import { getLocalePath } from '../i18n.js'

// Stable IDs are shared by translations; labels and descriptions are localized.
export const articleTags = {
	'engineering-leadership': {
		en: {
			label: 'Engineering leadership',
			description:
				'Leading engineering teams: ownership, delivery, feedback and the day-to-day work of management.',
		},
		fr: {
			label: 'Management technique',
			description:
				'Diriger des équipes techniques : autonomie, livraison, feedback et pratique quotidienne du management.',
		},
	},
	'ai-at-work': {
		en: {
			label: 'AI at work',
			description:
				'Practical ways to use AI in engineering and management while keeping responsibility for the work.',
		},
		fr: {
			label: 'IA au travail',
			description:
				'Utiliser l’IA dans l’ingénierie et le management tout en gardant la responsabilité du travail.',
		},
	},
	careers: {
		en: {
			label: 'Careers',
			description:
				'Growing an engineering career: contributions, recognition, learning and the move into management.',
		},
		fr: {
			label: 'Parcours professionnels',
			description:
				'Évoluer dans l’ingénierie : contributions, reconnaissance, apprentissage et passage au management.',
		},
	},
}

export const articleTagIds = Object.keys(articleTags)

export function getArticleTagUrl(tag, locale) {
	return getLocalePath(locale, `/write/tags/${tag}/`)
}
