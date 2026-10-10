// Shared slugs keep editorial recommendations consistent across translations.
export const relatedArticles = {
	'modern-em': ['ai-for-the-human-part-of-engineering-management', 'context-beats-prompts'],
	'ai-for-the-human-part-of-engineering-management': ['sharing-my-one-to-one-notes', 'modern-em'],
	'sharing-my-one-to-one-notes': [
		'ai-for-the-human-part-of-engineering-management',
		'context-beats-prompts',
	],
	'context-beats-prompts': ['sharing-my-one-to-one-notes', 'keep-your-own-record'],
	'ai-beyond-coding': ['same-problems-different-teams', 'modern-em'],
	'same-problems-different-teams': ['ai-beyond-coding', 'speed-over-perfection'],
	'keep-your-own-record': ['make-the-case-for-your-work', 'shy-bairns-get-nowt'],
	'make-the-case-for-your-work': ['keep-your-own-record', 'shy-bairns-get-nowt'],
	'shy-bairns-get-nowt': ['make-the-case-for-your-work', 'keep-your-own-record'],
	'speed-over-perfection': ['punk', 'same-problems-different-teams'],
	punk: ['speed-over-perfection', 'modern-em'],
	'why-i-keep-work-on-a-separate-phone': [
		'ai-for-the-human-part-of-engineering-management',
		'sharing-my-one-to-one-notes',
	],
}
