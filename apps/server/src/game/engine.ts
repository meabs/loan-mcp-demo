import { randomUUID } from 'node:crypto'
import type { Book, CustomerDefinition, PublicScene, Recommendation, ShopStyle, World } from '@last-bookshop/contracts'
import {
	assetManifest,
	books,
	defaultEdithAnswer,
	edithQuestionAnswers,
	edithVale,
	publicRequest
} from './seeds.js'
import { BookshopError } from './errors.js'
import { chooseWinner, scoreRecommendation } from './scoring.js'
import { rewardForWinner } from './progression.js'

export type EngineState = {
	world: World
	lastCustomerAnswer: { question: string; answer: string } | null
}

export function createWorld(args: {
	shopName: string
	shopStyle: ShopStyle
	now?: Date
	retentionDays: number
}): EngineState {
	const now = args.now ?? new Date()
	const expiresAt = new Date(now.getTime() + args.retentionDays * 24 * 60 * 60 * 1000)
	const world: World = {
		id: randomUUID(),
		version: 1,
		status: 'active',
		shop: {
			name: args.shopName.trim(),
			style: args.shopStyle,
			reputation: 0,
			coins: 12
		},
		player: {
			id: randomUUID()
		},
		rival: {
			id: 'avery-quill',
			name: 'Avery Quill',
			shopName: 'The Perfect Cupboard',
			reputation: 3
		},
		customerStates: [
			{
				customerId: edithVale.id,
				relationship: 0,
				encountersCompleted: 0
			}
		],
		currentEncounter: {
			id: randomUUID(),
			customerId: edithVale.id,
			publicRequest,
			availableBookIds: books.map((book) => book.id),
			questionsAsked: 0,
			maxQuestions: 1,
			playerRecommendation: null,
			rivalRecommendation: null,
			result: null,
			status: 'awaiting_question_or_recommendation'
		},
		createdAt: now.toISOString(),
		updatedAt: now.toISOString(),
		expiresAt: expiresAt.toISOString()
	}

	return { world, lastCustomerAnswer: null }
}

export function toPublicScene(
	state: EngineState,
	resumeTokenAvailable = false
): PublicScene {
	const encounter = state.world.currentEncounter
	const availableBooks = encounter
		? encounter.availableBookIds.map((id) => getBook(id))
		: books

	return {
		world: state.world,
		customer: {
			id: edithVale.id,
			name: edithVale.name,
			pronouns: edithVale.pronouns,
			summary: edithVale.summary,
			publicTraits: edithVale.publicTraits,
			portraitAssetId: edithVale.portraitAssetId,
			spriteAssetId: edithVale.spriteAssetId
		},
		books: availableBooks,
		lastCustomerAnswer: state.lastCustomerAnswer,
		assetManifest,
		resumeTokenAvailable
	}
}

export function assertVersion(world: World, expectedWorldVersion: number): void {
	if (world.version !== expectedWorldVersion) {
		throw new BookshopError(
			'STALE_WORLD_VERSION',
			'The bookshop changed since this action started. Refresh the scene and try again.',
			409
		)
	}
}

export function assertActive(world: World): void {
	if (world.status === 'expired' || new Date(world.expiresAt).getTime() < Date.now()) {
		throw new BookshopError('WORLD_EXPIRED', 'This bookshop has expired.', 410)
	}
}

export function askCustomer(
	state: EngineState,
	question: string,
	expectedWorldVersion: number
): EngineState {
	assertActive(state.world)
	assertVersion(state.world, expectedWorldVersion)
	const encounter = requireEncounter(state.world)
	if (encounter.status !== 'awaiting_question_or_recommendation') {
		throw new BookshopError(
			'INVALID_ENCOUNTER_STATE',
			'Edith is no longer taking questions for this encounter.',
			409
		)
	}
	if (encounter.questionsAsked >= encounter.maxQuestions) {
		throw new BookshopError(
			'QUESTION_LIMIT_REACHED',
			'Only one question is available in this demo encounter.',
			400
		)
	}

	const answer = classifyQuestion(question)
	const now = new Date().toISOString()
	return {
		world: {
			...state.world,
			version: state.world.version + 1,
			updatedAt: now,
			currentEncounter: {
				...encounter,
				questionsAsked: encounter.questionsAsked + 1
			}
		},
		lastCustomerAnswer: {
			question,
			answer
		}
	}
}

