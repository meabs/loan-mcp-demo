import express from 'express'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { loadConfig } from './config/env.js'
import { counters } from './observability/logger.js'
import { SqliteWorldRepository } from './repositories/sqlite-world-repository.js'
import { makeMcpServer } from './mcp/server.js'
import { readWidgetHtml } from './mcp/resources.js'

export function createApp() {
	const config = loadConfig()
	const repository = new SqliteWorldRepository(config.databasePath)
	const app = express()
	const __dirname = fileURLToPath(new URL('.', import.meta.url))
	const rootDir = join(__dirname, '../../..')

	app.use(express.json({ limit: '64kb' }))
	app.use(
		'/assets',
		express.static(join(rootDir, 'apps/widget/dist/assets'), {
			immutable: true,
			maxAge: '1y'
		})
	)

	app.get('/health', (_req, res) => {
		res.json({
			ok: true,
			service: 'the-last-bookshop',
			mcp: '/mcp',
			database: 'sqlite',
			counters: {
				worldsStarted: counters.worldsStarted,
				encountersCompleted: counters.encountersCompleted,
				playerWins: counters.playerWins,
				rivalWins: counters.rivalWins,
				toolErrors: counters.toolErrors
			}
		})
	})

	app.get(['/', '/preview'], (_req, res) => {
		res.type('html').send(`<!doctype html>
			<html lang="en">
				<head>
					<meta charset="utf-8" />
					<meta name="viewport" content="width=device-width, initial-scale=1" />
					<title>The Last Bookshop</title>
				</head>
				<body>${readWidgetHtml()}</body>
			</html>`)
	})

	app.post('/mcp', async (req, res) => {
		const server = makeMcpServer({ config, repository })
		try {
			const transport = new StreamableHTTPServerTransport({
				sessionIdGenerator: undefined
			})
			await server.connect(transport)
			await transport.handleRequest(req, res, req.body)
			res.on('close', () => {
				transport.close()
				server.close()
			})
		} catch (error) {
			console.error('Error handling MCP request', error)
			if (!res.headersSent) {
				res.status(500).json({
					jsonrpc: '2.0',
					error: {
						code: -32603,
						message: 'Internal server error'
					},
					id: null
				})
			}
		}
	})

	app.get('/mcp', (_req, res) => {
		res.status(405).json({
			jsonrpc: '2.0',
			error: {
				code: -32000,
				message: 'Use POST for MCP Streamable HTTP requests.'
			},
			id: null
		})
	})

	return { app, config }
}

const { app, config } = createApp()

app.listen(config.port, () => {
	console.log(`The Last Bookshop MCP server listening on http://127.0.0.1:${config.port}`)
})
