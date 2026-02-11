import Sheet from 'dyss';

const rpmLabels = [500, 1000, 1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000, 5500, 6000, 6500, 7000, 7500];
const loadLabels = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

const afrLevels = [10.2, 10.3, 10.5, 10.7, 10.9, 11.3, 11.6, 11.8, 12.1, 12.5, 12.9, 13.4, 13.9, 14.7, 15.8, 16.8, 18.1];

const colorBands = [
	{ max: 10.6, bg: '#203a8f', text: '#f6f1e8' },
	{ max: 11.0, bg: '#2f56bf', text: '#f6f1e8' },
	{ max: 11.5, bg: '#11a3a2', text: '#f6f1e8' },
	{ max: 12.2, bg: '#16c173', text: '#0d1220' },
	{ max: 13.0, bg: '#66d23d', text: '#0d1220' },
	{ max: 13.8, bg: '#b8d43b', text: '#0d1220' },
	{ max: 14.9, bg: '#f0c938', text: '#0d1220' },
	{ max: 16.0, bg: '#f09a30', text: '#0d1220' },
	{ max: 16.9, bg: '#ea7032', text: '#f6f1e8' },
	{ max: Infinity, bg: '#e64b3a', text: '#f6f1e8' }
];

function clamp(value, min, max) {
	return Math.min(max, Math.max(min, value));
}

function nearestAFR(value) {
	let closest = afrLevels[0];
	let bestDistance = Math.abs(value - closest);
	for (const level of afrLevels) {
		const distance = Math.abs(value - level);
		if (distance < bestDistance) {
			bestDistance = distance;
			closest = level;
		}
	}
	return closest;
}

function valueToBand(value) {
	for (const band of colorBands) {
		if (value <= band.max) return band;
	}
	return colorBands[colorBands.length - 1];
}

function cloneGrid(grid) {
	return grid.map((row) => row.slice());
}

function makeBaseValue(rowIndex, colIndex) {
	const rowNorm = rowIndex / (loadLabels.length - 1); // top is low load
	const colNorm = colIndex / (rpmLabels.length - 1);
	const cruiseLean = 14.7 + (1 - rowNorm) * 2.4;
	const loadRichening = rowNorm * 2.6;
	const midRpmEnrichment = Math.exp(-Math.pow((colNorm - 0.62) / 0.19, 2)) * rowNorm * 2.3;
	const highRpmEnrichment = Math.exp(-Math.pow((colNorm - 0.92) / 0.14, 2)) * rowNorm * 1.0;
	const raw = cruiseLean - loadRichening - midRpmEnrichment - highRpmEnrichment;
	return nearestAFR(clamp(raw, afrLevels[0], afrLevels[afrLevels.length - 1]));
}

function updateCode(code, selector, snapshot, state) {
	code.textContent = [
		`const operatingPoint = { rpm: ${Math.round(state.rpm)}, load: ${Math.round(state.load)} };`,
		'',
		`const snapshot = ${JSON.stringify(snapshot, null, 2)};`,
		'',
		`sheet.updateSet('${selector}', {`,
		`  backgroundColor: '${snapshot.color}',`,
		`  color: '${snapshot.textColor}'`,
		`});`
	].join('\n');
}

