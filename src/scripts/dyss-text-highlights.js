import Sheet from 'dyss';

function normalizeHex(value) {
	const raw = String(value).trim().replace(/^#/, '');
	if (raw.length === 3 && /^[0-9a-fA-F]{3}$/.test(raw)) {
		return `#${raw
			.split('')
			.map((char) => char + char)
			.join('')
			.toLowerCase()}`;
	}
	if (raw.length === 6 && /^[0-9a-fA-F]{6}$/.test(raw)) {
		return `#${raw.toLowerCase()}`;
	}
	return null;
}

function toHexFieldValue(value) {
	return String(value).replace(/^#/, '');
}

function sanitizeHexInput(input) {
	const cleaned = String(input.value)
		.replace(/^#/, '')
		.replace(/[^0-9a-fA-F]/g, '')
		.slice(0, 6)
		.toLowerCase();
	if (input.value !== cleaned) input.value = cleaned;
	return cleaned;
}

function parseHexInputValue(value, allowShort = false) {
	const raw = String(value).trim().replace(/^#/, '');
	if (raw.length === 6) return normalizeHex(raw);
	if (allowShort && raw.length === 3) return normalizeHex(raw);
	return null;
}

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
	const hasTrustedTypes = typeof window !== 'undefined' && 'trustedTypes' in window;
	const hexTimers = new WeakMap();

	function updateColorRule(color) {
		sheet.updateSet(`.hl-${color.id}`, {
			backgroundColor: color.value
		});
	}

	function commitColorHexInput(target, colorRow, color, allowShort = false) {
		const normalized = parseHexInputValue(target.value, allowShort);
		if (!normalized) return;
		color.value = normalized;
		target.value = toHexFieldValue(normalized);
		const picker = colorRow.querySelector('input[data-field="value"]');
		if (picker instanceof HTMLInputElement) picker.value = normalized;
		updateColorRule(color);
		const swatch = colorRow.querySelector('.dyss-swatch');
		if (swatch instanceof HTMLElement) swatch.style.background = color.value;
	}

	function renderPalette() {
		palette.replaceChildren();
		for (const color of colors) {
			const isActive = color.id === activeColorId;
			const row = document.createElement('div');
			row.className = 'dyss-color';
			row.dataset.colorId = color.id;

			const swatch = document.createElement('button');
			swatch.type = 'button';
			swatch.className = 'dyss-swatch';
			swatch.setAttribute('aria-pressed', String(isActive));
			swatch.style.background = color.value;

			const labelInput = document.createElement('input');
			labelInput.type = 'text';
			labelInput.dataset.field = 'label';
			labelInput.value = color.label;
			labelInput.setAttribute('aria-label', 'Color label');

			const colorInput = document.createElement('input');
			colorInput.type = 'color';
			colorInput.dataset.field = 'value';
			colorInput.value = color.value;
			colorInput.setAttribute('aria-label', 'Color value');

			const colorPair = document.createElement('div');
			colorPair.className = 'dyss-color-pair';

			const colorHexInput = document.createElement('input');
			colorHexInput.type = 'text';
			colorHexInput.dataset.field = 'valueHex';
			colorHexInput.value = toHexFieldValue(color.value);
			colorHexInput.maxLength = 6;
			colorHexInput.setAttribute('spellcheck', 'false');
			colorHexInput.setAttribute('autocapitalize', 'off');
			colorHexInput.setAttribute('autocomplete', 'off');
			colorHexInput.setAttribute('aria-label', 'Color hex value');

			const colorHexWrap = document.createElement('span');
			colorHexWrap.className = 'dyss-hex-wrap';
			colorHexWrap.append(colorHexInput);

			colorPair.append(colorInput, colorHexWrap);

			const removeButton = document.createElement('button');
			removeButton.type = 'button';
			removeButton.className = 'dyss-remove';
			removeButton.setAttribute('aria-label', 'Remove color');
			removeButton.textContent = 'Remove';

			row.append(swatch, labelInput, colorPair, removeButton);
			palette.append(row);
		}

		colors.forEach(updateColorRule);
	}

	function renderWords() {
		wordsContainer.replaceChildren();
		tokens.forEach((word, index) => {
			const wordEl = document.createElement('span');
			wordEl.className = 'word';
			wordEl.dataset.wordIndex = String(index);

			const layersEl = document.createElement('span');
			layersEl.className = 'word-layers';
			const layerIds = Array.from(highlights.get(index) ?? []);
			for (const colorId of layerIds) {
				const layer = document.createElement('span');
				layer.className = `hl-layer hl-${colorId}`;
				layersEl.append(layer);
			}

			const textEl = document.createElement('span');
			textEl.className = 'word-text';
			textEl.textContent = word;

			wordEl.append(layersEl, textEl);
			wordsContainer.append(wordEl);
			wordsContainer.append(document.createTextNode(' '));
		});
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
			const hexInput = colorRow.querySelector('input[data-field="valueHex"]');
			if (hexInput instanceof HTMLInputElement) hexInput.value = toHexFieldValue(color.value);
			updateColorRule(color);
			const swatch = colorRow.querySelector('.dyss-swatch');
			if (swatch instanceof HTMLElement) swatch.style.background = color.value;
		}

		if (target.getAttribute('data-field') === 'valueHex') {
			sanitizeHexInput(target);
			const currentTimer = hexTimers.get(target);
			if (currentTimer) window.clearTimeout(currentTimer);
			const timer = window.setTimeout(() => {
				commitColorHexInput(target, colorRow, color, false);
				hexTimers.delete(target);
			}, 180);
			hexTimers.set(target, timer);
			return;
		}
	});

	palette.addEventListener(
		'blur',
		(event) => {
			const target = event.target;
			if (!(target instanceof HTMLInputElement)) return;
			if (target.getAttribute('data-field') !== 'valueHex') return;
			const colorRow = target.closest('[data-color-id]');
			if (!colorRow) return;
			const colorId = colorRow.getAttribute('data-color-id');
			if (!colorId) return;
			const color = colors.find((item) => item.id === colorId);
			if (!color) return;
			const currentTimer = hexTimers.get(target);
			if (currentTimer) {
				window.clearTimeout(currentTimer);
				hexTimers.delete(target);
			}
			sanitizeHexInput(target);
			commitColorHexInput(target, colorRow, color, true);
		},
		true
	);

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
