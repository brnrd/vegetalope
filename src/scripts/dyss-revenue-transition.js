export const revenueTransitionDuration = 480

export function revenueFrame(rows) {
	return {
		rows: rows.map(({ id, label, value, color }) => ({ id, label, value, color })),
		opacity: rows.some(row => row.value > 0) ? 1 : 0,
	}
}

function mixColor(from, to, progress) {
	if (from === to) return to
	const channels = color =>
		color
			.slice(1)
			.match(/../g)
			.map(channel => parseInt(channel, 16))
	const a = channels(from),
		b = channels(to)
	return (
		'#' +
		a
			.map((value, index) =>
				Math.round(value + (b[index] - value) * progress)
					.toString(16)
					.padStart(2, '0'),
			)
			.join('')
	)
}

export function revenueTransition(from, to, now, duration = revenueTransitionDuration) {
	return { from, to, started: now, duration }
}

export function sampleRevenueTransition(transition, now) {
	const progress = transition.duration
		? Math.min(1, Math.max(0, (now - transition.started) / transition.duration))
		: 1
	if (progress === 1) return { ...transition.to, complete: true }
	// All boundaries share one easing curve, so they stay ordered and the circle stays closed.
	const blend = progress * progress * (3 - 2 * progress)
	const from = new Map(transition.from.rows.map(row => [row.id, row]))
	const to = new Map(transition.to.rows.map(row => [row.id, row]))
	const ids = new Set([...from.keys(), ...to.keys()])
	const fromTotal = transition.from.rows.reduce((sum, row) => sum + row.value, 0)
	const toTotal = transition.to.rows.reduce((sum, row) => sum + row.value, 0)
	const total = fromTotal + (toTotal - fromTotal) * blend
	return {
		rows: [...ids].map(id => {
			const a = from.get(id),
				b = to.get(id)
			// Interpolating shares keeps large edits gradual. Derive amounts from the same total.
			const start = fromTotal
				? (a?.value ?? 0) / fromTotal
				: toTotal
					? (b?.value ?? 0) / toTotal
					: 0
			const end = toTotal ? (b?.value ?? 0) / toTotal : start
			return {
				...(b || a),
				value: total * (start + (end - start) * blend),
				color: mixColor(a?.color ?? b.color, b?.color ?? a.color, blend),
			}
		}),
		opacity: transition.from.opacity + (transition.to.opacity - transition.from.opacity) * blend,
		complete: false,
	}
}