function mountFuelMap(root) {
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
	let baseValues = [];
	let values = [];
	let liveTimer = null;
	let liveInterval = Number(intervalSelect.value) || 50;
	let renderCount = 0;
	let fpsWindowStart = performance.now();
	let fpsRafId = 0;
	let liveStartTime = 0;
	let lastTick = 0;
	const state = {
		rpmPos: 0.42,
		loadPos: 0.28,
		rpm: rpmLabels[Math.round((rpmLabels.length - 1) * 0.42)],
		load: loadLabels[Math.round((loadLabels.length - 1) * 0.28)]
	};

	function buildTable() {
		baseValues = loadLabels.map((_, rowIndex) =>
			rpmLabels.map((_, colIndex) => makeBaseValue(rowIndex, colIndex))
		);
		values = cloneGrid(baseValues);

		head.replaceChildren();
		body.replaceChildren();
		cells.length = 0;

		const headRow = document.createElement('tr');
		const corner = document.createElement('th');
		corner.textContent = 'LOAD \\ RPM';
		headRow.append(corner);
		rpmLabels.forEach((rpm) => {
			const th = document.createElement('th');
			th.textContent = `${rpm}`;
			headRow.append(th);
		});
		head.append(headRow);

		loadLabels.forEach((load, rowIndex) => {
			const row = document.createElement('tr');
			const rowHeader = document.createElement('th');
			rowHeader.textContent = rowIndex === 0 ? `LOW ${load}%` : rowIndex === loadLabels.length - 1 ? `HIGH ${load}%` : `${load}%`;
			row.append(rowHeader);

			rpmLabels.forEach((_, colIndex) => {
				const cell = document.createElement('td');
				const id = `fm-${rowIndex}-${colIndex}`;
				cell.className = `fm-cell ${id}`;
				cell.textContent = values[rowIndex][colIndex].toFixed(1);
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
		let sample = null;
		for (const cellMeta of cells) {
			const value = values[cellMeta.rowIndex][cellMeta.colIndex];
			const band = valueToBand(value);
			sheet.updateSet(`.${cellMeta.id}`, {
				backgroundColor: band.bg,
				color: band.text
			});
			cellMeta.cell.textContent = value.toFixed(1);
			if (!sample) {
				sample = {
					cell: cellMeta.id,
					value,
					color: band.bg,
					textColor: band.text
				};
			}
		}

		if (sample) updateCode(code, `.${sample.cell}`, sample, state);
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

	function perturbValues(now) {
		const elapsed = (now - liveStartTime) / 1000;
		const deltaTime = Math.max((now - lastTick) / 1000, 0.001);
		lastTick = now;

		const rpmTarget = clamp(0.5 + 0.42 * Math.sin(elapsed * 0.92) + 0.12 * Math.sin(elapsed * 2.35 + 0.4), 0, 1);
		const loadTarget = clamp(
			0.48 + 0.4 * Math.sin(elapsed * 0.74 + 1.2) + 0.14 * Math.cos(elapsed * 1.91 + 0.15),
			0,
			1
		);
		const stateBlend = clamp(deltaTime * 4.8, 0.12, 0.45);
		state.rpmPos += (rpmTarget - state.rpmPos) * stateBlend;
		state.loadPos += (loadTarget - state.loadPos) * stateBlend;
		const rpmIndex = Math.round(state.rpmPos * (rpmLabels.length - 1));
		const loadIndex = Math.round(state.loadPos * (loadLabels.length - 1));
		state.rpm = rpmLabels[rpmIndex];
		state.load = loadLabels[loadIndex];

		const throttle = clamp(0.55 + 0.45 * Math.sin(elapsed * 1.15 + 0.6), 0, 1);
		const globalBias = 0.24 * Math.sin(elapsed * 1.35) + 0.12 * Math.cos(elapsed * 2.7 + 0.3);

		values = values.map((row, rowIndex) =>
			row.map((current, colIndex) => {
				const base = baseValues[rowIndex][colIndex];
				const rowNorm = rowIndex / (loadLabels.length - 1);
				const colNorm = colIndex / (rpmLabels.length - 1);
				const dx = (colNorm - state.rpmPos) / 0.19;
				const dy = (rowNorm - state.loadPos) / 0.2;
				const influence = Math.exp(-(dx * dx + dy * dy));
				const enrichment = influence * (1.2 + throttle * 2.4) * (0.22 + rowNorm * 0.78);
				const pulse = influence * 0.55 * Math.sin(elapsed * 6.2 + colIndex * 0.27 - rowIndex * 0.18);
				const sweep = 0.36 * (0.28 + rowNorm * 0.72) * Math.sin(colNorm * 12.5 - elapsed * 3.9);
				const target = clamp(
					base - enrichment + pulse + sweep + globalBias,
					afrLevels[0],
					afrLevels[afrLevels.length - 1]
				);
				const smoothed = current + (target - current) * clamp(deltaTime * 8.2, 0.24, 0.85);
				return nearestAFR(smoothed);
			})
		);
	}

	function startLive() {
		if (liveTimer) return;
		fpsWindowStart = performance.now();
		renderCount = 0;
		liveStartTime = performance.now();
		lastTick = liveStartTime;
		fpsRafId = window.requestAnimationFrame(tickFPS);
		liveTimer = window.setInterval(() => {
			perturbValues(performance.now());
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

const demo = document.querySelector('[data-dyss-fuel-map]');
if (demo) mountFuelMap(demo);
