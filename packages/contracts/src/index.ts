import { z } from 'zod'

export const ShopStyleSchema = z.enum(['cottage', 'woodland', 'seaside'])
export const WorldStatusSchema = z.enum(['active', 'completed', 'expired'])
export const EncounterStatusSchema = z.enum([
	'awaiting_question_or_recommendation',
	'awaiting_rival_recommendation',
	'ready_to_resolve',
	'resolved'
])
export const SubmittedBySchema = z.enum(['player', 'rival'])
export const LengthSchema = z.enum(['short', 'medium', 'long'])

export const ShopSchema = z.object({
	name: z.string().min(1).max(60),
	style: ShopStyleSchema,
	reputation: z.number().int(),
	coins: z.number().int()
})

export const PlayerStateSchema = z.object({
	id: z.string(),
	displayName: z.string().optional()
})

export const RivalStateSchema = z.object({
	id: z.literal('avery-quill'),
	name: z.literal('Avery Quill'),
	shopName: z.literal('The Perfect Cupboard'),
	reputation: z.number().int()
})

export const CustomerStateSchema = z.object({
	customerId: z.string(),
	relationship: z.number().int(),
	encountersCompleted: z.number().int().min(0)
})

export const RecommendationSchema = z.object({
	bookId: z.string(),
	reason: z.string().min(1).max(600),
	submittedBy: SubmittedBySchema
})

export const ScoreBreakdownSchema = z.object({
	genreMatch: z.number(),
	themeMatch: z.number(),
	toneMatch: z.number(),
	intensityMatch: z.number(),
	lengthMatch: z.number(),
	explanationMatch: z.number(),
	avoidanceViolation: z.number(),
	total: z.number()
})

export const EncounterResultSchema = z.object({
	id: z.string(),
	winner: SubmittedBySchema,
	playerScore: z.number(),
	rivalScore: z.number(),
	playerBreakdown: ScoreBreakdownSchema,
	rivalBreakdown: ScoreBreakdownSchema,
	customerResponse: z.string(),
	coinDelta: z.number().int(),
	reputationDelta: z.number().int(),
	relationshipDelta: z.number().int(),
	resolvedAt: z.string()
})

export const EncounterSchema = z.object({
	id: z.string(),
	customerId: z.string(),
	publicRequest: z.string(),
	availableBookIds: z.array(z.string()),
	questionsAsked: z.number().int().min(0),
	maxQuestions: z.number().int().min(0),
	playerRecommendation: RecommendationSchema.nullable(),
	rivalRecommendation: RecommendationSchema.nullable(),
	result: EncounterResultSchema.nullable(),
	status: EncounterStatusSchema
})

export const WorldSchema = z.object({
	id: z.string(),
	version: z.number().int().min(1),
	status: WorldStatusSchema,
	shop: ShopSchema,
	player: PlayerStateSchema,
	rival: RivalStateSchema,
	customerStates: z.array(CustomerStateSchema),
	currentEncounter: EncounterSchema.nullable(),
	createdAt: z.string(),
	updatedAt: z.string(),
	expiresAt: z.string()
})

export const CustomerDefinitionSchema = z.object({
	id: z.string(),
	name: z.string(),
	pronouns: z.string(),
	summary: z.string(),
	publicTraits: z.array(z.string()),
	likes: z.array(z.string()),
	dislikes: z.array(z.string()),
	sensitiveTopics: z.array(z.string()),
	portraitAssetId: z.string(),
	spriteAssetId: z.string()
})

export const PublicCustomerSchema = CustomerDefinitionSchema.pick({
	id: true,
	name: true,
	pronouns: true,
	summary: true,
	publicTraits: true,
	portraitAssetId: true,
	spriteAssetId: true
})

export const BookSchema = z.object({
	id: z.string(),
	title: z.string(),
	author: z.string(),
	description: z.string(),
	genres: z.array(z.string()),
	themes: z.array(z.string()),
	tone: z.array(z.string()),
	intensity: z.number().int().min(1).max(5),
	length: LengthSchema,
	coverAssetId: z.string()
})

export const AssetManifestEntrySchema = z.object({
	id: z.string(),
	path: z.string(),
	type: z.enum([
		'background',
		'portrait',
		'sprite',
		'book-cover',
		'decoration',
		'effect'
	]),
	alt: z.string(),
	width: z.number().int().positive(),
	height: z.number().int().positive()
})

export const PublicSceneSchema = z.object({
	world: WorldSchema,
	customer: PublicCustomerSchema,
	books: z.array(BookSchema),
	lastCustomerAnswer: z
		.object({
			question: z.string(),
			answer: z.string()
		})
		.nullable(),
	assetManifest: z.array(AssetManifestEntrySchema),
	resumeTokenAvailable: z.boolean()
})

export const BookshopErrorCodeSchema = z.enum([
	'INVALID_TOKEN',
	'WORLD_EXPIRED',
	'WORLD_NOT_FOUND',
	'STALE_WORLD_VERSION',
	'INVALID_ENCOUNTER_STATE',
	'BOOK_NOT_AVAILABLE',
	'QUESTION_LIMIT_REACHED',
	'ALREADY_RESOLVED',
	'RATE_LIMITED',
	'INTERNAL_ERROR'
])

export type ShopStyle = z.infer<typeof ShopStyleSchema>
export type WorldStatus = z.infer<typeof WorldStatusSchema>
export type EncounterStatus = z.infer<typeof EncounterStatusSchema>
export type SubmittedBy = z.infer<typeof SubmittedBySchema>
export type Shop = z.infer<typeof ShopSchema>
export type PlayerState = z.infer<typeof PlayerStateSchema>
export type RivalState = z.infer<typeof RivalStateSchema>
export type CustomerState = z.infer<typeof CustomerStateSchema>
export type Recommendation = z.infer<typeof RecommendationSchema>
export type ScoreBreakdown = z.infer<typeof ScoreBreakdownSchema>
export type EncounterResult = z.infer<typeof EncounterResultSchema>
export type Encounter = z.infer<typeof EncounterSchema>
export type World = z.infer<typeof WorldSchema>
export type CustomerDefinition = z.infer<typeof CustomerDefinitionSchema>
export type PublicCustomer = z.infer<typeof PublicCustomerSchema>
export type Book = z.infer<typeof BookSchema>
export type AssetManifestEntry = z.infer<typeof AssetManifestEntrySchema>
export type PublicScene = z.infer<typeof PublicSceneSchema>
export type BookshopErrorCode = z.infer<typeof BookshopErrorCodeSchema>
