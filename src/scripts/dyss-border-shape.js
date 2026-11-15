import Sheet from 'dyss'
import { registerDemo } from './dyss-demo-lifecycle.js'
const clamp = (value, min, max) => Math.min(max, Math.max(min, value))
function framePoints(energy, time) {
	const points = [],
		nx = 18,
		ny = 12
	const displacement = (i, salt) =>
		(Math.sin(time * 7 + i * 1.2 + salt) + Math.sin(time * 13 - i * 0.8 + salt) * 0.3) *
		energy *
		0.08
	for (let i = 0; i <= nx; i++) points.push([(i / nx) * 100, displacement(i, 1)])
	for (let i = 1; i <= ny; i++) points.push([100 + displacement(i, 2), (i / ny) * 100])
	for (let i = nx - 1; i >= 0; i--) points.push([(i / nx) * 100, 100 + displacement(i, 3)])
	for (let i = ny - 1; i > 0; i--) points.push([displacement(i, 4), (i / ny) * 100])
	return points
}
function mountBorderShapeDemo(root) {
	const find = selector => root.querySelector(selector)
	const card = find('[data-electric-card]'),
		play = find('[data-electric-play]'),
		energyInput = find('[data-voltage]'),
		widthInput = find('[data-charge]')
	const board = find('[data-network-board]'),
		nodeLayer = find('[data-node-layer]'),
		connectorLayer = find('[data-connector-layer]'),
		fallback = find('[data-network-fallback]')
	const add = find('[data-add-node]'),
		remove = find('[data-remove-node]'),
		topologyInput = find('[data-topology]'),
		bendInput = find('[data-bend]')
	const electricCode = find('[data-electric-code]'),
		networkCode = find('[data-network-code]'),
		outline = find('[data-electric-fallback]')
	const sheet = new Sheet(),
		scope = `shape-${Math.random().toString(36).slice(2, 9)}`
	root.classList.add(scope)
	const nativeSupported =
		CSS.supports('border-shape', 'polygon(0% 0%,100% 0%,100% 100%,0% 100%)') &&
		CSS.supports('border-shape', 'shape(from 0 50%, curve to 100% 50% with 50% 100%)')
	let supported = nativeSupported
	const renderer = document.querySelector('[data-shape-renderer]')
	renderer.hidden = !nativeSupported
	function describeRenderer() {
		root.dataset.borderSupported = String(supported)
		document.querySelector('[data-support-note]').dataset.supported = String(supported)
		document.querySelector('[data-support-copy]').textContent = supported
			? 'Native border-shape / live CSS outlines'
			: nativeSupported
				? 'SVG fallback preview / same perimeter and connector points'
				: 'SVG fallback / native border-shape unavailable'
		renderer.textContent = supported ? 'Preview SVG fallback' : 'Use native border-shape'
	}
	describeRenderer()
	renderer.addEventListener('click', () => {
		supported = !supported
		describeRenderer()
		drawElectric()
		updateConnections()
	})

	let electricRunning = false,
		frame = 0,
		lastFrame = 0,
		elapsed = 0,
		lastDraw = 0
	function drawElectric() {
		const points = framePoints(Number(energyInput.value), elapsed),
			width = Number(widthInput.value)
		const polygon = `polygon(${points.map(([x, y]) => `${x.toFixed(2)}% ${y.toFixed(2)}%`).join(', ')})`
		sheet.updateSet(`.${scope} [data-electric-card]`, {
			borderShape: supported ? polygon : 'none',
			borderWidth: `${width}px`,
			borderColor: supported ? 'var(--electric)' : 'transparent',
		})
		outline.setAttribute(
			'd',
			points.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(2)},${y.toFixed(2)}`).join(' ') + ' Z',
		)
		sheet.updateSet(`.${scope} [data-electric-fallback]`, { strokeWidth: String(width) })
		electricCode.textContent = supported
			? [
					`sheet.updateSet('.${scope} [data-electric-card]', {`,
					`  borderWidth: '${width}px',`,
					`  borderShape: '${polygon}'`,
					`});`,
				].join('\n')
			: [
					`// This browser uses the same perimeter points in SVG.`,
					`// The content remains unclipped.`,
					`sheet.updateSet('.${scope} [data-electric-fallback]', {`,
					`  strokeWidth: '${width}'`,
					`});`,
				].join('\n')
	}
	function animate(now) {
		if (!electricRunning || document.hidden) return
		elapsed += Math.min((now - lastFrame) / 1000, 0.05)
		lastFrame = now
		if (now - lastDraw > 33) {
			drawElectric()
			lastDraw = now
		}
		frame = requestAnimationFrame(animate)
	}
	function setElectric(active) {
		electricRunning = active
		play.setAttribute('aria-pressed', String(active))
		play.textContent = active ? 'Pause current' : 'Start current'
		cancelAnimationFrame(frame)
		if (active && !document.hidden) {
			lastFrame = performance.now()
			frame = requestAnimationFrame(animate)
		}
	}
	play.addEventListener('click', () => setElectric(!electricRunning))
	for (const input of [energyInput, widthInput])
		input.addEventListener('input', () => {
			find('[data-voltage-output]').textContent = `${energyInput.value} / 12`
			find('[data-charge-output]').textContent = `${widthInput.value}px`
			drawElectric()
		})
	const nodes = [],
		connections = [],
		colors = [
			'#de866c',
			'#d8bd78',
			'#80b8a6',
			'#a99ac4',
			'#c38c9e',
			'#81a6c3',
			'#afbd7c',
			'#c49c71',
		]
	let nextId = 1,
		drag = null
	function nodeSelector(id) {
		return `.${scope} .network-node-${id}`
	}
	function syncButtons() {
		add.disabled = nodes.length >= 8
		remove.disabled = nodes.length <= 2
	}
	function limits() {
		const rect = board.getBoundingClientRect(),
			radius = (nodes[0]?.element.offsetWidth || 76) / 2 + 8
		return { x: (radius / rect.width) * 100, y: (radius / rect.height) * 100 }
	}
	function positionNode(node) {
		const bounds = limits()
		node.x = clamp(node.x, bounds.x, 100 - bounds.x)
		node.y = clamp(node.y, bounds.y, 100 - bounds.y)
		sheet.updateSet(nodeSelector(node.id), {
			left: `${node.x}%`,
			top: `${node.y}%`,
			'--node-color': colors[(node.id - 1) % colors.length],
		})
	}
	function pairs() {
		const result = []
		for (let i = 0; i < nodes.length - 1; i++) result.push([nodes[i], nodes[i + 1]])
		if (topologyInput.value === 'ring' && nodes.length > 2) result.push([nodes.at(-1), nodes[0]])
		if (topologyInput.value === 'mesh') {
			result.length = 0
			for (let i = 0; i < nodes.length; i++)
				for (let j = i + 1; j < nodes.length; j++) result.push([nodes[i], nodes[j]])
		}
		return result
	}
	function updateConnections() {
		const rect = board.getBoundingClientRect()
		fallback.setAttribute('viewBox', `0 0 ${rect.width} ${rect.height}`)
		let latest
		connections.forEach((connection, index) => {
			const { from, to, selector, path } = connection,
				fx = (from.x / 100) * rect.width,
				fy = (from.y / 100) * rect.height,
				dx = ((to.x - from.x) / 100) * rect.width,
				dy = ((to.y - from.y) / 100) * rect.height
			const distance = Math.hypot(dx, dy),
				angle = Math.atan2(dy, dx),
				slack = clamp(1 - distance / Math.max(rect.width * 0.65, 280), 0, 1),
				bend = Number(bendInput.value)
			const height = 10 + Math.abs(bend) * 1.5 * (0.2 + slack),
				sign = (bend < 0 ? -1 : 1) * (index % 2 ? 1 : -1),
				edge = sign > 0 ? 100 : 0
			const shape = `shape(from 0 50%, curve to 25% 50% with 12.5% ${edge}%, smooth to 50% 50%, smooth to 75% 50%, smooth to 100% 50%)`
			sheet.updateSet(selector, {
				left: `${from.x}%`,
				top: `calc(${from.y}% - ${height / 2}px)`,
				width: `${distance}px`,
				height: `${height}px`,
				transform: `rotate(${(angle * 180) / Math.PI}deg)`,
				borderShape: shape,
				'--connector-color': colors[index % colors.length],
			})
			const point = (x, y) =>
				[
					fx + x * Math.cos(angle) - y * Math.sin(angle),
					fy + x * Math.sin(angle) + y * Math.cos(angle),
				]
					.map(v => v.toFixed(2))
					.join(',')
			const d = `M${point(0, 0)} Q${point(distance * 0.125, (sign * height) / 2)} ${point(distance * 0.25, 0)} T${point(distance * 0.5, 0)} T${point(distance * 0.75, 0)} T${point(distance, 0)}`
			path.setAttribute('d', d)
			sheet.updateSet(`.${scope} .network-curve-${connection.id}`, {
				stroke: colors[index % colors.length],
				strokeWidth: '7px',
				strokeLinecap: 'round',
			})
			latest = { selector, shape, distance, d }
		})
		if (latest)
			networkCode.textContent = supported
				? [
						`// ${nodes.length} nodes · ${connections.length} ${topologyInput.value} connections`,
						`sheet.updateSet('${latest.selector}', {`,
						`  width: '${latest.distance.toFixed(1)}px',`,
						`  borderShape: '${latest.shape}'`,
						`});`,
					].join('\n')
				: [
						`// Matching quadratic curves are used in the SVG fallback.`,
						`// ${nodes.length} nodes · ${connections.length} ${topologyInput.value} connections`,
						`path.setAttribute('d', '${latest.d}');`,
						`sheet.updateSet('.${scope} .network-curve-${connections.at(-1).id}', {`,
						`  stroke: '${colors[(connections.length - 1) % colors.length]}', strokeWidth: '7px'`,
						`});`,
					].join('\n')
	}
	function rebuild() {
		for (const connection of connections) {
			sheet.remove(connection.selector)
			sheet.remove(`.${scope} .network-curve-${connection.id}`)
		}
		connections.length = 0
		connectorLayer.replaceChildren(fallback)
		fallback.replaceChildren()
		pairs().forEach(([from, to], index) => {
			const id = `${from.id}-${to.id}-${index}`,
				selector = `.${scope} .network-connector-${id}`
			const element = document.createElement('span')
			element.className = `network-connector network-connector-${id}`
			connectorLayer.append(element)
			const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
			path.classList.add(`network-curve-${id}`)
			fallback.append(path)
			connections.push({ id, from, to, selector, path })
		})
		updateConnections()
	}
	function addNode(x, y) {
		if (nodes.length >= 8) return
		const id = nextId++,
			element = document.createElement('button')
		element.type = 'button'
		element.className = `network-node network-node-${id}`
		element.textContent = String(id).padStart(2, '0')
		element.setAttribute('aria-label', `Circle ${id}. Drag or move with arrow keys.`)
		nodeLayer.append(element)
		const node = { id, x, y, element }
		nodes.push(node)
		positionNode(node)
		element.addEventListener('pointerdown', event => {
			if (event.button !== 0) return
			event.preventDefault()
			drag = { node, pointerId: event.pointerId }
			element.setPointerCapture(event.pointerId)
		})
		const end = () => {
			drag = null
		}
		element.addEventListener('pointerup', end)
		element.addEventListener('pointercancel', end)
		element.addEventListener('lostpointercapture', end)
		element.addEventListener('keydown', event => {
			const changes = {
				ArrowLeft: [-3, 0],
				ArrowRight: [3, 0],
				ArrowUp: [0, -3],
				ArrowDown: [0, 3],
			}
			const delta = changes[event.key]
			if (!delta) return
			event.preventDefault()
			node.x += delta[0]
			node.y += delta[1]
			positionNode(node)
			updateConnections()
		})
		syncButtons()
		rebuild()
	}
	board.addEventListener('pointermove', event => {
		if (!drag || event.pointerId !== drag.pointerId) return
		const rect = board.getBoundingClientRect()
		drag.node.x = ((event.clientX - rect.left) / rect.width) * 100
		drag.node.y = ((event.clientY - rect.top) / rect.height) * 100
		positionNode(drag.node)
		updateConnections()
	})
	add.addEventListener('click', () => {
		const angle = nodes.length * 2.39996
		addNode(50 + Math.cos(angle) * 28, 50 + Math.sin(angle) * 28)
	})
	remove.addEventListener('click', () => {
		if (nodes.length <= 2) return
		const node = nodes.pop()
		node.element.remove()
		sheet.remove(nodeSelector(node.id))
		if (drag?.node === node) drag = null
		syncButtons()
		rebuild()
	})
	topologyInput.addEventListener('change', rebuild)
	bendInput.addEventListener('input', () => {
		find('[data-bend-output]').textContent = `${bendInput.value}%`
		updateConnections()
	})
	const observer = new ResizeObserver(() => {
		nodes.forEach(positionNode)
		updateConnections()
	})
	observer.observe(board)
	function visibility() {
		cancelAnimationFrame(frame)
		if (!document.hidden && electricRunning) {
			lastFrame = performance.now()
			frame = requestAnimationFrame(animate)
		}
	}
	document.addEventListener('visibilitychange', visibility)
	addNode(22, 28)
	addNode(76, 25)
	addNode(66, 73)
	addNode(28, 70)
	drawElectric()
	setElectric(!matchMedia('(prefers-reduced-motion: reduce)').matches)
	return () => {
		electricRunning = false
		cancelAnimationFrame(frame)
		observer.disconnect()
		document.removeEventListener('visibilitychange', visibility)
		sheet.destroy()
	}
}
registerDemo('[data-border-shape-demo]', mountBorderShapeDemo)
