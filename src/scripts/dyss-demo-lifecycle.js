// Bundled scripts execute once; Astro's router mounts a fresh demo on every visit.
export function registerDemo(selector, mount) {
	let cleanups = [];

	document.addEventListener('astro:page-load', () => {
		if (cleanups.length) return;
		cleanups = Array.from(document.querySelectorAll(selector), (root) => mount(root));
	});

	document.addEventListener('astro:before-swap', () => {
		for (const cleanup of cleanups) cleanup?.();
		cleanups = [];
	});
}
