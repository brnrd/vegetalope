import Sheet from 'dyss'
import { registerDemo } from './dyss-demo-lifecycle.js'
import {
	initialRevenue,
	revenueSlices,
	revenueGradient,
	createRevenueStream,
	advanceRevenueStream,
	setRevenueValue,
	syncRevenueWindow,
} from './dyss-revenue-model.js'
import {
	revenueFrame,
	revenueTransition,
	sampleRevenueTransition,
} from './dyss-revenue-transition.js'
const currency = new Intl.NumberFormat('en-US', {
	style: 'currency',
	currency: 'USD',
	maximumFractionDigits: 0,
})
function mountDemo(root) {
	const find = selector => root.querySelector(selector)
	const controls = find('[data-dyss-controls]'),
		rowsContainer = find('[data-dyss-rows]')
	const pie = find('[data-dyss-pie]'),
		code = find('[data-dyss-code]')
	const live = find('[data-dyss-live]'),
		interval = find('[data-dyss-interval]')
	const add = find('[data-dyss-add]'),
		reset = find('[data-pie-reset]')
	const totalOutput = find('[data-pie-total]'),
		countOutput = find('[data-pie-count]')
	const rate = find('[data-dyss-fps]'),
		status = find('[data-pie-status]'),
		latestOutput = find('[data-pie-latest]')
	const sheet = new Sheet()
	const scope = `revenue-${Math.random().toString(36).slice(2, 9)}`
	root.classList.add(scope)
	let nextId = 0,
		rows = [],
		running = false,
		frame = 0,
		lastFrame = 0
	let stream,
		renderClock = 0,
		rateClock = 0,
		updates = 0
	const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)')
	let displayed = null,
		targetFrame = null,
		transition = null,
		motionFrame = 0
	function build() {
		rowsContainer.replaceChildren()
		pie.replaceChildren()
		for (const row of rows) {
			const element = document.createElement('div')
			element.className = 'revenue-row'
			element.dataset.id = row.id
			const name = document.createElement('div')
			name.className = 'revenue-name'
			const color = document.createElement('input')
			color.type = 'color'
			color.value = row.color
			color.dataset.field = 'color'
			color.setAttribute('aria-label', `${row.label} color`)
			const label = document.createElement('input')
			label.value = row.label
			label.dataset.field = 'label'
			label.maxLength = 32
			label.setAttribute('aria-label', 'Category name')
			name.append(color, label)
			const value = document.createElement('input')
			value.type = 'number'
			value.min = '0'
			value.max = '1000000000'
			value.step = '1'
			value.value = row.value
			value.dataset.field = 'value'
			value.setAttribute('aria-label', `${row.label} revenue in dollars`)
			const output = document.createElement('output')
			output.setAttribute('aria-label', `${row.label} percentage`)
			const remove = document.createElement('button')
			remove.type = 'button'
			remove.dataset.remove = ''
			remove.textContent = '×'
			remove.setAttribute('aria-label', `Remove ${row.label}`)
			remove.disabled = rows.length <= 1
			element.append(name, value, output, remove)
			rowsContainer.append(element)
			const slice = document.createElement('li')
			slice.className = 'revenue-category'
			pie.append(slice)
			row.element = element
			row.slice = slice
		}
		add.disabled = rows.length >= 8
	}
	function paint(snapshot) {
		displayed = snapshot
		const total = snapshot.rows.reduce((sum, row) => sum + row.value, 0)
		const slices = revenueSlices(snapshot.rows)
		const gradient = revenueGradient(slices)
		sheet.updateSet(`.${scope} .revenue-pie`, { background: gradient, opacity: snapshot.opacity })
		const visualRows = new Map(slices.map(slice => [slice.row.id, slice]))
		for (const row of rows) {
			const { row: visualRow, share } = visualRows.get(row.id) || { row: { value: 0 }, share: 0 }
			row.slice.dataset.percentage = share.toFixed(1)
			row.slice.dataset.color = row.color
			row.slice.textContent = `${row.label}: ${currency.format(visualRow.value)}, ${share.toFixed(1)}%`
			row.element.querySelector('output').textContent = `${share.toFixed(1)}%`
			const input = row.element.querySelector('[data-field="value"]')
			if (document.activeElement !== input) input.value = Math.round(visualRow.value)
		}
		totalOutput.textContent = currency.format(total)
		countOutput.textContent = total
			? `${rows.length} ${rows.length === 1 ? 'category' : 'categories'}`
			: 'No revenue yet'
		code.textContent = [
			`// Amounts and slice boundaries interpolate together.`,
			`// The circle stays closed during every animation frame.`,
			`const total = ${Math.round(total)};`,
			'',
			`sheet.updateSet('.${scope} .revenue-pie', {`,
			`  background: '${gradient}',`,
			`  opacity: ${snapshot.opacity.toFixed(3)}`,
			`});`,
		].join('\n')
	}
	function animate(now) {
		motionFrame = 0
		if (!transition) return
		const snapshot = sampleRevenueTransition(transition, now)
		paint(snapshot)
		if (snapshot.complete) transition = null
		else motionFrame = requestAnimationFrame(animate)
	}
	function updateVisuals(immediate) {
		const next = revenueFrame(rows)
		if (immediate || !displayed || motionPreference.matches || document.hidden) {
			cancelAnimationFrame(motionFrame)
			motionFrame = 0
			transition = null
			targetFrame = next
			paint(next)
			return
		}
		// Polling must not restart motion when the destination has not changed.
		const unchanged =
			targetFrame &&
			next.rows.length === targetFrame.rows.length &&
			next.rows.every((row, index) => {
				const previous = targetFrame.rows[index]
				return (
					row.id === previous.id && row.value === previous.value && row.color === previous.color
				)
			})
		const now = performance.now()
		if (!unchanged) {
			const current = transition ? sampleRevenueTransition(transition, now) : displayed
			transition = revenueTransition(current, next, now)
			targetFrame = next
		}
		paint(transition ? sampleRevenueTransition(transition, now) : next)
		if (transition && !motionFrame) motionFrame = requestAnimationFrame(animate)
	}
	function draw({ immediate = false } = {}) {
		for (const row of rows) {
			row.element
				.querySelector('[data-field="color"]')
				.setAttribute('aria-label', `${row.label} color`)
			row.element
				.querySelector('[data-field="value"]')
				.setAttribute('aria-label', `${row.label} revenue in dollars`)
			row.element.querySelector('[data-remove]').setAttribute('aria-label', `Remove ${row.label}`)
			row.element.toggleAttribute(
				'data-recent-sale',
				stream.latest?.id === row.id && stream.time - stream.latest.time < 1.3,
			)
		}
		const latestRow = rows.find(row => row.id === stream.latest?.id)
		latestOutput.textContent = latestRow
			? `${latestRow.label} +${currency.format(stream.latest.amount)}`
			: 'Start sales to see the next transaction'
		updateVisuals(immediate)
		updates++
	}
	function tick(now) {
		const dt = Math.min((now - lastFrame) / 1000, 0.1)
		lastFrame = now
		advanceRevenueStream(stream, rows, dt)
		renderClock += dt
		rateClock += dt
		if (renderClock >= Number(interval.value) / 1000) {
			renderClock = 0
			draw()
		}
		if (rateClock >= 1) {
			rate.textContent = `${Math.round(updates / rateClock)} updates/s`
			rateClock = 0
			updates = 0
		}
		frame = requestAnimationFrame(tick)
	}
	function setRunning(value) {
		running = value
		live.setAttribute('aria-pressed', String(running))
		live.textContent = running ? 'Pause sales' : 'Simulate sales'
		status.textContent = `30-second window / ${running ? 'live sales' : 'paused'}`
		cancelAnimationFrame(frame)
		if (running && !document.hidden) {
			lastFrame = performance.now()
			frame = requestAnimationFrame(tick)
		} else {
			draw()
			rate.textContent = '0 updates/s'
		}
	}
	function resetSample() {
		setRunning(false)
		rows = initialRevenue.map(row => ({ ...row, id: ++nextId }))
		stream = createRevenueStream(rows)
		renderClock = rateClock = updates = 0
		build()
		draw({ immediate: true })
	}
	controls.addEventListener('submit', event => event.preventDefault())
	controls.addEventListener('input', event => {
		const input = event.target
		const row = rows.find(row => String(row.id) === input.closest('[data-id]')?.dataset.id)
		if (!row) return
		if (input.dataset.field === 'value')
			setRevenueValue(stream, row, Math.max(0, Math.min(1e9, Math.round(Number(input.value) || 0))))
		if (input.dataset.field === 'label') row.label = input.value.trim() || 'Untitled'
		if (input.dataset.field === 'color') row.color = input.value
		draw()
	})
	controls.addEventListener(
		'blur',
		event => {
			if (event.target.dataset.field !== 'value') return
			const row = rows.find(row => String(row.id) === event.target.closest('[data-id]')?.dataset.id)
			if (row) {
				const snapshot = transition
					? sampleRevenueTransition(transition, performance.now())
					: displayed
				event.target.value = Math.round(
					snapshot.rows.find(item => item.id === row.id)?.value ?? row.value,
				)
			}
		},
		true,
	)

	controls.addEventListener('click', event => {
		if (!event.target.matches('[data-remove]') || rows.length <= 1) return
		const id = event.target.closest('[data-id]').dataset.id
		rows = rows.filter(row => String(row.id) !== id)
		syncRevenueWindow(stream, rows)
		build()
		draw()
	})
	add.addEventListener('click', () => {
		if (rows.length >= 8) return
		const row = {
			id: ++nextId,
			label: `Category ${rows.length + 1}`,
			value: 200,
			color: ['#889a70', '#b591b0', '#729bbb', '#bba482'][rows.length % 4],
		}
		rows.push(row)
		setRevenueValue(stream, row, row.value)
		build()
		draw()
	})
	live.addEventListener('click', () => setRunning(!running))
	reset.addEventListener('click', resetSample)
	function visibility() {
		setRunning(running)
	}
	document.addEventListener('visibilitychange', visibility)
	function motionChanged() {
		if (motionPreference.matches) draw({ immediate: true })
	}
	motionPreference.addEventListener('change', motionChanged)
	// Populate before toggling playback, so the first draw always has a category.
	rows = initialRevenue.map(row => ({ ...row, id: ++nextId }))
	stream = createRevenueStream(rows)
	build()
	draw()
	return () => {
		cancelAnimationFrame(frame)
		cancelAnimationFrame(motionFrame)
		document.removeEventListener('visibilitychange', visibility)
		motionPreference.removeEventListener('change', motionChanged)
		sheet.destroy()
	}
}
registerDemo('[data-dyss-demo]', mountDemo)
