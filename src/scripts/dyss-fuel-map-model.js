// An illustrative, naturally aspirated gasoline engine; not a calibration map.
export const rpmLabels = Array.from({ length: 15 }, (_, i) => 500 + i * 500);
export const loadLabels = Array.from({ length: 10 }, (_, i) => 10 + i * 10);
export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const lerp = (a, b, t) => a + (b - a) * t;
const approach = (value, target, dt, tau) => lerp(value, target, 1 - Math.exp(-dt / tau));

export const targetMap = loadLabels.map((load) => rpmLabels.map((rpm) => {
	const enrichment = clamp((load - 58) / 32, 0, 1);
	const idle = Math.exp(-(((rpm - 850) / 650) ** 2));
	const torquePeak = Math.exp(-(((rpm - 4500) / 1700) ** 2));
	return Number((14.7 + (load < 30 ? 0.35 : 0) * (1 - idle)
		- 0.85 * idle - enrichment * (1.8 + 0.25 * torquePeak)).toFixed(2));
}));

// RPM and load follow the same drive cycle. Lift-off drops load before RPM.
const cycle = [
	[0, 850, 23, 0.04, 'Idle'], [3, 850, 23, 0.04, 'Idle'],
	[5, 2200, 38, 0.24, 'Cruise'], [10, 2600, 40, 0.26, 'Cruise'],
	[10.5, 2750, 92, 1, 'Tip-in'], [17, 6500, 96, 1, 'Full load'],
	[17.4, 4900, 35, 0.08, 'Gear change'], [18, 4800, 92, 1, 'Full load'],
	[21, 6200, 96, 1, 'Full load'], [21.4, 6100, 10, 0, 'Lift-off'],
	[27, 2000, 10, 0, 'Overrun'], [29, 1000, 22, 0.04, 'Return to idle'],
	[32, 850, 23, 0.04, 'Idle']
];

export function lookup(rpm, load) {
	const x = clamp((rpm - 500) / 500, 0, rpmLabels.length - 1);
	const y = clamp((load - 10) / 10, 0, loadLabels.length - 1);
	const col = Math.min(Math.floor(x), rpmLabels.length - 2);
	const row = Math.min(Math.floor(y), loadLabels.length - 2);
	const weights = [
		{ row, col, weight: (1 - (x - col)) * (1 - (y - row)) },
		{ row, col: col + 1, weight: (x - col) * (1 - (y - row)) },
		{ row: row + 1, col, weight: (1 - (x - col)) * (y - row) },
		{ row: row + 1, col: col + 1, weight: (x - col) * (y - row) }
	];
	return { x, y, weights, target: weights.reduce((sum, cell) => sum + targetMap[cell.row][cell.col] * cell.weight, 0) };
}

export function createSimulation() {
	const initial = lookup(850, 23).target;
	return { time: 0, rpm: 850, load: 23, throttle: 0.04, target: initial,
		measured: initial, enrichment: 0, fuelCut: false, phase: 'Idle', exhaust: [] };
}

export function stepSimulation(state, dt) {
	state.time += dt;
	const time = state.time % 32;
	const index = cycle.findIndex((point) => point[0] > time);
	const from = cycle[index - 1];
	const to = cycle[index];
	const blend = (time - from[0]) / (to[0] - from[0]);
	const throttle = lerp(from[3], to[3], blend);
	const throttleRate = (throttle - state.throttle) / dt;
	state.throttle = throttle;
	state.rpm = approach(state.rpm, lerp(from[1], to[1], blend), dt, 0.55);
	state.load = approach(state.load, lerp(from[2], to[2], blend), dt, 0.16);
	state.enrichment = Math.max(state.enrichment * Math.exp(-dt / 0.35), clamp(throttleRate * 0.45, 0, 0.65));
	// Hysteresis prevents fuel cut from chattering at the idle threshold.
	state.fuelCut = state.throttle < 0.015 && state.rpm > (state.fuelCut ? 1400 : 1800);
	state.phase = state.fuelCut ? 'Fuel cut' : state.enrichment > 0.2 ? 'Tip-in enrichment' : to[4];
	state.target = lookup(state.rpm, state.load).target;
	const combustion = state.fuelCut ? 20 : state.target - state.enrichment
		+ 0.055 * Math.sin(state.time * 8.3) + 0.025 * Math.sin(state.time * 19.7);
	state.exhaust.push({ time: state.time, value: combustion });
	// Transport delay followed by a damped wideband response.
	while (state.exhaust.length > 1 && state.exhaust[1].time <= state.time - 0.18) state.exhaust.shift();
	state.measured = approach(state.measured, state.exhaust[0].value, dt, 0.22);
	return state;
}

export function afrColor(value) {
	const stops = [[12, [72, 157, 175]], [13, [119, 185, 172]], [14.7, [230, 218, 158]], [15.5, [216, 151, 111]]];
	const bounded = clamp(value, 12, 15.5);
	const upper = stops.findIndex(([limit]) => bounded <= limit);
	if (upper === 0) return `rgb(${stops[0][1].join(', ')})`;
	const [low, a] = stops[upper - 1];
	const [high, b] = stops[upper];
	return `rgb(${a.map((channel, i) => Math.round(lerp(channel, b[i], (bounded - low) / (high - low)))).join(', ')})`;
}
