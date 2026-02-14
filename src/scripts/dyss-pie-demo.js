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

const starterSegments = [
	{ label: 'Product', value: 44, color: '#0a7f78' },
	{ label: 'Services', value: 31, color: '#ef6f6c' },
	{ label: 'Support', value: 17, color: '#f8b133' },
	{ label: 'Other', value: 8, color: '#2f3c5b' }
];

const colorPool = ['#0a7f78', '#ef6f6c', '#f8b133', '#2f3c5b', '#4181f2', '#7c5ce0', '#e554a6'];

let nextId = 1;

function makeSegment(partial = {}) {
	return {
		id: String(nextId++),
		label: partial.label || `Service ${nextId - 1}`,
		value: Number.isFinite(partial.value) ? partial.value : 25,
		color: partial.color || colorPool[(nextId - 2) % colorPool.length]
	};
}

function clampValue(value) {
	const number = Number(value);
	if (!Number.isFinite(number)) return 0;
	return Math.max(0, Math.min(100, Math.round(number)));
}

function toSlices(rows) {
	const total = rows.reduce((sum, row) => sum + row.value, 0);
	if (total <= 0) {
		return rows.map((row) => ({ ...row, pct: 0, start: 0, end: 0 }));
	}

	let cumulative = 0;
	return rows.map((row, index) => {
		const remaining = Math.max(0, 100 - cumulative);
		const rawPct = (row.value / total) * 100;
		const pct = index === rows.length - 1 ? remaining : Math.max(0, Math.min(rawPct, remaining));
		const start = cumulative;
		const end = index === rows.length - 1 ? 100 : start + pct;
		cumulative = end;
		return { ...row, pct: end - start, start, end };
	});
}

