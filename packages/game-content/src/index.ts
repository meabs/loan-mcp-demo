import type { AssetManifestEntry, Book, CustomerDefinition } from '@last-bookshop/contracts'

export const assetManifest: AssetManifestEntry[] = [
	{
		id: 'bg-cottage',
		path: '/assets/bookshop/wall_1.png',
		type: 'background',
		alt: 'Pixel art wall tile for the cottage bookshop interior.',
		width: 32,
		height: 48
	},
	{
		id: 'bg-woodland',
		path: '/assets/bookshop/wall_1.png',
		type: 'background',
		alt: 'Pixel art wall tile for the woodland bookshop interior.',
		width: 32,
		height: 48
	},
	{
		id: 'bg-seaside',
		path: '/assets/bookshop/wall_1.png',
		type: 'background',
		alt: 'Pixel art wall tile for the seaside bookshop interior.',
		width: 32,
		height: 48
	},
	{
		id: 'floor-cottage',
		path: '/assets/bookshop/floor_1.png',
		type: 'background',
		alt: 'Pixel art wooden floor tile.',
		width: 32,
		height: 32
	},
	{
		id: 'portrait-edith',
		path: 'css:portrait-edith',
		type: 'portrait',
		alt: 'Placeholder portrait for Edith Vale.',
		width: 320,
		height: 320
	},
	{
		id: 'sprite-edith',
		path: 'css:sprite-edith',
		type: 'sprite',
		alt: 'Small placeholder sprite for Edith Vale.',
		width: 96,
		height: 128
	},
	{
		id: 'sprite-book-unit-1',
		path: '/assets/bookshop/book_unit_1.png',
		type: 'sprite',
		alt: 'Pixel art bookcase.',
		width: 64,
		height: 64
	},
	{
		id: 'sprite-book-unit-4',
		path: '/assets/bookshop/book_unit_4.png',
		type: 'sprite',
		alt: 'Pixel art bookcase with varied books.',
		width: 64,
		height: 64
	},
	{
		id: 'sprite-counter',
		path: '/assets/bookshop/counter.png',
		type: 'sprite',
		alt: 'Pixel art shop counter.',
		width: 96,
		height: 64
	},
	{
		id: 'decoration-sofa',
		path: '/assets/bookshop/cozy_sofa.png',
		type: 'decoration',
		alt: 'Pixel art cosy sofa.',
		width: 64,
		height: 64
	},
	{
		id: 'decoration-plant',
		path: '/assets/bookshop/plant_pot_1.png',
		type: 'decoration',
		alt: 'Pixel art plant pot.',
		width: 32,
		height: 32
	},
	{
		id: 'decoration-globe',
		path: '/assets/bookshop/globe.png',
		type: 'decoration',
		alt: 'Pixel art globe.',
		width: 32,
		height: 32
	},
	{
		id: 'decoration-lamp',
		path: '/assets/bookshop/lamp.png',
		type: 'decoration',
		alt: 'Pixel art lamp.',
		width: 32,
		height: 32
	},
	{
		id: 'decoration-window',
		path: '/assets/bookshop/window_1.png',
		type: 'decoration',
		alt: 'Pixel art bookshop window.',
		width: 32,
		height: 32
	},
	{
		id: 'sprite-cat-sleeping',
		path: '/assets/cats/spr_cat_1_sleep_strip9.png',
		type: 'sprite',
		alt: 'Pixel art sleeping shop cat animation strip.',
		width: 288,
		height: 32
	},
	{
		id: 'sprite-cat-idle',
		path: '/assets/cats/spr_cat_1_idle_strip9.png',
		type: 'sprite',
		alt: 'Pixel art idle shop cat animation strip.',
		width: 288,
		height: 32
	},
	{
		id: 'sprite-cat-walk',
		path: '/assets/cats/spr_cat_1_walk_strip9.png',
		type: 'sprite',
		alt: 'Pixel art walking shop cat animation strip.',
		width: 288,
		height: 32
	},
	{
		id: 'sprite-cat-lick',
		path: '/assets/cats/spr_cat_1_lick_strip5.png',
		type: 'sprite',
		alt: 'Pixel art grooming shop cat animation strip.',
		width: 160,
		height: 32
	},
	{
		id: 'cover-clockmaker-map',
		path: 'css:cover-clockmaker-map',
		type: 'book-cover',
		alt: "Cover placeholder for The Clockmaker's Map.",
		width: 240,
		height: 360
	},
	{
		id: 'cover-eleven-miles',
		path: 'css:cover-eleven-miles',
		type: 'book-cover',
		alt: 'Cover placeholder for Eleven Miles Underground.',
		width: 240,
		height: 360
	},
	{
		id: 'cover-silver-heron',
		path: 'css:cover-silver-heron',
		type: 'book-cover',
		alt: 'Cover placeholder for Voyage of the Silver Heron.',
		width: 240,
		height: 360
	}
]

