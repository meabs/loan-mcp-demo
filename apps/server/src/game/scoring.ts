import type {
	Book,
	CustomerDefinition,
	Recommendation,
	ScoreBreakdown,
	SubmittedBy
} from '@last-bookshop/contracts'

export const scoringWeights = {
	genreMatch: 30,
	themeMatch: 20,
	toneMatch: 20,
	intensityMatch: 10,
	lengthMatch: 5,
	explanationMatch: 15,
	avoidanceViolation: 60
} as const

const desiredIntensity = 2
const desiredLength = 'medium'

function countOverlap(values: string[], desired: string[]): number {
	const normalized = new Set(values.map((value) => value.toLowerCase()))
	return desired.filter((value) => normalized.has(value.toLowerCase())).length
}

function includesAnyText(text: string, needles: string[]): number {
	const normalized = text.toLowerCase()
	return needles.filter((needle) => normalized.includes(needle.toLowerCase())).length
}

export function scoreRecommendation(args: {
	book: Book
	customer: CustomerDefinition
	recommendation: Recommendation
}): ScoreBreakdown {
	const { book, customer, recommendation } = args
	const genreOverlap = countOverlap(book.genres, ['adventure', 'mystery', 'exploration'])
	const themeOverlap = countOverlap(book.themes, customer.likes)
	const toneOverlap = countOverlap(book.tone, ['dry humour', 'clever', 'warm'])
	const avoidanceViolations =
		countOverlap([...book.genres, ...book.themes, ...book.tone], customer.dislikes) +
		includesAnyText(book.description, ['boat', 'boats', 'sea voyage', 'ocean', 'ship'])
	const explanationSignals = includesAnyText(recommendation.reason, [
		'adventure',
		'puzzle',
		'puzzles',
		'clever',
		'dry',
		'wit',
		'no boats',
		'nothing involving boats',
		'map'
	])

	const genreMatch = Math.min(1, genreOverlap / 2) * scoringWeights.genreMatch
	const themeMatch = Math.min(1, themeOverlap / 2) * scoringWeights.themeMatch
	const toneMatch = Math.min(1, toneOverlap / 2) * scoringWeights.toneMatch
	const intensityMatch =
		(1 - Math.min(Math.abs(book.intensity - desiredIntensity), 4) / 4) *
		scoringWeights.intensityMatch
	const lengthMatch = book.length === desiredLength ? scoringWeights.lengthMatch : 0
	const explanationMatch =
		Math.min(1, explanationSignals / 3) * scoringWeights.explanationMatch
	const avoidanceViolation = avoidanceViolations * scoringWeights.avoidanceViolation
	const total = Math.round(
		genreMatch +
			themeMatch +
			toneMatch +
			intensityMatch +
			lengthMatch +
			explanationMatch -
			avoidanceViolation
	)

	return {
		genreMatch,
		themeMatch,
		toneMatch,
		intensityMatch,
		lengthMatch,
		explanationMatch,
		avoidanceViolation,
		total
	}
}

export function chooseWinner(args: {
	player: ScoreBreakdown
	rival: ScoreBreakdown
	playerBook: Book
	rivalBook: Book
}): SubmittedBy {
	const comparisons = [
		args.player.total - args.rival.total,
		args.rival.avoidanceViolation - args.player.avoidanceViolation,
		args.player.genreMatch - args.rival.genreMatch,
		args.player.toneMatch - args.rival.toneMatch,
		args.player.explanationMatch - args.rival.explanationMatch,
		args.playerBook.id.localeCompare(args.rivalBook.id) * -1
	]

	for (const comparison of comparisons) {
		if (comparison > 0) return 'player'
		if (comparison < 0) return 'rival'
	}

	return 'player'
}
