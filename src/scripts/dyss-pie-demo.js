import Sheet from 'dyss';

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

function escapeHTML(input) {
	return input
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;');
}

function toSlices(rows) {
	const total = rows.reduce((sum, row) => sum + row.value, 0);
	if (total <= 0) {
		return rows.map((row) => ({ ...row, pct: 0, start: 0, end: 0 }));
	}

	let cumulative = 0;
	return rows.map((row) => {
		const pct = (row.value / total) * 100;
		const start = cumulative;
		cumulative += pct;
		return { ...row, pct, start, end: cumulative };
	});
}

function mountDemo(root) {
	const controls = root.querySelector('[data-dyss-controls]');
	const rowsContainer = root.querySelector('[data-dyss-rows]');
	const addButton = root.querySelector('[data-dyss-add]');
	const liveButton = root.querySelector('[data-dyss-live]');
	const intervalSelect = root.querySelector('[data-dyss-interval]');
	const fpsOutput = root.querySelector('[data-dyss-fps]');
	const pie = root.querySelector('.dyss-pie');
	const legend = root.querySelector('[data-dyss-legend]');
	const code = root.querySelector('[data-dyss-code]');

	if (!controls || !rowsContainer || !addButton || !liveButton || !intervalSelect || !fpsOutput || !pie || !legend || !code) return;

	const sheet = new Sheet();
	const className = `dynamic-${Math.random().toString(36).slice(2, 10)}`;
	const selector = `.dyss-pie.${className}`;
	let rows = starterSegments.map((segment) => makeSegment(segment));
	let liveDataTimer = null;
	let liveIntervalMs = Number(intervalSelect.value) || 50;
	let renderCount = 0;
	let fpsWindowStart = performance.now();
	let fpsRafId = 0;

	sheet.add(selector, {
		backgroundImage: 'conic-gradient(#d9d9d9 0deg 360deg)'
	});
	pie.classList.add(className);

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

			const removeButton = document.createElement('button');
			removeButton.type = 'button';
			removeButton.dataset.remove = '';
			removeButton.textContent = 'Remove';
			if (rows.length === 1) removeButton.disabled = true;

			rowEl.append(labelInput, valueInput, output, colorInput, removeButton);
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

	function updateCode(stops) {
		const rowsCode = rows.map((row) => ({ label: row.label, value: row.value, color: row.color }));
		code.textContent = [
			`const values = ${JSON.stringify(rowsCode, null, 2)};`,
			'',
			`sheet.updateSet('${selector}', {`,
			`  backgroundImage: 'conic-gradient(${stops})'`,
			`});`
		].join('\n');
	}

	function renderChart() {
		renderCount += 1;

		const slices = toSlices(rows);
		const total = rows.reduce((sum, row) => sum + row.value, 0);

		const stops =
			total <= 0
				? '#d9d9d9 0deg 360deg'
				: slices
						.map((slice) => {
							const from = (slice.start * 3.6).toFixed(2);
							const to = (slice.end * 3.6).toFixed(2);
							return `${slice.color} ${from}deg ${to}deg`;
						})
						.join(', ');

		sheet.updateSet(selector, {
			backgroundImage: `conic-gradient(${stops})`
		});

		legend.replaceChildren();
		if (slices.length === 0) {
			const li = document.createElement('li');
			const swatch = document.createElement('span');
			swatch.className = 'swatch';
			swatch.style.background = '#d9d9d9';
			const label = document.createElement('span');
			label.textContent = 'No data';
			const valueEl = document.createElement('strong');
			valueEl.textContent = '0';
			const pct = document.createElement('em');
			pct.textContent = '0.0%';
			li.append(swatch, label, valueEl, pct);
			legend.append(li);
		} else {
			for (const slice of slices) {
				const li = document.createElement('li');
				const swatch = document.createElement('span');
				swatch.className = 'swatch';
				swatch.style.background = slice.color;
				const label = document.createElement('span');
				label.textContent = slice.label;
				const valueEl = document.createElement('strong');
				valueEl.textContent = String(slice.value);
				const pct = document.createElement('em');
				const pctText = total <= 0 ? '0.0' : slice.pct.toFixed(1);
				pct.textContent = `${pctText}%`;
				li.append(swatch, label, valueEl, pct);
				legend.append(li);
			}
		}

		updateCode(stops);
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
		}

		renderChart();
	});

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
