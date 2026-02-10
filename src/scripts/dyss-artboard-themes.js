import Sheet from 'dyss';

const themes = {
	signal: {
		name: 'Signal',
		bg: '#f6f1e8',
		ink: '#14161a',
		accent: '#c21f2b',
		surface: '#fff7ee',
		border: 'rgba(20, 22, 26, 0.14)',
		shadow: 'rgba(12, 14, 16, 0.12)'
	},
	noir: {
		name: 'Noir',
		bg: '#0d1220',
		ink: '#f2eee4',
		accent: '#5bd6c1',
		surface: '#141b2d',
		border: 'rgba(240, 240, 240, 0.16)',
		shadow: 'rgba(0, 0, 0, 0.45)'
	},
	studio: {
		name: 'Studio',
		bg: '#eef5ff',
		ink: '#12243d',
		accent: '#4a3bd6',
		surface: '#f9fbff',
		border: 'rgba(18, 36, 61, 0.16)',
		shadow: 'rgba(12, 18, 28, 0.18)'
	}
};

function updateCode(code, selector, theme) {
	code.textContent = [
		`const theme = ${JSON.stringify(theme, null, 2)};`,
		'',
		`sheet.updateSet('${selector}', {`,
		`  '--ab-bg': theme.bg,`,
		`  '--ab-ink': theme.ink,`,
		`  '--ab-accent': theme.accent,`,
		`  '--ab-surface': theme.surface,`,
		`  '--ab-border': theme.border,`,
		`  '--ab-shadow': theme.shadow`,
		`});`
	].join('\n');
}

function mountArtboard(root) {
	const preview = root.querySelector('[data-dyss-preview]');
	const code = root.querySelector('[data-dyss-code]');
	const buttons = Array.from(root.querySelectorAll('[data-theme]'));

	if (!preview || !code || buttons.length === 0) return;

	const sheet = new Sheet();
	const className = `artboard-${Math.random().toString(36).slice(2, 9)}`;
	const selector = `.artboard.${className}`;
	preview.classList.add(className);

	sheet.add(selector, {
		'--ab-bg': themes.signal.bg,
		'--ab-ink': themes.signal.ink,
		'--ab-accent': themes.signal.accent,
		'--ab-surface': themes.signal.surface,
		'--ab-border': themes.signal.border,
		'--ab-shadow': themes.signal.shadow
	});

	const artboardRule = sheet.get(selector);
	if (!artboardRule) return;

	function applyTheme(name) {
		const theme = themes[name] ?? themes.signal;
		artboardRule.style.setProperty('--ab-bg', theme.bg);
		artboardRule.style.setProperty('--ab-ink', theme.ink);
		artboardRule.style.setProperty('--ab-accent', theme.accent);
		artboardRule.style.setProperty('--ab-surface', theme.surface);
		artboardRule.style.setProperty('--ab-border', theme.border);
		artboardRule.style.setProperty('--ab-shadow', theme.shadow);
		updateCode(code, selector, theme);
		buttons.forEach((button) => {
			button.setAttribute('aria-pressed', button.getAttribute('data-theme') === name ? 'true' : 'false');
		});
	}

	buttons.forEach((button) => {
		button.addEventListener('click', () => {
			const name = button.getAttribute('data-theme');
			if (!name) return;
			applyTheme(name);
		});
	});

	applyTheme('signal');
}

const demo = document.querySelector('[data-dyss-artboard]');
if (demo) mountArtboard(demo);
