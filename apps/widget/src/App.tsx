import { useState } from 'react'
import { BookOpen, Check, HelpCircle, RefreshCw, Store, Trophy } from 'lucide-react'
import type { Book, ShopStyle } from '@last-bookshop/contracts'
import { useBookshop } from './state/useBookshop'
import { BookCover } from './components/BookCover'
import { CatSprite } from './components/CatSprite'
import './styles/app.css'

const styles: Array<{ id: ShopStyle; label: string }> = [
	{ id: 'cottage', label: 'Cottage' },
	{ id: 'woodland', label: 'Woodland' },
	{ id: 'seaside', label: 'Seaside' }
]

export function App() {
	const bookshop = useBookshop()
	const [shopName, setShopName] = useState('The Last Bookshop')
	const [shopStyle, setShopStyle] = useState<ShopStyle>('cottage')
	const [resumeInput, setResumeInput] = useState(bookshop.resumeToken)
	const [question, setQuestion] = useState('')
	const [selectedBookId, setSelectedBookId] = useState('')
	const [reason, setReason] = useState('')

	const scene = bookshop.scene
	const encounter = scene?.world.currentEncounter ?? null
	const hasPlayerRecommendation = Boolean(encounter?.playerRecommendation)
	const result = encounter?.result

	if (!scene) {
		return (
			<main className="bookshop-app">
				<section className="hero-panel">
					<div className="shop-mark" aria-hidden="true">
						<Store size={28} />
					</div>
					<div>
						<p className="eyebrow">Cosy competition</p>
						<h1>The Last Bookshop</h1>
						<p>
							Name your shop, meet Edith Vale, and recommend a fictional book before
							Avery Quill makes a rival pitch.
						</p>
					</div>
				</section>
				<section className="setup-panel" aria-labelledby="start-title">
					<h2 id="start-title">Open the shop</h2>
					<label>
						Shop name
						<input value={shopName} onChange={(event) => setShopName(event.target.value)} />
					</label>
					<div>
						<p className="field-label">Shop style</p>
						<div className="segmented" role="radiogroup" aria-label="Shop style">
							{styles.map((style) => (
								<button
									key={style.id}
									type="button"
									className={style.id === shopStyle ? 'active' : ''}
									onClick={() => setShopStyle(style.id)}
									aria-pressed={style.id === shopStyle}
								>
									{style.label}
								</button>
							))}
						</div>
					</div>
					<button
						type="button"
						className="primary"
						disabled={bookshop.loading || shopName.trim().length === 0}
						onClick={() => void bookshop.start(shopName, shopStyle)}
					>
						<Store size={18} />
						Start game
					</button>
				</section>
				<section className="setup-panel" aria-labelledby="resume-title">
					<h2 id="resume-title">Resume</h2>
					<label>
						Resume token
						<input
							value={resumeInput}
							onChange={(event) => setResumeInput(event.target.value)}
							placeholder="Paste token"
						/>
					</label>
					<button
						type="button"
						className="secondary"
						disabled={bookshop.loading || resumeInput.trim().length === 0}
						onClick={() => void bookshop.resume(resumeInput.trim())}
					>
						<RefreshCw size={18} />
						Resume game
					</button>
				</section>
				<ErrorNotice error={bookshop.error} onRefresh={bookshop.clearError} />
			</main>
		)
	}

	return (
		<main className={`bookshop-app ${scene.world.shop.style}`}>
			<section className="scene-panel" aria-label="Bookshop scene">
				<div className="scene-assets" aria-hidden="true">
					<img className="asset shelf shelf-a" src="/assets/bookshop/book_unit_1.png" alt="" />
					<img className="asset shelf shelf-b" src="/assets/bookshop/book_unit_4.png" alt="" />
					<img className="asset shelf shelf-c" src="/assets/bookshop/book_unit_8.png" alt="" />
					<img className="asset window" src="/assets/bookshop/window_1.png" alt="" />
					<img className="asset globe" src="/assets/bookshop/globe.png" alt="" />
					<img className="asset lamp" src="/assets/bookshop/lamp.png" alt="" />
					<img className="asset plant" src="/assets/bookshop/plant_pot_1.png" alt="" />
					<img className="asset sofa" src="/assets/bookshop/cozy_sofa.png" alt="" />
					<img className="asset counter-sprite" src="/assets/bookshop/counter.png" alt="" />
					<CatSprite animation="sleep" className="sleeping-cat" />
					<CatSprite animation="walk" className="walking-cat" />
				</div>
				<div className="portrait">
					<span>EV</span>
				</div>
				<div className="speech">
					<p className="eyebrow">Edith Vale</p>
					<h1>{encounter?.publicRequest}</h1>
					<p>{scene.customer.summary}</p>
				</div>
			</section>

			<section className="status-strip" aria-label="Shop status">
				<Metric label="Coins" value={scene.world.shop.coins} />
				<Metric label="Reputation" value={scene.world.shop.reputation} />
				<Metric
					label="Relationship"
					value={
						scene.world.customerStates.find((state) => state.customerId === scene.customer.id)
							?.relationship ?? 0
					}
				/>
			</section>

			{bookshop.error ? (
				<ErrorNotice error={bookshop.error} onRefresh={() => void bookshop.refresh()} />
			) : null}

			{!result && !hasPlayerRecommendation ? (
				<section className="action-panel">
					<div className="panel-heading">
						<HelpCircle size={20} />
						<div>
							<h2>Ask once, then choose</h2>
							<p>{encounter?.questionsAsked ? 'Question used' : 'One question available'}</p>
						</div>
					</div>
					{scene.lastCustomerAnswer ? (
						<blockquote>{scene.lastCustomerAnswer.answer}</blockquote>
					) : (
						<div className="ask-row">
							<input
								value={question}
								maxLength={300}
								onChange={(event) => setQuestion(event.target.value)}
								placeholder="Ask about puzzles, tone, boats..."
							/>
							<button
								type="button"
								className="secondary icon-button"
								disabled={bookshop.loading || question.trim().length === 0}
								onClick={() => {
									void bookshop.ask(question.trim())
									setQuestion('')
								}}
								aria-label="Ask Edith"
							>
								<HelpCircle size={18} />
							</button>
						</div>
					)}
				</section>
			) : null}

			{!result && !hasPlayerRecommendation ? (
				<BookSelection
					books={scene.books}
					selectedBookId={selectedBookId}
					reason={reason}
					onSelect={setSelectedBookId}
					onReason={setReason}
					onSubmit={() => void bookshop.recommend(selectedBookId, reason.trim())}
					loading={bookshop.loading}
				/>
			) : null}

			{!result && hasPlayerRecommendation ? (
				<section className="action-panel">
					<div className="panel-heading">
						<BookOpen size={20} />
						<div>
							<h2>Avery’s turn</h2>
							<p>The rival bookseller has enough public information to make a pitch.</p>
						</div>
					</div>
					<button
						type="button"
						className="primary"
						disabled={bookshop.loading}
						onClick={() => void bookshop.resolveAfterRival()}
					>
						<Check size={18} />
						Let Avery respond
					</button>
				</section>
			) : null}

			{result ? (
				<section className="result-panel">
					<div className="panel-heading">
						<Trophy size={22} />
						<div>
							<p className="eyebrow">Result</p>
							<h2>{result.winner === 'player' ? 'Edith chose your book' : 'Avery won this round'}</h2>
						</div>
					</div>
					<p>{result.customerResponse}</p>
					<div className="score-grid">
						<Metric label="Your score" value={result.playerScore} />
						<Metric label="Avery score" value={result.rivalScore} />
						<Metric label="Coins" value={`+${result.coinDelta}`} />
						<Metric label="Reputation" value={`+${result.reputationDelta}`} />
					</div>
				</section>
			) : null}
		</main>
	)
}

