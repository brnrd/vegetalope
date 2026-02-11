import Sheet from 'dyss';

const defaultSwatches = [
	{ id: 'c1', label: 'Primary', color: '#1f6feb' },
	{ id: 'c2', label: 'Warning', color: '#f2b636' },
	{ id: 'c3', label: 'Success', color: '#2fbf71' },
	{ id: 'c4', label: 'Critical', color: '#d84f4f' }
];

let nextId = 5;

function makeSwatch(partial = {}) {
	return {
		id: partial.id || `c${nextId++}`,
		label: partial.label || `Swatch ${nextId - 1}`,
		color: partial.color || '#7b6de0'
	};
}

function clampThreshold(value) {
	const number = Number(value);
	if (!Number.isFinite(number)) return 1.21;
	return Math.max(1.12, Math.min(1.3, number));
}

function normalizeHex(value) {
	const raw = value.trim().replace(/^#/, '');
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
	return value.replace(/^#/, '');
}

function sanitizeHexInput(input) {
	const cleaned = input.value.replace(/^#/, '').replace(/[^0-9a-fA-F]/g, '').slice(0, 6).toLowerCase();
	if (input.value !== cleaned) input.value = cleaned;
	return cleaned;
}

function parseHexInputValue(value, allowShort = false) {
	const raw = value.trim().replace(/^#/, '');
	if (raw.length === 6) return normalizeHex(raw);
	if (allowShort && raw.length === 3) return normalizeHex(raw);
	return null;
}

function hexToRgb(hex) {
	const clean = hex.replace('#', '');
	if (clean.length !== 6) return { r: 255, g: 255, b: 255 };
	return {
		r: Number.parseInt(clean.slice(0, 2), 16),
		g: Number.parseInt(clean.slice(2, 4), 16),
		b: Number.parseInt(clean.slice(4, 6), 16)
	};
}

function mountContrastLab(root) {
	const controls = root.querySelector('[data-dyss-controls]');
	const rowsContainer = root.querySelector('[data-dyss-rows]');
	const thresholdInput = root.querySelector('[data-dyss-threshold]');
	const thresholdOutput = root.querySelector('[data-dyss-threshold-output]');
	const lightTextInput = root.querySelector('[data-dyss-light-text]');
	const lightTextHexInput = root.querySelector('[data-dyss-light-text-hex]');
	const darkTextInput = root.querySelector('[data-dyss-dark-text]');
	const darkTextHexInput = root.querySelector('[data-dyss-dark-text-hex]');
	const addButton = root.querySelector('[data-dyss-add]');
	const preview = root.querySelector('[data-dyss-preview]');
	const support = root.querySelector('[data-dyss-support]');
	const code = root.querySelector('[data-dyss-code]');

	if (
		!controls ||
		!rowsContainer ||
		!thresholdInput ||
		!thresholdOutput ||
		!lightTextInput ||
		!darkTextInput ||
		!addButton ||
		!preview ||
		!support ||
		!code
	) {
		return;
	}

	const sheet = new Sheet();
	let threshold = clampThreshold(thresholdInput.value);
	let lightText = lightTextInput.value;
	let darkText = darkTextInput.value;
	let swatches = defaultSwatches.map((item) => makeSwatch(item));
	const hexTimers = new WeakMap();

	function syncCandidateInputs() {
		lightTextInput.value = lightText;
		darkTextInput.value = darkText;
		if (lightTextHexInput instanceof HTMLInputElement) lightTextHexInput.value = toHexFieldValue(lightText);
		if (darkTextHexInput instanceof HTMLInputElement) darkTextHexInput.value = toHexFieldValue(darkText);
	}

	function commitCandidateHexInput(target, allowShort = false) {
		if (target === lightTextHexInput) {
			const normalized = parseHexInputValue(target.value, allowShort);
			if (!normalized) return;
			lightText = normalized;
			syncCandidateInputs();
			renderRows();
			renderPreview();
		}
		if (target === darkTextHexInput) {
			const normalized = parseHexInputValue(target.value, allowShort);
			if (!normalized) return;
			darkText = normalized;
			syncCandidateInputs();
			renderRows();
			renderPreview();
		}
	}

	function commitRowHexInput(target, row, swatch, allowShort = false) {
		const normalized = parseHexInputValue(target.value, allowShort);
		if (!normalized) return;
		swatch.color = normalized;
		target.value = toHexFieldValue(normalized);
		const picker = row.querySelector('input[data-field="color"]');
		if (picker instanceof HTMLInputElement) picker.value = normalized;
		renderPreview();
	}

	function textFormula(backgroundColor) {
		const light = hexToRgb(lightText);
		const dark = hexToRgb(darkText);
		return `rgb(from oklch(from ${backgroundColor} round(${threshold.toFixed(2)} - l) 0 0) calc((r / 255) * ${light.r - dark.r} + ${dark.r}) calc((g / 255) * ${light.g - dark.g} + ${dark.g}) calc((b / 255) * ${light.b - dark.b} + ${dark.b}))`;
	}

	function supportMessage() {
		const formula = textFormula('#3366cc');
		if (typeof CSS !== 'undefined' && typeof CSS.supports === 'function' && CSS.supports('color', formula)) {
			return `Relative color syntax supported. Text toggles between ${lightText} and ${darkText}.`;
		}
		return `Relative color syntax unsupported in this browser; cards fall back to inherited text color.`;
	}

	function renderRows() {
		rowsContainer.replaceChildren();
		for (const swatch of swatches) {
			const row = document.createElement('div');
			row.className = 'contrast-row';
			row.dataset.swatchId = swatch.id;

			const labelInput = document.createElement('input');
			labelInput.type = 'text';
			labelInput.dataset.field = 'label';
			labelInput.value = swatch.label;
			labelInput.setAttribute('aria-label', 'Swatch label');

			const colorInput = document.createElement('input');
			colorInput.type = 'color';
			colorInput.dataset.field = 'color';
			colorInput.value = swatch.color;
			colorInput.setAttribute('aria-label', 'Swatch color');

			const colorPair = document.createElement('div');
			colorPair.className = 'contrast-color-pair';

			const colorHexInput = document.createElement('input');
			colorHexInput.type = 'text';
			colorHexInput.dataset.field = 'colorHex';
			colorHexInput.value = toHexFieldValue(swatch.color);
			colorHexInput.maxLength = 6;
			colorHexInput.setAttribute('spellcheck', 'false');
			colorHexInput.setAttribute('autocapitalize', 'off');
			colorHexInput.setAttribute('autocomplete', 'off');
			colorHexInput.setAttribute('aria-label', 'Swatch color hex');

			const colorHexWrap = document.createElement('span');
			colorHexWrap.className = 'contrast-hex-wrap';
			colorHexWrap.append(colorHexInput);

			colorPair.append(colorInput, colorHexWrap);

			const formula = document.createElement('code');
			formula.textContent = `${lightText} / ${darkText}`;

			const removeButton = document.createElement('button');
			removeButton.type = 'button';
			removeButton.dataset.remove = '';
			removeButton.textContent = 'Remove';
			if (swatches.length === 1) removeButton.disabled = true;

			row.append(labelInput, colorPair, formula, removeButton);
			rowsContainer.append(row);
		}
	}

	function ensureRule(selector) {
		let rule = sheet.get(selector);
		if (!rule) {
			sheet.add(selector, {});
			rule = sheet.get(selector);
		}
		return rule;
	}

	function updateCode() {
		const swatchesCode = swatches.map((swatch) => ({ label: swatch.label, color: swatch.color }));
		const updates = swatches
			.map((swatch) => {
				const selector = `.contrast-card-${swatch.id}`;
				const formula = textFormula(swatch.color);
				return [
					`sheet.updateSet('${selector}', {`,
					`  backgroundColor: '${swatch.color}',`,
					`  color: '${formula}'`,
					`});`
				].join('\n');
			})
			.join('\n\n');

		code.textContent = [
			`const threshold = ${threshold.toFixed(2)};`,
			`const lightText = '${lightText}';`,
			`const darkText = '${darkText}';`,
			`const swatches = ${JSON.stringify(swatchesCode, null, 2)};`,
			'',
			updates
		].join('\n');
	}

	function renderPreview() {
		preview.replaceChildren();
		for (const swatch of swatches) {
			const card = document.createElement('article');
			card.className = `contrast-card contrast-card-${swatch.id}`;

			const title = document.createElement('h4');
			title.textContent = swatch.label;

			const body = document.createElement('p');
			body.textContent = 'Adaptive text color computed from background lightness.';

			const chip = document.createElement('span');
			chip.className = 'contrast-chip';
			chip.textContent = swatch.color;

			card.append(title, body, chip);
			preview.append(card);

			const formula = textFormula(swatch.color);
			sheet.updateSet(`.contrast-card-${swatch.id}`, {
				backgroundColor: swatch.color,
				color: formula
			});
		}

		support.textContent = supportMessage();
		updateCode();
	}

	controls.addEventListener('input', (event) => {
		const target = event.target;
		if (!(target instanceof HTMLInputElement)) return;

		if (target === thresholdInput) {
			threshold = clampThreshold(target.value);
			target.value = threshold.toFixed(2);
			thresholdOutput.textContent = threshold.toFixed(2);
			renderRows();
			renderPreview();
			return;
		}
		if (target === lightTextInput) {
			lightText = target.value;
			syncCandidateInputs();
			renderRows();
			renderPreview();
			return;
		}
		if (target === lightTextHexInput) {
			sanitizeHexInput(target);
			const currentTimer = hexTimers.get(target);
			if (currentTimer) window.clearTimeout(currentTimer);
			const timer = window.setTimeout(() => {
				commitCandidateHexInput(target, false);
				hexTimers.delete(target);
			}, 180);
			hexTimers.set(target, timer);
			return;
		}
		if (target === darkTextInput) {
			darkText = target.value;
			syncCandidateInputs();
			renderRows();
			renderPreview();
			return;
		}
		if (target === darkTextHexInput) {
			sanitizeHexInput(target);
			const currentTimer = hexTimers.get(target);
			if (currentTimer) window.clearTimeout(currentTimer);
			const timer = window.setTimeout(() => {
				commitCandidateHexInput(target, false);
				hexTimers.delete(target);
			}, 180);
			hexTimers.set(target, timer);
			return;
		}

		const row = target.closest('[data-swatch-id]');
		if (!row) return;
		const id = row.getAttribute('data-swatch-id');
		const swatch = swatches.find((item) => item.id === id);
		if (!swatch) return;
		const field = target.getAttribute('data-field');
		if (field === 'label') {
			swatch.label = target.value.trim() || 'Untitled';
		}
		if (field === 'color') {
			swatch.color = target.value;
			const hexInput = row.querySelector('input[data-field="colorHex"]');
			if (hexInput instanceof HTMLInputElement) hexInput.value = toHexFieldValue(swatch.color);
		}
		if (field === 'colorHex') {
			sanitizeHexInput(target);
			const currentTimer = hexTimers.get(target);
			if (currentTimer) window.clearTimeout(currentTimer);
			const timer = window.setTimeout(() => {
				commitRowHexInput(target, row, swatch, false);
				hexTimers.delete(target);
			}, 180);
			hexTimers.set(target, timer);
			return;
		}

		renderPreview();
	});

	controls.addEventListener(
		'blur',
		(event) => {
			const target = event.target;
			if (!(target instanceof HTMLInputElement)) return;
			const isCandidate = target === lightTextHexInput || target === darkTextHexInput;
			const isRowHex = target.getAttribute('data-field') === 'colorHex';
			if (!isCandidate && !isRowHex) return;
			const currentTimer = hexTimers.get(target);
			if (currentTimer) {
				window.clearTimeout(currentTimer);
				hexTimers.delete(target);
			}
			sanitizeHexInput(target);
			if (isCandidate) {
				commitCandidateHexInput(target, true);
				return;
			}
			const row = target.closest('[data-swatch-id]');
			if (!row) return;
			const id = row.getAttribute('data-swatch-id');
			const swatch = swatches.find((item) => item.id === id);
			if (!swatch) return;
			commitRowHexInput(target, row, swatch, true);
		},
		true
	);

	controls.addEventListener('click', (event) => {
		const target = event.target;
		if (!(target instanceof HTMLElement)) return;
		if (!target.matches('[data-remove]')) return;
		const row = target.closest('[data-swatch-id]');
		if (!row) return;
		const id = row.getAttribute('data-swatch-id');
		swatches = swatches.filter((item) => item.id !== id);
		if (swatches.length === 0) swatches = [makeSwatch({ label: 'Fallback', color: '#7b6de0' })];
		renderRows();
		renderPreview();
	});

	addButton.addEventListener('click', () => {
		swatches.push(makeSwatch());
		renderRows();
		renderPreview();
	});

	thresholdOutput.textContent = threshold.toFixed(2);
	syncCandidateInputs();
	renderRows();
	renderPreview();
}

document.querySelectorAll('[data-dyss-contrast-lab]').forEach(mountContrastLab);
