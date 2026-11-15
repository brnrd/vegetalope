import Sheet from 'dyss'
import { registerDemo } from './dyss-demo-lifecycle.js'
import { normalizeHex } from './utils/hex-color.js'
import { contrastRatio, readableInk } from './utils/contrast.js'
const themes = {
	signal: {
		bg: '#f6f1e8',
		ink: '#293448',
		accent: '#a14132',
		surfaceMix: 94,
		typeScale: 1,
		spaceScale: 1,
	},
	noir: {
		bg: '#101925',
		ink: '#eee9de',
		accent: '#7fc8b5',
		surfaceMix: 89,
		typeScale: 1,
		spaceScale: 1,
	},
	studio: {
		bg: '#edf2f8',
		ink: '#233750',
		accent: '#6356a3',
		surfaceMix: 95,
		typeScale: 1.03,
		spaceScale: 1.06,
	},
}
function mountThemeMixer(root) {
	const controls = root.querySelector('[data-dyss-controls]'),
		preview = root.querySelector('[data-theme-preview]'),
		code = root.querySelector('[data-dyss-code]')
	const sheet = new Sheet(),
		scope = `theme-${Math.random().toString(36).slice(2, 9)}`
	preview.classList.add(scope)
	const selector = `.theme-preview.${scope}`
	let preset = 'signal',
		tokens = { ...themes[preset] },
		saved = false
	function syncControls() {
		for (const input of controls.querySelectorAll('[data-token]')) {
			const key = input.dataset.token
			input.value = input.type === 'text' ? String(tokens[key]).slice(1) : tokens[key]
		}
	}
	function render(custom = false) {
		if (!sheet.get(selector)) sheet.add(selector, {})
		const rule = sheet.get(selector)
		for (const [key, value] of Object.entries({
			'--tm-bg': tokens.bg,
			'--tm-ink': tokens.ink,
			'--tm-accent': tokens.accent,
			'--tm-accent-ink': readableInk(tokens.accent),
			'--tm-surface-mix': `${tokens.surfaceMix}%`,
			'--tm-type-scale': String(tokens.typeScale),
			'--tm-space-scale': String(tokens.spaceScale),
		}))
			rule.style.setProperty(key, value)
		for (const key of ['surfaceMix', 'typeScale', 'spaceScale'])
			root.querySelector(`[data-output="${key}"]`).textContent =
				key === 'surfaceMix' ? `${tokens[key]}%` : `${tokens[key].toFixed(2)}×`
		for (const button of controls.querySelectorAll('[data-theme]'))
			button.setAttribute('aria-pressed', String(button.dataset.theme === preset))
		root.querySelector('[data-theme-status]').textContent =
			`${preset[0].toUpperCase() + preset.slice(1)} / ${custom ? 'customized' : 'original'}`
		const ratio = contrastRatio(tokens.bg, tokens.ink)
		root.querySelector('[data-theme-contrast]').textContent =
			`Paper / ink: ${ratio.toFixed(2)}:1 · ${ratio >= 4.5 ? 'passes' : 'below'} normal-text AA contrast. Button text adapts to the accent.`
		code.textContent = [
			`// One live dyss rule supplies every component token.`,
			`const rule = sheet.get('${selector}');`,
			`rule.style.setProperty('--tm-bg', '${tokens.bg}');`,
			`rule.style.setProperty('--tm-ink', '${tokens.ink}');`,
			`rule.style.setProperty('--tm-accent', '${tokens.accent}');`,
			`rule.style.setProperty('--tm-accent-ink', '${readableInk(tokens.accent)}');`,
			`rule.style.setProperty('--tm-surface-mix', '${tokens.surfaceMix}%');`,
			`rule.style.setProperty('--tm-type-scale', '${tokens.typeScale}');`,
			`rule.style.setProperty('--tm-space-scale', '${tokens.spaceScale}');`,
		].join('\n')
	}
	controls.addEventListener('submit', event => event.preventDefault())
	controls.addEventListener('input', event => {
		const input = event.target,
			key = input.dataset.token
		if (!key) return
		if (['bg', 'ink', 'accent'].includes(key)) {
			const value = normalizeHex(input.value)
			if (!value) return
			tokens[key] = value
			for (const peer of controls.querySelectorAll(`[data-token="${key}"]`))
				if (peer !== input) peer.value = peer.type === 'text' ? value.slice(1) : value
		} else tokens[key] = Number(input.value)
		render(true)
	})
	controls.addEventListener(
		'blur',
		event => {
			const input = event.target
			const key = input.dataset.token
			if (input.type !== 'text' || !['bg', 'ink', 'accent'].includes(key)) return
			input.value = tokens[key].slice(1)
		},
		true,
	)
	controls.addEventListener('click', event => {
		const name = event.target.dataset.theme
		if (name && themes[name]) preset = name
		if (name || event.target.matches('[data-theme-reset]')) {
			tokens = { ...themes[preset] }
			syncControls()
			render()
		}
	})
	const save = root.querySelector('[data-theme-save]')
	save.addEventListener('click', () => {
		saved = !saved
		save.setAttribute('aria-pressed', String(saved))
		save.textContent = saved ? 'Saved to your list' : 'Save for later'
		root.querySelector('[data-theme-save-note]').textContent = saved
			? 'One good idea, kept for later.'
			: 'Build a little reading space.'
	})
	syncControls()
	render()
	return () => sheet.destroy()
}
registerDemo('[data-dyss-theme-demo]', mountThemeMixer)
