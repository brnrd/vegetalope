import test from 'node:test'
import assert from 'node:assert/strict'
import { stepSpring, dampingRatio } from './dyss-spring-model.js'
import { contrastRatio, readableInk } from './utils/contrast.js'
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

test('contrast ratios match known black/white and equal-color cases', () => {
	assert.equal(contrastRatio('#000000', '#ffffff'), 21)
	assert.equal(contrastRatio('#ffffff', '#000000'), 21)
	assert.equal(contrastRatio('#315e80', '#315e80'), 1)
	assert.ok(Math.abs(contrastRatio('#777777', '#ffffff') - 4.478) < 0.001)
})

test('adaptive button text selects the higher-contrast candidate', () => {
	for (const background of ['#315e80', '#d8bc7d', '#4e9276', '#c87762', '#bacbd3', '#263448']) {
		const chosen = readableInk(background)
		assert.ok(
			contrastRatio(background, chosen) >=
				contrastRatio(background, chosen === '#ffffff' ? '#14161a' : '#ffffff'),
		)
	}
})

test('springs settle without numerical instability throughout the control range', () => {
	for (const stiffness of [40, 100, 300])
		for (const damping of [1, 12, 50])
			for (const mass of [0.3, 1, 3]) {
				const state = { x: -0.65, velocity: 0, target: 0 }
				const parameters = { stiffness, damping, mass }
				for (let step = 0; step < 60 * 240; step++) {
					stepSpring(state, parameters, 1 / 240)
					assert.ok(Number.isFinite(state.x) && Number.isFinite(state.velocity))
				}
				assert.ok(Math.abs(state.x) < 0.001, JSON.stringify(parameters))
				assert.ok(Math.abs(state.velocity) < 0.01, JSON.stringify(parameters))
			}
})

test('damping changes overshoot behavior rather than just animation speed', () => {
	for (const [damping, shouldOvershoot] of [
		[5, true],
		[30, false],
	]) {
		const parameters = { stiffness: 100, damping, mass: 1 }
		const state = { x: -0.65, velocity: 0, target: 0 }
		let overshot = false
		for (let step = 0; step < 5 * 240; step++) {
			stepSpring(state, parameters, 1 / 240)
			overshot ||= state.x > 0.001
		}
		assert.equal(overshot, shouldOvershoot)
		assert.equal(dampingRatio(parameters) < 1, shouldOvershoot)
	}
})

test('the spring respects the visible rail bounds after a fast release', () => {
	const state = { x: -0.59, target: 0, velocity: -3, minimum: -0.6, maximum: 0.9 }
	for (let step = 0; step < 240; step++) {
		stepSpring(state, { stiffness: 55, damping: 5, mass: 1 }, 1 / 240)
		assert.ok(state.x >= state.minimum && state.x <= state.maximum)
	}
})

const revenueRows = () => initialRevenue.map((row, id) => ({ ...row, id }))

test('revenue fills one complete turn, including awkward fractions and trailing zero values', () => {
	for (const values of [
		[1, 1, 1, 0],
		[0, 7, 0, 0],
		[13, 29, 7, 11],
	]) {
		const rows = revenueRows().map((row, index) => ({ ...row, value: values[index] }))
		const slices = revenueSlices(rows)
		assert.equal(slices[0].start, 0)
		assert.equal(slices.findLast(slice => slice.share > 0).end, 100)
		assert.ok(Math.abs(slices.reduce((sum, slice) => sum + slice.share, 0) - 100) < 1e-10)
		assert.ok(!revenueGradient(slices).includes('transparent'))
		for (let index = 1; index < slices.length; index++)
			assert.equal(slices[index].start, slices[index - 1].end)
	}
	assert.equal(
		revenueGradient(revenueSlices(revenueRows().map(row => ({ ...row, value: 0 })))),
		'var(--hairline)',
	)
})

test('sales change the displayed mix noticeably and do not dilute into an all-time total', () => {
	const rows = revenueRows(),
		stream = createRevenueStream(rows)
	const original = revenueSlices(rows).map(slice => slice.share)
	advanceRevenueStream(stream, rows, 3)
	assert.ok(revenueSlices(rows).some((slice, index) => Math.abs(slice.share - original[index]) > 5))
	advanceRevenueStream(stream, rows, 597)
	const before = revenueSlices(rows).map(slice => slice.share)
	assert.ok(stream.events.length <= 34)
	assert.ok(rows.reduce((sum, row) => sum + row.value, 0) < 5000)
	advanceRevenueStream(stream, rows, 3)
	assert.ok(revenueSlices(rows).some((slice, index) => Math.abs(slice.share - before[index]) > 5))
})

