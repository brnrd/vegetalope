export function viewTransitionNameFromPath(path: string): string {
	const pathname = path.split(/[?#]/, 1)[0] || '/'
	const slug = pathname
		.replace(/^\/+|\/+$/g, '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')

	return `page-title-${slug || 'home'}`
}

export const pageContentTransition = {
	forwards: {
		old: {
			name: 'vegetalopeContentOut',
			duration: '90ms',
			easing: 'ease-out',
			fillMode: 'both',
		},
		new: {
			name: 'vegetalopeContentInFromRight',
			duration: '180ms',
			easing: 'cubic-bezier(0.2, 0.7, 0.2, 1)',
			fillMode: 'both',
		},
	},
	backwards: {
		old: {
			name: 'vegetalopeContentOut',
			duration: '90ms',
			easing: 'ease-out',
			fillMode: 'both',
		},
		new: {
			name: 'vegetalopeContentInFromLeft',
			duration: '180ms',
			easing: 'cubic-bezier(0.2, 0.7, 0.2, 1)',
			fillMode: 'both',
		},
	},
}
