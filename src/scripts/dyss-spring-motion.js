import Sheet from 'dyss'
import { registerDemo } from './dyss-demo-lifecycle.js'
import { clamp, stepSpring, dampingRatio } from './dyss-spring-model.js'
const presets = {
	soft: { stiffness: 55, damping: 5, mass: 1 },
	balanced: { stiffness: 100, damping: 12, mass: 1 },
	heavy: { stiffness: 120, damping: 24, mass: 2.5 },
}
function mountSpring(root) {
	const find = selector => root.querySelector(selector)
	const stage = find('[data-spring-stage]'),
		mass = find('[data-spring-mass]'),
		coil = find('[data-spring-coil]'),
		svg = find('[data-spring-svg]')
	const release = find('[data-spring-release]'),
		pause = find('[data-spring-pause]'),
		reset = find('[data-spring-reset]'),
		status = find('[data-spring-status]'),
		code = find('[data-dyss-code]')
	const positionTrace = find('[data-spring-position-trace]'),
		restTrace = find('[data-spring-rest-trace]')
	const sheet = new Sheet(),
		scope = `spring-${Math.random().toString(36).slice(2, 9)}`
	root.classList.add(scope)
	const state = { x: -0.65, velocity: 0, target: 0, minimum: -1.1, maximum: 1.1 }
	let parameters = { ...presets.balanced }
	let running = false,
		dragging = false,
		frame = 0,
		lastFrame = 0,
		accumulator = 0,
		time = 0,
		settleTime = 0,
		lastSample = -1,
		width = 600,
		height = 250,
		history = []
	let lastPointer = 0,
		lastPointerTime = 0
	const percent = x => ((x + 1.2) / 2.4) * 100
	function render() {
		sheet.updateSet(`.${scope} .spring-mass`, { left: `${percent(state.x)}%` })
		sheet.updateSet(`.${scope} .spring-target`, { left: `${percent(state.target)}%` })
		const end = (percent(state.x) / 100) * width - 31,
			y = height / 2,
			points = [
				[30, y],
				[38, y],
			]
		const length = Math.max(0, end - 48)
		for (let i = 0; i < 24; i++) points.push([38 + ((i + 1) / 25) * length, y + (i % 2 ? -8 : 8)])
		points.push([end - 7, y], [end, y])
		coil.setAttribute(
			'd',
			points.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(2)},${y.toFixed(2)}`).join(' '),
		)
		find('[data-spring-displacement]').textContent =
			`${((state.x - state.target) * 100).toFixed(1)} cm`
		find('[data-spring-velocity]').textContent = `${state.velocity.toFixed(2)} m/s`
		code.textContent = [
			`// F = −kx − cv; fixed simulation step = 1 / 240 second.`,
			`const position = ${state.x.toFixed(4)};`,
			`const velocity = ${state.velocity.toFixed(4)};`,
			`sheet.updateSet('.${scope} .spring-mass', {`,
			`  left: '${percent(state.x).toFixed(3)}%'`,
			`});`,
		].join('\n')
	}
	function sample() {
		history.push({ time, x: state.x, target: state.target })
		history = history.filter(p => time - p.time <= 6)
		for (const [path, key] of [
			[positionTrace, 'x'],
			[restTrace, 'target'],
		])
			path.setAttribute(
				'd',
				history
					.map(
						(p, i) =>
							`${i ? 'L' : 'M'}${(600 - ((time - p.time) / 6) * 600).toFixed(1)},${(50 - (p[key] / 1.2) * 40).toFixed(1)}`,
					)
					.join(' '),
			)
	}
	function updateControls(preset) {
		for (const input of root.querySelectorAll('[data-spring-param]')) {
			const key = input.dataset.springParam
			input.value = parameters[key]
			find(`[data-spring-output="${key}"]`).textContent =
				`${parameters[key]} ${key === 'mass' ? 'kg' : key === 'stiffness' ? 'N/m' : 'N·s/m'}`
		}
		mass.querySelector('span').textContent = parameters.mass.toFixed(1)
		const ratio = dampingRatio(parameters)
		find('[data-spring-ratio]').textContent = ratio.toFixed(2)
		find('[data-spring-behavior]').textContent =
			ratio < 0.95
				? 'Underdamped / overshoots, then settles.'
				: ratio > 1.05
					? 'Overdamped / a slower return without oscillation.'
					: 'Near critical damping / returns with little overshoot.'
		for (const button of root.querySelectorAll('[data-spring-preset]'))
			button.setAttribute('aria-pressed', String(button.dataset.springPreset === preset))
	}
	function stop(label) {
		running = false
		cancelAnimationFrame(frame)
		pause.disabled = true
		pause.textContent = 'Pause motion'
		status.textContent = label
	}
	function tick(now) {
		if (!running || document.hidden) return
		const dt = Math.min((now - lastFrame) / 1000, 0.05)
		lastFrame = now
		if (!dragging) {
			accumulator += dt
			while (accumulator >= 1 / 240) {
				stepSpring(state, parameters, 1 / 240)
				accumulator -= 1 / 240
			}
		}
		time += dt
		settleTime =
			!dragging && Math.abs(state.x - state.target) < 0.0004 && Math.abs(state.velocity) < 0.002
				? settleTime + dt
				: 0
		if (time - lastSample >= 1 / 30) {
			sample()
			lastSample = time
		}
		render()
		if (settleTime > 0.3) {
			state.x = state.target
			state.velocity = 0
			render()
			stop('Settled at rest')
			return
		}
		frame = requestAnimationFrame(tick)
	}
	function start() {
		running = true
		settleTime = 0
		pause.disabled = false
		pause.textContent = 'Pause motion'
		status.textContent = dragging ? 'Dragging / release to let go' : 'Live / settling'
		cancelAnimationFrame(frame)
		lastFrame = performance.now()
		if (!document.hidden) frame = requestAnimationFrame(tick)
	}
	function moveTarget(value) {
		state.target = clamp(
			value,
			Math.max(-0.75, state.minimum + 0.1),
			Math.min(0.75, state.maximum - 0.1),
		)
		start()
		render()
	}
	function releaseTest() {
		state.x = clamp(
			state.target + (state.target - 0.65 >= state.minimum ? -0.65 : 0.65),
			state.minimum,
			state.maximum,
		)
		state.velocity = 0
		time = 0
		history = []
		lastSample = -1
		accumulator = 0
		start()
		sample()
		render()
	}
	release.addEventListener('click', releaseTest)
	pause.addEventListener('click', () => {
		if (running) {
			running = false
			cancelAnimationFrame(frame)
			pause.textContent = 'Resume motion'
			status.textContent = 'Paused / motion held'
		} else start()
	})
	reset.addEventListener('click', () => {
		dragging = false
		stop('Ready to release')
		Object.assign(state, { x: Math.max(-0.65, state.minimum), target: 0, velocity: 0 })
		time = 0
		history = []
		lastSample = -1
		accumulator = 0
		sample()
		render()
	})
	mass.addEventListener('pointerdown', event => {
		if (event.button !== 0) return
		event.preventDefault()
		dragging = true
		mass.setPointerCapture(event.pointerId)
		lastPointer = state.x
		lastPointerTime = event.timeStamp
		state.velocity = 0
		start()
	})
	mass.addEventListener('pointermove', event => {
		if (!dragging) return
		const rect = stage.getBoundingClientRect(),
			x = clamp(
				((event.clientX - rect.left) / rect.width) * 2.4 - 1.2,
				state.minimum,
				state.maximum,
			)
		const dt = (event.timeStamp - lastPointerTime) / 1000
		if (dt > 0) state.velocity = clamp((x - lastPointer) / dt, -3, 3)
		state.x = x
		lastPointer = x
		lastPointerTime = event.timeStamp
		render()
	})
	function endDrag(event) {
		if (!dragging) return
		dragging = false
		if (event.timeStamp - lastPointerTime > 100) state.velocity = 0
		start()
	}
	mass.addEventListener('pointerup', endDrag)
	mass.addEventListener('pointercancel', endDrag)
	mass.addEventListener('keydown', event => {
		if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
			event.preventDefault()
			moveTarget(state.target + (event.key === 'ArrowLeft' ? -0.12 : 0.12))
		}
		if (event.key === ' ' || event.key === 'Enter') {
			event.preventDefault()
			releaseTest()
		}
	})
	stage.addEventListener('pointerdown', event => {
		if (event.target.closest('[data-spring-mass]')) return
		const rect = stage.getBoundingClientRect()
		moveTarget(((event.clientX - rect.left) / rect.width) * 2.4 - 1.2)
	})
	root.querySelector('form').addEventListener('submit', event => event.preventDefault())
	root.addEventListener('input', event => {
		const key = event.target.dataset.springParam
		if (!key) return
		parameters[key] = Number(event.target.value)
		updateControls()
		render()
	})
	root.addEventListener('click', event => {
		const name = event.target.dataset.springPreset
		if (!name) return
		parameters = { ...presets[name] }
		updateControls(name)
		releaseTest()
	})
	function visibility() {
		cancelAnimationFrame(frame)
		if (!document.hidden && running) {
			lastFrame = performance.now()
			frame = requestAnimationFrame(tick)
		}
	}
	document.addEventListener('visibilitychange', visibility)
	const observer = new ResizeObserver(() => {
		width = stage.clientWidth
		height = stage.clientHeight
		// Keep the mass clear of the anchor and stage edges at every viewport size.
		state.minimum = ((30 + mass.offsetWidth / 2 + 10) / width) * 2.4 - 1.2
		state.maximum = 1.2 - ((mass.offsetWidth / 2 + 10) / width) * 2.4
		state.x = clamp(state.x, state.minimum, state.maximum)
		state.target = clamp(state.target, state.minimum + 0.1, state.maximum - 0.1)
		svg.setAttribute('viewBox', `0 0 ${width} ${height}`)
		render()
	})
	observer.observe(stage)
	updateControls('balanced')
	render()
	sample()
	return () => {
		running = false
		cancelAnimationFrame(frame)
		observer.disconnect()
		document.removeEventListener('visibilitychange', visibility)
		sheet.destroy()
	}
}
registerDemo('[data-dyss-spring]', mountSpring)