test('sales and expiry are independent of the drawing interval', () => {
	const fastRows = revenueRows(),
		slowRows = revenueRows()
	const fast = createRevenueStream(fastRows),
		slow = createRevenueStream(slowRows)
	for (let index = 0; index < 2400; index++) advanceRevenueStream(fast, fastRows, 1 / 60)
	for (let index = 0; index < 160; index++) advanceRevenueStream(slow, slowRows, 0.25)
	assert.deepEqual(
		fastRows.map(row => row.value),
		slowRows.map(row => row.value),
	)
	assert.equal(fast.saleIndex, slow.saleIndex)
})

test('edited values expire, removed categories leave the window, and new categories get sales', () => {
	const rows = revenueRows(),
		stream = createRevenueStream(rows)
	setRevenueValue(stream, rows[0], 999)
	assert.equal(rows[0].value, 999)
	const customSale = stream.events.find(sale => sale.id === rows[0].id)
	advanceRevenueStream(stream, rows, 30.1)
	assert.ok(!stream.events.includes(customSale))
	rows.shift()
	syncRevenueWindow(stream, rows)
	assert.ok(stream.events.every(sale => rows.some(row => row.id === sale.id)))
	for (let id = 4; id < 8; id++)
		rows.push({ id, label: `Category ${id}`, value: 0, color: '#889a70' })
	advanceRevenueStream(stream, rows, 29)
	assert.ok(rows.every(row => row.value > 0))
})

test('animated revenue stays closed and eases even very large edits', () => {
	const before = revenueFrame(revenueRows())
	const after = revenueFrame(
		revenueRows().map((row, index) => ({ ...row, value: index ? row.value : 1e9 })),
	)
	const transition = revenueTransition(before, after, 100)
	for (let elapsed = 0; elapsed <= 480; elapsed += 40) {
		const sample = sampleRevenueTransition(transition, 100 + elapsed)
		const slices = revenueSlices(sample.rows)
		assert.equal(slices.at(-1).end, 100)
		assert.ok(sample.rows.every(row => row.value >= 0))
		for (let index = 1; index < slices.length; index++)
			assert.equal(slices[index].start, slices[index - 1].end)
	}
	const halfway = revenueSlices(sampleRevenueTransition(transition, 340).rows)[0].share
	assert.ok(halfway > 60 && halfway < 80)
	assert.deepEqual(sampleRevenueTransition(transition, 580).rows, after.rows)
})

test('a new destination continues from the current animated state without a jump', () => {
	const rows = revenueRows()
	const before = revenueFrame(rows)
	const firstTarget = revenueFrame(rows.map(row => ({ ...row, value: row.value * 2 })))
	const first = revenueTransition(before, firstTarget, 0)
	const current = sampleRevenueTransition(first, 180)
	const nextTarget = revenueFrame(rows.map((row, index) => ({ ...row, value: index ? 0 : 500 })))
	const next = revenueTransition(current, nextTarget, 180)
	const continued = sampleRevenueTransition(next, 180)
	for (let index = 0; index < current.rows.length; index++)
		assert.ok(Math.abs(continued.rows[index].value - current.rows[index].value) < 1e-8)
	assert.deepEqual(sampleRevenueTransition(next, 660).rows, nextTarget.rows)
	assert.equal(before.rows[0].value, 440)
})

test('category insertion, removal, and empty states transition cleanly', () => {
	const rows = revenueRows()
	const after = rows.slice(1).concat({ id: 9, label: 'New', value: 200, color: '#889a70' })
	const transition = revenueTransition(revenueFrame(rows), revenueFrame(after), 0)
	const halfway = sampleRevenueTransition(transition, 240)
	assert.ok(halfway.rows.find(row => row.id === 0).value > 0)
	assert.ok(halfway.rows.find(row => row.id === 9).value > 0)
	assert.deepEqual(
		sampleRevenueTransition(transition, 480).rows.map(row => row.id),
		after.map(row => row.id),
	)
	const empty = revenueFrame(rows.map(row => ({ ...row, value: 0 })))
	const fading = revenueTransition(revenueFrame(rows), empty, 0)
	assert.equal(sampleRevenueTransition(fading, 240).opacity, 0.5)
	assert.equal(sampleRevenueTransition(fading, 480).opacity, 0)
	assert.ok(sampleRevenueTransition(fading, 480).rows.every(row => row.value === 0))
	assert.deepEqual(
		sampleRevenueTransition(revenueTransition(revenueFrame(rows), empty, 0, 0), 0).rows,
		empty.rows,
	)
})
