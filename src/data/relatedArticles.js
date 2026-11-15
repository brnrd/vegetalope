import { getArticleParts } from '../i18n.js'

// Shared slugs keep editorial recommendations consistent across translations.
export const relatedArticles = {
	'degrees-and-experience': ['becoming-an-em', 'shy-bairns-get-nowt'],
	'becoming-an-em': ['genchi-genbutsu', 'modern-em'],
	exceptional: ['keep-your-own-record', 'make-the-case-for-your-work'],
	'genchi-genbutsu': ['engineering-methodology', 'speed-over-perfection'],
	'engineering-methodology': ['speed-over-perfection', 'same-problems-different-teams'],
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

export function getRelatedArticles(entries, slug, locale, limit = 2) {
	const bySlug = new Map(
		entries
			.filter(entry => getArticleParts(entry.id).locale === locale)
			.map(entry => [getArticleParts(entry.id).slug, entry]),
	)
	const currentTags = new Set(bySlug.get(slug)?.data.tags ?? [])
	const overlap = entry => (entry.data.tags ?? []).filter(tag => currentTags.has(tag)).length
	const fallback = [...bySlug.entries()]
		.filter(([candidate]) => candidate !== slug)
		.sort(([, a], [, b]) => overlap(b) - overlap(a) || b.data.pubDate - a.data.pubDate)
		.map(([candidate]) => candidate)

	return [...new Set([...(relatedArticles[slug] ?? []), ...fallback])]
		.filter(candidate => candidate !== slug && bySlug.has(candidate))
		.slice(0, limit)
		.map(candidate => bySlug.get(candidate))
}
