<script>
	import { fade, fly } from 'svelte/transition'
	import { onMount } from 'svelte'

	export let movies = []

	let q = ''
	let sort = 'title-asc' // default: alphabetical
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

		const setOrDelete = (key, value, isDefault) => {
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

		const onPopState = () => {
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
</script>

<div class="toolbar">
	<div>
		<label>Search</label>
		<div class="row">
			<input
				type="search"
				bind:value={q}
				placeholder="Title, original title…"
			/>
			<button type="button" on:click={() => (q = '')}>Clear</button>
		</div>
	</div>

	<div>
		<label>Sort</label>
		<select bind:value={sort}>
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
		<label>Decade</label>
		<select bind:value={decade}>
			<option value="all">All</option>
			{#each decades as d}
				<option value={d}>{d}</option>
			{/each}
		</select>
	</div>

	<div>
		<label>Min IMDb</label>
		<select bind:value={minImdb}>
			<option value="all">All</option>
			<option value="9">9+</option>
			<option value="8.5">8.5+</option>
			<option value="8">8+</option>
			<option value="7.5">7.5+</option>
			<option value="7">7+</option>
		</select>
	</div>
	
</div>

<p class="meta">
	<span>{filtered.length} / {movies.length}</span>
	<span>
		{#if q || decade !== 'all' || minImdb !== 'all'}
			{#if q}search: "{q}"{/if}
			{#if decade !== 'all'} · decade: {decade}{/if}
			{#if minImdb !== 'all'} · IMDb: {minImdb}+{/if}
		{:else}
			All movies
		{/if}
	</span>
</p>

<div class="grid">
	{#each filtered as x (x.idx)}
		<div class="card" role="button" tabindex="0" on:click={() => openMovie(x.m)} on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), openMovie(x.m))} aria-label="View details for {x.m.title}">
			<article>
				<h3>
					{x.m.title}
					{#if x.m.originalTitle && x.m.originalTitle !== x.m.title}
						&nbsp;(<span class="original-title">{x.m.originalTitle}</span>)
					{/if}
					{#if x.y}- {x.y}{/if}
				</h3>

				<div class="badges">
					<span class="badge imdb-badge"><a href=https://www.imdb.com/title/{x.m.imdbId} target="_blank" on:click|stopPropagation>IMDb</a>
						{#if x.m.imdbRating !== null}
							<span>{x.m.imdbRating.toFixed(1)}/10</span>
						{/if}
					</span>

					{#if x.runtime !== null && x.runtime > 0}
						<span class="badge">{formatRuntime(x.runtime)}</span>
					{/if}
					{#if x.y}
						<span class="badge">{x.y}</span>
					{/if}
				</div>

				{#if x.m.summary}
					<p class="summary">{x.m.summary}</p>
				{/if}
			</article>
		</div>
	{/each}
</div>

{#if selectedMovie}
	<div class="modal-backdrop" transition:fade on:click={closeMovie} role="button" tabindex="0" aria-label="Close modal" on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), closeMovie())}>
		<div class="modal-content" transition:fly={{ y: 50, duration: 300 }} on:click|stopPropagation role="dialog" aria-modal="true" aria-labelledby="modal-title">
			<button class="modal-close" on:click={closeMovie} aria-label="Close">×</button>
			<div class="modal-body">
				<h2 id="modal-title" class="modal-title">
					{selectedMovie.title}
					{#if selectedMovie.originalTitle && selectedMovie.originalTitle !== selectedMovie.title}
						<span class="original-title">({selectedMovie.originalTitle})</span>
					{/if}
				</h2>

				<div class="modal-badges">
					<span class="badge imdb-badge">
						<a href="https://www.imdb.com/title/{selectedMovie.imdbId}" target="_blank">IMDb</a>
						{#if selectedMovie.imdbRating !== null}
							<span>{selectedMovie.imdbRating.toFixed(1)}/10</span>
						{/if}
					</span>
					{#if selectedMovie.runtimeMinutes !== null && selectedMovie.runtimeMinutes > 0}
						<span class="badge">{formatRuntime(selectedMovie.runtimeMinutes)}</span>
					{/if}
					{#if selectedMovie.year}
						<span class="badge">{selectedMovie.year}</span>
					{/if}
				</div>

				{#if selectedMovie.summary}
					<div class="modal-summary">
						{selectedMovie.summary}
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}

{#if filtered.length === 0}
	<div class="empty">No matches. Try clearing filters or searching fewer words.</div>
{/if}

<style>
	.toolbar {
		display: grid;
		gap: 0.6rem;
		grid-template-columns: 1fr;
		margin-bottom: 1rem;
	}
	@media (min-width: 720px) {
		.toolbar {
			grid-template-columns: 1.4fr 0.8fr 0.8fr 0.8fr;
			align-items: end;
		}
	}
	label {
		display: block;
		font-size: 0.85rem;
		opacity: 0.85;
		margin-bottom: 0.35rem;
	}
	.checkbox-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0;
		cursor: pointer;
	}
	.checkbox-label input[type="checkbox"] {
		width: auto;
		margin: 0;
		cursor: pointer;
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
	input, select, button {
		width: 100%;
		padding: 0.6rem 0.7rem;
		border-radius: 12px;
		border: 1px solid var(--border, rgba(255,255,255,0.12));
		background: var(--card, rgba(255,255,255,0.03));
		color: inherit;
	}
	button {
		width: auto;
		cursor: pointer;
		opacity: 0.85;
		flex-shrink: 0;
	}
	button:hover { opacity: 1; }

	.meta {
		display: flex;
		justify-content: space-between;
		gap: 0.75rem;
		font-size: 0.85rem;
		opacity: 0.85;
		margin: 0.2rem 0 0.9rem;
	}

	.grid {
		display: grid;
		gap: 0.9rem;
		grid-template-columns: repeat(1, minmax(0, 1fr));
	}
	@media (min-width: 720px) {
		.grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
	}

	.card {
		border: 1px solid var(--border, rgba(255,255,255,0.12));
		border-radius: 14px;
		padding: 0.9rem 1rem;
		background: var(--card, rgba(255,255,255,0.03));
		cursor: pointer;
		transition: transform 0.2s, box-shadow 0.2s;
	}
	.card:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}
	.card:focus {
		outline: 2px solid var(--primary-color, var(--flexoki-red-600));
		outline-offset: 2px;
	}

	h3 { margin: 0; font-size: 1rem; line-height: 1.25; }
	.badges {
		margin-top: 0.4rem;
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem 0.5rem;
		font-size: 0.85rem;
		opacity: 0.85;
	}
	.badge {
		border: 1px solid var(--border, rgba(255,255,255,0.12));
		border-radius: 0;
		padding: 0.15rem 0.4rem 0;
		white-space: nowrap;
		font-size: 0.8rem;
		background: transparent;
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
	}
	.badge a {
		color: inherit;
		text-decoration: none;
	}
	.imdb-badge {
		border-color: var(--flexoki-yellow-400, #d0a215);
	}
	.summary {
		margin: 0.6rem 0 0;
		font-size: 0.92rem;
		line-height: 1.35;
		opacity: 0.95;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
	.empty {
		margin-top: 1rem;
		padding: 1rem;
		border-radius: 14px;
		border: 1px solid var(--border, rgba(255,255,255,0.12));
		opacity: 0.85;
	}

	.modal-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.75);
		backdrop-filter: blur(4px);
		z-index: 1000;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1rem;
		overflow-y: auto;
	}

	.modal-content {
		background: var(--background-body);
		border-radius: 16px;
		max-width: 800px;
		width: 100%;
		max-height: 90vh;
		overflow-y: auto;
		position: relative;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
		border: 1px solid var(--border, rgba(255,255,255,0.12));
	}

	.modal-close {
		position: absolute;
		top: 1rem;
		right: 1rem;
		background: transparent;
		border: none;
		font-size: 2rem;
		line-height: 1;
		cursor: pointer;
		color: var(--text-main);
		opacity: 0.7;
		width: 2.5rem;
		height: 2.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		transition: opacity 0.2s, background 0.2s;
		z-index: 10;
	}
	.modal-close:hover {
		opacity: 1;
		background: rgba(255, 255, 255, 0.1);
	}

	.modal-body {
		padding: 2.5rem 2rem 2rem;
	}

	.modal-title {
		font-size: 2rem;
		margin: 0 0 1rem;
		line-height: 1.3;
	}
	.modal-title .original-title {
		font-size: 0.85em;
		opacity: 0.8;
		font-weight: normal;
	}

	.modal-badges {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-bottom: 1.5rem;
		font-size: 0.95rem;
	}

	.modal-summary {
		font-size: 1.1rem;
		line-height: 1.7;
		color: var(--text-main);
		opacity: 0.95;
		white-space: pre-wrap;
	}

	@media (max-width: 720px) {
		.modal-content {
			max-height: 95vh;
			border-radius: 12px;
		}
		.modal-body {
			padding: 2rem 1.5rem 1.5rem;
		}
		.modal-title {
			font-size: 1.6rem;
		}
		.modal-summary {
			font-size: 1rem;
		}
	}
</style>