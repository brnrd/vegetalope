<script>
	import { fade, fly } from 'svelte/transition'
	import { cubicOut } from 'svelte/easing'
	import { onMount } from 'svelte'

	export let movies = []

	let q = ''
	let sort = 'title-asc'
	let decade = 'all'
	let minImdb = 'all'
	let selectedMovie = null

	const DEFAULTS = {
		q: '',
		sort: 'title-asc',
		decade: 'all',
		minImdb: 'all',
	}

	const SORT_OPTIONS = new Set([
		'title-asc',
		'title-desc',
		'year-desc',
		'year-asc',
		'imdb-desc',
		'runtime-asc',
		'runtime-desc',
	])

	const MIN_IMDB_OPTIONS = new Set(['all', '9', '8.5', '8', '7.5', '7'])

	let didInitFromUrl = false

	function readStateFromUrl() {
		const params = new URLSearchParams(window.location.search)
		const nextQ = params.get('q') ?? DEFAULTS.q
		const nextSort = params.get('sort') ?? DEFAULTS.sort
		const nextDecade = params.get('decade') ?? DEFAULTS.decade
		const nextMinImdb = params.get('minImdb') ?? DEFAULTS.minImdb

		q = nextQ
		sort = SORT_OPTIONS.has(nextSort) ? nextSort : DEFAULTS.sort
		decade = nextDecade || DEFAULTS.decade
		minImdb = MIN_IMDB_OPTIONS.has(nextMinImdb) ? nextMinImdb : DEFAULTS.minImdb
	}

	function writeStateToUrl() {
		if (!didInitFromUrl) return

		const params = new URLSearchParams(window.location.search)

		function setOrDelete(key, value, isDefault) {
			if (isDefault) params.delete(key)
			else params.set(key, value)
		}

		setOrDelete('q', q, !q || q === DEFAULTS.q)
		setOrDelete('sort', sort, sort === DEFAULTS.sort)
		setOrDelete('decade', decade, !decade || decade === DEFAULTS.decade)
		setOrDelete('minImdb', minImdb, minImdb === DEFAULTS.minImdb)

		const search = params.toString()
		const nextUrl = `${window.location.pathname}${search ? `?${search}` : ''}${window.location.hash || ''}`
		window.history.replaceState({}, '', nextUrl)
	}

	function normalise(s) {
		return String(s || '')
			.toLowerCase()
			.normalize('NFD')
			.replace(/[\u0300-\u036f]/g, '')
			.trim()
	}

	function toNumber(v) {
		const n = Number(v)
		return Number.isFinite(n) ? n : null
	}

	function yearNumber(y) {
		if (typeof y === 'number') return y
		const match = String(y || '').match(/\d{4}/)
		return match ? Number(match[0]) : null
	}

	function decadeLabel(y) {
		return `${Math.floor(y / 10) * 10}s`
	}

	function formatRuntime(minutes) {
		if (!minutes || minutes <= 0) return null
		const hours = Math.floor(minutes / 60)
		const mins = minutes % 60
		if (hours === 0) return `${mins}min`
		if (mins === 0) return `${hours}h`
		return `${hours}h${mins}`
	}

	function openMovie(movie) {
		selectedMovie = movie
		document.body.style.overflow = 'hidden'
	}

	function closeMovie() {
		selectedMovie = null
		document.body.style.overflow = ''
	}

	function handleKeydown(event) {
		if (event.key === 'Escape' && selectedMovie) {
			closeMovie()
		}
	}

	onMount(() => {
		readStateFromUrl()
		didInitFromUrl = true

		function onPopState() {
			readStateFromUrl()
		}

		window.addEventListener('popstate', onPopState)
		window.addEventListener('keydown', handleKeydown)

		return () => {
			window.removeEventListener('popstate', onPopState)
			window.removeEventListener('keydown', handleKeydown)
			document.body.style.overflow = ''
		}
	})

	$: writeStateToUrl()

	$: decades = Array.from(
		new Set(
			movies
				.map((m) => yearNumber(m.year))
				.filter(Boolean)
				.map((y) => decadeLabel(y)),
		),
	).sort((a, b) => {
		const numA = Number(a.replace('s', ''))
		const numB = Number(b.replace('s', ''))
		return numA - numB
	})

	$: if (didInitFromUrl && decades.length) {
		if (decade !== 'all' && !decades.includes(decade)) {
			decade = 'all'
		}
	}

	$: filtered = movies
		.map((m, idx) => {
			const y = yearNumber(m.year)
			return {
				m,
				idx,
				y,
				decade: y ? decadeLabel(y) : '',
				imdb: toNumber(m.imdbRating),
				runtime: toNumber(m.runtimeMinutes),
				search: normalise([m.title, m.originalTitle].filter(Boolean).join(' ')),
			}
		})
		.filter((x) => {
			const nq = normalise(q)
			const matchesSearch = !nq || x.search.includes(nq)
			const matchesDecade = decade === 'all' || x.decade === decade
			const min = minImdb === 'all' ? null : Number(minImdb)
			const matchesRating = min === null || (x.imdb !== null && x.imdb >= min)

			return matchesSearch && matchesDecade && matchesRating
		})
		.sort((a, b) => {
			if (sort === 'title-asc' || sort === 'title-desc') {
				const cmp = normalise(a.m.title).localeCompare(
					normalise(b.m.title),
					undefined,
					{ numeric: true, sensitivity: 'base' },
				)
				return sort === 'title-desc' ? -cmp : cmp
			}
			if (sort === 'year-desc') return (b.y ?? -Infinity) - (a.y ?? -Infinity)
			if (sort === 'year-asc') return (a.y ?? Infinity) - (b.y ?? Infinity)
			if (sort === 'imdb-desc') return (b.imdb ?? -Infinity) - (a.imdb ?? -Infinity)
			if (sort === 'runtime-asc') return (a.runtime ?? Infinity) - (b.runtime ?? Infinity)
			if (sort === 'runtime-desc') return (b.runtime ?? -Infinity) - (a.runtime ?? -Infinity)
			return 0
		})

	$: hasActiveFilters = Boolean(q) || decade !== 'all' || minImdb !== 'all'
