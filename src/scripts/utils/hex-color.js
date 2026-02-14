export function normalizeHex(value) {
	const raw = String(value).trim().replace(/^#/, '');
	if (raw.length === 3 && /^[0-9a-fA-F]{3}$/.test(raw)) {
		return `#${raw
			.split('')
			.map((char) => char + char)
			.join('')
			.toLowerCase()}`;
	}
	if (raw.length === 6 && /^[0-9a-fA-F]{6}$/.test(raw)) {
		return `#${raw.toLowerCase()}`;
	}
	return null;
}

export function toHexFieldValue(value) {
	return String(value).replace(/^#/, '');
}

export function sanitizeHexInput(input) {
	const cleaned = String(input.value)
		.replace(/^#/, '')
		.replace(/[^0-9a-fA-F]/g, '')
		.slice(0, 6)
		.toLowerCase();
	if (input.value !== cleaned) input.value = cleaned;
	return cleaned;
}

export function parseHexInputValue(value, allowShort = false) {
	const raw = String(value).trim().replace(/^#/, '');
	if (raw.length === 6) return normalizeHex(raw);
	if (allowShort && raw.length === 3) return normalizeHex(raw);
	return null;
}