function BookSelection({
	books,
	selectedBookId,
	reason,
	onSelect,
	onReason,
	onSubmit,
	loading
}: {
	books: Book[]
	selectedBookId: string
	reason: string
	onSelect: (bookId: string) => void
	onReason: (reason: string) => void
	onSubmit: () => void
	loading: boolean
}) {
	return (
		<section className="action-panel">
			<div className="panel-heading">
				<BookOpen size={20} />
				<div>
					<h2>Recommend one book</h2>
					<p>Pick carefully; Edith asked for adventure without boats.</p>
				</div>
			</div>
			<div className="book-grid">
				{books.map((book) => (
					<button
						type="button"
						key={book.id}
						className={`book-option ${selectedBookId === book.id ? 'selected' : ''}`}
						onClick={() => onSelect(book.id)}
						aria-pressed={selectedBookId === book.id}
					>
						<BookCover book={book} />
						<strong>{book.title}</strong>
						<span>{book.description}</span>
					</button>
				))}
			</div>
			<label>
				Your recommendation
				<textarea
					value={reason}
					maxLength={600}
					onChange={(event) => onReason(event.target.value)}
					placeholder="Explain why this suits Edith..."
				/>
			</label>
			<button
				type="button"
				className="primary"
				disabled={loading || !selectedBookId || reason.trim().length === 0}
				onClick={onSubmit}
			>
				<Check size={18} />
				Submit recommendation
			</button>
		</section>
	)
}

function Metric({ label, value }: { label: string; value: string | number }) {
	return (
		<div className="metric">
			<span>{label}</span>
			<strong>{value}</strong>
		</div>
	)
}

function ErrorNotice({
	error,
	onRefresh
}: {
	error: { code: string; message: string } | null
	onRefresh: () => void
}) {
	if (!error) return null
	return (
		<section className="error-panel" role="alert">
			<strong>{error.code}</strong>
			<p>{error.message}</p>
			<button type="button" className="secondary" onClick={onRefresh}>
				<RefreshCw size={16} />
				Refresh
			</button>
		</section>
	)
}
