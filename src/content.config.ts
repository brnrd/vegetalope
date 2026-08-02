import { defineCollection, z } from 'astro:content'
import { glob } from 'astro/loaders'

const write = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/write' }),
	schema: z.object({
		title: z.string(),
		description: z.string(),
		pubDate: z.coerce.date(),
		updatedDate: z.coerce.date().optional(),
		heroImage: z.string().optional(),
		heroImageAlt: z.string().optional(),
	}),
})

export const collections = { write }
