<script>
	import { normalizeHex, parseHexInputValue, sanitizeHexInput, toHexFieldValue } from '../../scripts/utils/hex-color.js';

	export let value = '#000000';
	export let className = '';
	export let pickerAttrs = {};
	export let hexAttrs = {};
	export let onColorChange = null;

	let color = normalizeHex(value) ?? '#000000';
	let hex = toHexFieldValue(color);

	$: {
		const normalizedValue = normalizeHex(value);
		if (normalizedValue && normalizedValue !== color) {
			color = normalizedValue;
			hex = toHexFieldValue(color);
		}
	}

	function emit(source) {
		if (typeof onColorChange === 'function') {
			onColorChange({ value: color, source });
		}
	}

	function onPickerInput(event) {
		const target = event.currentTarget;
		if (!(target instanceof HTMLInputElement)) return;
		color = target.value;
		hex = toHexFieldValue(color);
		emit('picker');
	}

	function onHexInput(event) {
		const target = event.currentTarget;
		if (!(target instanceof HTMLInputElement)) return;
		hex = sanitizeHexInput(target);
		const normalized = parseHexInputValue(hex, false);
		if (normalized) {
			color = normalized;
			emit('hex');
		}
	}

	function onHexBlur(event) {
		const target = event.currentTarget;
		if (!(target instanceof HTMLInputElement)) return;
		hex = sanitizeHexInput(target);
		const normalized = parseHexInputValue(hex, true);
		if (normalized) {
			color = normalized;
			hex = toHexFieldValue(color);
			emit('hex');
			return;
		}
		hex = toHexFieldValue(color);
	}
</script>

<div class={`dyss-color-input ${className}`.trim()}>
	<input type="color" bind:value={color} on:input={onPickerInput} {...pickerAttrs} />
	<span class="dyss-hex-wrap">
		<input
			type="text"
			bind:value={hex}
			maxlength="6"
			autocomplete="off"
			autocapitalize="off"
			spellcheck="false"
			on:input={onHexInput}
			on:blur={onHexBlur}
			{...hexAttrs}
		/>
	</span>
</div>

<style>
	.dyss-color-input {
		--dyss-color-picker-size: 46px;
		--dyss-color-hex-size: 108px;
		--dyss-color-height: 34px;
		display: grid;
		grid-template-columns: var(--dyss-color-picker-size) var(--dyss-color-hex-size);
		inline-size: calc(var(--dyss-color-picker-size) + var(--dyss-color-hex-size));
		gap: 0;
		align-items: center;
	}

	.dyss-color-input input[type='color'] {
		inline-size: var(--dyss-color-picker-size);
		block-size: var(--dyss-color-height);
		padding: 0;
		border: 1px solid var(--hairline);
		border-right: 0;
		border-radius: 0.35rem 0 0 0.35rem;
		background: transparent;
	}

	.dyss-hex-wrap {
		position: relative;
		display: inline-flex;
	}

	.dyss-hex-wrap::before {
		content: '#';
		position: absolute;
		inset-inline-start: 0.5rem;
		inset-block-start: 50%;
		transform: translateY(-50%);
		font-family: var(--font-label);
		font-size: 0.72rem;
		color: var(--color-ink-muted);
		pointer-events: none;
	}

	.dyss-color-input input[type='text'] {
		inline-size: 100%;
		block-size: var(--dyss-color-height);
		padding-inline: 1.1rem 0.5rem;
		border: 1px solid var(--hairline);
		border-radius: 0 0.35rem 0.35rem 0;
		font-family: var(--font-label);
		font-size: 0.72rem;
		letter-spacing: 0.06em;
		text-transform: lowercase;
	}
</style>
