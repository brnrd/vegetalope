import Sheet from 'dyss';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function framePolygon(voltage, tick) {
	const points = [];
	const stepsX = 14;
	const stepsY = 8;
	const jitter = (index, salt) => {
		const wave = Math.sin(tick * 1.7 + index * 12.9898 + salt * 78.233);
		const snap = Math.sin(tick * 5.1 + index * 4.17 + salt) * 0.35;
		return (wave + snap) * voltage * 0.17;
	};

	for (let index = 0; index <= stepsX; index += 1) {
		points.push([index / stepsX * 100, jitter(index, 1)]);
	}
	for (let index = 1; index <= stepsY; index += 1) {
		points.push([100 + jitter(index, 2), index / stepsY * 100]);
	}
	for (let index = stepsX - 1; index >= 0; index -= 1) {
		points.push([index / stepsX * 100, 100 + jitter(index, 3)]);
	}
	for (let index = stepsY - 1; index > 0; index -= 1) {
		points.push([jitter(index, 4), index / stepsY * 100]);
	}

	return `polygon(${points.map(([x, y]) => `${x.toFixed(2)}% ${y.toFixed(2)}%`).join(', ')})`;
}

function connectorShape(direction) {
	const edge = direction > 0 ? 0 : 100;
	return `shape(from 0 50%, curve to 25% 50% with 12.5% ${edge}%, smooth to 50% 50%, smooth to 75% 50%, smooth to 100% 50%)`;
}

