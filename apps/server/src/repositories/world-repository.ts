import type { EngineState } from '../game/engine.js'

export type StoredWorld = {
	id: string
	tokenHash: string
	state: EngineState
	createdAt: string
	updatedAt: string
	expiresAt: string
}

export interface WorldRepository {
	create(args: { tokenHash: string; state: EngineState }): Promise<StoredWorld>
	findByTokenHash(tokenHash: string): Promise<StoredWorld | null>
	save(args: { tokenHash: string; state: EngineState }): Promise<StoredWorld>
}
