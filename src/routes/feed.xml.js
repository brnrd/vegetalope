const siteURL = 'https://www.vegetalope.com'
const siteTitle = 'vegetalope'
const siteDescription = 'vegetalope'

export const get = async () => {
	const articles = await Promise.all(
		Object.entries(import.meta.glob('./articles/*.md')).map(async ([path, resolver]) => {
			const article = await resolver()
			const slug = path.slice(2, -3)
			const articleHTML = article.default.render().html
			return { ...article.metadata, slug, articleHTML: `<![CDATA[${articleHTML}]]>` }
		}),
	).then(articles => {
		return articles.sort((a, b) => new Date(b.date) - new Date(a.date))
	})

	const body = render(articles)
	const headers = {
		'Cache-Control': 'max-age=0, s-maxage=3600',
		'Content-Type': 'application/xml',
	}

	return {
		body,
		headers,
	}
}

const render = articles =>
	`<?xml version="1.0" encoding="UTF-8" ?>
		<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
		<channel>
		<title>${siteTitle}</title>
		<description>${siteDescription}</description>
		<link>${siteURL}</link>
		<atom:link href="${siteURL}/feed.xml" rel="self" type="application/rss+xml"/>
		${articles
			.map(
				article => `<item>
					<guid isPermaLink="true">${siteURL}/blog/${article.slug}</guid>
					<title>${article.title}</title>
					<link>${siteURL}/blog/${article.slug}</link>
					<description>${article.articleHTML}</description>
					<pubDate>${new Date(article.date).toUTCString()}</pubDate>
				</item>`,
			)
			.join('')}
		</channel>
		</rss>`
