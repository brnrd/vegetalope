import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';
import mdx from '@astrojs/mdx';

// https://astro.build/config
export default defineConfig({
	output: 'static',
	site: 'https://vegetalope.com',
	build: {
		inlineStylesheets: 'always'
	},
	integrations: [svelte(), mdx()],
	redirects: {
		'/blog/brian-viner-100-classic-films': {
			status: 302,
			destination: '/watch/brian-viner-100-classic-films'
		},
		'/articles/2024-06-01-brian-viner-100-classic-films': {
			status: 302,
			destination: '/watch/brian-viner-100-classic-films'
		},
		'/blog/2022-01-05-movies': {
			status: 302,
			destination: '/watch/movies'
		},
		'/blog/2023-10-23-punk': {
			status: 302,
			destination: '/write/punk'
		},
		'/blog/2022-01-05-tv-shows': {
			status: 302,
			destination: '/watch/tv-shows'
		},
		'/blog/2022-01-05-tv-shows': {
			status: 302,
			destination: '/watch/tv-shows'
		},
		'/write/ask-and-do': {
			status: 302,
			destination: '/write/shy-bairns-get-nowt'
		}
	  }
});
