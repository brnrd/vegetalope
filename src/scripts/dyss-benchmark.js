import Sheet from 'dyss'

const METHOD_CLASSES = [
	'is-inline',
	'is-vars',
	'is-class-toggle',
	'is-cssom',
	'is-constructed',
	'is-dyss',
	'is-css-text',
	'is-rerender',
]
const MAX_STATE_COUNT = 36
const STATE_CLASS_PREFIX = 'bench-state-'
const DEFAULT_STAGE_STATE = {
	backgroundColor: '#d7d1c4',
	borderColor: '#776b5f',
	outlineColor: 'rgba(255,255,255,0.38)',
	boxShadow: 'none',
	transform: 'translate3d(0, 0, 0) scale(1)',
}

function clamp(value, min, max) {
	return Math.min(max, Math.max(min, value))
}

function toNumber(value, fallback) {
	const number = Number(value)
	return Number.isFinite(number) ? number : fallback
}

function formatMs(value) {
	return `${value.toFixed(3)} ms`
}

function median(values) {
	const sorted = [...values].sort((a, b) => a - b)
	const middle = Math.floor(sorted.length / 2)
	if (sorted.length % 2 === 0) {
		return (sorted[middle - 1] + sorted[middle]) / 2
	}
	return sorted[middle]
}

function createState(index) {
	const hue = (index * 29) % 360
	const offset = ((index % 7) - 3) * 0.6
	const scale = 1 + ((index % 5) - 2) * 0.015

	return {
		backgroundColor: `hsl(${hue} 78% 60%)`,
		borderColor: `hsl(${(hue + 42) % 360} 72% 34%)`,
		outlineColor: `hsl(${(hue + 180) % 360} 84% 94% / 0.48)`,
		boxShadow: `0 ${2 + (index % 4)}px ${5 + (index % 5)}px hsl(${
			(hue + 210) % 360
		} 42% 24% / 0.18)`,
		transform: `translate3d(${offset.toFixed(2)}px, ${(-offset).toFixed(
			2,
		)}px, 0) scale(${scale.toFixed(3)})`,
	}
}

function clearMethodClasses(stage) {
	stage.classList.remove(...METHOD_CLASSES)
}

function activateMethod(stage, className) {
	clearMethodClasses(stage)
	stage.classList.add(className)
}

function clearStateClasses(stage) {
	for (const className of [...stage.classList]) {
		if (className.startsWith(STATE_CLASS_PREFIX)) {
			stage.classList.remove(className)
		}
	}
}

function applyStageVars(stage, state) {
	stage.style.setProperty('--bench-bg', state.backgroundColor)
	stage.style.setProperty('--bench-border', state.borderColor)
	stage.style.setProperty('--bench-outline', state.outlineColor)
	stage.style.setProperty('--bench-shadow', state.boxShadow)
	stage.style.setProperty('--bench-transform', state.transform)
}

function buildNodes(stage, count) {
	const fragment = document.createDocumentFragment()
	for (let index = 0; index < count; index += 1) {
		const node = document.createElement('div')
		node.className = 'bench-node'
		node.setAttribute('aria-hidden', 'true')
		fragment.append(node)
	}
	stage.replaceChildren(fragment)
	return Array.from(stage.children)
}

function buildStyledNodes(stage, count, state) {
	const fragment = document.createDocumentFragment()
	for (let index = 0; index < count; index += 1) {
		const node = document.createElement('div')
		node.className = 'bench-node'
		node.setAttribute('aria-hidden', 'true')
		node.style.backgroundColor = state.backgroundColor
		node.style.borderColor = state.borderColor
		node.style.outlineColor = state.outlineColor
		node.style.boxShadow = state.boxShadow
		node.style.transform = state.transform
		fragment.append(node)
	}
	stage.replaceChildren(fragment)
	return Array.from(stage.children)
}

function clearInlineStyles(nodes) {
	for (const node of nodes) {
		if (node instanceof HTMLElement) node.removeAttribute('style')
	}
}

function forceStyleRead(nodes) {
	const target = nodes[nodes.length - 1]
	if (!(target instanceof HTMLElement)) return
	window.getComputedStyle(target).backgroundColor
}

function nextFrame() {
	return new Promise(resolve => window.requestAnimationFrame(() => resolve()))
}

function createCssomRule() {
	const styleEl = document.createElement('style')
	styleEl.setAttribute('data-dyss-benchmark-style', '')
	document.head.append(styleEl)

	const sheet = styleEl.sheet
	if (!(sheet instanceof CSSStyleSheet)) return null

	sheet.insertRule('.dyss-benchmark-stage.is-cssom .bench-node {}', sheet.cssRules.length)
	const rule = sheet.cssRules[sheet.cssRules.length - 1]
	return rule instanceof CSSStyleRule ? rule : null
}

