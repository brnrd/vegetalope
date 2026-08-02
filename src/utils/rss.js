import { getArticleParts } from '../i18n';

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

export function createRssResponse({ entries, site, locale, title, description }) {
	const siteUrl = site ?? new URL('http://localhost');
	const channelPath = locale === 'fr' ? '/fr/' : '/';
	const channelLink = new URL(channelPath, siteUrl).toString();
	const items = entries.map((entry) => {
		const { slug } = getArticleParts(entry.id);
		const path = locale === 'fr' ? `/fr/write/${slug}` : `/write/${slug}`;
		return { ...entry.data, path, content: entry.rendered?.html ?? '' };
	});

	const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${escapeXml(title)}</title>
    <description>${escapeXml(description)}</description>
    <language>${locale}</language>
    <link>${escapeXml(channelLink)}</link>
    <lastBuildDate>${escapeXml(formatDate(items[0]?.updatedDate ?? items[0]?.pubDate))}</lastBuildDate>
    ${items.map((item) => {
		const link = new URL(item.path, siteUrl).toString();
		return `<item>
      <title>${escapeXml(item.title)}</title>
      <description>${escapeXml(item.description)}</description>
      <link>${escapeXml(link)}</link>
      <guid>${escapeXml(link)}</guid>
      <pubDate>${escapeXml(formatDate(item.pubDate))}</pubDate>
      <content:encoded><![CDATA[${item.content}]]></content:encoded>
    </item>`;
	}).join('\n')}
  </channel>
</rss>`;

	return new Response(rss, {
		headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
	});
}
