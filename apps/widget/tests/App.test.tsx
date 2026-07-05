// @vitest-environment jsdom

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { App } from '../src/App'

describe('App', () => {
	it('renders start and resume views before a scene exists', () => {
		render(<App />)
		expect(screen.getByRole('heading', { name: 'The Last Bookshop' })).toBeInTheDocument()
		expect(screen.getByRole('button', { name: /start game/i })).toBeInTheDocument()
		expect(screen.getByRole('button', { name: /resume game/i })).toBeInTheDocument()
	})

	it('shows a bridge error when starting outside ChatGPT', async () => {
		const user = userEvent.setup()
		render(<App />)
		await user.click(screen.getByRole('button', { name: /start game/i }))
		expect(await screen.findByText('WIDGET_ERROR')).toBeInTheDocument()
	})

	it('supports keyboard navigation to the start button', async () => {
		const user = userEvent.setup()
		render(<App />)
		await user.tab()
		expect(document.activeElement).toBe(screen.getByLabelText(/shop name/i))
	})
})