function createConstructedRule() {
	if (
		typeof CSSStyleSheet === 'undefined' ||
		!('replaceSync' in CSSStyleSheet.prototype) ||
		!('adoptedStyleSheets' in document)
	) {
		return null
	}

	const sheet = new CSSStyleSheet()
	sheet.replaceSync('.dyss-benchmark-stage.is-constructed .bench-node {}')
	document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet]

	const rule = sheet.cssRules[0]
	return rule instanceof CSSStyleRule ? rule : null
}

function createDyssRule() {
	const sheet = new Sheet()
	const selector = '.dyss-benchmark-stage.is-dyss .bench-node'
	sheet.add(selector, {})
	return { sheet, selector }
}

function createCssTextWriter() {
	const styleEl = document.createElement('style')
	styleEl.setAttribute('data-dyss-benchmark-css-text', '')
	document.head.append(styleEl)
	return styleEl
}

function writeCssText(styleEl, state) {
	styleEl.textContent = `
.dyss-benchmark-stage.is-css-text .bench-node {
	background-color: ${state.backgroundColor};
	border-color: ${state.borderColor};
	outline-color: ${state.outlineColor};
	box-shadow: ${state.boxShadow};
	transform: ${state.transform};
}
`
}

function createClassToggleSheet() {
	const styleEl = document.createElement('style')
	styleEl.setAttribute('data-dyss-benchmark-class-toggle', '')
	document.head.append(styleEl)

	const sheet = styleEl.sheet
	if (!(sheet instanceof CSSStyleSheet)) return null

	for (let index = 1; index <= MAX_STATE_COUNT; index += 1) {
		const state = createState(index)
		sheet.insertRule(
			`.dyss-benchmark-stage.is-class-toggle.${STATE_CLASS_PREFIX}${index} .bench-node {
				background-color: ${state.backgroundColor};
				border-color: ${state.borderColor};
				outline-color: ${state.outlineColor};
				box-shadow: ${state.boxShadow};
				transform: ${state.transform};
			}`,
			sheet.cssRules.length,
		)
	}

	return sheet
}

function computeMetrics(samples) {
	const total = samples.reduce((sum, value) => sum + value, 0)
	return {
		average: total / samples.length,
		median: median(samples),
		best: Math.min(...samples),
		worst: Math.max(...samples),
	}
}

function renderResults(tbody, winner, results) {
	tbody.replaceChildren()

	if (!results.length) {
		winner.textContent = 'Results will appear here after the first run.'
		return
	}

	const sorted = [...results].sort((a, b) => a.metrics.average - b.metrics.average)
	const fastest = sorted[0]
	const slowest = sorted[sorted.length - 1]
	const baseline = fastest.metrics.average || Number.EPSILON
	const multiplier = slowest.metrics.average / baseline

	winner.textContent = `${fastest.label} was fastest on average (${formatMs(
		fastest.metrics.average,
	)}). ${slowest.label} was ${multiplier.toFixed(2)}x slower.`

	for (const result of sorted) {
		const row = document.createElement('tr')
		const relative = `${(result.metrics.average / baseline).toFixed(2)}x`

		row.innerHTML = `
			<td>${result.label}</td>
			<td>${formatMs(result.metrics.average)}</td>
			<td>${formatMs(result.metrics.median)}</td>
			<td>${formatMs(result.metrics.best)}</td>
			<td>${formatMs(result.metrics.worst)}</td>
			<td>${relative}</td>
			<td>${result.writeScope}</td>
		`

		tbody.append(row)
	}
}

function setActiveCodeTab(root, methodId) {
	const tabs = root.querySelectorAll('[data-benchmark-code-tab]')
	const panels = root.querySelectorAll('[data-benchmark-code-panel]')

	for (const tab of tabs) {
		if (!(tab instanceof HTMLButtonElement)) continue
		const isActive = tab.getAttribute('data-benchmark-code-tab') === methodId
		tab.setAttribute('aria-selected', isActive ? 'true' : 'false')
		tab.tabIndex = isActive ? 0 : -1
	}

	for (const panel of panels) {
		if (!(panel instanceof HTMLElement)) continue
		panel.hidden = panel.getAttribute('data-benchmark-code-panel') !== methodId
	}
}

