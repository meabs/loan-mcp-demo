// @vitest-environment jsdom

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { App } from '../src/App'

const scene = {
	world: {
		id: 'world-1',
		version: 1,
		status: 'active',
		shop: { name: 'The Last Bookshop', style: 'cottage', reputation: 0, coins: 12 },
		player: { id: 'player-1' },
		rival: { id: 'avery-quill', name: 'Avery Quill', shopName: 'The Perfect Cupboard', reputation: 3 },
		customerStates: [{ customerId: 'edith-vale', relationship: 0, encountersCompleted: 0 }],
		currentEncounter: {
			id: 'encounter-1',
			customerId: 'edith-vale',
			publicRequest: 'I want something adventurous, but nothing involving boats.',
			availableBookIds: ['clockmakers-map'],
			questionsAsked: 0,
			maxQuestions: 1,
			playerRecommendation: null,
			rivalRecommendation: null,
			result: null,
			status: 'awaiting_question_or_recommendation'
		},
		createdAt: '2026-07-05T00:00:00.000Z',
		updatedAt: '2026-07-05T00:00:00.000Z',
		expiresAt: '2026-10-03T00:00:00.000Z'
	},
	customer: {
		id: 'edith-vale',
		name: 'Edith Vale',
		pronouns: 'she/her',
		summary: 'Retired teacher with dry humour.',
		publicTraits: ['dry humour'],
		portraitAssetId: 'portrait-edith',
		spriteAssetId: 'sprite-edith'
	},
	books: [
		{
			id: 'clockmakers-map',
			title: "The Clockmaker's Map",
			author: 'Iris Bell',
			description: 'A puzzle adventure.',
			genres: ['adventure'],
			themes: ['puzzles'],
			tone: ['dry'],
			intensity: 2,
			length: 'medium',
			coverAssetId: 'cover-clockmaker-map'
		}
	],
	lastCustomerAnswer: null,
	assetManifest: [],
	resumeTokenAvailable: true
}

afterEach(() => {
	vi.restoreAllMocks()
	window.localStorage.clear()
	delete window.__LAST_BOOKSHOP_CONFIG__
	delete window.openai
})

describe('App', () => {
	it('renders start and resume views before a scene exists', () => {
		render(<App />)
		expect(screen.getByRole('heading', { name: 'The Last Bookshop' })).toBeInTheDocument()
		expect(screen.getByRole('button', { name: /start game/i })).toBeInTheDocument()
		expect(screen.getByRole('button', { name: /resume game/i })).toBeInTheDocument()
	})

	it('starts through the HTTP fallback when the ChatGPT bridge is unavailable', async () => {
		window.__LAST_BOOKSHOP_CONFIG__ = { publicBaseUrl: 'https://games-mcp.example.test' }
		vi.spyOn(window, 'fetch').mockResolvedValue(
			new window.Response(
				`event: message\ndata: ${JSON.stringify({
					result: {
						structuredContent: scene,
						_meta: { resumeToken: 'resume-token' }
					},
					jsonrpc: '2.0',
					id: 1
				})}\n\n`,
				{
					status: 200,
					headers: { 'content-type': 'text/event-stream' }
				}
			)
		)
		const user = userEvent.setup()
		render(<App />)
		await user.click(screen.getByRole('button', { name: /start game/i }))
		expect(await screen.findByText('Edith Vale')).toBeInTheDocument()
		expect(window.fetch).toHaveBeenCalledWith(
			'https://games-mcp.example.test/mcp',
			expect.objectContaining({ method: 'POST' })
		)
	})

	it('supports keyboard navigation to the start button', async () => {
		const user = userEvent.setup()
		render(<App />)
		await user.tab()
		expect(document.activeElement).toBe(screen.getByLabelText(/shop name/i))
	})
})