export function submitRecommendation(
	state: EngineState,
	recommendation: Recommendation,
	expectedWorldVersion: number
): EngineState {
	assertActive(state.world)
	assertVersion(state.world, expectedWorldVersion)
	const encounter = requireEncounter(state.world)
	const book = getAvailableBook(encounter.availableBookIds, recommendation.bookId)
	if (!book) {
		throw new BookshopError('BOOK_NOT_AVAILABLE', 'That book is not available today.', 400)
	}
	if (encounter.status === 'resolved') {
		throw new BookshopError('ALREADY_RESOLVED', 'This encounter has already been resolved.', 409)
	}
	if (recommendation.submittedBy === 'player') {
		if (encounter.playerRecommendation) {
			throw new BookshopError(
				'INVALID_ENCOUNTER_STATE',
				'The player has already recommended a book.',
				409
			)
		}
		const nextEncounter = {
			...encounter,
			playerRecommendation: recommendation,
			status: 'awaiting_rival_recommendation' as const
		}
		return nextState(state, nextEncounter)
	}

	if (encounter.status !== 'awaiting_rival_recommendation' && !encounter.playerRecommendation) {
		throw new BookshopError(
			'INVALID_ENCOUNTER_STATE',
			'Avery should wait until the player has recommended a book.',
			409
		)
	}
	if (encounter.rivalRecommendation) {
		throw new BookshopError(
			'INVALID_ENCOUNTER_STATE',
			'Avery has already recommended a book.',
			409
		)
	}

	return nextState(state, {
		...encounter,
		rivalRecommendation: recommendation,
		status: 'ready_to_resolve'
	})
}

export function resolveRecommendations(
	state: EngineState,
	expectedWorldVersion: number
): EngineState {
	assertActive(state.world)
	const encounter = requireEncounter(state.world)
	if (encounter.result) return state
	assertVersion(state.world, expectedWorldVersion)
	if (!encounter.playerRecommendation || !encounter.rivalRecommendation) {
		throw new BookshopError(
			'INVALID_ENCOUNTER_STATE',
			'Both booksellers must recommend before Edith chooses.',
			409
		)
	}

	const playerBook = getBook(encounter.playerRecommendation.bookId)
	const rivalBook = getBook(encounter.rivalRecommendation.bookId)
	const playerBreakdown = scoreRecommendation({
		book: playerBook,
		customer: edithVale,
		recommendation: encounter.playerRecommendation
	})
	const rivalBreakdown = scoreRecommendation({
		book: rivalBook,
		customer: edithVale,
		recommendation: encounter.rivalRecommendation
	})
	const winner = chooseWinner({
		player: playerBreakdown,
		rival: rivalBreakdown,
		playerBook,
		rivalBook
	})
	const reward = rewardForWinner(winner)
	const response =
		winner === 'player'
			? `Edith chooses ${playerBook.title}. "That sounds properly adventurous without putting me near a gangplank. Sensible work."`
			: `Edith chooses ${rivalBook.title}. "Avery has, irritatingly, made the better case today. I shall try not to enjoy admitting it."`
	const result = {
		id: randomUUID(),
		winner,
		playerScore: playerBreakdown.total,
		rivalScore: rivalBreakdown.total,
		playerBreakdown,
		rivalBreakdown,
		customerResponse: response,
		...reward,
		resolvedAt: new Date().toISOString()
	}
	const customerStates = state.world.customerStates.map((customerState) =>
		customerState.customerId === edithVale.id
			? {
					...customerState,
					relationship: customerState.relationship + reward.relationshipDelta,
					encountersCompleted: customerState.encountersCompleted + 1
				}
			: customerState
	)

	return {
		world: {
			...state.world,
			version: state.world.version + 1,
			status: 'completed',
			shop: {
				...state.world.shop,
				coins: state.world.shop.coins + reward.coinDelta,
				reputation: state.world.shop.reputation + reward.reputationDelta
			},
			customerStates,
			currentEncounter: {
				...encounter,
				result,
				status: 'resolved'
			},
			updatedAt: new Date().toISOString()
		},
		lastCustomerAnswer: state.lastCustomerAnswer
	}
}

function classifyQuestion(question: string): string {
	const normalized = question.toLowerCase()
	const match = edithQuestionAnswers.find((entry) =>
		entry.match.some((term) => normalized.includes(term))
	)
	return match?.answer ?? defaultEdithAnswer
}

function requireEncounter(world: World) {
	if (!world.currentEncounter) {
		throw new BookshopError('INVALID_ENCOUNTER_STATE', 'There is no active encounter.', 409)
	}
	return world.currentEncounter
}

function getBook(bookId: string): Book {
	const book = books.find((candidate) => candidate.id === bookId)
	if (!book) {
		throw new BookshopError('BOOK_NOT_AVAILABLE', 'That book is not available today.', 400)
	}
	return book
}

function getAvailableBook(availableBookIds: string[], bookId: string): Book | null {
	if (!availableBookIds.includes(bookId)) return null
	return getBook(bookId)
}

function nextState(state: EngineState, currentEncounter: World['currentEncounter']): EngineState {
	return {
		world: {
			...state.world,
			version: state.world.version + 1,
			currentEncounter,
			updatedAt: new Date().toISOString()
		},
		lastCustomerAnswer: state.lastCustomerAnswer
	}
}

export function publicAveryBrief(scene: PublicScene): string {
	return [
		`Customer: ${scene.customer.name}.`,
		`Request: ${scene.world.currentEncounter?.publicRequest ?? 'No active request'}.`,
		`Public traits: ${scene.customer.publicTraits.join(', ')}.`,
		`Available books: ${scene.books
			.map((book) => `${book.id}: ${book.title} (${book.description})`)
			.join(' | ')}.`
	].join('\n')
}

export type GameContent = {
	customer: CustomerDefinition
	books: Book[]
}
