import { useState } from 'react'
import {
	BookOpen,
	Check,
	Gift,
	Heart,
	HelpCircle,
	RefreshCw,
	Search,
	Settings,
	Star,
	Store,
	Trophy,
	Users
} from 'lucide-react'
import type { Book, EncounterResult, ShopStyle } from '@last-bookshop/contracts'
import type { ReactNode } from 'react'
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

	const relationship =
		scene.world.customerStates.find((state) => state.customerId === scene.customer.id)?.relationship ?? 0
	const selectedBook = scene.books.find((book) => book.id === selectedBookId)

	return (
		<main className={`bookshop-app in-play ${scene.world.shop.style}`}>
			<section className="game-shell" aria-label="Bookshop encounter">
				<div className="top-status" aria-label="Shop status">
					<div className="brand-plaque">
						<Store size={20} />
						<strong>{scene.world.shop.name}</strong>
					</div>
					<StatusPill icon={<Gift size={18} />} label="Coins" value={scene.world.shop.coins} />
					<StatusPill icon={<Star size={18} />} label="Reputation" value={scene.world.shop.reputation} />
					<StatusPill icon={<Heart size={18} />} label="Relationship" value={relationship} />
					<div className="day-plaque">
						<BookOpen size={18} />
						<span>Day 1 - Morning</span>
					</div>
					<button type="button" className="settings-button" aria-label="Settings">
						<Settings size={20} />
					</button>
				</div>

				<div className="scene-panel" aria-label="Bookshop scene">
					<SceneAssets />
					<div className="shop-sign" aria-hidden="true">The Last Bookshop</div>
					<div className={`character customer ${result ? 'happy' : 'idle'}`} aria-hidden="true">
						<span>EV</span>
					</div>
					<div
						className={`character rival ${
							hasPlayerRecommendation && !result ? 'thinking' : result?.winner === 'rival' ? 'happy' : 'idle'
						}`}
						aria-hidden="true"
					>
						<span>AQ</span>
					</div>
					<div className="speech customer-speech">
						<p className="eyebrow">{scene.customer.name}</p>
						<h1>{scene.lastCustomerAnswer?.answer ?? encounter?.publicRequest}</h1>
						<p>{scene.customer.summary}</p>
					</div>
					<div className="speech rival-speech">
						<p className="eyebrow">Avery Quill</p>
						<p>
							{hasPlayerRecommendation
								? 'Hmm. I have a sharper pitch ready.'
								: 'I am listening for the public clues.'}
						</p>
					</div>

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
						<div className="rival-turn-card">
							<div>
								<p className="eyebrow">Rival turn</p>
								<h2>{selectedBook ? `You chose ${selectedBook.title}` : 'Your recommendation is in'}</h2>
								<p>Avery is preparing a competing recommendation from the same public clues.</p>
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
						</div>
					) : null}

					{result ? <ResultOverlay result={result} /> : null}
				</div>

				<div className="bottom-actions" aria-label="Encounter actions">
					<div className="ask-tool">
						<Search size={18} />
						{scene.lastCustomerAnswer ? (
							<span>Question used</span>
						) : (
							<input
								value={question}
								maxLength={300}
								onChange={(event) => setQuestion(event.target.value)}
								placeholder="Ask about puzzles, tone, boats..."
								disabled={Boolean(result) || hasPlayerRecommendation}
							/>
						)}
						<button
							type="button"
							className="secondary compact-button"
							disabled={
								bookshop.loading ||
								Boolean(result) ||
								hasPlayerRecommendation ||
								Boolean(scene.lastCustomerAnswer) ||
								question.trim().length === 0
							}
							onClick={() => {
								void bookshop.ask(question.trim())
								setQuestion('')
							}}
						>
							<HelpCircle size={17} />
							Ask
						</button>
					</div>
					<button type="button" className="secondary compact-button" disabled>
						<BookOpen size={17} />
						Clues
					</button>
					<button
						type="button"
						className="primary compact-button"
						disabled={
							bookshop.loading ||
							!selectedBookId ||
							reason.trim().length === 0 ||
							hasPlayerRecommendation ||
							Boolean(result)
						}
						onClick={() => void bookshop.recommend(selectedBookId, reason.trim())}
					>
						<Check size={17} />
						Suggest
					</button>
					<button type="button" className="secondary compact-button" disabled>
						<Users size={17} />
						Deal
					</button>
				</div>
			</section>

			{bookshop.error ? <ErrorNotice error={bookshop.error} onRefresh={() => void bookshop.refresh()} /> : null}
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
		<section className="book-choice-panel" aria-label="Book recommendations">
			<div className="panel-heading">
				<BookOpen size={20} />
				<div>
					<h2>Choose the best match</h2>
					<p>Read the covers, then make your case.</p>
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
						<div className="book-option-copy">
							<strong>{book.title}</strong>
							<span>{book.tone[0]} - {book.genres[0]}</span>
						</div>
					</button>
				))}
			</div>
			<label>
				<span>Your recommendation</span>
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

function SceneAssets() {
	return (
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
	)
}

function StatusPill({
	icon,
	label,
	value
}: {
	icon: ReactNode
	label: string
	value: string | number
}) {
	return (
		<div className="status-pill">
			{icon}
			<span>{label}</span>
			<strong>{value}</strong>
		</div>
	)
}

function ResultOverlay({
	result
}: {
	result: EncounterResult | null
}) {
	if (!result) return null
	return (
		<section className="verdict-overlay" aria-label="Round result">
			<div className="verdict-ribbon">
				<Trophy size={18} />
				Verdict
			</div>
			<h2>{result.winner === 'player' ? 'Edith chose your book' : 'Avery wins this round'}</h2>
			<p>{result.customerResponse}</p>
			<div className="score-grid">
				<Metric label="You" value={result.playerScore} />
				<Metric label="Avery" value={result.rivalScore} />
				<Metric label="Coins" value={`+${result.coinDelta}`} />
				<Metric label="Reputation" value={`+${result.reputationDelta}`} />
			</div>
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
