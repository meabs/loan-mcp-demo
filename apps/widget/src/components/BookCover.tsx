import type { Book } from '@last-bookshop/contracts'

export function BookCover({ book }: { book: Book }) {
	return (
		<div className={`book-cover ${book.coverAssetId}`} aria-label={book.title}>
			<span>{book.title}</span>
			<small>{book.author}</small>
		</div>
	)
}
