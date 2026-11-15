// WCAG relative luminance for opaque sRGB colors.
export function luminance(hex) {
	const channels = hex
		.slice(1)
		.match(/../g)
		.map(channel => {
			const value = parseInt(channel, 16) / 255
			return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
		})
	return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722
}
export function contrastRatio(a, b) {
	const light = luminance(a),
		dark = luminance(b)
	return (Math.max(light, dark) + 0.05) / (Math.min(light, dark) + 0.05)
}
export function readableInk(background) {
	return contrastRatio(background, '#ffffff') > contrastRatio(background, '#14161a')
		? '#ffffff'
		: '#14161a'
}
