import { useMemo, useState } from 'react'
import type { PublicScene, ShopStyle } from '@last-bookshop/contracts'
import {
	callTool,
	getInitialResumeToken,
	getInitialScene,
	rememberResumeToken
} from '../bridge/openai'

type ErrorState = {
	code: string
	message: string
} | null

function isError(result: unknown): result is { error: { code: string; message: string } } {
	return Boolean(
		result &&
			typeof result === 'object' &&
			'error' in result &&
			(result as { error?: unknown }).error
	)
}

export function useBookshop() {
	const [scene, setScene] = useState<PublicScene | null>(() => getInitialScene())
	const [resumeToken, setResumeToken] = useState(() => getInitialResumeToken())
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<ErrorState>(null)

	const version = scene?.world.version ?? 1

	async function run(name: string, input: Record<string, unknown>) {
		setLoading(true)
		setError(null)
		try {
			const result = await callTool(name, input)
			if (isError(result.structuredContent)) {
				setError(result.structuredContent.error)
				return null
			}
			const nextScene = result.structuredContent as PublicScene | undefined
			if (nextScene?.world) setScene(nextScene)
			if (result._meta?.resumeToken) {
				setResumeToken(result._meta.resumeToken)
				await rememberResumeToken(result._meta.resumeToken)
			}
			return nextScene ?? null
		} catch (toolError) {
			setError({
				code: 'WIDGET_ERROR',
				message:
					toolError instanceof Error
						? toolError.message
						: 'The widget could not call the bookshop tool.'
			})
			return null
		} finally {
			setLoading(false)
		}
	}

	return useMemo(
		() => ({
			scene,
			resumeToken,
			loading,
			error,
			clearError: () => setError(null),
			start: (shopName: string, shopStyle: ShopStyle) =>
				run('start_bookshop', { shopName, shopStyle }),
			resume: (token = resumeToken) => run('resume_bookshop', { resumeToken: token }),
			refresh: () => run('get_bookshop_scene', { resumeToken }),
			ask: (question: string) =>
				run('ask_customer', {
					resumeToken,
					question,
					expectedWorldVersion: version
				}),
			recommend: (bookId: string, reason: string) =>
				run('submit_player_recommendation', {
					resumeToken,
					bookId,
					reason,
					expectedWorldVersion: version
				}),
			resolveAfterRival: async () => {
				if (!scene?.world.currentEncounter) return null
				const playerBook = scene.world.currentEncounter.playerRecommendation?.bookId
				const rivalBook =
					scene.books.find((book) => book.id !== playerBook && book.id !== 'voyage-silver-heron')
						?.id ?? scene.books.find((book) => book.id !== playerBook)?.id
				if (!rivalBook) return null
				const rivalScene = await run('submit_rival_recommendation', {
					resumeToken,
					bookId: rivalBook,
					reason:
						'Avery recommends it for its precise adventure, tidy structure, and confidence that it meets Edith without too much fuss.',
					expectedWorldVersion: version
				})
				if (!rivalScene) return null
				return run('resolve_recommendations', {
					resumeToken,
					expectedWorldVersion: rivalScene.world.version
				})
			}
		}),
		[scene, resumeToken, loading, error, version]
	)
}
