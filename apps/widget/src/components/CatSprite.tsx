type CatAnimation = 'sleep' | 'idle' | 'walk' | 'lick'

const catSprites: Record<
	CatAnimation,
	{ src: string; frames: number; duration: string; label: string }
> = {
	sleep: {
		src: '/assets/cats/spr_cat_1_sleep_strip9.png',
		frames: 9,
		duration: '1.6s',
		label: 'Sleeping shop cat'
	},
	idle: {
		src: '/assets/cats/spr_cat_1_idle_strip9.png',
		frames: 9,
		duration: '1.2s',
		label: 'Idle shop cat'
	},
	walk: {
		src: '/assets/cats/spr_cat_1_walk_strip9.png',
		frames: 9,
		duration: '0.9s',
		label: 'Walking shop cat'
	},
	lick: {
		src: '/assets/cats/spr_cat_1_lick_strip5.png',
		frames: 5,
		duration: '1.1s',
		label: 'Grooming shop cat'
	}
}

export function CatSprite({
	animation,
	className = '',
	hidden = true
}: {
	animation: CatAnimation
	className?: string
	hidden?: boolean
}) {
	const sprite = catSprites[animation]

	return (
		<span
			className={`cat-strip cat-${animation} ${className}`}
			role={hidden ? undefined : 'img'}
			aria-label={hidden ? undefined : sprite.label}
			aria-hidden={hidden}
			style={
				{
					'--cat-sheet': `url("${sprite.src}")`,
					'--cat-frames': sprite.frames,
					'--cat-duration': sprite.duration
				} as CSSProperties
			}
		/>
	)
}
import type { CSSProperties } from 'react'
