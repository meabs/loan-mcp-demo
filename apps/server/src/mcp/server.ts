import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import {
	RESOURCE_MIME_TYPE,
	registerAppResource
} from '@modelcontextprotocol/ext-apps/server'
import type { ServerConfig } from '../config/env.js'
import type { WorldRepository } from '../repositories/world-repository.js'
import { readWidgetHtml, widgetUri } from './resources.js'
import { registerBookshopTools } from './tools/bookshop-tools.js'

export function makeMcpServer(args: {
	config: ServerConfig
	repository: WorldRepository
}): McpServer {
	const server = new McpServer(
		{
			name: 'the-last-bookshop',
			version: '0.1.0'
		},
		{
			instructions:
				'The Last Bookshop is a cosy game. ChatGPT narrates and acts as Avery Quill, but the server owns state, hidden preferences, scoring, and persistence.'
		}
	)

	registerAppResource(
		server,
		'The Last Bookshop',
		widgetUri,
		{
			description: 'A cosy playable bookshop recommendation game.',
			_meta: {
				'openai/widgetDescription':
					'Playable vertical slice for The Last Bookshop.',
				ui: {
					prefersBorder: false,
					domain: args.config.publicBaseUrl,
					csp: {
						connectDomains: [args.config.publicBaseUrl],
						resourceDomains: [args.config.publicBaseUrl]
					}
				}
			}
		},
		async () => ({
			contents: [
				{
					uri: widgetUri,
					mimeType: RESOURCE_MIME_TYPE,
					text: readWidgetHtml(args.config.publicBaseUrl),
					_meta: {
						'openai/widgetDescription':
							'Playable vertical slice for The Last Bookshop.',
						ui: {
							prefersBorder: false,
							domain: args.config.publicBaseUrl,
							csp: {
								connectDomains: [args.config.publicBaseUrl],
								resourceDomains: [args.config.publicBaseUrl]
							}
						}
					}
				}
			]
		})
	)

	registerBookshopTools(server, {
		repository: args.repository,
		config: args.config
	})

	return server
}
