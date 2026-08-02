import { getCollection } from 'astro:content';
import { getArticleParts } from '../../i18n';
import { createRssResponse } from '../../utils/rss';

export async function GET({ site }) {
	const entries = (await getCollection('write'))
		.filter((entry) => getArticleParts(entry.id).locale === 'fr')
		.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());

	return createRssResponse({
		entries,
		site,
		locale: 'fr',
		title: 'vegetalope - Écrits',
		description: 'Réflexions sur l’ingénierie logicielle et la vie.',
	});
}
