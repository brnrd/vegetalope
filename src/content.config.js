import { defineCollection, z } from 'astro:content'
import { glob } from 'astro/loaders'
import { articleTagIds } from './data/articleTags.js'

const write = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/write' }),
	schema: z.object({
		title: z.string(),
		description: z.string(),
		tags: z.array(z.enum(articleTagIds)).min(1),
		pubDate: z.coerce.date(),
		updatedDate: z.coerce.date().optional(),
		heroImage: z.string().optional(),
		heroImageAlt: z.string().optional(),
	}),
})

export const collections = { write }
