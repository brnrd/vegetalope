import test from 'node:test'
import assert from 'node:assert/strict'
import { getRelatedArticles } from './relatedArticles.js'

const article = (slug, tags, date = '2026-01-01', locale = 'en') => ({
	id: `${locale}/${slug}`,
	data: { tags, pubDate: new Date(date) },
})
const slugs = entries => entries.map(entry => entry.id)

test('keeps editorial choices ahead of newer matching articles', () => {
	const entries = [
		article('becoming-an-em', ['careers']),
		article('genchi-genbutsu', ['engineering-leadership']),
		article('modern-em', ['engineering-leadership']),
		article('new-career-article', ['careers'], '2026-11-15'),
	]
	assert.deepEqual(slugs(getRelatedArticles(entries, 'becoming-an-em', 'en')), [
		'en/genchi-genbutsu',
		'en/modern-em',
	])
})

test('ranks fallback recommendations by shared topics, then recency', () => {
	const entries = [
		article('new-article', ['ai-at-work', 'engineering-leadership']),
		article('recent-unrelated', ['careers'], '2026-11-15'),
		article('one-match', ['ai-at-work'], '2026-11-01'),
		article('two-matches', ['ai-at-work', 'engineering-leadership']),
		article('older-match', ['ai-at-work'], '2025-01-01'),
	]
	assert.deepEqual(slugs(getRelatedArticles(entries, 'new-article', 'en')), [
		'en/two-matches',
		'en/one-match',
	])
})

test('fills missing translations locally without recommending the current article', () => {
	const entries = [
		article('becoming-an-em', ['careers'], undefined, 'fr'),
		article('modern-em', ['engineering-leadership'], undefined, 'fr'),
		article('local-career-article', ['careers'], undefined, 'fr'),
		article('genchi-genbutsu', ['engineering-leadership']),
	]
	assert.deepEqual(slugs(getRelatedArticles(entries, 'becoming-an-em', 'fr')), [
		'fr/modern-em',
		'fr/local-career-article',
	])
})

test('returns only available alternatives in a small collection', () => {
	const entries = [article('only-article', ['careers'])]
	assert.deepEqual(getRelatedArticles(entries, 'only-article', 'en'), [])
})
