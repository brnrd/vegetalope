import Sheet from 'dyss'
import { registerDemo } from './dyss-demo-lifecycle.js'
const paragraphs = [
	'During the first week of the trial, the team replaced the morning status meeting with a short written update. People reported fewer interruptions and more time to finish a piece of work before switching context.',
	'The change did not make every conversation unnecessary. Questions with several possible answers still benefited from a shared discussion. The most useful updates made uncertainty visible rather than presenting every decision as settled.',
	'For the next trial, we will keep the written update and reserve a small window for open questions. We should compare the experience across different roles before deciding whether to make the change permanent.',
]
const defaults = [
	{ id: 'c1', label: 'Evidence', value: '#5a9fbb' },
	{ id: 'c2', label: 'Question', value: '#dcb74f' },
	{ id: 'c3', label: 'Follow-up', value: '#bc839d' },
]
function mountDemo(root) {
	const find = selector => root.querySelector(selector)
	const words = find('[data-dyss-words]'),
		palette = find('[data-dyss-palette]')
	const add = find('[data-dyss-add-color]'),
		clear = find('[data-dyss-clear]')
	const apply = find('[data-highlight-apply]'),
		undo = find('[data-highlight-undo]')
	const confirmation = find('[data-highlight-confirm]'),
		cancel = find('[data-highlight-cancel]')
	const selectionOutput = find('[data-highlight-selection]'),
		status = find('[data-highlight-status]')
	const example = find('[data-highlight-example]'),
		code = find('[data-dyss-code]')
	const sheet = new Sheet(),
		scope = `annotations-${Math.random().toString(36).slice(2, 9)}`
	root.classList.add(scope)
	let colors = defaults.map(color => ({ ...color })),
		active = 'c1',
		nextId = 4
	let highlights = new Map(),
		selected = [],
		past = []
	let strokeCount = 0,
		layoutFrame = 0,
		disposed = false,
		selecting = false
	const strokes = document.createElement('span')
	strokes.className = 'annotation-strokes'
	strokes.setAttribute('aria-hidden', 'true')
	words.append(strokes)
	const wordElements = []
	for (const paragraph of paragraphs) {
		const p = document.createElement('p')
		for (const token of paragraph.split(/\s+/)) {
			const word = document.createElement('span')
			word.className = 'word'
			word.dataset.wordIndex = wordElements.length
			const text = document.createElement('span')
			text.className = 'word-text'
			text.textContent = token
			word.append(text)
			p.append(word, document.createTextNode(' '))
			wordElements.push(word)
		}
		words.append(p)
	}
	function updateColors() {
		for (const color of colors) {
			sheet.updateSet(`.${scope} .hl-${color.id}`, { backgroundColor: color.value })
			sheet.updateSet(`.${scope} .swatch-${color.id}`, { backgroundColor: color.value })
		}
		const current = colors.find(color => color.id === active)
		code.textContent = [
			`// A single rule recolors every annotation in this group.`,
			`sheet.updateSet('.${scope} .hl-${active}', {`,
			`  backgroundColor: '${current.value}'`,
			`});`,
			'',
			`// Adjacent words share one stroke per group on each rendered line.`,
			`<span class="hl-layer hl-${active}"></span>`,
		].join('\n')
		if (selected.length) renderStrokes()
	}
	function renderPalette() {
		palette.replaceChildren()
		for (const color of colors) {
			const row = document.createElement('div')
			row.className = 'annotation-group'
			row.dataset.id = color.id
			const button = document.createElement('button')
			button.type = 'button'
			button.className = `annotation-swatch swatch-${color.id}`
			button.dataset.choose = ''
			button.setAttribute('aria-label', `Use ${color.label}`)
			button.setAttribute('aria-pressed', String(active === color.id))
			const label = document.createElement('input')
			label.value = color.label
			label.dataset.field = 'label'
			label.maxLength = 24
			label.setAttribute('aria-label', 'Annotation group name')
			const picker = document.createElement('input')
			picker.type = 'color'
			picker.value = color.value
			picker.dataset.field = 'value'
			picker.setAttribute('aria-label', `${color.label} highlight color`)
			const remove = document.createElement('button')
			remove.type = 'button'
			remove.dataset.remove = ''
			remove.textContent = '×'
			remove.disabled = colors.length <= 1
			remove.setAttribute('aria-label', `Remove ${color.label}`)
			row.append(button, label, picker, remove)
			palette.append(row)
		}
		add.disabled = colors.length >= 6
		updateColors()
	}
	function snapshot() {
		return [...highlights].map(([index, ids]) => [index, [...ids]])
	}
	function remember() {
		past.push(snapshot())
		if (past.length > 30) past.shift()
	}
	function renderStrokes() {
		const origin = words.getBoundingClientRect()
		const fontSize = parseFloat(getComputedStyle(words).fontSize)
		// Read the text layout before adding layers, so a phrase also joins across its spaces.
		const boxes = wordElements.map(word => ({
			rect: word.getBoundingClientRect(),
			paragraph: word.parentElement,
		}))
		const segments = []
		const pending = new Set(selected)
		for (const color of colors) {
			let segment = null
			boxes.forEach(({ rect, paragraph }, index) => {
				if (!highlights.get(index)?.has(color.id) && !(color.id === active && pending.has(index))) {
					segment = null
					return
				}
				if (segment && segment.paragraph === paragraph && Math.abs(segment.top - rect.top) < 1) {
					segment.right = rect.right
				} else {
					segment = {
						color: color.id,
						paragraph,
						left: rect.left,
						right: rect.right,
						top: rect.top,
						height: rect.height,
					}
					segments.push(segment)
				}
			})
		}
		const fragment = document.createDocumentFragment()
		segments.forEach((segment, index) => {
			const layer = document.createElement('span')
			layer.className = `hl-layer hl-${segment.color} annotation-stroke-${index}`
			fragment.append(layer)
			sheet.updateSet(`.${scope} .annotation-stroke-${index}`, {
				left: `${segment.left - origin.left - fontSize * 0.04}px`,
				top: `${segment.top - origin.top + fontSize * 0.18}px`,
				width: `${segment.right - segment.left + fontSize * 0.08}px`,
				height: `${segment.height - fontSize * 0.28}px`,
			})
		})
		for (let index = segments.length; index < strokeCount; index++)
			sheet.remove(`.${scope} .annotation-stroke-${index}`)
		strokeCount = segments.length
		strokes.replaceChildren(fragment)
		positionConfirmation()
	}
	function positionConfirmation() {
		if (!selected.length || selecting) {
			confirmation.hidden = true
			return
		}
		const end = wordElements[selected.at(-1)].getBoundingClientRect()
		if (end.bottom < 0 || end.top > window.innerHeight) {
			confirmation.hidden = true
			return
		}
		confirmation.hidden = false
		const paper = words.closest('.annotation-paper'),
			bounds = paper.getBoundingClientRect()
		const width = confirmation.offsetWidth,
			height = confirmation.offsetHeight
		const minLeft = Math.max(bounds.left + 4, 8)
		const maxLeft = Math.max(minLeft, Math.min(bounds.right - 4, window.innerWidth - 8) - width)
		const left = Math.max(minLeft, Math.min(maxLeft, end.right - width / 2))
		const above = end.top - height - 8
		const below = above < 8
		const top = Math.max(
			8,
			Math.min(window.innerHeight - height - 8, below ? end.bottom + 8 : above),
		)
		confirmation.dataset.placement = below ? 'below' : 'above'
		sheet.updateSet(`.${scope} .annotation-confirm`, {
			left: `${left - bounds.left - paper.clientLeft}px`,
			top: `${top - bounds.top - paper.clientTop}px`,
		})
		sheet.updateSet(`.${scope} .annotation-confirm::after`, {
			left: `${Math.max(8, Math.min(width - 8, end.right - left))}px`,
		})
	}
	function scheduleStrokes() {
		if (layoutFrame || disposed) return
		layoutFrame = requestAnimationFrame(() => {
			layoutFrame = 0
			renderStrokes()
		})
	}
	function renderHighlights() {
		let overlaps = 0,
			count = 0
		wordElements.forEach((word, index) => {
			const ids = highlights.get(index) || new Set()
			if (ids.size) count++
			if (ids.size > 1) overlaps++
		})
		renderStrokes()
		status.textContent = `${count} marked words / ${overlaps} overlaps`
		undo.disabled = past.length === 0
		clear.disabled = count === 0
	}
	function captureSelection() {
		const selection = window.getSelection()
		if (!selection || selection.isCollapsed || !selection.rangeCount) return
		const range = selection.getRangeAt(0)
		if (!words.contains(range.startContainer) || !words.contains(range.endContainer)) {
			clearSelection(false)
			renderStrokes()
			return
		}
		const next = wordElements.flatMap((word, index) =>
			range.intersectsNode(word.querySelector('.word-text')) ? [index] : [],
		)
		const changed =
			next.length !== selected.length || next.some((index, offset) => index !== selected[offset])
		selected = next
		words.toggleAttribute('data-pending', !!selected.length)
		apply.disabled = !selected.length
		selectionOutput.textContent = `${selected.length} words selected`
		if (changed) renderStrokes()
		else positionConfirmation()
	}
	function clearSelection(clearNative = true) {
		selected = []
		words.removeAttribute('data-pending')
		confirmation.hidden = true
		apply.disabled = true
		selectionOutput.textContent = 'No passage selected'
		if (clearNative) window.getSelection()?.removeAllRanges()
	}
	apply.addEventListener('click', () => {
		if (!selected.length) return
		const focused = confirmation.contains(document.activeElement)
		remember()
		for (const index of selected) {
			const ids = highlights.get(index) || new Set()
			ids.add(active)
			highlights.set(index, ids)
		}
		clearSelection()
		renderHighlights()
		if (focused) words.focus({ preventScroll: true })
	})
	function cancelPending() {
		const focused = confirmation.contains(document.activeElement)
		clearSelection()
		renderStrokes()
		if (focused) words.focus({ preventScroll: true })
	}
	cancel.addEventListener('click', cancelPending)
	confirmation.addEventListener('pointerdown', event => event.preventDefault())
	function beginSelection(event) {
		if (event.button !== 0) return
		selecting = true
		clearSelection(false)
		renderStrokes()
	}
	function finishSelection() {
		if (!selecting) return
		selecting = false
		if (window.getSelection()?.isCollapsed) {
			clearSelection(false)
			renderStrokes()
			return
		}
		captureSelection()
		positionConfirmation()
	}
	function outsidePointer(event) {
		if (
			selected.length &&
			!words.contains(event.target) &&
			!confirmation.contains(event.target) &&
			!palette.contains(event.target)
		)
			cancelPending()
	}
	function selectionKey(event) {
		if (!selected.length) return
		if (event.key === 'Escape') {
			event.preventDefault()
			cancelPending()
		} else if (
			event.key === 'Enter' &&
			!event.target.closest('button, input, textarea, select, a, summary')
		) {
			event.preventDefault()
			apply.click()
		}
	}
	undo.addEventListener('click', () => {
		const previous = past.pop()
		if (!previous) return
		highlights = new Map(
			previous.map(([i, ids]) => [i, new Set(ids.filter(id => colors.some(c => c.id === id)))]),
		)
		clearSelection()
		renderHighlights()
	})
	clear.addEventListener('click', () => {
		remember()
		highlights.clear()
		clearSelection()
		renderHighlights()
	})
	function showExample(record = true) {
		if (record) remember()
		highlights.clear()
		;[
			[colors[0].id, 8, 28],
			[colors[1 % colors.length].id, 22, 41],
			[colors[2 % colors.length].id, 84, 104],
		].forEach(([id, start, end]) => {
			for (let i = start; i <= end; i++) {
				const ids = highlights.get(i) || new Set()
				ids.add(id)
				highlights.set(i, ids)
			}
		})
		clearSelection()
		renderHighlights()
	}
	example.addEventListener('click', () => showExample())
	palette.addEventListener('click', event => {
		const target = event.target,
			row = target.closest('[data-id]')
		if (!row) return
		if (target.matches('[data-choose]')) {
			active = row.dataset.id
			for (const button of palette.querySelectorAll('[data-choose]'))
				button.setAttribute(
					'aria-pressed',
					String(button.closest('[data-id]').dataset.id === active),
				)
			updateColors()
		}
		if (target.matches('[data-remove]') && colors.length > 1) {
			past = []
			colors = colors.filter(c => c.id !== row.dataset.id)
			for (const ids of highlights.values()) ids.delete(row.dataset.id)
			sheet.remove(`.${scope} .hl-${row.dataset.id}`)
			sheet.remove(`.${scope} .swatch-${row.dataset.id}`)
			if (active === row.dataset.id) active = colors[0].id
			renderPalette()
			renderHighlights()
		}
	})
	palette.addEventListener('input', event => {
		const target = event.target,
			color = colors.find(c => c.id === target.closest('[data-id]')?.dataset.id)
		if (!color) return
		if (target.dataset.field === 'value') color.value = target.value
		if (target.dataset.field === 'label') {
			color.label = target.value.trim() || 'Untitled'
			target
				.closest('[data-id]')
				.querySelector('[data-choose]')
				.setAttribute('aria-label', `Use ${color.label}`)
		}
		updateColors()
	})
	add.addEventListener('click', () => {
		if (colors.length >= 6) return
		active = `c${nextId++}`
		colors.push({ id: active, label: 'New group', value: '#93af76' })
		renderPalette()
	})
	document.addEventListener('selectionchange', captureSelection)
	words.addEventListener('pointerdown', beginSelection)
	document.addEventListener('pointerdown', outsidePointer)
	document.addEventListener('pointerup', finishSelection)
	document.addEventListener('pointercancel', finishSelection)
	document.addEventListener('keydown', selectionKey)
	window.addEventListener('scroll', positionConfirmation, { passive: true })
	window.addEventListener('resize', positionConfirmation, { passive: true })
	const observer = new ResizeObserver(scheduleStrokes)
	observer.observe(words)
	document.fonts.ready.then(scheduleStrokes)
	renderPalette()
	showExample(false)
	return () => {
		disposed = true
		cancelAnimationFrame(layoutFrame)
		observer.disconnect()
		document.removeEventListener('selectionchange', captureSelection)
		document.removeEventListener('pointerdown', outsidePointer)
		document.removeEventListener('pointerup', finishSelection)
		document.removeEventListener('pointercancel', finishSelection)
		document.removeEventListener('keydown', selectionKey)
		window.removeEventListener('scroll', positionConfirmation)
		window.removeEventListener('resize', positionConfirmation)
		sheet.destroy()
	}
}
registerDemo('[data-dyss-highlight-demo]', mountDemo)
