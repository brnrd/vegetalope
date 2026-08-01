import { defineConfig } from 'astro/config'
import svelte from '@astrojs/svelte'
import mdx from '@astrojs/mdx'
import { satteri } from '@astrojs/markdown-satteri'
import { readingTime } from '@xsynaptic/satteri-reading-time'
import linkValidator from 'astro-link-validator'

// https://astro.build/config
export default defineConfig({
	output: 'static',
	site: 'https://vegetalope.com',
	build: {
		inlineStylesheets: 'always',
	},
	markdown: {
		processor: satteri({ mdastPlugins: [readingTime()] }),
	},
	integrations: [
		svelte(),
		mdx(),
		linkValidator({
			checkExternal: false,
			failOnBrokenLinks: true,
		}),
	],
	redirects: {
		'/blog/brian-viner-100-classic-films': {
			status: 302,
			destination: '/watch/brian-viner-100-classic-films',
		},
		'/articles/2024-06-01-brian-viner-100-classic-films': {
			status: 302,
			destination: '/watch/brian-viner-100-classic-films',
		},
		'/blog/2022-01-05-movies': {
			status: 302,
			destination: '/watch/movies',
		},
		'/blog/2023-10-23-punk': {
			status: 302,
			destination: '/write/punk',
		},
		'/blog/2022-01-05-tv-shows': {
			status: 302,
			destination: '/watch/tv-shows',
		},
		'/write/ask-and-do': {
			status: 302,
			destination: '/write/shy-bairns-get-nowt',
		},
	},
})
