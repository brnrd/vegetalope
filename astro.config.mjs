import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import svelte from '@astrojs/svelte';

// https://astro.build/config
export default defineConfig({
	site: 'https://vegetalope.com',
	integrations: [mdx(), sitemap(), svelte()],
	redirects: {
		'/blog/[...slug]': {
			status: 302,
			destination: '/articles/[...slug]'
		},
		'/blog/brian-viner-100-classic-films': {
			status: 302,
			destination: '/articles/2024-06-01-brian-viner-100-classic-films'
		  }
	  }
});