async function mountBenchmark(root) {
	const countInput = root.querySelector('[data-benchmark-count]')
	const countOutput = root.querySelector('[data-benchmark-count-output]')
	const samplesInput = root.querySelector('[data-benchmark-samples]')
	const samplesOutput = root.querySelector('[data-benchmark-samples-output]')
	const flushInput = root.querySelector('[data-benchmark-flush]')
	const runButton = root.querySelector('[data-benchmark-run]')
	const status = root.querySelector('[data-benchmark-status]')
	const supportNote = root.querySelector('[data-benchmark-support-note]')
	const winner = root.querySelector('[data-benchmark-winner]')
	const activeMethod = root.querySelector('[data-benchmark-active-method]')
	const tbody = root.querySelector('[data-benchmark-results]')
	const stage = root.querySelector('[data-benchmark-stage]')

	if (
		!(countInput instanceof HTMLInputElement) ||
		!(countOutput instanceof HTMLOutputElement) ||
		!(samplesInput instanceof HTMLInputElement) ||
		!(samplesOutput instanceof HTMLOutputElement) ||
		!(flushInput instanceof HTMLInputElement) ||
		!(runButton instanceof HTMLButtonElement) ||
		!(status instanceof HTMLElement) ||
		!(supportNote instanceof HTMLElement) ||
		!(winner instanceof HTMLElement) ||
		!(activeMethod instanceof HTMLElement) ||
		!(tbody instanceof HTMLTableSectionElement) ||
		!(stage instanceof HTMLElement)
	) {
		return
	}

	createClassToggleSheet()
	const cssomRule = createCssomRule()
	const constructedRule = createConstructedRule()
	const dyssHandle = createDyssRule()
	const cssTextStyle = createCssTextWriter()
	let currentCount = 0
	let nodes = []

	function resetStageSurface() {
		clearMethodClasses(stage)
		clearStateClasses(stage)
		stage.classList.add('is-vars')
		applyStageVars(stage, DEFAULT_STAGE_STATE)
		if (currentCount > 0) {
			nodes = buildNodes(stage, currentCount)
		}
	}

	const methods = [
		{
			id: 'inline',
			className: 'is-inline',
			label: 'Inline styles',
			writeScope: () => `${nodes.length} elements x 5 props`,
			prepare() {
				clearStateClasses(stage)
				activateMethod(stage, this.className)
			},
			apply(state) {
				for (const node of nodes) {
					if (!(node instanceof HTMLElement)) continue
					node.style.backgroundColor = state.backgroundColor
					node.style.borderColor = state.borderColor
					node.style.outlineColor = state.outlineColor
					node.style.boxShadow = state.boxShadow
					node.style.transform = state.transform
				}
			},
		},
		{
			id: 'vars',
			className: 'is-vars',
			label: 'Parent CSS vars',
			writeScope: () => '1 parent x 5 vars',
			prepare() {
				clearInlineStyles(nodes)
				clearStateClasses(stage)
				activateMethod(stage, this.className)
			},
			apply(state) {
				applyStageVars(stage, state)
			},
		},
		{
			id: 'class-toggle',
			className: 'is-class-toggle',
			label: 'Class toggle',
			writeScope: () => '1 parent class swap',
			prepare() {
				clearInlineStyles(nodes)
				clearStateClasses(stage)
				activateMethod(stage, this.className)
			},
			apply(_, index = 1) {
				clearStateClasses(stage)
				stage.classList.add(`${STATE_CLASS_PREFIX}${index}`)
			},
		},
		{
			id: 'cssom',
			className: 'is-cssom',
			label: 'Raw CSSOM rule',
			writeScope: () => '1 rule x 5 props',
			prepare() {
				clearInlineStyles(nodes)
				clearStateClasses(stage)
				activateMethod(stage, this.className)
			},
			apply(state) {
				if (!(cssomRule instanceof CSSStyleRule)) return
				cssomRule.style.setProperty('background-color', state.backgroundColor)
				cssomRule.style.setProperty('border-color', state.borderColor)
				cssomRule.style.setProperty('outline-color', state.outlineColor)
				cssomRule.style.setProperty('box-shadow', state.boxShadow)
				cssomRule.style.setProperty('transform', state.transform)
			},
		},
	]

	if (constructedRule instanceof CSSStyleRule) {
		supportNote.textContent = 'Constructed stylesheet benchmark is available in this browser.'
		methods.push({
			id: 'constructed',
			className: 'is-constructed',
			label: 'Constructed sheet',
			writeScope: () => '1 adopted rule x 5 props',
			prepare() {
				clearInlineStyles(nodes)
				clearStateClasses(stage)
				activateMethod(stage, this.className)
			},
			apply(state) {
				constructedRule.style.setProperty('background-color', state.backgroundColor)
				constructedRule.style.setProperty('border-color', state.borderColor)
				constructedRule.style.setProperty('outline-color', state.outlineColor)
				constructedRule.style.setProperty('box-shadow', state.boxShadow)
				constructedRule.style.setProperty('transform', state.transform)
			},
		})
	} else {
		supportNote.textContent =
			'Constructed stylesheet benchmark is skipped here because this browser does not support document.adoptedStyleSheets plus replaceSync().'
	}

	methods.push(
		{
			id: 'dyss',
			className: 'is-dyss',
			label: 'dyss.updateSet()',
			writeScope: () => '1 helper call',
			prepare() {
				clearInlineStyles(nodes)
				clearStateClasses(stage)
				activateMethod(stage, this.className)
			},
			apply(state) {
				dyssHandle.sheet.updateSet(dyssHandle.selector, {
					backgroundColor: state.backgroundColor,
					borderColor: state.borderColor,
					outlineColor: state.outlineColor,
					boxShadow: state.boxShadow,
					transform: state.transform,
				})
			},
		},
		{
			id: 'css-text',
			className: 'is-css-text',
			label: 'CSS-in-JS style tag',
			writeScope: () => '1 stylesheet string rewrite',
			prepare() {
				clearInlineStyles(nodes)
				clearStateClasses(stage)
				activateMethod(stage, this.className)
			},
			apply(state) {
				writeCssText(cssTextStyle, state)
			},
		},
		{
			id: 'rerender',
			className: 'is-rerender',
			label: 'Full rerender',
			writeScope: () => `${currentCount} nodes rebuilt`,
			prepare() {
				clearStateClasses(stage)
				activateMethod(stage, this.className)
			},
			apply(state) {
				nodes = buildStyledNodes(stage, currentCount, state)
			},
		},
	)

	function syncOutputs() {
		countOutput.value = countInput.value
		countOutput.textContent = countInput.value
		samplesOutput.value = samplesInput.value
		samplesOutput.textContent = samplesInput.value
	}

	function syncNodes() {
		const desired = clamp(toNumber(countInput.value, 1200), 200, 4000)
		if (desired === currentCount) return
		currentCount = desired
		nodes = buildNodes(stage, desired)
		status.textContent = `Prepared ${desired} elements.`
	}

	async function runBenchmark() {
		syncOutputs()
		syncNodes()

		const sampleCount = clamp(toNumber(samplesInput.value, 18), 6, 36)
		const shouldFlush = flushInput.checked
		const states = Array.from({ length: sampleCount }, (_, index) => createState(index + 1))
		const results = []

		runButton.disabled = true
		status.textContent = `Running ${methods.length} methods across ${currentCount} elements...`

		try {
			for (const method of methods) {
				activeMethod.textContent = method.label
				status.textContent = `Running ${method.label}...`
				setActiveCodeTab(root, method.id)
				method.prepare()
				method.apply(states[0], 1)
				if (shouldFlush) forceStyleRead(nodes)

				await nextFrame()

				const samples = []
				for (const [index, state] of states.entries()) {
					const start = performance.now()
					method.apply(state, index + 1)
					if (shouldFlush) forceStyleRead(nodes)
					samples.push(performance.now() - start)
				}

				results.push({
					id: method.id,
					label: method.label,
					writeScope: method.writeScope(),
					metrics: computeMetrics(samples),
				})

				renderResults(tbody, winner, results)
				await nextFrame()
			}

			status.textContent = `Finished ${methods.length} comparisons across ${currentCount} elements.`
		} finally {
			resetStageSurface()
			activeMethod.textContent = 'Idle'
			runButton.disabled = false
		}
	}

	syncOutputs()
	syncNodes()
	resetStageSurface()
	setActiveCodeTab(root, 'inline')

	countInput.addEventListener('input', syncOutputs)
	samplesInput.addEventListener('input', syncOutputs)
	countInput.addEventListener('change', () => {
		syncNodes()
		resetStageSurface()
	})
	runButton.addEventListener('click', () => {
		void runBenchmark()
	})

	root.addEventListener('click', event => {
		const target = event.target
		if (!(target instanceof HTMLButtonElement)) return
		const methodId = target.getAttribute('data-benchmark-code-tab')
		if (!methodId) return
		setActiveCodeTab(root, methodId)
	})
}

const root = document.querySelector('[data-dyss-benchmark]')
if (root instanceof HTMLElement) {
	void mountBenchmark(root)
}
