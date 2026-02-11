import Sheet from 'dyss';

const defaults = {
	bg: '#f6f1e8',
	ink: '#14161a',
	accent: '#c21f2b',
	surfaceMix: 92,
	typeScale: 1,
	spaceScale: 1
};

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

function toNumber(value, fallback) {
	const number = Number(value);
	return Number.isFinite(number) ? number : fallback;
}

function clamp(value, min, max) {
	return Math.min(max, Math.max(min, value));
}

function formatScale(value) {
	return `${value.toFixed(2)}x`;
}

function updateOutputs(root, tokens) {
	const surfaceOut = root.querySelector('[data-output="surfaceMix"]');
	const typeOut = root.querySelector('[data-output="typeScale"]');
	const spaceOut = root.querySelector('[data-output="spaceScale"]');
	if (surfaceOut) surfaceOut.textContent = `${Math.round(tokens.surfaceMix)}%`;
	if (typeOut) typeOut.textContent = formatScale(tokens.typeScale);
	if (spaceOut) spaceOut.textContent = formatScale(tokens.spaceScale);
}

function updateCode(codeEl, selector, tokens) {
	const codeTokens = {
		bg: tokens.bg,
		ink: tokens.ink,
		accent: tokens.accent,
		surfaceMix: Math.round(tokens.surfaceMix),
		typeScale: Number(tokens.typeScale.toFixed(2)),
		spaceScale: Number(tokens.spaceScale.toFixed(2))
	};

	codeEl.textContent = [
		`const tokens = ${JSON.stringify(codeTokens, null, 2)};`,
		'',
		`sheet.updateSet('${selector}', {`,
		`  '--tm-bg': tokens.bg,`,
		`  '--tm-ink': tokens.ink,`,
		`  '--tm-accent': tokens.accent,`,
		`  '--tm-surface-mix': tokens.surfaceMix + '%',`,
		`  '--tm-type-scale': tokens.typeScale,`,
		`  '--tm-space-scale': tokens.spaceScale`,
		`});`
	].join('\n');
}

function mountThemeMixer(root) {
	const controls = root.querySelector('[data-dyss-controls]');
	const preview = root.querySelector('[data-theme-preview]');
	const code = root.querySelector('[data-dyss-code]');

	if (!controls || !preview || !code) return;

	const sheet = new Sheet();
	const className = `dyss-theme-${Math.random().toString(36).slice(2, 9)}`;
	const selector = `.theme-preview.${className}`;
	preview.classList.add(className);

	const tokens = { ...defaults };
	const hexTimers = new WeakMap();

	sheet.add(selector, {
		'--tm-bg': tokens.bg,
		'--tm-ink': tokens.ink,
		'--tm-accent': tokens.accent,
		'--tm-surface-mix': `${Math.round(tokens.surfaceMix)}%`,
		'--tm-type-scale': tokens.typeScale,
		'--tm-space-scale': tokens.spaceScale
	});

	const rule = sheet.get(selector);
	if (!rule) return;

	function applyTokens() {
		rule.style.setProperty('--tm-bg', tokens.bg);
		rule.style.setProperty('--tm-ink', tokens.ink);
		rule.style.setProperty('--tm-accent', tokens.accent);
		rule.style.setProperty('--tm-surface-mix', `${Math.round(tokens.surfaceMix)}%`);
		rule.style.setProperty('--tm-type-scale', String(tokens.typeScale));
		rule.style.setProperty('--tm-space-scale', String(tokens.spaceScale));
		updateOutputs(root, tokens);
		updateCode(code, selector, tokens);
	}

	function syncControls() {
		const inputs = controls.querySelectorAll('[data-token]');
		for (const input of inputs) {
			if (!(input instanceof HTMLInputElement)) continue;
			const token = input.getAttribute('data-token');
			if (!token) continue;
			if (token === 'bg' || token === 'ink' || token === 'accent') {
				input.value = input.type === 'text' ? toHexFieldValue(tokens[token]) : tokens[token];
			}
			if (token === 'surfaceMix') {
				input.value = String(tokens.surfaceMix);
			}
			if (token === 'typeScale') {
				input.value = String(tokens.typeScale);
			}
			if (token === 'spaceScale') {
				input.value = String(tokens.spaceScale);
			}
		}
	}

	function syncColorTokenInputs(token) {
		const tokenInputs = controls.querySelectorAll(`[data-token="${token}"]`);
		for (const input of tokenInputs) {
			if (!(input instanceof HTMLInputElement)) continue;
			input.value = input.type === 'text' ? toHexFieldValue(tokens[token]) : tokens[token];
		}
	}

	function commitTokenHexInput(target, token, allowShort = false) {
		const normalized = parseHexInputValue(target.value, allowShort);
		if (!normalized) return;
		tokens[token] = normalized;
		syncColorTokenInputs(token);
		applyTokens();
	}

	controls.addEventListener('input', (event) => {
		const target = event.target;
		if (!(target instanceof HTMLInputElement)) return;
		const token = target.getAttribute('data-token');
		if (!token) return;

		if (token === 'bg' || token === 'ink' || token === 'accent') {
			if (target.type === 'text') {
				sanitizeHexInput(target);
				const currentTimer = hexTimers.get(target);
				if (currentTimer) window.clearTimeout(currentTimer);
				const timer = window.setTimeout(() => {
					commitTokenHexInput(target, token, false);
					hexTimers.delete(target);
				}, 180);
				hexTimers.set(target, timer);
				return;
			} else {
				tokens[token] = target.value;
				syncColorTokenInputs(token);
				applyTokens();
				return;
			}
		}

		if (token === 'surfaceMix') {
			tokens.surfaceMix = clamp(toNumber(target.value, defaults.surfaceMix), 70, 98);
		}

		if (token === 'typeScale') {
			tokens.typeScale = clamp(toNumber(target.value, defaults.typeScale), 0.85, 1.3);
		}

		if (token === 'spaceScale') {
			tokens.spaceScale = clamp(toNumber(target.value, defaults.spaceScale), 0.8, 1.4);
		}

		applyTokens();
	});

	controls.addEventListener(
		'blur',
		(event) => {
			const target = event.target;
			if (!(target instanceof HTMLInputElement)) return;
			if (target.type !== 'text') return;
			const token = target.getAttribute('data-token');
			if (token !== 'bg' && token !== 'ink' && token !== 'accent') return;
			const currentTimer = hexTimers.get(target);
			if (currentTimer) {
				window.clearTimeout(currentTimer);
				hexTimers.delete(target);
			}
			sanitizeHexInput(target);
			commitTokenHexInput(target, token, true);
		},
		true
	);

	syncControls();
	applyTokens();
}

const demo = document.querySelector('[data-dyss-theme-demo]');
if (demo) mountThemeMixer(demo);
