import type { PublicScene } from '@last-bookshop/contracts'

type ToolResult = {
	structuredContent?: PublicScene | { error?: { code: string; message: string } }
	content?: Array<{ type: string; text: string }>
	_meta?: {
		resumeToken?: string
		[key: string]: unknown
	}
}

type OpenAIWidgetApi = {
	toolOutput?: PublicScene
	toolResponseMetadata?: {
		resumeToken?: string
		[key: string]: unknown
	}
	callTool?: (name: string, input: Record<string, unknown>) => Promise<ToolResult>
	setWidgetState?: (state: Record<string, unknown>) => Promise<void> | void
	widgetState?: Record<string, unknown>
	theme?: 'light' | 'dark'
}

declare global {
	interface Window {
		openai?: OpenAIWidgetApi
		__LAST_BOOKSHOP_CONFIG__?: {
			publicBaseUrl?: string
		}
	}
}

export function getInitialScene(): PublicScene | null {
	return window.openai?.toolOutput ?? null
}

export function getInitialResumeToken(): string {
	const token =
		window.openai?.toolResponseMetadata?.resumeToken ??
		(window.openai?.widgetState?.resumeToken as string | undefined) ??
		window.localStorage.getItem('lastBookshopResumeToken')
	return token ?? ''
}

export async function callTool(
	name: string,
	input: Record<string, unknown>
): Promise<ToolResult> {
	if (window.openai?.callTool) {
		try {
			return await withTimeout(window.openai.callTool(name, input), 8000)
		} catch {
			return callToolOverHttp(name, input)
		}
	}
	return callToolOverHttp(name, input)
}

export async function rememberResumeToken(resumeToken: string): Promise<void> {
	window.localStorage.setItem('lastBookshopResumeToken', resumeToken)
	await window.openai?.setWidgetState?.({ resumeToken })
}

async function callToolOverHttp(
	name: string,
	input: Record<string, unknown>
): Promise<ToolResult> {
	const configuredBase = window.__LAST_BOOKSHOP_CONFIG__?.publicBaseUrl
	const endpoint = configuredBase
		? `${configuredBase.replace(/\/$/, '')}/mcp`
		: new URL('/mcp', window.location.href).toString()
	const response = await window.fetch(endpoint, {
		method: 'POST',
		headers: {
			'content-type': 'application/json',
			accept: 'application/json, text/event-stream'
		},
		body: JSON.stringify({
			jsonrpc: '2.0',
			id: Date.now(),
			method: 'tools/call',
			params: {
				name,
				arguments: input
			}
		})
	})
	const text = await response.text()
	if (!response.ok) {
		throw new Error(`Tool call failed with HTTP ${response.status}.`)
	}
	const payload = parseMcpResponse(text)
	if (payload.error) {
		throw new Error(payload.error.message ?? 'The bookshop tool call failed.')
	}
	return payload.result as ToolResult
}

function parseMcpResponse(text: string): {
	result?: unknown
	error?: { message?: string }
} {
	const dataLine = text.split(/\r?\n/).find((line) => line.startsWith('data: '))
	return JSON.parse(dataLine ? dataLine.slice(6) : text)
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
	return new Promise((resolve, reject) => {
		const timeout = window.setTimeout(() => reject(new Error('Tool call timed out.')), ms)
		promise.then(
			(value) => {
				window.clearTimeout(timeout)
				resolve(value)
			},
			(error: unknown) => {
				window.clearTimeout(timeout)
				reject(error)
			}
		)
	})
}
