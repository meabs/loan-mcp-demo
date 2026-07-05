import { describe, expect, it } from 'vitest'
import { books, edithVale } from '../src/game/seeds.js'
import { chooseWinner, scoreRecommendation } from '../src/game/scoring.js'

describe('scoring', () => {
	it('rewards the clever non-maritime adventure', () => {
		const book = books.find((candidate) => candidate.id === 'clockmakers-map')
		expect(book).toBeTruthy()
		const score = scoreRecommendation({
			book: book!,
			customer: edithVale,
			recommendation: {
				bookId: book!.id,
				reason: 'It has adventure, puzzles, dry wit, and no boats.',
				submittedBy: 'player'
			}
		})
		expect(score.total).toBeGreaterThan(60)
		expect(score.avoidanceViolation).toBe(0)
	})

	it('penalizes boat conflicts heavily', () => {
		const book = books.find((candidate) => candidate.id === 'voyage-silver-heron')
		expect(book).toBeTruthy()
		const score = scoreRecommendation({
			book: book!,
			customer: edithVale,
			recommendation: {
				bookId: book!.id,
				reason: 'A moving boat adventure across the ocean.',
				submittedBy: 'player'
			}
		})
		expect(score.avoidanceViolation).toBeGreaterThanOrEqual(120)
		expect(score.total).toBeLessThan(0)
	})

	it('uses deterministic tie-breakers', () => {
		const clock = books.find((candidate) => candidate.id === 'clockmakers-map')!
		const underground = books.find((candidate) => candidate.id === 'eleven-miles-underground')!
		const winner = chooseWinner({
			player: {
				genreMatch: 10,
				themeMatch: 0,
				toneMatch: 0,
				intensityMatch: 0,
				lengthMatch: 0,
				explanationMatch: 0,
				avoidanceViolation: 0,
				total: 20
			},
			rival: {
				genreMatch: 10,
				themeMatch: 0,
				toneMatch: 0,
				intensityMatch: 0,
				lengthMatch: 0,
				explanationMatch: 0,
				avoidanceViolation: 0,
				total: 20
			},
			playerBook: clock,
			rivalBook: underground
		})
		expect(winner).toBe('player')
	})
})
