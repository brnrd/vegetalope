import { SITE_TITLE, SITE_DESCRIPTION } from '../consts';

const escapeXml = (value) =>
	String(value ?? '')
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');

const formatDate = (value) => {
	const date = value ? new Date(value) : null;
	return date && !Number.isNaN(date.valueOf()) ? date.toUTCString() : '';
};

export async function GET({ site }) {
	const modules = import.meta.glob('./write/*.md', { eager: true });
	const items = await Promise.all(
		Object.values(modules).map(async (mod) => {
			let content = '';
			if (typeof mod.compiledContent === 'function') {
				content = await mod.compiledContent();
			} else if (typeof mod.compiledContent === 'string') {
				content = mod.compiledContent;
			}

			return {
				url: mod.url,
				content,
				...mod.frontmatter,
			};
		}),
	);

	const sortedItems = items
		.filter((item) => item.url && item.title)
		.sort((a, b) => new Date(b.pubDate).valueOf() - new Date(a.pubDate).valueOf());

	const siteUrl = site ?? new URL('http://localhost');
	const channelLink = new URL('/', siteUrl).toString();

	const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${escapeXml(SITE_TITLE)} - Write</title>
    <description>${escapeXml(SITE_DESCRIPTION)}</description>
    <link>${escapeXml(channelLink)}</link>
    <lastBuildDate>${escapeXml(formatDate(sortedItems[0]?.updatedDate ?? sortedItems[0]?.pubDate))}</lastBuildDate>
    ${sortedItems
			.map((item) => {
				const link = new URL(item.url, siteUrl).toString();
				return `<item>
      <title>${escapeXml(item.title)}</title>
      <description>${escapeXml(item.description ?? '')}</description>
      <link>${escapeXml(link)}</link>
      <guid>${escapeXml(link)}</guid>
      <pubDate>${escapeXml(formatDate(item.pubDate))}</pubDate>
      <content:encoded><![CDATA[${item.content ?? ''}]]></content:encoded>
    </item>`;
			})
			.join('\n')}
  </channel>
</rss>`;

	return new Response(rss, {
		headers: {
			'Content-Type': 'application/rss+xml; charset=utf-8',
		},
	});
}
