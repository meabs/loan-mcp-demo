import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { registerAppTool } from '@modelcontextprotocol/ext-apps/server'
import {
	RecommendationSchema,
	ShopStyleSchema,
	type BookshopErrorCode
} from '@last-bookshop/contracts'
import type { WorldRepository } from '../../repositories/world-repository.js'
import { createWorld, publicAveryBrief, toPublicScene } from '../../game/engine.js'
import {
	askCustomer,
	resolveRecommendations,
	submitRecommendation
} from '../../game/engine.js'
import { BookshopError, publicError } from '../../game/errors.js'
import { generateResumeToken, hashResumeToken, isPlausibleResumeToken } from '../../security/tokens.js'
import { InMemoryRateLimiter } from '../../security/rate-limit.js'
import { counters, logEvent } from '../../observability/logger.js'
import type { ServerConfig } from '../../config/env.js'
import { widgetUri } from '../resources.js'

const resumeTokenSchema = z.string().min(32).max(120)
const expectedVersionSchema = z.number().int().min(1)

const rateLimiter = new InMemoryRateLimiter(60, 60_000)

type ToolContext = {
	repository: WorldRepository
	config: ServerConfig
}

export function registerBookshopTools(server: McpServer, context: ToolContext): void {
	const toolMeta = {
		ui: {
			resourceUri: widgetUri
		},
		'openai/widgetAccessible': true,
		'openai/outputTemplate': widgetUri,
		'openai/toolInvocation/invoking': 'Opening The Last Bookshop',
		'openai/toolInvocation/invoked': 'The Last Bookshop is ready'
	}

	registerAppTool(
		server,
		'start_bookshop',
		{
			title: 'Start bookshop',
			description:
				'Use this when the player wants to start a new anonymous game of The Last Bookshop.',
			inputSchema: {
				shopName: z.string().min(1).max(60),
				shopStyle: ShopStyleSchema
			},
			annotations: {
				readOnlyHint: false,
				destructiveHint: false,
				idempotentHint: false,
				openWorldHint: false
			},
			_meta: toolMeta
		},
		async (input) =>
			runTool('start_bookshop', async () => {
				const resumeToken = generateResumeToken()
				const tokenHash = hashResumeToken(resumeToken)
				const state = createWorld({
					shopName: input.shopName,
					shopStyle: input.shopStyle,
					retentionDays: context.config.worldRetentionDays
				})
				await context.repository.create({ tokenHash, state })
				counters.worldsStarted += 1
				const scene = toPublicScene(state, true)
				return {
					structuredContent: scene,
					content: [
						{
							type: 'text',
							text: `${scene.world.shop.name} is open. Edith Vale is waiting for a clever recommendation.`
						}
					],
					_meta: {
						resumeToken,
						requestId: randomUUID()
					}
				}
			})
	)

	registerAppTool(
		server,
		'resume_bookshop',
		{
			title: 'Resume bookshop',
			description:
				'Use this when the player provides a resume token and wants to continue an existing anonymous game.',
			inputSchema: {
				resumeToken: resumeTokenSchema
			},
			annotations: {
				readOnlyHint: true,
				destructiveHint: false,
				idempotentHint: true,
				openWorldHint: false
			},
			_meta: toolMeta
		},
		async (input) =>
			runTool('resume_bookshop', async () => {
				const stored = await loadStored(context.repository, input.resumeToken)
				const scene = toPublicScene(stored.state, true)
				return {
					structuredContent: scene,
					content: [
						{
							type: 'text',
							text: `Resumed ${scene.world.shop.name}. Current version is ${scene.world.version}.`
						}
					],
					_meta: {
						resumeToken: input.resumeToken,
						requestId: randomUUID()
					}
				}
			})
	)

	registerAppTool(
		server,
		'get_bookshop_scene',
		{
			title: 'Get bookshop scene',
			description:
				'Use this when the current public game scene should be refreshed without changing state.',
			inputSchema: {
				resumeToken: resumeTokenSchema
			},
			annotations: {
				readOnlyHint: true,
				destructiveHint: false,
				idempotentHint: true,
				openWorldHint: false
			},
			_meta: toolMeta
		},
		async (input) =>
			runTool('get_bookshop_scene', async () => {
				const stored = await loadStored(context.repository, input.resumeToken)
				const scene = toPublicScene(stored.state, true)
				return {
					structuredContent: scene,
					content: [
						{
							type: 'text',
							text: `The scene is ready. ${publicAveryBrief(scene)}`
						}
					],
					_meta: {
						resumeToken: input.resumeToken,
						requestId: randomUUID()
					}
				}
			})
	)

	registerAppTool(
		server,
		'ask_customer',
		{
			title: 'Ask customer',
			description:
				'Use this when the player asks Edith one concise question before recommending a book.',
			inputSchema: {
				resumeToken: resumeTokenSchema,
				question: z.string().min(1).max(300),
				expectedWorldVersion: expectedVersionSchema
			},
			annotations: {
				readOnlyHint: false,
				destructiveHint: false,
				idempotentHint: false,
				openWorldHint: false
			},
			_meta: toolMeta
		},
		async (input) =>
			runTool('ask_customer', async () => {
				checkRate(input.resumeToken)
				const stored = await loadStored(context.repository, input.resumeToken)
				const next = askCustomer(stored.state, input.question, input.expectedWorldVersion)
				await context.repository.save({ tokenHash: stored.tokenHash, state: next })
				const scene = toPublicScene(next, true)
				return {
					structuredContent: scene,
					content: [{ type: 'text', text: scene.lastCustomerAnswer?.answer ?? '' }],
					_meta: { resumeToken: input.resumeToken, requestId: randomUUID() }
				}
			})
	)

	registerAppTool(
		server,
		'submit_player_recommendation',
		{
			title: 'Submit player recommendation',
			description:
				'Use this when the player chooses one available book and explains why Edith should read it.',
			inputSchema: {
				resumeToken: resumeTokenSchema,
				bookId: z.string().min(1).max(80),
				reason: z.string().min(1).max(600),
				expectedWorldVersion: expectedVersionSchema
			},
			annotations: {
				readOnlyHint: false,
				destructiveHint: false,
				idempotentHint: false,
				openWorldHint: false
			},
			_meta: toolMeta
		},
		async (input) =>
			runTool('submit_player_recommendation', async () => {
				checkRate(input.resumeToken)
				const stored = await loadStored(context.repository, input.resumeToken)
				const next = submitRecommendation(
					stored.state,
					RecommendationSchema.parse({
						bookId: input.bookId,
						reason: input.reason,
						submittedBy: 'player'
					}),
					input.expectedWorldVersion
				)
				await context.repository.save({ tokenHash: stored.tokenHash, state: next })
				return {
					structuredContent: toPublicScene(next, true),
					content: [
						{
							type: 'text',
							text: 'Your recommendation is recorded. Avery Quill can now respond as the rival bookseller.'
						}
					],
					_meta: { resumeToken: input.resumeToken, requestId: randomUUID() }
				}
			})
	)

	registerAppTool(
		server,
		'submit_rival_recommendation',
		{
			title: 'Submit rival recommendation',
			description:
				'Use this when ChatGPT is acting as Avery Quill and must submit a rival recommendation using only public scene information.',
			inputSchema: {
				resumeToken: resumeTokenSchema,
				bookId: z.string().min(1).max(80),
				reason: z.string().min(1).max(600),
				expectedWorldVersion: expectedVersionSchema
			},
			annotations: {
				readOnlyHint: false,
				destructiveHint: false,
				idempotentHint: false,
				openWorldHint: false
			},
			_meta: toolMeta
		},
		async (input) =>
			runTool('submit_rival_recommendation', async () => {
				checkRate(input.resumeToken)
				const stored = await loadStored(context.repository, input.resumeToken)
				const next = submitRecommendation(
					stored.state,
					RecommendationSchema.parse({
						bookId: input.bookId,
						reason: input.reason,
						submittedBy: 'rival'
					}),
					input.expectedWorldVersion
				)
				await context.repository.save({ tokenHash: stored.tokenHash, state: next })
				return {
					structuredContent: toPublicScene(next, true),
					content: [
						{
							type: 'text',
							text: 'Avery Quill has made a polished rival recommendation.'
						}
					],
					_meta: { resumeToken: input.resumeToken, requestId: randomUUID() }
				}
			})
	)

	registerAppTool(
		server,
		'resolve_recommendations',
		{
			title: 'Resolve recommendations',
			description:
				'Use this when both booksellers have recommended books and Edith should choose a winner deterministically.',
			inputSchema: {
				resumeToken: resumeTokenSchema,
				expectedWorldVersion: expectedVersionSchema
			},
			annotations: {
				readOnlyHint: false,
				destructiveHint: false,
				idempotentHint: true,
				openWorldHint: false
			},
			_meta: toolMeta
		},
		async (input) =>
			runTool('resolve_recommendations', async () => {
				checkRate(input.resumeToken)
				const stored = await loadStored(context.repository, input.resumeToken)
				const next = resolveRecommendations(stored.state, input.expectedWorldVersion)
				if (next !== stored.state) {
					await context.repository.save({ tokenHash: stored.tokenHash, state: next })
					counters.encountersCompleted += 1
					if (next.world.currentEncounter?.result?.winner === 'player') counters.playerWins += 1
					if (next.world.currentEncounter?.result?.winner === 'rival') counters.rivalWins += 1
				}
				const scene = toPublicScene(next, true)
				return {
					structuredContent: scene,
					content: [
						{
							type: 'text',
							text:
								scene.world.currentEncounter?.result?.customerResponse ??
								'Edith has made her choice.'
						}
					],
					_meta: { resumeToken: input.resumeToken, requestId: randomUUID() }
				}
			})
	)
}

