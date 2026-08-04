export const locales = ['en', 'fr'] as const
export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = 'en'

export const ui = {
	en: {
		about: 'About',
		toggleNavigation: 'Toggle navigation',
		siteNavigation: 'Site',
		languageSelection: 'Language selection',
		intro: 'I write about software engineering and life, and build small tools for fun.',
		write: 'Write',
		allArticles: 'All articles',
		build: 'Build',
		buildDyss: 'Small runtime CSS demos built with dyss.',
		buildMoments: 'A tiny app to track meaningful dates. Local-first, no account.',
		firefoxAddons: 'Firefox add-ons',
		buildAddons: 'PromptTube and Amazon Search Focus.',
		lastUpdated: 'last updated on',
		minuteRead: 'min read',
		colourTheme: 'Colour theme',
		useTheme: (theme: string) => `Use ${theme} theme`,
		themes: { auto: 'auto', light: 'light', dark: 'dark' },
		hello: 'Hello',
		myNameIs: 'my name is',
		aboutBernard: 'About Bernard Debecker',
		feedTitle: 'vegetalope Write Feed',
	},
	fr: {
		about: 'À propos',
		toggleNavigation: 'Afficher ou masquer la navigation',
		siteNavigation: 'Site',
		languageSelection: 'Sélection de la langue',
		intro: 'J’écris sur le developpement web et la vie, et je crée de petits outils pour le plaisir.',
		write: 'Ecrire',
		allArticles: 'Tous les articles',
		build: 'Faire',
		buildDyss: 'Petites démonstrations CSS créées avec dyss.',
		buildMoments: 'Une petite application pour suivre les dates importantes. Locale, sans compte.',
		firefoxAddons: 'Extensions Firefox',
		buildAddons: 'PromptTube et Amazon Search Focus.',
		lastUpdated: 'dernière mise à jour le',
		minuteRead: 'min de lecture',
		colourTheme: 'Thème de couleur',
		useTheme: (theme: string) => `Utiliser le thème ${theme}`,
		themes: { auto: 'auto', light: 'clair', dark: 'sombre' },
		hello: 'Bonjour',
		myNameIs: 'je m’appelle',
		aboutBernard: 'À propos de Bernard Debecker',
		feedTitle: 'Flux des écrits de vegetalope',
	},
} as const

export function getLocaleFromPath(pathname: string): Locale {
	return pathname === '/fr' || pathname.startsWith('/fr/') ? 'fr' : 'en'
}

export function getLocalePath(locale: Locale, path = '/') {
	const normalizedPath = path.startsWith('/') ? path : `/${path}`
	if (locale === defaultLocale) return normalizedPath
	if (normalizedPath === '/') return '/fr/'
	return `/fr${normalizedPath}`
}

export function getArticleParts(id: string) {
	const normalizedId = id.replace(/\.(md|mdx)$/, '')
	const [candidateLocale, ...slugParts] = normalizedId.split('/')
	const locale: Locale = candidateLocale === 'fr' ? 'fr' : 'en'
	return { locale, slug: slugParts.join('/') }
}
