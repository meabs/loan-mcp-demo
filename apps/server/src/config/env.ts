export type ServerConfig = {
	nodeEnv: string
	port: number
	publicBaseUrl: string
	mcpEndpoint: string
	databasePath: string
	logLevel: string
	worldRetentionDays: number
}

export function loadConfig(env = process.env): ServerConfig {
	const publicBaseUrl = env.PUBLIC_BASE_URL ?? 'http://127.0.0.1:3100'

	return {
		nodeEnv: env.NODE_ENV ?? 'development',
		port: Number(env.PORT ?? 3100),
		publicBaseUrl,
		mcpEndpoint: env.MCP_ENDPOINT ?? `${publicBaseUrl}/mcp`,
		databasePath: env.DATABASE_PATH ?? '/tmp/last-bookshop.sqlite',
		logLevel: env.LOG_LEVEL ?? 'info',
		worldRetentionDays: Number(env.WORLD_RETENTION_DAYS ?? 90)
	}
}
