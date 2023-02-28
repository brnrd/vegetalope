<script context="module">
	export const load = async ({ fetch }) => {
		const articles = await fetch('/api/articles.json')
		const allArticles = await articles.json()

		return {
			props: {
				articles: allArticles,
			},
		}
	}
</script>

<script>
	export let articles
</script>

<!-- <main>
    <ul>
        {#each articles as article}
            <li>
            <h2>
                <a href={article.path}>
                {article.meta.title}
                </a>
            </h2>
            Published {article.meta.date}
            </li>
        {/each}
        </ul>
</main> -->
<style lang="stylus">

</style>
