import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'

export function generateResumeToken(): string {
	return randomBytes(32).toString('base64url')
}

export function hashResumeToken(token: string): string {
	return createHash('sha256').update(token, 'utf8').digest('hex')
}

export function verifyTokenHash(token: string, expectedHash: string): boolean {
	const actual = Buffer.from(hashResumeToken(token), 'hex')
	const expected = Buffer.from(expectedHash, 'hex')
	if (actual.length !== expected.length) return false
	return timingSafeEqual(actual, expected)
}

export function isPlausibleResumeToken(token: string): boolean {
	return /^[A-Za-z0-9_-]{32,120}$/.test(token)
}
