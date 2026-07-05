import js from '@eslint/js'
import tseslint from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import prettier from 'eslint-config-prettier'

export default [
	{
		ignores: [
			'node_modules/**',
			'dist/**',
			'server/**',
			'web/**',
			'apps/**/dist/**',
			'packages/**/dist/**'
		]
	},
	js.configs.recommended,
	{
		files: ['**/*.ts', '**/*.tsx'],
		languageOptions: {
			parser: tsParser,
			parserOptions: {
				sourceType: 'module',
				ecmaVersion: 'latest'
			},
			globals: {
				Buffer: 'readonly',
				URL: 'readonly',
				console: 'readonly',
				document: 'readonly',
				process: 'readonly',
				window: 'readonly'
			}
		},
		plugins: {
			'@typescript-eslint': tseslint
		},
		rules: {
			...tseslint.configs.recommended.rules,
			'@typescript-eslint/no-explicit-any': 'off'
		}
	},
	prettier
]
