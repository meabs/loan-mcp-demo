import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
	plugins: [react()],
	build: {
		outDir: 'dist',
		emptyOutDir: true,
		rollupOptions: {
			input: 'src/main.tsx',
			output: {
				entryFileNames: 'last-bookshop-widget.js',
				assetFileNames: 'last-bookshop-widget.css'
			}
		}
	},
	test: {
		environment: 'jsdom',
		globals: true,
		setupFiles: ['apps/widget/tests/setup.ts']
	}
})