async function loadStored(repository: WorldRepository, resumeToken: string) {
	if (!isPlausibleResumeToken(resumeToken)) {
		throw new BookshopError('INVALID_TOKEN', 'The resume token is not valid.', 401)
	}
	const tokenHash = hashResumeToken(resumeToken)
	const stored = await repository.findByTokenHash(tokenHash)
	if (!stored) {
		throw new BookshopError('WORLD_NOT_FOUND', 'No bookshop was found for that token.', 404)
	}
	if (new Date(stored.expiresAt).getTime() < Date.now()) {
		throw new BookshopError('WORLD_EXPIRED', 'This bookshop has expired.', 410)
	}
	return stored
}

function checkRate(key: string): void {
	if (!rateLimiter.check(hashResumeToken(key))) {
		throw new BookshopError('RATE_LIMITED', 'Too many bookshop actions. Try again shortly.', 429)
	}
}

async function runTool<T>(toolName: string, handler: () => Promise<T>): Promise<any> {
	const startedAt = Date.now()
	try {
		const result = await handler()
		const durationMs = Date.now() - startedAt
		counters.latencyMs.push(durationMs)
		logEvent({
			toolName,
			durationMs,
			outcome: 'ok',
			message: 'tool completed'
		})
		return result
	} catch (error) {
		const durationMs = Date.now() - startedAt
		counters.toolErrors += 1
		const publicShape = publicError(error)
		logEvent({
			toolName,
			durationMs,
			outcome: 'error',
			errorCategory: publicShape.code,
			message: publicShape.message
		})
		return toolError(publicShape.code, publicShape.message)
	}
}

function toolError(code: BookshopErrorCode, message: string) {
	return {
		structuredContent: {
			error: {
				code,
				message
			}
		},
		content: [
			{
				type: 'text',
				text: message
			}
		]
	}
}
