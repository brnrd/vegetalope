#!/usr/bin/env node
/* eslint-disable no-console */

// Fill missing movie metadata using Wikidata + Wikipedia, no API keys.
// - runtimeMinutes from Wikidata (P2047)
// - imdbId / imdbUrl from Wikidata (P345)
// - originalTitle from Wikidata (P1476) when present
// - summary from Wikipedia REST summary (short extract)
//
// Usage:
//   node fill-movie-metadata-wikidata.mjs input.json output.json
//
// Notes:
// - This script is conservative: it only writes fields that are missing (null/empty).
// - Matching is best-effort and year-aware. For ambiguous titles, it prefers entities
//   where publication year matches.
// - Respect Wikidata/Wikipedia by keeping concurrency low.

import fs from 'node:fs/promises'
import process from 'node:process'

function toStr(v) {
	return v === null || v === undefined ? '' : String(v)
}

function normalise(s) {
	return toStr(s)
		.toLowerCase()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/\s+/g, ' ')
		.trim()
}

function firstYear(yearField) {
	if (!yearField) return null
	if (typeof yearField === 'number') return yearField
	const m = String(yearField).match(/\b(\d{4})\b/)
	return m ? Number(m[1]) : null
}

function isMissing(v) {
	return v === null || v === undefined || v === ''
}

function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms))
}

async function fetchJson(url, opts = {}) {
	const res = await fetch(url, {
		headers: {
			'accept': 'application/sparql-results+json, application/json',
			'user-agent': 'vegetalope-movie-metadata/1.0 (personal site enrichment; +no-email)',
			...opts.headers,
		},
		...opts,
	})

	if (!res.ok) {
		const text = await res.text().catch(() => '')
		throw new Error(`HTTP ${res.status} ${res.statusText} for ${url}\n${text.slice(0, 200)}`)
	}

	return res.json()
}

function buildSparqlSearchQuery(title) {
	const escaped = title.replace(/"/g, '\\"')
	return `
SELECT ?item ?itemLabel ?year ?imdb ?duration ?originalTitle ?wikipediaTitle WHERE {
  SERVICE wikibase:mwapi {
    bd:serviceParam wikibase:endpoint "www.wikidata.org";
                    wikibase:api "EntitySearch";
                    mwapi:search "${escaped}";
                    mwapi:language "en".
    ?item wikibase:apiOutputItem mwapi:item.
  }

  ?item wdt:P31/wdt:P279* wd:Q11424 .

  OPTIONAL { ?item wdt:P345 ?imdb . }
  OPTIONAL {
    ?item wdt:P2047 ?durationValue .
    BIND(ROUND(?durationValue) AS ?duration)
  }
  OPTIONAL {
    ?item wdt:P1476 ?originalTitleNode .
    BIND(STR(?originalTitleNode) AS ?originalTitle)
  }
  OPTIONAL {
    ?item wdt:P577 ?date .
    BIND(YEAR(?date) AS ?year)
  }

  OPTIONAL {
    ?wikipedia schema:about ?item ;
               schema:isPartOf <https://en.wikipedia.org/> ;
               schema:name ?wikipediaTitle .
  }

  SERVICE wikibase:label { bd:serviceParam wikibase:language "en,fr". }
}
LIMIT 12
`
}

async function wikidataCandidates(title) {
	const endpoint = 'https://query.wikidata.org/sparql'
	const query = buildSparqlSearchQuery(title)
	const url = `${endpoint}?format=json&query=${encodeURIComponent(query)}`
	const data = await fetchJson(url)
	return data.results.bindings.map((b) => ({
		qid: b.item?.value?.split('/').pop() || null,
		label: b.itemLabel?.value || null,
		year: b.year?.value ? Number(b.year.value) : null,
		imdb: b.imdb?.value || null,
		duration: b.duration?.value ? Number(b.duration.value) : null,
		originalTitle: b.originalTitle?.value || null,
		wikipediaTitle: b.wikipediaTitle?.value || null,
	}))
}

function scoreCandidate(candidate, title, year) {
	let score = 0
	const t = normalise(title)
	const lab = normalise(candidate.label || '')

	if (lab === t) score += 8
	if (lab.includes(t) || t.includes(lab)) score += 4

	if (year && candidate.year) {
		const diff = Math.abs(candidate.year - year)
		if (diff === 0) score += 10
		else if (diff === 1) score += 4
		else if (diff <= 2) score += 2
	}

	if (candidate.imdb) score += 2
	if (candidate.wikipediaTitle) score += 1

	return score
}

function pickBest(candidates, title, year) {
	if (!candidates.length) return null
	const scored = candidates
		.map((c) => ({ c, score: scoreCandidate(c, title, year) }))
		.sort((a, b) => b.score - a.score)

	if (scored[0].score < 6) return null
	return scored[0].c
}

async function wikipediaSummary(wikipediaTitle) {
	if (!wikipediaTitle) return null
	const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(wikipediaTitle)}`
	const data = await fetchJson(url, { headers: { accept: 'application/json' } })
	return data.extract || null
}

function imdbUrlFromId(imdb) {
	if (!imdb) return null
	return `https://www.imdb.com/title/${imdb}/`
}

