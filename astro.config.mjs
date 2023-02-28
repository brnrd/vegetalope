import { defineConfig } from 'astro/config'
import mdx from '@astrojs/mdx'
import sitemap from '@astrojs/sitemap'
import image from '@astrojs/image'

export default defineConfig({
	site: 'https://www.vegetalope.com',
	integrations: [mdx(), sitemap(), image()],
})
