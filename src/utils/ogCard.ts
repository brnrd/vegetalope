import type { Locale } from '../i18n'

export interface SocialCardProps {
	title: string
	description: string
	pubDate: string
	locale: Locale
}

const escapeXml = (value: string) =>
	value.replace(/[<>&"']/g, character => {
		const entities: Record<string, string> = {
			'<': '&lt;',
			'>': '&gt;',
			'&': '&amp;',
			'"': '&quot;',
			"'": '&apos;',
		}
		return entities[character]
	})

const wrapText = (text: string, maxCharacters: number, maxLines: number) => {
	const words = text.split(/\s+/)
	const lines: string[] = []
	let currentLine = ''

	for (const word of words) {
		const candidate = currentLine ? `${currentLine} ${word}` : word
		if (candidate.length > maxCharacters && currentLine) {
			lines.push(currentLine)
			currentLine = word
		} else {
			currentLine = candidate
		}
	}

	if (currentLine) lines.push(currentLine)
	return lines.slice(0, maxLines)
}

export const renderSocialCard = ({ title, description, pubDate, locale }: SocialCardProps) => {
	const titleLines = wrapText(title, 25, 3)
	const descriptionLines = wrapText(description, 68, 2)
	const titleSize = titleLines.length > 2 ? 72 : 84
	const titleStartY = titleLines.length > 2 ? 185 : 210
	const titleMarkup = titleLines
		.map((line, index) => `<text x="84" y="${titleStartY + index * (titleSize + 8)}" class="title">${escapeXml(line)}</text>`)
		.join('')
	const descriptionMarkup = descriptionLines
		.map((line, index) => `<text x="84" y="${488 + index * 36}" class="description">${escapeXml(line)}</text>`)
		.join('')
	const formattedDate = new Intl.DateTimeFormat(locale === 'fr' ? 'fr-FR' : 'en-GB', {
		day: 'numeric',
		month: 'long',
		year: 'numeric',
	}).format(new Date(pubDate))

	return `
		<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
			<rect width="1200" height="630" fill="#f6f1e8"/>
			<rect x="0" y="0" width="24" height="630" fill="#c21f2b"/>
			<circle cx="1090" cy="94" r="150" fill="#1a2747" opacity="0.06"/>
			<circle cx="1135" cy="545" r="230" fill="#c21f2b" opacity="0.05"/>
			<style>
				.brand { fill: #1a2747; font: 700 24px ui-monospace, monospace; letter-spacing: 7px; }
				.title { fill: #14161a; font: 700 ${titleSize}px Georgia, 'Times New Roman', serif; }
				.description { fill: #3b3f47; font: 400 29px system-ui, sans-serif; }
				.meta { fill: #3b3f47; font: 600 19px ui-monospace, monospace; letter-spacing: 3px; }
			</style>
			<text x="84" y="88" class="brand">VEGETALOPE</text>
			${titleMarkup}
			${descriptionMarkup}
			<text x="84" y="574" class="meta">${escapeXml(formattedDate.toUpperCase())}</text>
			<text x="1116" y="574" text-anchor="end" class="meta">VEGETALOPE.COM</text>
		</svg>
	`
}