function mountBorderShapeDemo(root) {
	const electricCard = root.querySelector('[data-electric-card]');
	const electricPlay = root.querySelector('[data-electric-play]');
	const voltageInput = root.querySelector('[data-voltage]');
	const chargeInput = root.querySelector('[data-charge]');
	const board = root.querySelector('[data-network-board]');
	const nodeLayer = root.querySelector('[data-node-layer]');
	const connectorLayer = root.querySelector('[data-connector-layer]');
	const addButton = root.querySelector('[data-add-node]');
	const removeButton = root.querySelector('[data-remove-node]');
	const topologySelect = root.querySelector('[data-topology]');
	const bendInput = root.querySelector('[data-bend]');
	const electricCode = root.querySelector('[data-electric-code]');
	const networkCode = root.querySelector('[data-network-code]');
	if (!electricCard || !electricPlay || !voltageInput || !chargeInput || !board || !nodeLayer || !connectorLayer || !addButton || !removeButton || !topologySelect || !bendInput || !electricCode || !networkCode) return;

	const sheet = new Sheet();
	const instance = Math.random().toString(36).slice(2, 9);
	root.classList.add(`lab-${instance}`);
	const cardSelector = `.lab-${instance} [data-electric-card]`;
	sheet.add(cardSelector, {});
	const cardRule = sheet.get(cardSelector);

	const supported = CSS.supports('border-shape', 'shape(from 0 0, line to 100% 100%)');
	const supportNote = document.querySelector('[data-support-note]');
	const supportCopy = document.querySelector('[data-support-copy]');
	if (supportNote) supportNote.setAttribute('data-supported', String(supported));
	if (supportCopy) supportCopy.textContent = supported
		? 'border-shape is active in this browser'
		: 'Fallback preview: border-shape is not enabled here';

	let electricRunning = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	let voltage = Number(voltageInput.value);
	let charge = Number(chargeInput.value);
	let lastFrame = 0;
	let frameCount = 0;

	function writeElectricCode(path) {
		electricCode.textContent = [
			`sheet.updateSet('${cardSelector}', {`,
			`  'border-width': '${charge}px',`,
			`  'border-shape': '${path}',`,
			`  'filter': 'drop-shadow(0 0 ${Math.round(voltage * 1.5)}px var(--electric))'`,
			`});`
		].join('\n');
	}

	function renderElectric(time) {
		if (electricRunning && time - lastFrame > 70) {
			lastFrame = time;
			const path = framePolygon(voltage, frameCount++);
			cardRule?.style.setProperty('border-shape', path);
			cardRule?.style.setProperty('clip-path', supported ? 'none' : path);
			cardRule?.style.setProperty('border-width', `${charge}px`);
			cardRule?.style.setProperty('filter', `drop-shadow(0 0 ${voltage * 1.5}px var(--electric))`);
			writeElectricCode(path);
		}
		requestAnimationFrame(renderElectric);
	}

	electricPlay.addEventListener('click', () => {
		electricRunning = !electricRunning;
		electricPlay.setAttribute('aria-pressed', String(electricRunning));
		electricPlay.textContent = electricRunning ? 'Pause current' : 'Start current';
	});

	voltageInput.addEventListener('input', () => {
		voltage = Number(voltageInput.value);
		const output = root.querySelector('[data-voltage-output]');
		if (output) output.textContent = `${voltage}kV`;
	});

	chargeInput.addEventListener('input', () => {
		charge = Number(chargeInput.value);
		const output = root.querySelector('[data-charge-output]');
		if (output) output.textContent = `${charge}px`;
	});

	const nodes = [];
	const nodeColors = ['#ff6542', '#ffcf4a', '#65d6c4', '#8e7dff', '#ff7eb6', '#77b8ff', '#c7e45a', '#ff9f43'];
	let topology = topologySelect.value;
	let bend = Number(bendInput.value);
	let activeDrag = null;

	function nodeSelector(id) {
		return `.lab-${instance} .network-node-${id}`;
	}

	function connectorSelector(id) {
		return `.lab-${instance} .network-connector-${id}`;
	}

	function syncButtons() {
		addButton.disabled = nodes.length >= 8;
		removeButton.disabled = nodes.length <= 2;
	}

	function addNode(x, y) {
		if (nodes.length >= 8) return;
		const id = nodes.length ? Math.max(...nodes.map((node) => node.id)) + 1 : 1;
		const element = document.createElement('button');
		element.type = 'button';
		element.className = `network-node network-node-${id}`;
		element.textContent = String(id).padStart(2, '0');
		element.setAttribute('aria-label', `Drag circle ${id}`);
		nodeLayer.append(element);
		const selector = nodeSelector(id);
		sheet.add(selector, {
			left: `${x}%`,
			top: `${y}%`,
			'--node-color': nodeColors[(id - 1) % nodeColors.length]
		});
		nodes.push({ id, x, y, element, rule: sheet.get(selector) });
		element.addEventListener('pointerdown', (event) => {
			activeDrag = nodes.find((node) => node.id === id) ?? null;
			element.setPointerCapture(event.pointerId);
		});
		element.addEventListener('pointerup', () => { activeDrag = null; });
		element.addEventListener('pointercancel', () => { activeDrag = null; });
		syncButtons();
		rebuildConnectors();
	}

	function getPairs() {
		const pairs = [];
		for (let index = 0; index < nodes.length - 1; index += 1) pairs.push([nodes[index], nodes[index + 1]]);
		if (topology === 'ring' && nodes.length > 2) pairs.push([nodes[nodes.length - 1], nodes[0]]);
		if (topology === 'mesh') {
			pairs.length = 0;
			for (let from = 0; from < nodes.length; from += 1) {
				for (let to = from + 1; to < nodes.length; to += 1) pairs.push([nodes[from], nodes[to]]);
			}
		}
		return pairs;
	}

	function updateConnector(rule, from, to, index) {
		const rect = board.getBoundingClientRect();
		const fromX = from.x / 100 * rect.width;
		const fromY = from.y / 100 * rect.height;
		const toX = to.x / 100 * rect.width;
		const toY = to.y / 100 * rect.height;
		const dx = toX - fromX;
		const dy = toY - fromY;
		const distance = Math.hypot(dx, dy);
		const angle = Math.atan2(dy, dx) * 180 / Math.PI;
		const idealLength = clamp(rect.width * 0.58, 300, 540);
		const slack = clamp(1 - distance / idealLength, 0, 1);
		const squish = Math.abs(bend) / 42;
		const waveHeight = 28 + slack * (80 + squish * 150);
		const direction = (bend < 0 ? -1 : 1) * (index % 2 === 0 ? 1 : -1);
		const shape = connectorShape(direction);
		rule?.style.setProperty('left', `${from.x}%`);
		rule?.style.setProperty('top', `calc(${from.y}% - ${(waveHeight / 2).toFixed(2)}px)`);
		rule?.style.setProperty('width', `${distance}px`);
		rule?.style.setProperty('height', `${waveHeight.toFixed(2)}px`);
		rule?.style.setProperty('transform', `rotate(${angle}deg)`);
		rule?.style.setProperty('border-shape', shape);
		rule?.style.setProperty('--connector-color', nodeColors[index % nodeColors.length]);
		return { shape, distance, angle, waveHeight, slack };
	}

	function rebuildConnectors() {
		connectorLayer.replaceChildren();
		const pairs = getPairs();
		let latest = null;
		pairs.forEach(([from, to], index) => {
			const id = `${from.id}-${to.id}-${index}`;
			const element = document.createElement('span');
			element.className = `network-connector network-connector-${id}`;
			connectorLayer.append(element);
			const selector = connectorSelector(id);
			sheet.add(selector, {});
			const rule = sheet.get(selector);
			latest = { selector, ...updateConnector(rule, from, to, index) };
		});
		if (latest) {
				networkCode.textContent = [
				`sheet.updateSet('${latest.selector}', {`,
				`  width: '${latest.distance.toFixed(1)}px',`,
				`  height: '${latest.waveHeight.toFixed(1)}px', // ${Math.round(latest.slack * 100)}% slack`,
				`  transform: 'rotate(${latest.angle.toFixed(1)}deg)',`,
				`  'border-shape': '${latest.shape}'`,
				`});`,
				'',
				`// ${nodes.length} nodes · ${pairs.length} ${topology} connectors`
			].join('\n');
		}
	}

	board.addEventListener('pointermove', (event) => {
		if (!activeDrag) return;
		const rect = board.getBoundingClientRect();
		activeDrag.x = clamp((event.clientX - rect.left) / rect.width * 100, 7, 93);
		activeDrag.y = clamp((event.clientY - rect.top) / rect.height * 100, 10, 90);
		activeDrag.rule?.style.setProperty('left', `${activeDrag.x}%`);
		activeDrag.rule?.style.setProperty('top', `${activeDrag.y}%`);
		rebuildConnectors();
	});

	addButton.addEventListener('click', () => {
		const index = nodes.length;
		const angle = index * 2.39996;
		addNode(50 + Math.cos(angle) * 30, 50 + Math.sin(angle) * 30);
	});

	removeButton.addEventListener('click', () => {
		if (nodes.length <= 2) return;
		const removed = nodes.pop();
		removed?.element.remove();
		syncButtons();
		rebuildConnectors();
	});

	topologySelect.addEventListener('change', () => {
		topology = topologySelect.value;
		rebuildConnectors();
	});

	bendInput.addEventListener('input', () => {
		bend = Number(bendInput.value);
		const output = root.querySelector('[data-bend-output]');
		if (output) output.textContent = `${bend}%`;
		rebuildConnectors();
	});

	window.addEventListener('resize', rebuildConnectors);
	addNode(22, 28);
	addNode(76, 25);
	addNode(66, 73);
	addNode(28, 70);
	syncButtons();
	requestAnimationFrame(renderElectric);
}

const demo = document.querySelector('[data-border-shape-demo]');
if (demo) mountBorderShapeDemo(demo);