export const edithVale: CustomerDefinition = {
	id: 'edith-vale',
	name: 'Edith Vale',
	pronouns: 'she/her',
	summary: 'Retired teacher with dry humour, sharp taste, and a dislike of fuss.',
	publicTraits: [
		'Retired teacher',
		'Dry humour',
		'Likes clever adventure',
		'Dislikes sentimental cliches'
	],
	likes: ['adventure', 'puzzles', 'understated wit', 'clever maps'],
	dislikes: ['sentimental cliches', 'boats', 'sea voyages', 'overwrought emotion'],
	sensitiveTopics: ['bereavement', 'illness'],
	portraitAssetId: 'portrait-edith',
	spriteAssetId: 'sprite-edith'
}

export const books: Book[] = [
	{
		id: 'clockmakers-map',
		title: "The Clockmaker's Map",
		author: 'Hester Lint',
		description:
			'A retired surveyor inherits a brass map that rearranges itself each midnight, sending her through libraries, clock towers, and locked gardens.',
		genres: ['adventure', 'mystery'],
		themes: ['puzzles', 'maps', 'friendship', 'understated wit'],
		tone: ['dry humour', 'clever', 'warm'],
		intensity: 2,
		length: 'medium',
		coverAssetId: 'cover-clockmaker-map'
	},
	{
		id: 'eleven-miles-underground',
		title: 'Eleven Miles Underground',
		author: 'Rowan Pike',
		description:
			'Three archivists descend into an abandoned postal railway and find a city of locked rooms, coded murals, and uneasy silences.',
		genres: ['exploration', 'suspense'],
		themes: ['puzzles', 'underground', 'secrets'],
		tone: ['claustrophobic', 'tense', 'serious'],
		intensity: 4,
		length: 'long',
		coverAssetId: 'cover-eleven-miles'
	},
	{
		id: 'voyage-silver-heron',
		title: 'Voyage of the Silver Heron',
		author: 'Mara Bellweather',
		description:
			'A tender sea voyage in which a grieving cartographer crosses the winter ocean to return a keepsake to an island observatory.',
		genres: ['adventure', 'maritime'],
		themes: ['boats', 'sea voyage', 'grief', 'healing'],
		tone: ['emotional', 'sentimental', 'lyrical'],
		intensity: 3,
		length: 'medium',
		coverAssetId: 'cover-silver-heron'
	}
]

export const edithQuestionAnswers = [
	{
		id: 'boats',
		match: ['boat', 'boats', 'sea', 'ship', 'voyage', 'ocean', 'sailing'],
		answer:
			'No boats, please. I spent one school trip watching thirty children turn green on a ferry, and literature has yet to improve on the experience.'
	},
	{
		id: 'adventure',
		match: ['adventure', 'exciting', 'quest', 'journey'],
		answer:
			'Adventure is welcome, provided everyone involved has packed a brain. I prefer a locked gate to a swooning declaration.'
	},
	{
		id: 'puzzles',
		match: ['puzzle', 'mystery', 'clever', 'riddle'],
		answer:
			'A puzzle would be splendid. I like a book that trusts the reader to keep up without shouting clues from the hedgerow.'
	},
	{
		id: 'tone',
		match: ['funny', 'humour', 'humor', 'wit', 'tone'],
		answer:
			'Dry wit, yes. Anything too gooey and I begin marking it in red pen.'
	},
	{
		id: 'length',
		match: ['short', 'long', 'length', 'quick'],
		answer:
			'Medium is ideal. Long is acceptable if the author has earned the furniture. Short is fine, but I do like to settle in.'
	},
	{
		id: 'intensity',
		match: ['dark', 'scary', 'suspense', 'intense'],
		answer:
			'A little suspense is healthy. If I need a torch, a warning label, and a biscuit afterwards, perhaps not today.'
	}
]

export const defaultEdithAnswer =
	'I am after something adventurous, clever, and not soaked in sentiment. If it contains a boat, I shall quietly shelve it elsewhere.'

export const publicRequest = 'I want something adventurous, but nothing involving boats.'
