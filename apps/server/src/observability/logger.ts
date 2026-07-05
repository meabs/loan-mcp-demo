export type LogEvent = {
	requestId?: string
	toolName?: string
	durationMs?: number
	outcome: 'ok' | 'error'
	worldVersion?: number
	encounterId?: string
	errorCategory?: string
	message: string
}

export function logEvent(event: LogEvent): void {
	const payload = {
		timestamp: new Date().toISOString(),
		...event
	}
	console.log(JSON.stringify(payload))
}

export const counters = {
	worldsStarted: 0,
	encountersCompleted: 0,
	playerWins: 0,
	rivalWins: 0,
	toolErrors: 0,
	latencyMs: [] as number[]
}
