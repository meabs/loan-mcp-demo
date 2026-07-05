import type { SubmittedBy } from '@last-bookshop/contracts'

export function rewardForWinner(winner: SubmittedBy) {
	if (winner === 'player') {
		return {
			coinDelta: 7,
			reputationDelta: 2,
			relationshipDelta: 2
		}
	}

	return {
		coinDelta: 2,
		reputationDelta: 0,
		relationshipDelta: 1
	}
}
