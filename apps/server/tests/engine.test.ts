import { describe, expect, it } from 'vitest'
import {
	askCustomer,
	createWorld,
	resolveRecommendations,
	submitRecommendation,
	toPublicScene
} from '../src/game/engine.js'
import { BookshopError } from '../src/game/errors.js'

function startedWorld() {
	return createWorld({
		shopName: 'Foxglove Books',
		shopStyle: 'woodland',
		retentionDays: 90
	})
}

describe('engine', () => {
	it('creates a public scene without hidden customer preferences', () => {
		const scene = toPublicScene(startedWorld())
		expect(scene.customer.name).toBe('Edith Vale')
		expect('likes' in scene.customer).toBe(false)
		expect('dislikes' in scene.customer).toBe(false)
	})

	it('allows one authored question only', () => {
		const state = startedWorld()
		const next = askCustomer(state, 'Do you like puzzles?', state.world.version)
		expect(next.lastCustomerAnswer?.answer).toContain('puzzle')
		expect(() =>
			askCustomer(next, 'And boats?', next.world.version)
		).toThrowError(BookshopError)
	})

	it('rejects stale mutations', () => {
		const state = startedWorld()
		expect(() =>
			askCustomer(state, 'Do you like puzzles?', state.world.version + 1)
		).toThrowError(BookshopError)
	})

	it('resolves once and applies rewards once', () => {
		const state = startedWorld()
		const player = submitRecommendation(
			state,
			{
				bookId: 'clockmakers-map',
				reason: 'It is adventurous, puzzle-led, dry, and avoids boats.',
				submittedBy: 'player'
			},
			state.world.version
		)
		const rival = submitRecommendation(
			player,
			{
				bookId: 'eleven-miles-underground',
				reason: 'It is a serious exploration story with coded rooms.',
				submittedBy: 'rival'
			},
			player.world.version
		)
		const resolved = resolveRecommendations(rival, rival.world.version)
		const repeated = resolveRecommendations(resolved, resolved.world.version)
		expect(resolved.world.currentEncounter?.result?.winner).toBe('player')
		expect(repeated.world.shop.coins).toBe(resolved.world.shop.coins)
		expect(repeated.world.version).toBe(resolved.world.version)
	})
})
