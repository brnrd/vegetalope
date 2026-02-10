import Sheet from 'dyss';

const lorem =
	'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.';

const defaultColors = [
	{ id: 'c1', label: 'Blue', value: '#3b82f6' },
	{ id: 'c2', label: 'Red', value: '#ef4444' },
	{ id: 'c3', label: 'Green', value: '#22c55e' }
];

let nextColorId = 4;

function tokenize(text) {
	return text.split(/\s+/).filter(Boolean);
}

function escapeHTML(input) {
	return input
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;');
}

function mountDemo(root) {
	const wordsContainer = root.querySelector('[data-dyss-words]');
	const palette = root.querySelector('[data-dyss-palette]');
	const addColorButton = root.querySelector('[data-dyss-add-color]');
	const clearButton = root.querySelector('[data-dyss-clear]');

	if (!wordsContainer || !palette || !addColorButton || !clearButton) return;

	const sheet = new Sheet();
	const tokens = tokenize(lorem);
	let colors = defaultColors.map((color) => ({ ...color }));
	let activeColorId = colors[0]?.id ?? null;
	const highlights = new Map();

	function updateColorRule(color) {
		sheet.updateSet(`.hl-${color.id}`, {
			backgroundColor: color.value
		});
	}

	function renderPalette() {
		palette.innerHTML = colors
			.map((color) => {
				const isActive = color.id === activeColorId;
				return `
					<div class="dyss-color" data-color-id="${color.id}">
						<button type="button" class="dyss-swatch" aria-pressed="${isActive}" style="background:${color.value}"></button>
						<input type="text" data-field="label" value="${escapeHTML(color.label)}" aria-label="Color label" />
						<input type="color" data-field="value" value="${color.value}" aria-label="Color value" />
						<button type="button" class="dyss-remove" aria-label="Remove color">Remove</button>
					</div>
				`;
			})
			.join('');

		colors.forEach(updateColorRule);
	}

	function renderWords() {
		wordsContainer.innerHTML = tokens
			.map((word, index) => {
				const layers = Array.from(highlights.get(index) ?? [])
					.map((colorId) => `<span class="hl-layer hl-${colorId}"></span>`)
					.join('');
				return `
					<span class="word" data-word-index="${index}">
						<span class="word-layers">${layers}</span>
						<span class="word-text">${escapeHTML(word)}</span>
					</span>
				`;
			})
			.join(' ');
	}

	function applyHighlight(range) {
		if (!activeColorId) return;
		const nodes = Array.from(wordsContainer.querySelectorAll('[data-word-index]'));
		let changed = false;

		for (const node of nodes) {
			if (!range.intersectsNode(node)) continue;
			const index = Number(node.getAttribute('data-word-index'));
			if (!Number.isFinite(index)) continue;
			const set = highlights.get(index) ?? new Set();
			if (!set.has(activeColorId)) {
				set.add(activeColorId);
				highlights.set(index, set);
				changed = true;
			}
		}

		if (changed) renderWords();
	}

	function clearHighlights() {
		highlights.clear();
		renderWords();
	}

	wordsContainer.addEventListener('mouseup', () => {
		const selection = window.getSelection();
		if (!selection || selection.rangeCount === 0) return;
		const range = selection.getRangeAt(0);
		if (!wordsContainer.contains(range.commonAncestorContainer)) return;
		applyHighlight(range);
		selection.removeAllRanges();
	});

	palette.addEventListener('click', (event) => {
		const target = event.target;
		if (!(target instanceof HTMLElement)) return;
		const colorRow = target.closest('[data-color-id]');
		if (!colorRow) return;
		const colorId = colorRow.getAttribute('data-color-id');
		if (!colorId) return;

		if (target.classList.contains('dyss-remove')) {
			colors = colors.filter((color) => color.id !== colorId);
			for (const set of highlights.values()) {
				set.delete(colorId);
			}
			if (activeColorId === colorId) {
				activeColorId = colors[0]?.id ?? null;
			}
			renderPalette();
			renderWords();
			return;
		}

		if (target.classList.contains('dyss-swatch')) {
			activeColorId = colorId;
			renderPalette();
			return;
		}
	});

	palette.addEventListener('input', (event) => {
		const target = event.target;
		if (!(target instanceof HTMLInputElement)) return;
		const colorRow = target.closest('[data-color-id]');
		if (!colorRow) return;
		const colorId = colorRow.getAttribute('data-color-id');
		if (!colorId) return;
		const color = colors.find((item) => item.id === colorId);
		if (!color) return;

		if (target.getAttribute('data-field') === 'label') {
			color.label = target.value.trim() || color.label;
		}

		if (target.getAttribute('data-field') === 'value') {
			color.value = target.value;
			updateColorRule(color);
			colorRow.querySelector('.dyss-swatch')?.setAttribute('style', `background:${color.value}`);
		}
	});

	addColorButton.addEventListener('click', () => {
		const id = `c${nextColorId++}`;
		colors.push({ id, label: `Color ${nextColorId - 1}`, value: '#f59e0b' });
		activeColorId = id;
		renderPalette();
	});

	clearButton.addEventListener('click', () => {
		clearHighlights();
	});

	renderPalette();
	renderWords();
}

document.querySelectorAll('[data-dyss-highlight-demo]').forEach(mountDemo);
