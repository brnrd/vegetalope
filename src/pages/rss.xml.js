import { getCollection } from 'astro:content';
import { SITE_TITLE, SITE_DESCRIPTION } from '../consts';
import { getArticleParts } from '../i18n';
import { createRssResponse } from '../utils/rss';

export async function GET({ site }) {
	const entries = (await getCollection('write'))
		.filter((entry) => getArticleParts(entry.id).locale === 'en')
		.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());

	return createRssResponse({
		entries,
		site,
		locale: 'en',
		title: `${SITE_TITLE} - Write`,
		description: SITE_DESCRIPTION,
	});
}
