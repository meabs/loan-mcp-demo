import { describe, expect, it } from 'vitest'
import {
	generateResumeToken,
	hashResumeToken,
	isPlausibleResumeToken,
	verifyTokenHash
} from '../src/security/tokens.js'

describe('tokens', () => {
	it('generates opaque verifiable tokens', () => {
		const token = generateResumeToken()
		const hash = hashResumeToken(token)
		expect(isPlausibleResumeToken(token)).toBe(true)
		expect(hash).not.toContain(token)
		expect(verifyTokenHash(token, hash)).toBe(true)
		expect(verifyTokenHash(`${token}x`, hash)).toBe(false)
	})
})
