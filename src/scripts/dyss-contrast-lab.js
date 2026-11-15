import Sheet from 'dyss'
import { registerDemo } from './dyss-demo-lifecycle.js'
import { normalizeHex } from './utils/hex-color.js'
import { contrastRatio } from './utils/contrast.js'
const initial = [
	{ label: 'Ocean', color: '#315e80' },
	{ label: 'Sand', color: '#d8bc7d' },
	{ label: 'Fern', color: '#4e9276' },
	{ label: 'Clay', color: '#c87762' },
	{ label: 'Mist', color: '#bacbd3' },
	{ label: 'Ink', color: '#263448' },
]
function mountContrastLab(root) {
	const find = selector => root.querySelector(selector)
	const controls = find('[data-dyss-controls]'),
		rowsBox = find('[data-dyss-rows]'),
		preview = find('[data-dyss-preview]')
	const code = find('[data-dyss-code]'),
		support = find('[data-dyss-support]'),
		summary = find('[data-contrast-summary]')
	const cutoff = find('[data-contrast-cutoff]'),
		cutoffOutput = find('[data-contrast-cutoff-output]'),
		add = find('[data-dyss-add]')
	const sheet = new Sheet(),
		scope = `contrast-${Math.random().toString(36).slice(2, 9)}`
	root.classList.add(scope)
	let nextId = 0,
		swatches = initial.map(swatch => ({ ...swatch, id: ++nextId })),
		mode = 'measured'
	let light = '#ffffff',
		dark = '#14161a'
	// A one-pixel canvas resolves the browser's relative-color result for measurement.
	const context = document.createElement('canvas').getContext('2d', { willReadFrequently: true })
	function cssFormula(bg) {
		const lightRGB = light
			.slice(1)
			.match(/../g)
			.map(c => parseInt(c, 16))
		const darkRGB = dark
			.slice(1)
			.match(/../g)
			.map(c => parseInt(c, 16))
		return `rgb(from oklch(from ${bg} round(${(Number(cutoff.value) + 0.5).toFixed(2)} - l) 0 0) ${lightRGB.map((c, i) => `calc((${['r', 'g', 'b'][i]} / 255) * ${c - darkRGB[i]} + ${darkRGB[i]})`).join(' ')})`
	}
	function build() {
		rowsBox.replaceChildren()
		preview.replaceChildren()
		for (const swatch of swatches) {
			const row = document.createElement('div')
			row.className = 'contrast-row'
			row.dataset.id = swatch.id
			const label = document.createElement('input')
			label.value = swatch.label
			label.dataset.field = 'label'
			label.maxLength = 24
			label.setAttribute('aria-label', 'Background name')
			const picker = document.createElement('input')
			picker.type = 'color'
			picker.value = swatch.color
			picker.dataset.field = 'color'
			picker.setAttribute('aria-label', `${swatch.label} background`)
			const hex = document.createElement('input')
			hex.value = swatch.color.slice(1)
			hex.dataset.field = 'hex'
			hex.maxLength = 6
			hex.spellcheck = false
			hex.setAttribute('aria-label', `${swatch.label} background hex`)
			const remove = document.createElement('button')
			remove.type = 'button'
			remove.dataset.remove = ''
			remove.textContent = '×'
			remove.disabled = swatches.length <= 1
			remove.setAttribute('aria-label', `Remove ${swatch.label}`)
			row.append(label, picker, hex, remove)
			rowsBox.append(row)
			const card = document.createElement('article')
			card.className = `contrast-card contrast-card-${swatch.id}`
			const title = document.createElement('h4'),
				sample = document.createElement('span'),
				body = document.createElement('p'),
				ratio = document.createElement('strong'),
				grade = document.createElement('span')
			sample.className = 'contrast-sample'
			sample.textContent = 'Aa'
			body.textContent = 'A little clarity goes a long way.'
			ratio.className = 'contrast-ratio'
			grade.className = 'contrast-grade'
			card.append(title, sample, body, ratio, grade)
			preview.append(card)
			swatch.card = card
		}
		add.disabled = swatches.length >= 8
	}
	function render() {
		let passing = 0
		const supported = CSS.supports('color', cssFormula('#315e80'))
		for (const swatch of swatches) {
			const best =
				contrastRatio(swatch.color, light) > contrastRatio(swatch.color, dark) ? light : dark
			const color = mode === 'css' && supported ? cssFormula(swatch.color) : best
			sheet.updateSet(`.${scope} .contrast-card-${swatch.id}`, {
				backgroundColor: swatch.color,
				color,
			})
			let chosen = best
			if (mode === 'css' && supported && context) {
				context.clearRect(0, 0, 1, 1)
				context.fillStyle = getComputedStyle(swatch.card).color
				context.fillRect(0, 0, 1, 1)
				const pixel = context.getImageData(0, 0, 1, 1).data
				chosen = `#${[...pixel]
					.slice(0, 3)
					.map(c => c.toString(16).padStart(2, '0'))
					.join('')}`
			}
			const ratio = contrastRatio(swatch.color, chosen)
			if (ratio >= 4.5) passing++
			swatch.card.querySelector('h4').textContent = swatch.label
			swatch.card.querySelector('.contrast-ratio').textContent = `${ratio.toFixed(2)}:1`
			swatch.card.querySelector('.contrast-grade').textContent =
				`Normal ${ratio >= 4.5 ? 'PASS' : 'FAIL'} · Large ${ratio >= 3 ? 'PASS' : 'FAIL'}\n${swatch.color} / ${chosen}`
		}
		summary.textContent = `${passing} / ${swatches.length} pass for normal text`
		support.textContent =
			mode === 'measured'
				? 'Compares both candidates and picks the higher contrast ratio.'
				: supported
					? 'Relative color syntax active. Change the cutoff and compare the measured results.'
					: 'Relative color syntax unavailable here; using measured contrast as the fallback.'
		cutoff.disabled = mode !== 'css'
		cutoffOutput.textContent = Number(cutoff.value).toFixed(2)
		for (const button of root.querySelectorAll('[data-contrast-mode]'))
			button.setAttribute('aria-pressed', String(button.dataset.contrastMode === mode))
		const first = swatches[0],
			chosen = contrastRatio(first.color, light) > contrastRatio(first.color, dark) ? light : dark
		code.textContent = [
			`// ${mode === 'measured' ? 'Compare the two candidates using WCAG relative luminance.' : 'A CSS lightness threshold is an approximation.'}`,
			`sheet.updateSet('.${scope} .contrast-card-${first.id}', {`,
			`  backgroundColor: '${first.color}',`,
			`  color: '${mode === 'css' && supported ? cssFormula(first.color) : chosen}'`,
			`});`,
		].join('\n')
	}
	controls.addEventListener('submit', e => e.preventDefault())
	controls.addEventListener('click', event => {
		const target = event.target
		if (target.dataset.contrastMode) {
			mode = target.dataset.contrastMode
			render()
		}
		if (target.matches('[data-remove]') && swatches.length > 1) {
			const id = target.closest('[data-id]').dataset.id
			sheet.remove(`.${scope} .contrast-card-${id}`)
			swatches = swatches.filter(s => String(s.id) !== id)
			build()
			render()
		}
	})
	controls.addEventListener('input', event => {
		const target = event.target
		if (target === cutoff) {
			render()
			return
		}
		for (const name of ['light', 'dark']) {
			if (target.matches(`[data-contrast-${name}], [data-contrast-${name}-hex]`)) {
				const value = normalizeHex(target.value)
				if (!value) return
				if (name === 'light') light = value
				else dark = value
				for (const input of controls.querySelectorAll(
					`[data-contrast-${name}], [data-contrast-${name}-hex]`,
				))
					if (input !== target) input.value = input.type === 'color' ? value : value.slice(1)
				render()
				return
			}
		}
		const row = target.closest('[data-id]'),
			swatch = swatches.find(s => String(s.id) === row?.dataset.id)
		if (!swatch) return
		if (target.dataset.field === 'label') swatch.label = target.value.trim() || 'Untitled'
		if (target.dataset.field === 'color' || target.dataset.field === 'hex') {
			const color = normalizeHex(target.value)
			if (!color) return
			swatch.color = color
			row.querySelector('[data-field="color"]').value = color
			if (target.dataset.field !== 'hex')
				row.querySelector('[data-field="hex"]').value = color.slice(1)
		}
		render()
	})
	controls.addEventListener(
		'blur',
		event => {
			const input = event.target
			if (input.matches('[data-contrast-light-hex]')) input.value = light.slice(1)
			if (input.matches('[data-contrast-dark-hex]')) input.value = dark.slice(1)
			if (input.dataset.field !== 'hex') return
			const swatch = swatches.find(s => String(s.id) === input.closest('[data-id]')?.dataset.id)
			if (swatch) input.value = swatch.color.slice(1)
		},
		true,
	)
	add.addEventListener('click', () => {
		if (swatches.length >= 8) return
		swatches.push({ id: ++nextId, label: 'New background', color: '#9487b4' })
		build()
		render()
	})
	build()
	render()
	return () => sheet.destroy()
}
registerDemo('[data-dyss-contrast-lab]', mountContrastLab)
