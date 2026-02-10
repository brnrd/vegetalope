import Sheet from 'dyss';

const rpmLabels = [1000, 1500, 2000, 2500, 3000, 3500, 4000];
const loadLabels = ['Idle', 'Cruise', 'Accel', 'Boost', 'Peak'];

function makeBaseValue(rowIndex, colIndex) {
	const base = 12 + rowIndex * 8 + colIndex * 3;
	return base + Math.round(Math.sin(colIndex * 0.7) * 2);
}

function clamp(value, min, max) {
	return Math.min(max, Math.max(min, value));
}

function valueToColor(value, min, max) {
	const t = clamp((value - min) / (max - min), 0, 1);
	const hue = 220 - t * 190;
	const lightness = 28 + t * 34;
	const bg = `hsl(${hue.toFixed(1)} 70% ${lightness.toFixed(1)}%)`;
	const text = lightness > 52 ? '#0d1220' : '#f6f1e8';
	return { bg, text };
}

function updateCode(code, selector, snapshot) {
	code.textContent = [
		`const snapshot = ${JSON.stringify(snapshot, null, 2)};`,
		'',
		`sheet.updateSet('${selector}', {`,
		`  backgroundColor: '${snapshot.color}',`,
		`  color: '${snapshot.textColor}'`,
		`});`
	].join('\n');
}

function mountHeatmap(root) {
	const head = root.querySelector('[data-dyss-head]');
	const body = root.querySelector('[data-dyss-body]');
	const liveButton = root.querySelector('[data-dyss-live]');
	const intervalSelect = root.querySelector('[data-dyss-interval]');
	const reseedButton = root.querySelector('[data-dyss-reseed]');
	const fpsOutput = root.querySelector('[data-dyss-fps]');
	const code = root.querySelector('[data-dyss-code]');

	if (!head || !body || !liveButton || !intervalSelect || !reseedButton || !fpsOutput || !code) return;

	let sheet = new Sheet();
	const cells = [];
	let values = [];
	let liveTimer = null;
	let liveInterval = Number(intervalSelect.value) || 50;
	let renderCount = 0;
	let fpsWindowStart = performance.now();
	let fpsRafId = 0;

	function buildTable() {
		values = loadLabels.map((_, rowIndex) =>
			rpmLabels.map((_, colIndex) => makeBaseValue(rowIndex, colIndex))
		);

		head.replaceChildren();
		body.replaceChildren();
		cells.length = 0;

		const headRow = document.createElement('tr');
		const corner = document.createElement('th');
		corner.textContent = 'Load \/ RPM';
		headRow.append(corner);
		rpmLabels.forEach((rpm) => {
			const th = document.createElement('th');
			th.textContent = `${rpm}`;
			headRow.append(th);
		});
		head.append(headRow);

		loadLabels.forEach((label, rowIndex) => {
			const row = document.createElement('tr');
			const rowHeader = document.createElement('th');
			rowHeader.textContent = label;
			row.append(rowHeader);

			rpmLabels.forEach((_, colIndex) => {
				const cell = document.createElement('td');
				const id = `hm-${rowIndex}-${colIndex}`;
				cell.className = `hm-cell ${id}`;
				cell.textContent = String(values[rowIndex][colIndex]);
				row.append(cell);

				sheet.add(`.${id}`, {
					backgroundColor: 'hsl(220 70% 28%)',
					color: '#f6f1e8'
				});

				cells.push({ id, rowIndex, colIndex, cell });
			});

			body.append(row);
		});
	}

	function resetSheet() {
		sheet.destroy();
		sheet = new Sheet();
	}

	function render() {
		renderCount += 1;
		let min = Infinity;
		let max = -Infinity;
		for (const row of values) {
			for (const val of row) {
				min = Math.min(min, val);
				max = Math.max(max, val);
			}
		}

		let sample = null;
		for (const cellMeta of cells) {
			const value = values[cellMeta.rowIndex][cellMeta.colIndex];
			const { bg, text } = valueToColor(value, min, max);
			sheet.updateSet(`.${cellMeta.id}`, {
				backgroundColor: bg,
				color: text
			});
			cellMeta.cell.textContent = String(value);
			if (!sample) {
				sample = {
					cell: cellMeta.id,
					value,
					color: bg,
					textColor: text
				};
			}
		}

		if (sample) updateCode(code, `.${sample.cell}`, sample);
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

	function perturbValues() {
		values = values.map((row, rowIndex) =>
			row.map((value, colIndex) => {
				const delta = Math.sin((rowIndex + 1) * 0.4 + performance.now() * 0.002) * 2;
				const jitter = (Math.random() - 0.5) * 1.2;
				return Math.round(value + delta + jitter);
			})
		);
	}

	function startLive() {
		if (liveTimer) return;
		fpsWindowStart = performance.now();
		renderCount = 0;
		fpsRafId = window.requestAnimationFrame(tickFPS);
		liveTimer = window.setInterval(() => {
			perturbValues();
			render();
		}, liveInterval);
		liveButton.textContent = 'Stop live data';
		liveButton.setAttribute('aria-pressed', 'true');
	}

	function stopLive() {
		if (!liveTimer) return;
		window.clearInterval(liveTimer);
		liveTimer = null;
		window.cancelAnimationFrame(fpsRafId);
		fpsOutput.textContent = '0.0 FPS';
		liveButton.textContent = 'Start live data';
		liveButton.setAttribute('aria-pressed', 'false');
	}

	function toggleLive() {
		if (liveTimer) {
			stopLive();
		} else {
			startLive();
		}
	}

	buildTable();
	render();

	liveButton.addEventListener('click', toggleLive);
	reseedButton.addEventListener('click', () => {
		if (liveTimer) stopLive();
		resetSheet();
		buildTable();
		render();
	});

	intervalSelect.addEventListener('change', () => {
		liveInterval = Number(intervalSelect.value) || 50;
		if (liveTimer) {
			stopLive();
			startLive();
		}
	});
}

const demo = document.querySelector('[data-dyss-heatmap]');
if (demo) mountHeatmap(demo);
