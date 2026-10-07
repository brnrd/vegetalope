import { readFile } from 'node:fs/promises'
import { parse } from 'yaml'

// Use the same Markdown metadata as the rendered article, never the build date.
export async function serializeArticleSitemap(item) {
	const match = new URL(item.url).pathname.match(/^\/(fr\/)?write\/(.+?)\/?$/)
	if (!match) return item
	const locale = match[1] ? 'fr' : 'en'
	const source = new URL(`../content/write/${locale}/${match[2]}.md`, import.meta.url)
	const markdown = await readFile(source, 'utf8')
	const frontmatter = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)
	if (!frontmatter) throw new Error(`Missing article metadata for ${item.url}`)
	const data = parse(frontmatter[1])
	const published = new Date(data.pubDate)
	const modified = new Date(data.updatedDate ?? data.pubDate)
	if (
		!Number.isFinite(published.getTime()) ||
		!Number.isFinite(modified.getTime()) ||
		modified < published
	) {
		throw new Error(`Invalid article dates for ${item.url}`)
	}
	return { ...item, lastmod: modified.toISOString() }
}
