export const revenueWindow = 30
export const initialRevenue = [
	{ label: 'Product', value: 440, color: '#4d9b91' },
	{ label: 'Services', value: 310, color: '#ce8065' },
	{ label: 'Support', value: 170, color: '#d8b36b' },
	{ label: 'Other', value: 80, color: '#7c8eac' },
]

export function revenueSlices(rows) {
	const total = rows.reduce((sum, row) => sum + row.value, 0)
	const lastPositive = rows.findLastIndex(row => row.value > 0)
	let start = 0
	return rows.map((row, index) => {
		const share = total ? (row.value / total) * 100 : 0
		// Close exactly at a full turn, including when trailing categories are empty.
		const end = index === lastPositive ? 100 : start + share
		const slice = { row, start, end, share }
		start = end
		return slice
	})
}

export function revenueGradient(slices) {
	const stops = slices
		.filter(slice => slice.share > 0)
		.map(({ row, start, end }) => `${row.color} ${start}% ${end}%`)
	return stops.length ? `conic-gradient(${stops.join(', ')})` : 'var(--hairline)'
}

export function createRevenueStream(rows) {
	// Seed recent sales rather than an all-time balance that would dilute every new sale.
	const times = [-25, -17, -9, -1]
	return {
		time: 0,
		nextSale: 0.9,
		saleIndex: 0,
		latest: null,
		events: rows.flatMap(row =>
			times.map((time, index) => ({
				id: row.id,
				time,
				amount: Math.floor(row.value / 4) + (index === 3 ? row.value % 4 : 0),
			})),
		),
	}
}

export function setRevenueValue(stream, row, value) {
	stream.events = stream.events.filter(sale => sale.id !== row.id)
	stream.events.push({ id: row.id, time: stream.time, amount: value })
	row.value = value
}

export function syncRevenueWindow(stream, rows) {
	const ids = new Set(rows.map(row => row.id))
	stream.events = stream.events.filter(
		sale => sale.time > stream.time - revenueWindow && ids.has(sale.id),
	)
	const totals = new Map()
	for (const sale of stream.events) totals.set(sale.id, (totals.get(sale.id) || 0) + sale.amount)
	for (const row of rows) row.value = totals.get(row.id) || 0
	if (stream.latest && !ids.has(stream.latest.id)) stream.latest = null
}

export function advanceRevenueStream(stream, rows, dt) {
	stream.time += dt
	while (stream.nextSale <= stream.time) {
		const index = stream.saleIndex++
		// Short runs of sales favor a different category in turn; every category participates.
		const primary = Math.floor(index / 12) % rows.length
		const row = rows[index % 4 < 3 ? primary : (Math.floor(index / 4) + 1) % rows.length]
		const amount = [45, 120, 65, 210, 35, 90, 160, 75][index % 8]
		const sale = { id: row.id, time: stream.nextSale, amount }
		stream.events.push(sale)
		stream.latest = sale
		stream.nextSale += 0.9
	}
	syncRevenueWindow(stream, rows)
}
