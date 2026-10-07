import { defineConfig } from 'astro/config'
import svelte from '@astrojs/svelte'
import mdx from '@astrojs/mdx'
import { satteri } from '@astrojs/markdown-satteri'
import { readingTime } from '@xsynaptic/satteri-reading-time'
import linkValidator from 'astro-link-validator'
import sitemap from '@astrojs/sitemap'

// https://astro.build/config
export default defineConfig({
	output: 'static',
	site: 'https://vegetalope.com',
	i18n: {
		locales: ['en', 'fr'],
		defaultLocale: 'en',
		routing: {
			prefixDefaultLocale: false,
		},
	},
	build: {
		inlineStylesheets: 'auto',
	},
	markdown: {
		processor: satteri({ mdastPlugins: [readingTime()] }),
	},
	integrations: [
		svelte(),
		mdx(),
		sitemap({
			filter: page => {
				const path = new URL(page).pathname.replace(/\/$/, '')
				return (
					!path.startsWith('/blog/') &&
					!path.startsWith('/articles/') &&
					path !== '/write/ask-and-do'
				)
			},
			i18n: { defaultLocale: 'en', locales: { en: 'en', fr: 'fr' } },
		}),
		linkValidator({
			checkExternal: false,
			failOnBrokenLinks: true,
		}),
	],
	redirects: {
		'/blog/brian-viner-100-classic-films': {
			status: 301,
			destination: '/watch/brian-viner-100-classic-films',
		},
		'/articles/2024-06-01-brian-viner-100-classic-films': {
			status: 301,
			destination: '/watch/brian-viner-100-classic-films',
		},
		'/blog/2022-01-05-movies': {
			status: 301,
			destination: '/watch/movies',
		},
		'/blog/2023-10-23-punk': {
			status: 301,
			destination: '/write/punk',
		},
		'/blog/2022-01-05-tv-shows': {
			status: 301,
			destination: '/watch/tv-shows',
		},
		'/write/ask-and-do': {
			status: 301,
			destination: '/write/shy-bairns-get-nowt',
		},
	},
})
