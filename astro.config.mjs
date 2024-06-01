import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';

// https://astro.build/config
export default defineConfig({
	site: 'https://vegetalope.com',
	integrations: [svelte()],
	redirects: {
		'/blog/brian-viner-100-classic-films': {
			status: 302,
			destination: '/brian-viner-100-classic-films'
		},
		'/articles/2024-06-01-brian-viner-100-classic-films': {
			status: 302,
			destination: '/brian-viner-100-classic-films'
		},
		'/blog/2022-01-05-movies': {
			status: 302,
			destination: '/movies'
		},
		'/blog/2023-10-23-punk': {
			status: 302,
			destination: '/punk'
		},
		'/blog/2022-01-05-tv-shows': {
			status: 302,
			destination: '/tv-shows'
		},
		'/blog/2022-01-05-tv-shows': {
			status: 302,
			destination: '/tv-shows'
		}
	  }
});
