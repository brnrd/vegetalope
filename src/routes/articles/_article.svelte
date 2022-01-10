<script>
	export let title
</script>

<svelte:head>
	<title>{title} | vegetalope</title>
	<meta property="og:title" content={title} />
</svelte:head>

<article class="article">
	<h2>{title}</h2>
	<section class="content">
		<slot />
	</section>
</article>
