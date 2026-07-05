import type { BookshopErrorCode } from '@last-bookshop/contracts'

export class BookshopError extends Error {
	constructor(
		readonly code: BookshopErrorCode,
		message: string,
		readonly status = 400
	) {
		super(message)
		this.name = 'BookshopError'
	}
}

export function publicError(error: unknown): { code: BookshopErrorCode; message: string } {
	if (error instanceof BookshopError) {
		return { code: error.code, message: error.message }
	}
	return { code: 'INTERNAL_ERROR', message: 'Something went wrong in the bookshop.' }
}
