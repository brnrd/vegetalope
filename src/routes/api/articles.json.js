export const get = async () => {
	const allArticleFiles = import.meta.glob('../articles/*.md')
	const iterablePostFiles = Object.entries(allArticleFiles)

	const allArticles = await Promise.all(
		iterablePostFiles.map(async ([path, resolver]) => {
			const article = await resolver()
			const postPath = path.slice(2, -3)

			return {
				meta: article.metadata,
				path: postPath,
				article: article.default.render(),
			}
		}),
	)

	const sortedPosts = allArticles.sort((a, b) => {
		return new Date(b.meta.date) - new Date(a.meta.date)
	})

	return {
		body: sortedPosts,
	}
}
