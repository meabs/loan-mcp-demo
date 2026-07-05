import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

export const widgetUri = 'ui://last-bookshop/bookshop-v1.html'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const rootDir = join(__dirname, '../../../..')

export function readWidgetHtml(publicBaseUrl = ''): string {
	const widgetDist = join(rootDir, 'apps/widget/dist')
	const js = readFileSync(join(widgetDist, 'last-bookshop-widget.js'), 'utf8')
	let css = ''
	try {
		css = readFileSync(join(widgetDist, 'last-bookshop-widget.css'), 'utf8')
	} catch {
		css = ''
	}

	return `
		<div id="root">
			<main class="loading-shell">
				<section class="bookshop-card">
					<p>The Last Bookshop</p>
					<h1>Opening the shop...</h1>
				</section>
			</main>
		</div>
		<style>${css}</style>
		<script>window.__LAST_BOOKSHOP_CONFIG__ = ${JSON.stringify({ publicBaseUrl })}</script>
		<script type="module">${js}</script>
	`.trim()
}