</script>

<div class="sticky-bar">
	<form class="inner" on:submit|preventDefault>
		<div>
			<label for="q">Search</label>
			<div class="row">
				<input
					id="q"
					type="search"
					bind:value={q}
					placeholder="Title, original title…"
					autocomplete="off"
				/>
				<button type="button" on:click={() => (q = '')}>Clear</button>
			</div>
		</div>

		<div>
			<label for="sort">Sort</label>
			<select id="sort" bind:value={sort}>
				<option value="title-asc">Title (A to Z)</option>
				<option value="title-desc">Title (Z to A)</option>
				<option value="year-desc">Year (newest)</option>
				<option value="year-asc">Year (oldest)</option>
				<option value="imdb-desc">IMDb (highest)</option>
				<option value="runtime-asc">Runtime (shortest)</option>
				<option value="runtime-desc">Runtime (longest)</option>
			</select>
		</div>

		<div>
			<label for="decade">Decade</label>
			<select id="decade" bind:value={decade}>
				<option value="all">All</option>
				{#each decades as d}
					<option value={d}>{d}</option>
				{/each}
			</select>
		</div>

		<div>
			<label for="minImdb">Min IMDb</label>
			<select id="minImdb" bind:value={minImdb}>
				<option value="all">All</option>
				<option value="9">9+</option>
				<option value="8.5">8.5+</option>
				<option value="8">8+</option>
				<option value="7.5">7.5+</option>
				<option value="7">7+</option>
			</select>
		</div>
	</form>
</div>

<p class="meta">
	<span>{filtered.length} / {movies.length}</span>
	<span>
		{#if hasActiveFilters}
			{#if q}search: "{q}"{/if}
			{#if decade !== 'all'} | decade: {decade}{/if}
			{#if minImdb !== 'all'} | IMDb: {minImdb}+{/if}
		{:else}
			All movies
		{/if}
	</span>
</p>

{#if filtered.length > 0}
	<ol class="media-list">
		{#each filtered as x (x.idx)}
			<li class="media-item">
				<button
					type="button"
					class="media-button"
					on:click={() => openMovie(x.m)}
					aria-label="View details for {x.m.title}"
				>
					<span class="media-title">
						{x.m.title}
						{#if x.m.originalTitle && x.m.originalTitle !== x.m.title}
							<span class="original-title"> ({x.m.originalTitle})</span>
						{/if}
						{#if x.y}
							<span class="meta"> ({x.y})</span>
						{/if}
					</span>

					<span class="media-meta">
						<a
							href={'https://www.imdb.com/title/' + x.m.imdbId}
							target="_blank"
							rel="noreferrer"
							on:click|stopPropagation
						>
							IMDb
						</a>

						{#if x.m.imdbRating !== null}
							<span class="meta">{x.m.imdbRating.toFixed(1)}/10</span>
						{/if}

						{#if x.runtime !== null && x.runtime > 0}
							<span class="meta">{formatRuntime(x.runtime)}</span>
						{/if}
					</span>

					{#if x.m.summary}
						<span class="summary">{x.m.summary}</span>
					{/if}
				</button>
			</li>
		{/each}
	</ol>
{:else}
	<div class="empty">No matches. Try clearing filters or searching fewer words.</div>
{/if}

{#if selectedMovie}
	<div
		class="modal-backdrop"
		transition:fade={{ duration: 120, easing: cubicOut }}
		on:click={closeMovie}
		role="button"
		tabindex="0"
		aria-label="Close modal"
		on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), closeMovie())}
	>
		<div
			class="modal-content"
			transition:fly={{ y: 24, duration: 140, easing: cubicOut }}
			on:click|stopPropagation
			on:keydown|stopPropagation
			role="dialog"
			aria-modal="true"
			aria-labelledby="modal-title"
			tabindex="-1"
		>
			<button class="modal-close" type="button" on:click={closeMovie}>
				Close
			</button>

			<div class="modal-body">
				<h2 id="modal-title">
					{selectedMovie.title}
					{#if selectedMovie.originalTitle && selectedMovie.originalTitle !== selectedMovie.title}
						<span class="original-title"> ({selectedMovie.originalTitle})</span>
					{/if}
				</h2>

				<p class="meta">
					<a
						href={'https://www.imdb.com/title/' + selectedMovie.imdbId}
						target="_blank"
						rel="noreferrer"
					>
						IMDb
					</a>

					{#if selectedMovie.imdbRating !== null}
						<span> | {selectedMovie.imdbRating.toFixed(1)}/10</span>
					{/if}

					{#if selectedMovie.runtimeMinutes !== null && selectedMovie.runtimeMinutes > 0}
						<span> | {formatRuntime(selectedMovie.runtimeMinutes)}</span>
					{/if}

					{#if selectedMovie.year}
						<span> | {selectedMovie.year}</span>
					{/if}
				</p>

				{#if selectedMovie.summary}
					<p class="modal-summary">{selectedMovie.summary}</p>
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	.sticky-bar .inner {
		display: grid;
		grid-template-columns: minmax(0, 1.6fr) repeat(3, minmax(140px, 1fr));
		gap: 0.75rem 1rem;
		align-items: end;
	}

	.sticky-bar label {
		display: block;
		font-family: var(--font-label);
		font-size: 0.75rem;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--color-ink-muted);
		margin-bottom: 0.35rem;
	}

	.sticky-bar input,
	.sticky-bar select,
	.sticky-bar button {
		border-radius: 0;
		height: 2.4rem;
		line-height: 2.4rem;
	}

	.sticky-bar input,
	.sticky-bar select {
		width: 100%;
		border: 1px solid var(--hairline);
		background: var(--color-bg);
		color: var(--color-ink);
		padding: 0 0.5rem;
	}

	.sticky-bar button {
		border: 1px solid var(--hairline);
		background: var(--color-bg);
		color: var(--color-ink);
		text-transform: uppercase;
		letter-spacing: 0.08em;
		font-family: var(--font-label);
		font-size: 0.7rem;
		padding: 0 0.75rem;
	}

	.sticky-bar button:hover {
		background: color-mix(in oklab, var(--color-bg) 92%, var(--color-ink));
	}

	.row {
		display: flex;
		gap: 0.5rem;
		align-items: stretch;
	}

	.row input {
		flex: 1;
		min-width: 0;
	}

	@media (max-width: 720px) {
		.sticky-bar .inner {
			grid-template-columns: 1fr;
		}
	}

	.media-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: grid;
		gap: 0;
	}

	.media-item {
		background: var(--color-bg);
		border-top: 1px solid var(--hairline);
		margin: 0;
	}

	.media-button {
		display: block;
		width: 100%;
		text-align: left;
		padding: 1.1rem 1.4rem;
		background: transparent;
		border: 0;
		cursor: pointer;
		position: relative;
		color: var(--color-ink);
		margin: 0;
	}

	.media-button:hover {
		background: color-mix(in oklab, var(--color-bg) 92%, var(--color-ink));
	}

	.media-button:focus-visible {
		outline: var(--focus);
		outline-offset: var(--focus-offset);
	}

	@media (min-width: 720px) {
		.media-button {
			display: grid;
			grid-template-columns: minmax(0, 1fr) auto;
			gap: 0.6rem 1.5rem;
			align-items: start;
		}
	}

	.media-title {
		display: block;
		font-weight: 700;
		font-family: var(--font-display);
		font-size: 1.05rem;
		letter-spacing: 0.01em;
		color: var(--color-ink);
	}

	.media-meta {
		display: flex;
		gap: 0.75rem;
		flex-wrap: wrap;
		margin-top: 0.25rem;
		font-family: var(--font-label);
		font-size: 0.8rem;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--color-ink-muted);
	}

	.summary {
		display: block;
		margin-top: 0.5rem;
		opacity: 0.95;
		max-width: 70ch;
		color: var(--color-ink-muted);
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	@media (min-width: 720px) {
		.media-meta {
			justify-content: flex-end;
			text-align: right;
		}

		.summary {
			grid-column: 1 / -1;
		}
	}

	.original-title {
		font-weight: 400;
		opacity: 0.85;
	}

	.empty {
		margin-top: 1rem;
		padding: 1rem;
		border: 1px solid var(--hairline);
		opacity: 0.85;
	}

	.modal-backdrop {
		position: fixed;
		inset: 0;
		background: color-mix(in oklab, CanvasText 60%, transparent);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 2rem;
		overflow: auto;
		z-index: 1000;
	}

	.modal-content {
		background: Canvas;
		color: CanvasText;
		border: 2px solid color-mix(in oklab, var(--color-ink) 30%, transparent);
		max-width: 72ch;
		width: 100%;
		padding: 1.25rem 1.5rem;
		max-height: min(80vh, 900px);
		overflow: auto;
		transform-origin: center;
	}

	.modal-close {
		float: right;
	}

	.modal-body {
		padding-top: 0.5rem;
	}

	.modal-body h2 {
		margin-top: 0.25rem;
	}

	.modal-summary {
		white-space: pre-wrap;
	}

	@media (max-width: 720px) {
		.modal-backdrop {
			padding: 0;
		}

		.modal-content {
			width: 100%;
			height: 100%;
			max-width: none;
			max-height: none;
			border: 0;
		}
	}
</style>
