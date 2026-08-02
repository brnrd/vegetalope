import { getCollection } from 'astro:content'
import type { APIRoute, GetStaticPaths } from 'astro'
import sharp from 'sharp'
import { getArticleParts } from '../../../i18n'
import { renderSocialCard, type SocialCardProps } from '../../../utils/ogCard'

export const getStaticPaths = (async () => {
	const articles = await getCollection('write')
	return articles
		.filter((article) => getArticleParts(article.id).locale === 'fr')
		.map((article) => ({
			params: { slug: getArticleParts(article.id).slug },
			props: {
				title: article.data.title,
				description: article.data.description,
				pubDate: article.data.pubDate.toISOString(),
				locale: 'fr' as const,
			},
		}))
}) satisfies GetStaticPaths

export const GET: APIRoute<SocialCardProps> = async ({ props }) => {
	const image = await sharp(Buffer.from(renderSocialCard(props))).png().toBuffer()

	return new Response(image, {
		headers: {
			'Content-Type': 'image/png',
			'Cache-Control': 'public, max-age=31536000, immutable',
		},
	})
}
