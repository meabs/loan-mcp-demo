import Database from 'better-sqlite3'
import type { EngineState } from '../game/engine.js'
import { WorldSchema } from '@last-bookshop/contracts'
import type { StoredWorld, WorldRepository } from './world-repository.js'

type Row = {
	id: string
	token_hash: string
	world_json: string
	last_answer_json: string | null
	created_at: string
	updated_at: string
	expires_at: string
}

export class SqliteWorldRepository implements WorldRepository {
	private readonly db: Database.Database

	constructor(databasePath: string) {
		this.db = new Database(databasePath)
		this.db.pragma('journal_mode = WAL')
		this.db.exec(`
			CREATE TABLE IF NOT EXISTS worlds (
				id TEXT PRIMARY KEY,
				token_hash TEXT NOT NULL UNIQUE,
				world_json TEXT NOT NULL,
				last_answer_json TEXT,
				created_at TEXT NOT NULL,
				updated_at TEXT NOT NULL,
				expires_at TEXT NOT NULL
			);
			CREATE INDEX IF NOT EXISTS idx_worlds_token_hash ON worlds(token_hash);
			CREATE INDEX IF NOT EXISTS idx_worlds_expires_at ON worlds(expires_at);
		`)
	}

	async create(args: { tokenHash: string; state: EngineState }): Promise<StoredWorld> {
		const world = WorldSchema.parse(args.state.world)
		this.db
			.prepare(
				`INSERT INTO worlds (id, token_hash, world_json, last_answer_json, created_at, updated_at, expires_at)
				 VALUES (@id, @tokenHash, @worldJson, @lastAnswerJson, @createdAt, @updatedAt, @expiresAt)`
			)
			.run({
				id: world.id,
				tokenHash: args.tokenHash,
				worldJson: JSON.stringify(world),
				lastAnswerJson: args.state.lastCustomerAnswer
					? JSON.stringify(args.state.lastCustomerAnswer)
					: null,
				createdAt: world.createdAt,
				updatedAt: world.updatedAt,
				expiresAt: world.expiresAt
			})
		return {
			id: world.id,
			tokenHash: args.tokenHash,
			state: args.state,
			createdAt: world.createdAt,
			updatedAt: world.updatedAt,
			expiresAt: world.expiresAt
		}
	}

	async findByTokenHash(tokenHash: string): Promise<StoredWorld | null> {
		const row = this.db
			.prepare('SELECT * FROM worlds WHERE token_hash = ?')
			.get(tokenHash) as Row | undefined
		return row ? rowToStoredWorld(row) : null
	}

	async save(args: { tokenHash: string; state: EngineState }): Promise<StoredWorld> {
		const world = WorldSchema.parse(args.state.world)
		const result = this.db
			.prepare(
				`UPDATE worlds
				 SET world_json = @worldJson,
					 last_answer_json = @lastAnswerJson,
					 updated_at = @updatedAt,
					 expires_at = @expiresAt
				 WHERE token_hash = @tokenHash`
			)
			.run({
				tokenHash: args.tokenHash,
				worldJson: JSON.stringify(world),
				lastAnswerJson: args.state.lastCustomerAnswer
					? JSON.stringify(args.state.lastCustomerAnswer)
					: null,
				updatedAt: world.updatedAt,
				expiresAt: world.expiresAt
			})
		if (result.changes !== 1) {
			throw new Error('World save failed')
		}
		return {
			id: world.id,
			tokenHash: args.tokenHash,
			state: args.state,
			createdAt: world.createdAt,
			updatedAt: world.updatedAt,
			expiresAt: world.expiresAt
		}
	}
}

function rowToStoredWorld(row: Row): StoredWorld {
	const world = WorldSchema.parse(JSON.parse(row.world_json))
	return {
		id: row.id,
		tokenHash: row.token_hash,
		state: {
			world,
			lastCustomerAnswer: row.last_answer_json ? JSON.parse(row.last_answer_json) : null
		},
		createdAt: row.created_at,
		updatedAt: row.updated_at,
		expiresAt: row.expires_at
	}
}