function clampSummary(s) {
	if (!s) return s
	if (s.length <= 520) return s

	const cut = s.slice(0, 520)
	const lastDot = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('! '), cut.lastIndexOf('? '))
	if (lastDot > 200) return cut.slice(0, lastDot + 1)
	return cut.slice(0, 480).trimEnd() + '…'
}

async function enrichMovie(movie) {
	const title = movie.title
	const year = firstYear(movie.year)

	const candidates = await wikidataCandidates(title)
	const best = pickBest(candidates, title, year)
	if (!best) return { movie, changed: false, match: null }

	let changed = false
	const out = { ...movie }

	if (isMissing(out.imdbId) && best.imdb) {
		out.imdbId = best.imdb
		changed = true
	}
	if (isMissing(out.imdbUrl) && best.imdb) {
		out.imdbUrl = imdbUrlFromId(best.imdb)
		changed = true
	}
	if (isMissing(out.runtimeMinutes) && best.duration) {
		out.runtimeMinutes = best.duration
		changed = true
	}
	if (isMissing(out.originalTitle) && best.originalTitle) {
		out.originalTitle = best.originalTitle
		changed = true
	}

	if (isMissing(out.summary) && best.wikipediaTitle) {
		await sleep(250)
		const sum = await wikipediaSummary(best.wikipediaTitle).catch(() => null)
		if (sum) {
			out.summary = clampSummary(sum)
			changed = true
		}
	}

	return { movie: out, changed, match: best }
}

async function main() {
	const [inputPath, outputPath] = process.argv.slice(2)
	if (!inputPath || !outputPath) {
		console.error('Usage: node fill-movie-metadata-wikidata.mjs input.json output.json')
		process.exit(1)
	}

	const raw = await fs.readFile(inputPath, 'utf-8')
	const data = JSON.parse(raw)

	if (!Array.isArray(data)) {
		console.error('Expected the JSON root to be an array of movies.')
		process.exit(1)
	}

	let changedCount = 0
	let matchedCount = 0

	const enriched = []
	for (let i = 0; i < data.length; i++) {
		const m = data[i]
		if (!m || !m.title) {
			enriched.push(m)
			continue
		}

		try {
			if (i > 0) await sleep(120)

			const res = await enrichMovie(m)
			enriched.push(res.movie)
			if (res.match) matchedCount++
			if (res.changed) changedCount++

			if (i % 10 === 0) {
				console.log(`[${i}/${data.length}] matched=${matchedCount} changed=${changedCount}`)
			}
		} catch (err) {
			console.warn(`Failed: ${m.title}`, err?.message || err)
			enriched.push(m)
		}
	}

	await fs.writeFile(outputPath, JSON.stringify(enriched, null, '\t') + '\n', 'utf-8')
	console.log(`Done. matched=${matchedCount}, changed=${changedCount}, total=${data.length}`)
}

main().catch((err) => {
	console.error(err)
	process.exit(1)
})