function mountDemo(root) {
	const controls = root.querySelector('[data-dyss-controls]');
	const rowsContainer = root.querySelector('[data-dyss-rows]');
	const addButton = root.querySelector('[data-dyss-add]');
	const liveButton = root.querySelector('[data-dyss-live]');
	const intervalSelect = root.querySelector('[data-dyss-interval]');
	const fpsOutput = root.querySelector('[data-dyss-fps]');
	const pieList = root.querySelector('[data-dyss-pie]');
	const code = root.querySelector('[data-dyss-code]');

	if (
		!controls ||
		!rowsContainer ||
		!addButton ||
		!liveButton ||
		!intervalSelect ||
		!fpsOutput ||
		!pieList ||
		!code
	) {
		return;
	}

	const sheet = new Sheet();
	const chartClass = `dyss-chart-${Math.random().toString(36).slice(2, 10)}`;
	pieList.classList.add(chartClass);

	let rows = starterSegments.map((segment) => makeSegment(segment));
	let liveDataTimer = null;
	let liveIntervalMs = Number(intervalSelect.value) || 50;
	let renderCount = 0;
	let fpsWindowStart = performance.now();
	let fpsRafId = 0;
	const hexTimers = new WeakMap();

	function commitRowHex(target, rowEl, row, allowShort = false) {
		const normalized = parseHexInputValue(target.value, allowShort);
		if (!normalized) return;
		row.color = normalized;
		target.value = toHexFieldValue(normalized);
		const picker = rowEl.querySelector('input[data-field="color"]');
		if (picker instanceof HTMLInputElement) picker.value = normalized;
		renderChart();
	}

	function renderRows() {
		rowsContainer.replaceChildren();
		for (const row of rows) {
			const rowEl = document.createElement('div');
			rowEl.className = 'dyss-row';
			rowEl.dataset.rowId = row.id;

			const labelInput = document.createElement('input');
			labelInput.type = 'text';
			labelInput.dataset.field = 'label';
			labelInput.value = row.label;
			labelInput.setAttribute('aria-label', 'Service label');

			const valueInput = document.createElement('input');
			valueInput.type = 'range';
			valueInput.min = '0';
			valueInput.max = '100';
			valueInput.dataset.field = 'value';
			valueInput.value = String(row.value);
			valueInput.setAttribute('aria-label', 'Service value');

			const output = document.createElement('output');
			output.textContent = String(row.value);

			const colorInput = document.createElement('input');
			colorInput.type = 'color';
			colorInput.dataset.field = 'color';
			colorInput.value = row.color;
			colorInput.setAttribute('aria-label', 'Service color');

			const colorPair = document.createElement('div');
			colorPair.className = 'dyss-color-pair';

			const colorHexInput = document.createElement('input');
			colorHexInput.type = 'text';
			colorHexInput.dataset.field = 'colorHex';
			colorHexInput.value = toHexFieldValue(row.color);
			colorHexInput.maxLength = 6;
			colorHexInput.setAttribute('spellcheck', 'false');
			colorHexInput.setAttribute('autocapitalize', 'off');
			colorHexInput.setAttribute('autocomplete', 'off');
			colorHexInput.setAttribute('aria-label', 'Service color hex');

			const colorHexWrap = document.createElement('span');
			colorHexWrap.className = 'dyss-hex-wrap';
			colorHexWrap.append(colorHexInput);

			colorPair.append(colorInput, colorHexWrap);

			const removeButton = document.createElement('button');
			removeButton.type = 'button';
			removeButton.dataset.remove = '';
			removeButton.textContent = 'Remove';
			if (rows.length === 1) removeButton.disabled = true;

			rowEl.append(labelInput, valueInput, output, colorPair, removeButton);
			rowsContainer.append(rowEl);
		}
	}

	function syncValueInputs() {
		for (const row of rows) {
			const rowEl = rowsContainer.querySelector(`[data-row-id="${row.id}"]`);
			if (!rowEl) continue;
			const valueInput = rowEl.querySelector('input[data-field="value"]');
			const output = rowEl.querySelector('output');
			if (valueInput instanceof HTMLInputElement) valueInput.value = String(row.value);
			if (output) output.textContent = String(row.value);
		}
	}

	function updateCode(slices) {
		const rowsCode = rows.map((row) => ({ label: row.label, value: row.value, color: row.color }));
		const liSample = slices
			.map(
				(slice) =>
					`<li data-percentage="${slice.pct.toFixed(1)}" data-color="${slice.color}"><strong>${slice.label}</strong></li>`
			)
			.join('\n');
		const ruleSample = slices
			.map((slice) => {
				const itemSelector = `.dyss-pie-item-${slice.id}`;
				return [
					`rule = sheet.get('${itemSelector}');`,
					`rule.style.setProperty('--accum', '${slice.start.toFixed(4)}');`,
					`rule.style.setProperty('--percentage', '${slice.pct.toFixed(4)}%');`,
					`rule.style.setProperty('--weighing', '${(slice.pct / 100).toFixed(6)}');`,
					`rule.style.setProperty('--bg-color', '${slice.color}');`
				].join('\n');
			})
			.join('\n\n');

		code.textContent = [
			`const values = ${JSON.stringify(rowsCode, null, 2)};`,
			'',
			'<figure>',
			'  <figcaption>Revenue split</figcaption>',
			'  <ul class="pie-chart">',
			liSample ? `    ${liSample}` : '    <li data-percentage="100" data-color="#d9d9d9"><strong>No data</strong></li>',
			'  </ul>',
			'</figure>',
			'',
			ruleSample || '// No data rule updates.'
		].join('\n');
	}

	function ensureRule(selector) {
		let rule = sheet.get(selector);
		if (!rule) {
			sheet.add(selector, {});
			rule = sheet.get(selector);
		}
		return rule;
	}

	function applySliceRule(slice) {
		const itemSelector = `.${chartClass} .dyss-pie-item-${slice.id}`;
		const rule = ensureRule(itemSelector);
		if (!rule) return;
		rule.style.setProperty('--accum', String(slice.start));
		rule.style.setProperty('--percentage', `${slice.pct}%`);
		rule.style.setProperty('--weighing', String(slice.pct / 100));
		rule.style.setProperty('--bg-color', slice.color);
	}

	function renderChart() {
		renderCount += 1;

		const slices = toSlices(rows);
		const total = rows.reduce((sum, row) => sum + row.value, 0);
		pieList.replaceChildren();

		if (rows.length === 0 || total <= 0) {
			const li = document.createElement('li');
			li.className = 'dyss-pie-item dyss-pie-item-empty';
			li.setAttribute('data-color', '#d9d9d9');
			li.setAttribute('data-percentage', '100.0');
			const label = document.createElement('strong');
			label.textContent = 'No data';
			li.append(label);
			pieList.append(li);
			const emptyRule = ensureRule(`.${chartClass} .dyss-pie-item-empty`);
			if (emptyRule) {
				emptyRule.style.setProperty('--accum', '0');
				emptyRule.style.setProperty('--percentage', '100%');
				emptyRule.style.setProperty('--weighing', '1');
				emptyRule.style.setProperty('--bg-color', '#d9d9d9');
			}
			updateCode([]);
			return;
		}

		for (const [index, slice] of slices.entries()) {
			const li = document.createElement('li');
			li.className = `dyss-pie-item dyss-pie-item-${slice.id}`;
			li.style.setProperty('--layer', String(slices.length - index));
			const explode = index === 0;
			li.setAttribute('data-explode', explode ? 'true' : 'false');
			li.setAttribute('data-color', slice.color);
			li.setAttribute('data-percentage', slice.pct.toFixed(1));
			const label = document.createElement('strong');
			label.textContent = slice.label;
			li.append(label);
			pieList.append(li);
			applySliceRule(slice);
		}

		updateCode(slices);
	}

	function tickFPS(now) {
		const elapsed = now - fpsWindowStart;
		if (elapsed >= 500) {
			const fps = (renderCount * 1000) / elapsed;
			fpsOutput.textContent = `${fps.toFixed(1)} FPS`;
			renderCount = 0;
			fpsWindowStart = now;
		}
		fpsRafId = window.requestAnimationFrame(tickFPS);
	}

	function streamMockData() {
		for (const row of rows) {
			const drift = (Math.random() - 0.5) * 10;
			row.value = clampValue(row.value + drift);
		}
		syncValueInputs();
		renderChart();
	}

	function setLiveMode(active) {
		if (active) {
			if (!liveDataTimer) {
				liveDataTimer = window.setInterval(streamMockData, liveIntervalMs);
			}
			liveButton.setAttribute('aria-pressed', 'true');
			liveButton.textContent = 'Stop live data';
		} else {
			if (liveDataTimer) {
				window.clearInterval(liveDataTimer);
				liveDataTimer = null;
			}
			liveButton.setAttribute('aria-pressed', 'false');
			liveButton.textContent = 'Start live data';
		}
	}

	controls.addEventListener('input', (event) => {
		const target = event.target;
		if (!(target instanceof HTMLElement)) return;
		const rowEl = target.closest('[data-row-id]');
		if (!rowEl) return;
		const id = rowEl.getAttribute('data-row-id');
		const row = rows.find((item) => item.id === id);
		if (!row) return;

		const field = target.getAttribute('data-field');
		if (field === 'label' && target instanceof HTMLInputElement) {
			row.label = target.value.trim() || 'Untitled';
		}
		if (field === 'value' && target instanceof HTMLInputElement) {
			row.value = clampValue(target.value);
			const output = rowEl.querySelector('output');
			if (output) output.textContent = String(row.value);
		}
		if (field === 'color' && target instanceof HTMLInputElement) {
			row.color = target.value;
			const hexInput = rowEl.querySelector('input[data-field="colorHex"]');
			if (hexInput instanceof HTMLInputElement) hexInput.value = toHexFieldValue(row.color);
		}
		if (field === 'colorHex' && target instanceof HTMLInputElement) {
			sanitizeHexInput(target);
			const currentTimer = hexTimers.get(target);
			if (currentTimer) window.clearTimeout(currentTimer);
			const timer = window.setTimeout(() => {
				commitRowHex(target, rowEl, row, false);
				hexTimers.delete(target);
			}, 180);
			hexTimers.set(target, timer);
			return;
		}

		renderChart();
	});

	controls.addEventListener(
		'blur',
		(event) => {
			const target = event.target;
			if (!(target instanceof HTMLInputElement)) return;
			if (target.getAttribute('data-field') !== 'colorHex') return;
			const rowEl = target.closest('[data-row-id]');
			if (!rowEl) return;
			const id = rowEl.getAttribute('data-row-id');
			const row = rows.find((item) => item.id === id);
			if (!row) return;
			const currentTimer = hexTimers.get(target);
			if (currentTimer) {
				window.clearTimeout(currentTimer);
				hexTimers.delete(target);
			}
			sanitizeHexInput(target);
			commitRowHex(target, rowEl, row, true);
		},
		true
	);

	controls.addEventListener('click', (event) => {
		const target = event.target;
		if (!(target instanceof HTMLElement)) return;
		if (!target.matches('[data-remove]')) return;
		const rowEl = target.closest('[data-row-id]');
		if (!rowEl) return;
		const id = rowEl.getAttribute('data-row-id');
		rows = rows.filter((row) => row.id !== id);
		if (rows.length === 0) {
			rows = [makeSegment({ label: 'Service 1', value: 0, color: '#d9d9d9' })];
		}
		renderRows();
		renderChart();
	});

	addButton.addEventListener('click', () => {
		rows.push(makeSegment({ value: 20 }));
		renderRows();
		renderChart();
	});

	liveButton.addEventListener('click', () => {
		const isLive = liveButton.getAttribute('aria-pressed') === 'true';
		setLiveMode(!isLive);
	});

	intervalSelect.addEventListener('change', () => {
		liveIntervalMs = Number(intervalSelect.value) || 50;
		if (liveDataTimer) {
			window.clearInterval(liveDataTimer);
			liveDataTimer = window.setInterval(streamMockData, liveIntervalMs);
		}
	});

	window.addEventListener('beforeunload', () => {
		setLiveMode(false);
		if (fpsRafId) window.cancelAnimationFrame(fpsRafId);
	});

	renderRows();
	renderChart();
	fpsRafId = window.requestAnimationFrame(tickFPS);
}

document.querySelectorAll('[data-dyss-demo]').forEach(mountDemo);
