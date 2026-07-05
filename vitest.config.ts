import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const rootDir = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
	resolve: {
		alias: {
			'@last-bookshop/contracts': resolve(rootDir, 'packages/contracts/src/index.ts'),
			'@last-bookshop/game-content': resolve(
				rootDir,
				'packages/game-content/src/index.ts'
			)
		}
	},
	test: {
		include: ['apps/**/tests/**/*.test.ts', 'apps/**/tests/**/*.test.tsx'],
		environment: 'node',
		environmentMatchGlobs: [['apps/widget/**', 'jsdom']],
		setupFiles: ['apps/widget/tests/setup.ts'],
		globals: true
	}
})
