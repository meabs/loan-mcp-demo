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
	if (!window.openai?.callTool) {
		throw new Error('Open this widget in ChatGPT developer mode to call tools.')
	}
	return window.openai.callTool(name, input)
}

export async function rememberResumeToken(resumeToken: string): Promise<void> {
	window.localStorage.setItem('lastBookshopResumeToken', resumeToken)
	await window.openai?.setWidgetState?.({ resumeToken })
}
