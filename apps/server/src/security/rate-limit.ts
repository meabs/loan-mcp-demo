export class InMemoryRateLimiter {
	private readonly hits = new Map<string, number[]>()

	constructor(
		private readonly limit: number,
		private readonly windowMs: number
	) {}

	check(key: string, now = Date.now()): boolean {
		const windowStart = now - this.windowMs
		const kept = (this.hits.get(key) ?? []).filter((value) => value >= windowStart)
		if (kept.length >= this.limit) {
			this.hits.set(key, kept)
			return false
		}
		kept.push(now)
		this.hits.set(key, kept)
		return true
	}
}
