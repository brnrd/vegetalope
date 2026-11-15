export const locales = ['en', 'fr']

export const defaultLocale = 'en'

export const ui = {
	en: {
		about: 'About',
		toggleNavigation: 'Toggle navigation',
		siteNavigation: 'Site',
		languageSelection: 'Language selection',
		homeEyebrow: 'Bernard Debecker / vegetalope',
		homeTitle: 'Bernard Debecker — Engineering leadership & small tools',
		homeDescription:
			'Practical thoughts on engineering leadership, AI at work and career growth by Bernard Debecker, plus small open-source tools.',
		homeHeadline: 'Thinking out loud. Making small things.',
		intro: 'I write about engineering, leading teams, and working life. I build tools for fun.',
		write: 'Write',
		writing: 'Writing',
		projects: 'Projects',
		writeTitle: 'Writing on engineering leadership, AI & careers',
		writeDescription:
			'Essays by Bernard Debecker on leading engineering teams, using AI at work and developing your career.',
		browseTopics: 'Browse by topic',
		articleTopics: 'Article topics',
		authorIntro:
			'I’m Bernard Debecker, an engineering leader and frontend engineer. I write about leading teams, AI at work and working life.',
		authorMore: 'More about me',
		followWriting: 'RSS',
		allArticles: 'All articles',
		build: 'Build',
		buildKieli: 'A self-hosted workspace for product copy and translations.',
		buildDyss: 'Documentation and experiments with the dyss CSS library.',
		buildMoments: 'A tiny app to track meaningful dates. Local-first, no account.',
		firefoxAddons: 'Firefox add-ons',
		buildAddons: 'PromptTube and Amazon Search Focus.',
		lastUpdated: 'last updated on',
		minuteRead: 'min read',
		colourTheme: 'Colour theme',
		useTheme: theme => `Use ${theme} theme`,
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
		homeEyebrow: 'Bernard Debecker / vegetalope',
		homeTitle: 'Bernard Debecker — Management technique et petits outils',
		homeDescription:
			'Réflexions de Bernard Debecker sur le management d’équipes techniques, l’IA au travail et les parcours professionnels, avec de petits outils open source.',
		homeHeadline: 'Penser à voix haute. Créer de petites choses.',
		intro:
			'J’écris sur l’ingénierie, la gestion d’équipe et la vie au travail. Je crée des outils pour le plaisir.',
		write: 'Écrire',
		writing: 'Articles',
		projects: 'Projets',
		writeTitle: 'Articles sur le management technique, l’IA et les carrières',
		writeDescription:
			'Les articles de Bernard Debecker sur le management d’équipes techniques, l’IA au travail et le développement professionnel.',
		browseTopics: 'Parcourir par thème',
		articleTopics: 'Thèmes de l’article',
		authorIntro:
			'Je m’appelle Bernard Debecker. Je dirige des équipes techniques et reste développeur frontend dans l’âme. J’écris sur le management, l’IA au travail et la vie professionnelle.',
		authorMore: 'En savoir plus sur moi',
		followWriting: 'RSS',
		allArticles: 'Tous les articles',
		build: 'Faire',
		buildKieli: 'Un espace de travail auto-hébergé pour les textes produit et les traductions.',
		buildDyss: 'Documentation et expérimentations autour de la bibliothèque CSS dyss.',
		buildMoments: 'Une petite application pour suivre les dates importantes. Locale, sans compte.',
		firefoxAddons: 'Extensions Firefox',
		buildAddons: 'PromptTube et Amazon Search Focus.',
		lastUpdated: 'dernière mise à jour le',
		minuteRead: 'min de lecture',
		colourTheme: 'Thème de couleur',
		useTheme: theme => `Utiliser le thème ${theme}`,
		themes: { auto: 'auto', light: 'clair', dark: 'sombre' },
		hello: 'Bonjour',
		myNameIs: 'je m’appelle',
		aboutBernard: 'À propos de Bernard Debecker',
		feedTitle: 'Flux des écrits de vegetalope',
	},
}

export function getLocaleFromPath(pathname) {
	return pathname === '/fr' || pathname.startsWith('/fr/') ? 'fr' : 'en'
}

export function getLocalePath(locale, path = '/') {
	const normalizedPath = path.startsWith('/') ? path : `/${path}`
	if (locale === defaultLocale) return normalizedPath
	if (normalizedPath === '/') return '/fr/'
	return `/fr${normalizedPath}`
}

export function getArticleParts(id) {
	const normalizedId = id.replace(/\.(md|mdx)$/, '')
	const [candidateLocale, ...slugParts] = normalizedId.split('/')
	const locale = candidateLocale === 'fr' ? 'fr' : 'en'
	return { locale, slug: slugParts.join('/') }
}
