import Sheet from 'dyss';
import { registerDemo } from './dyss-demo-lifecycle.js';
import { rpmLabels, loadLabels, targetMap, lookup, createSimulation, stepSimulation, afrColor } from './dyss-fuel-map-model.js';

function mountFuelMap(root) {
	const find = (selector) => root.querySelector(selector);
	const head = find('[data-dyss-head]');
	const body = find('[data-dyss-body]');
	const liveButton = find('[data-dyss-live]');
	const intervalSelect = find('[data-dyss-interval]');
	const resetButton = find('[data-dyss-reseed]');
	const fps = find('[data-dyss-fps]');
	const code = find('[data-dyss-code]');
	const stage = find('[data-fm-stage]');
	const overlay = find('[data-fm-overlay]');
	const marker = find('[data-fm-marker]');
	const trailPath = find('[data-fm-trail]');
	const targetTrace = find('[data-fm-target-trace]');
	const measuredTrace = find('[data-fm-measured-trace]');
	const status = find('[data-dyss-status]');
	const explanation = find('[data-fm-explanation]');
	const readouts = ['rpm', 'load', 'target', 'measured'].map((key) => find(`[data-fm-${key}]`));
	if (!head || !body || !code || !stage) return;

	const sheet = new Sheet();
	const cells = [];
	let state = createSimulation();
	let running = false;
	let started = false;
	let raf = 0;
	let lastFrame = 0;
	let accumulator = 0;
	let lastSample = -Infinity;
	let lastCSS = -Infinity;
	let updates = 0;
	let rateStart = 0;
	let history = [];
	let geometry;

	const headRow = document.createElement('tr');
	for (const label of ['% / RPM', ...rpmLabels]) {
		const th = document.createElement('th');
		th.scope = 'col';
		th.textContent = label;
		headRow.append(th);
	}
	head.replaceChildren(headRow);
	body.replaceChildren();
	loadLabels.forEach((load, row) => {
		const tr = document.createElement('tr');
		const th = document.createElement('th');
		th.scope = 'row';
		th.textContent = `${load}%`;
		tr.append(th);
		rpmLabels.forEach((rpm, col) => {
			const cell = document.createElement('td');
			const id = `fm-${row}-${col}`;
			const value = targetMap[row][col];
			cell.className = id;
			cell.textContent = value.toFixed(1);
			cell.title = `${rpm} RPM · ${load}% load · ${value.toFixed(2)} target AFR`;
			tr.append(cell);
			sheet.add(`.${id}`, { backgroundColor: afrColor(value), color: '#203548', boxShadow: 'inset 0 0 0 0 transparent' });
			cells.push({ id, cell, row, col, weight: 0 });
		});
		body.append(tr);
	});

	function point(x, y) {
		return [geometry.x + x * geometry.dx, geometry.y + y * geometry.dy];
	}

	function measure() {
		const rect = stage.getBoundingClientRect();
		const first = cells[0].cell.getBoundingClientRect();
		const last = cells.at(-1).cell.getBoundingClientRect();
		geometry = { x: first.x - rect.x + first.width / 2, y: first.y - rect.y + first.height / 2,
			dx: (last.x - first.x) / (rpmLabels.length - 1), dy: (last.y - first.y) / (loadLabels.length - 1) };
		overlay.setAttribute('viewBox', `0 0 ${rect.width} ${rect.height}`);
		renderPosition();
	}

	function renderPosition() {
		if (!geometry) return;
		const { x, y } = lookup(state.rpm, state.load);
		marker.setAttribute('transform', `translate(${point(x, y).join(' ')})`);
		const recent = history.filter((sample) => state.time - sample.time < 2.5);
		trailPath.setAttribute('d', recent.map((sample, i) => `${i ? 'L' : 'M'}${point(sample.x, sample.y).join(',')}`).join(' '));
	}

	function renderCSS() {
		const sample = lookup(state.rpm, state.load);
		const weights = new Map(sample.weights.map(({ row, col, weight }) => [`fm-${row}-${col}`, weight]));
		for (const meta of cells) {
			const weight = weights.get(meta.id) || 0;
			if (weight === meta.weight) continue;
			meta.weight = weight;
			sheet.updateSet(`.${meta.id}`, { boxShadow: `inset 0 0 0 2px rgba(32, 53, 72, ${(weight > 0 ? 0.15 + weight * 0.85 : 0).toFixed(3)})` });
		}
		const strongest = sample.weights.reduce((a, b) => a.weight > b.weight ? a : b);
		const id = `fm-${strongest.row}-${strongest.col}`;
		const weight = strongest.weight;
		code.textContent = [
			`// Four neighboring cells blend into the target AFR.`,
			`const operatingPoint = { rpm: ${Math.round(state.rpm)}, load: ${state.load.toFixed(1)} };`,
			`const targetAFR = ${state.target.toFixed(2)};`,
			`const measuredAFR = ${state.measured.toFixed(2)};`, '',
			`// Strongest cell: ${(weight * 100).toFixed(1)}% interpolation weight`,
			`sheet.updateSet('.${id}', {`,
			`  boxShadow: 'inset 0 0 0 2px rgba(32, 53, 72, ${(0.15 + weight * 0.85).toFixed(3)})'`,
			`});`
		].join('\n');
		updates++;
	}

	function trace(key) {
		let penDown = false;
		return history.map((sample) => {
			if (sample[key] === null) { penDown = false; return ''; }
			const x = 632 - (state.time - sample.time) / 8 * 600;
			const y = 94 - (sample[key] - 12) / 8 * 84;
			const command = penDown ? 'L' : 'M';
			penDown = true;
			return `${command}${x.toFixed(1)},${y.toFixed(1)}`;
		}).join(' ');
	}

	function renderSample() {
		const sample = lookup(state.rpm, state.load);
		history.push({ time: state.time, x: sample.x, y: sample.y,
			target: state.fuelCut ? null : state.target, measured: state.measured });
		history = history.filter((entry) => state.time - entry.time <= 8);
		readouts[0].textContent = String(Math.round(state.rpm / 10) * 10);
		readouts[1].textContent = state.load.toFixed(0);
		readouts[2].textContent = state.fuelCut ? '—' : state.target.toFixed(2);
		readouts[3].textContent = state.measured >= 19.8 ? '20+' : state.measured.toFixed(2);
		const prefix = running ? 'Live' : started ? 'Paused' : 'Ready';
		status.textContent = `${prefix} / ${state.phase.toLowerCase()}`;
		const message = state.fuelCut
			? 'Overrun: injectors are cut. The target trace pauses while the sensor moves beyond its lean display limit.'
			: state.enrichment > 0.2
				? 'Tip-in: a brief fuel enrichment follows the throttle opening. The sensor responds after the exhaust delay.'
				: 'The four outlined cells blend into the target. The measured signal follows with exhaust delay and sensor damping.';
		if (explanation.textContent !== message) explanation.textContent = message;
		targetTrace.setAttribute('d', trace('target'));
		measuredTrace.setAttribute('d', trace('measured'));
	}

	function frame(now) {
		if (!running || document.hidden) return;
		accumulator += Math.min((now - lastFrame) / 1000, 0.1);
		lastFrame = now;
		// A fixed physics step keeps the drive identical at every CSS update interval.
		while (accumulator >= 1 / 120) {
			stepSimulation(state, 1 / 120);
			accumulator -= 1 / 120;
		}
		if (now - lastSample >= 50) { renderSample(); lastSample = now; }
		if (now - lastCSS >= Number(intervalSelect.value)) { renderCSS(); lastCSS = now; }
		renderPosition();
		if (now - rateStart >= 1000) {
			fps.textContent = `${Math.round(updates * 1000 / (now - rateStart))} updates/s`;
			updates = 0;
			rateStart = now;
		}
		raf = requestAnimationFrame(frame);
	}

	function toggleLive() {
		running = !running;
		started = true;
		root.toggleAttribute('data-running', running);
		liveButton.textContent = running ? 'Pause drive cycle' : 'Resume drive cycle';
		liveButton.setAttribute('aria-pressed', String(running));
		cancelAnimationFrame(raf);
		if (running) {
			lastFrame = rateStart = performance.now();
			updates = 0;
			raf = requestAnimationFrame(frame);
		} else fps.textContent = '0 updates/s';
		// Refresh labels without adding duplicate timestamps to the traces.
		status.textContent = `${running ? 'Live' : 'Paused'} / ${state.phase.toLowerCase()}`;
	}

	function reset() {
		if (running) toggleLive();
		state = createSimulation();
		started = false;
		accumulator = 0;
		history = [];
		lastSample = lastCSS = -Infinity;
		liveButton.textContent = 'Start drive cycle';
		renderSample();
		renderCSS();
		renderPosition();
	}

	function visibilityChange() {
		cancelAnimationFrame(raf);
		if (!document.hidden && running) {
			lastFrame = rateStart = performance.now();
			updates = 0;
			raf = requestAnimationFrame(frame);
		}
	}

	liveButton.addEventListener('click', toggleLive);
	resetButton.addEventListener('click', reset);
	document.addEventListener('visibilitychange', visibilityChange);
	const observer = new ResizeObserver(measure);
	observer.observe(stage);
	reset();
	measure();
	return () => {
		running = false;
		cancelAnimationFrame(raf);
		observer.disconnect();
		document.removeEventListener('visibilitychange', visibilityChange);
		liveButton.removeEventListener('click', toggleLive);
		resetButton.removeEventListener('click', reset);
		sheet.destroy();
	};
}

registerDemo('[data-dyss-fuel-map]', mountFuelMap);
