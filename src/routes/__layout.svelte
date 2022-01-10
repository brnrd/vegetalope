<script context="module">
	export const load = ({ url }) => {
		const currentRoute = url.pathname

		return {
			props: {
				currentRoute,
			},
		}
	}
</script>

<script>
	import Header from '$lib/components/Header.svelte'
	import Footer from '$lib/components/Footer.svelte'

	import '$lib/styles/style.styl'

	import { scale } from 'svelte/transition'
	import { quadInOut } from 'svelte/easing'

	export let currentRoute
</script>

<svelte:head>
	<meta charset="utf-8" />
	<meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1" />
	<meta name="viewport" content="width=device-width" initial-scale="1" />
	<meta name="disabled-adaptations" content="watch" />
	<link rel="alternate" href="https://www.vegetalope.com/feed.xml" type="application/rss+xml" />
	<!-- favicon & theme-->
	<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
	<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
	<link rel="manifest" href="/site.webmanifest" />
	<link rel="mask-icon" href="/safari-pinned-tab.svg" color="#000000" />
	<meta name="msapplication-TileColor" content="#97e9c2" />
	<meta name="theme-color" content="#ffffff" />
	<!-- meta stuff-->
	<meta name="pocket-site-verification" content="7d224a8d64116b08c6daec8fc08a43" />
	<meta name="description" content="vegetalope" />
	<meta name="msvalidate.01" content="C26C7601A7BC06EDD0773BD8B09723CF" />
	<script>
		let FF_FOUC_FIX // FOUC fix
	</script>
</svelte:head>

<Header />

{#key currentRoute}
	<main in:scale={{ duration: 150, delay: 150, easing: quadInOut }} out:scale={{ duration: 150 }}>
		<slot />
	</main>
{/key}

<Footer />
