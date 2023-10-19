import * as adapter from '@astrojs/netlify/netlify-functions.js'
import { escape } from 'html-escaper'
/* empty css                                 */ /* empty css                                 */ import rss from '@astrojs/rss'
/* empty css                                */ import 'mime'
import 'cookie'
import 'kleur/colors'
import 'string-width'
import 'path-browserify'
import { compile } from 'path-to-regexp'

const ASTRO_VERSION = '1.6.10'

function createDeprecatedFetchContentFn() {
	return () => {
		throw new Error('Deprecated: Astro.fetchContent() has been replaced with Astro.glob().')
	}
}
function createAstroGlobFn() {
	const globHandler = (importMetaGlobResult, globValue) => {
		let allEntries = [...Object.values(importMetaGlobResult)]
		if (allEntries.length === 0) {
			throw new Error(`Astro.glob(${JSON.stringify(globValue())}) - no matches found.`)
		}
		return Promise.all(allEntries.map(fn => fn()))
	}
	return globHandler
}
function createAstro(filePathname, _site, projectRootStr) {
	const site = _site ? new URL(_site) : void 0
	const referenceURL = new URL(filePathname, `http://localhost`)
	const projectRoot = new URL(projectRootStr)
	return {
		site,
		generator: `Astro v${ASTRO_VERSION}`,
		fetchContent: createDeprecatedFetchContentFn(),
		glob: createAstroGlobFn(),
		resolve(...segments) {
			let resolved = segments.reduce((u, segment) => new URL(segment, u), referenceURL).pathname
			if (resolved.startsWith(projectRoot.pathname)) {
				resolved = '/' + resolved.slice(projectRoot.pathname.length)
			}
			return resolved
		},
	}
}

const escapeHTML = escape
class HTMLString extends String {
	get [Symbol.toStringTag]() {
		return 'HTMLString'
	}
}
const markHTMLString = value => {
	if (value instanceof HTMLString) {
		return value
	}
	if (typeof value === 'string') {
		return new HTMLString(value)
	}
	return value
}
function isHTMLString(value) {
	return Object.prototype.toString.call(value) === '[object HTMLString]'
}

var idle_prebuilt_default = `(self.Astro=self.Astro||{}).idle=t=>{const e=async()=>{await(await t())()};"requestIdleCallback"in window?window.requestIdleCallback(e):setTimeout(e,200)},window.dispatchEvent(new Event("astro:idle"));`

var load_prebuilt_default = `(self.Astro=self.Astro||{}).load=a=>{(async()=>await(await a())())()},window.dispatchEvent(new Event("astro:load"));`

var media_prebuilt_default = `(self.Astro=self.Astro||{}).media=(s,a)=>{const t=async()=>{await(await s())()};if(a.value){const e=matchMedia(a.value);e.matches?t():e.addEventListener("change",t,{once:!0})}},window.dispatchEvent(new Event("astro:media"));`

var only_prebuilt_default = `(self.Astro=self.Astro||{}).only=t=>{(async()=>await(await t())())()},window.dispatchEvent(new Event("astro:only"));`

var visible_prebuilt_default = `(self.Astro=self.Astro||{}).visible=(s,c,n)=>{const r=async()=>{await(await s())()};let i=new IntersectionObserver(e=>{for(const t of e)if(!!t.isIntersecting){i.disconnect(),r();break}});for(let e=0;e<n.children.length;e++){const t=n.children[e];i.observe(t)}},window.dispatchEvent(new Event("astro:visible"));`

var astro_island_prebuilt_default = `var l;{const c={0:t=>t,1:t=>JSON.parse(t,o),2:t=>new RegExp(t),3:t=>new Date(t),4:t=>new Map(JSON.parse(t,o)),5:t=>new Set(JSON.parse(t,o)),6:t=>BigInt(t),7:t=>new URL(t),8:t=>new Uint8Array(JSON.parse(t)),9:t=>new Uint16Array(JSON.parse(t)),10:t=>new Uint32Array(JSON.parse(t))},o=(t,s)=>{if(t===""||!Array.isArray(s))return s;const[e,n]=s;return e in c?c[e](n):void 0};customElements.get("astro-island")||customElements.define("astro-island",(l=class extends HTMLElement{constructor(){super(...arguments);this.hydrate=()=>{if(!this.hydrator||this.parentElement&&this.parentElement.closest("astro-island[ssr]"))return;const s=this.querySelectorAll("astro-slot"),e={},n=this.querySelectorAll("template[data-astro-template]");for(const r of n){const i=r.closest(this.tagName);!i||!i.isSameNode(this)||(e[r.getAttribute("data-astro-template")||"default"]=r.innerHTML,r.remove())}for(const r of s){const i=r.closest(this.tagName);!i||!i.isSameNode(this)||(e[r.getAttribute("name")||"default"]=r.innerHTML)}const a=this.hasAttribute("props")?JSON.parse(this.getAttribute("props"),o):{};this.hydrator(this)(this.Component,a,e,{client:this.getAttribute("client")}),this.removeAttribute("ssr"),window.removeEventListener("astro:hydrate",this.hydrate),window.dispatchEvent(new CustomEvent("astro:hydrate"))}}connectedCallback(){!this.hasAttribute("await-children")||this.firstChild?this.childrenConnectedCallback():new MutationObserver((s,e)=>{e.disconnect(),this.childrenConnectedCallback()}).observe(this,{childList:!0})}async childrenConnectedCallback(){window.addEventListener("astro:hydrate",this.hydrate);let s=this.getAttribute("before-hydration-url");s&&await import(s),this.start()}start(){const s=JSON.parse(this.getAttribute("opts")),e=this.getAttribute("client");if(Astro[e]===void 0){window.addEventListener(\`astro:\${e}\`,()=>this.start(),{once:!0});return}Astro[e](async()=>{const n=this.getAttribute("renderer-url"),[a,{default:r}]=await Promise.all([import(this.getAttribute("component-url")),n?import(n):()=>()=>{}]),i=this.getAttribute("component-export")||"default";if(!i.includes("."))this.Component=a[i];else{this.Component=a;for(const d of i.split("."))this.Component=this.Component[d]}return this.hydrator=r,this.hydrate},s,this)}attributeChangedCallback(){this.hydrator&&this.hydrate()}},l.observedAttributes=["props"],l))}`

function determineIfNeedsHydrationScript(result) {
	if (result._metadata.hasHydrationScript) {
		return false
	}
	return (result._metadata.hasHydrationScript = true)
}
const hydrationScripts = {
	idle: idle_prebuilt_default,
	load: load_prebuilt_default,
	only: only_prebuilt_default,
	media: media_prebuilt_default,
	visible: visible_prebuilt_default,
}
function determinesIfNeedsDirectiveScript(result, directive) {
	if (result._metadata.hasDirectives.has(directive)) {
		return false
	}
	result._metadata.hasDirectives.add(directive)
	return true
}
function getDirectiveScriptText(directive) {
	if (!(directive in hydrationScripts)) {
		throw new Error(`Unknown directive: ${directive}`)
	}
	const directiveScriptText = hydrationScripts[directive]
	return directiveScriptText
}
function getPrescripts(type, directive) {
	switch (type) {
		case 'both':
			return `<style>astro-island,astro-slot{display:contents}</style><script>${
				getDirectiveScriptText(directive) + astro_island_prebuilt_default
			}<\/script>`
		case 'directive':
			return `<script>${getDirectiveScriptText(directive)}<\/script>`
	}
	return ''
}

const defineErrors = errs => errs
const AstroErrorData = defineErrors({
	UnknownCompilerError: {
		code: 1e3,
	},
	StaticRedirectNotAllowed: {
		code: 3001,
		message:
			"Redirects are only available when using output: 'server'. Update your Astro config if you need SSR features.",
		hint: 'See https://docs.astro.build/en/guides/server-side-rendering/#enabling-ssr-in-your-project for more information on how to enable SSR.',
	},
	SSRClientAddressNotAvailableInAdapter: {
		code: 3002,
		message: adapterName =>
			`Astro.clientAddress is not available in the ${adapterName} adapter. File an issue with the adapter to add support.`,
	},
	StaticClientAddressNotAvailable: {
		code: 3003,
		message:
			"Astro.clientAddress is only available when using output: 'server'. Update your Astro config if you need SSR features.",
		hint: 'See https://docs.astro.build/en/guides/server-side-rendering/#enabling-ssr-in-your-project for more information on how to enable SSR.',
	},
	NoMatchingStaticPathFound: {
		code: 3004,
		message: pathName =>
			`A getStaticPaths route pattern was matched, but no matching static path was found for requested path ${pathName}.`,
		hint: possibleRoutes => `Possible dynamic routes being matched: ${possibleRoutes.join(', ')}.`,
	},
	OnlyResponseCanBeReturned: {
		code: 3005,
		message: (route, returnedValue) =>
			`Route ${
				route ? route : ''
			} returned a ${returnedValue}. Only a Response can be returned from Astro files.`,
		hint: 'See https://docs.astro.build/en/guides/server-side-rendering/#response for more information.',
	},
	MissingMediaQueryDirective: {
		code: 3006,
		message: componentName =>
			`Media query not provided for "client:media" directive. A media query similar to <${componentName} client:media="(max-width: 600px)" /> must be provided`,
	},
	NoMatchingRenderer: {
		code: 3007,
		message: (
			componentName,
			componentExtension,
			plural,
			validRenderersCount,
		) => `Unable to render ${componentName}!

${
	validRenderersCount > 0
		? `There ${plural ? 'are' : 'is'} ${validRenderersCount} renderer${
				plural ? 's' : ''
		  } configured in your \`astro.config.mjs\` file,
but ${plural ? 'none were' : 'it was not'} able to server-side render ${componentName}.`
		: `No valid renderer was found ${
				componentExtension
					? `for the .${componentExtension} file extension.`
					: `for this file extension.`
		  }`
}`,
		hint: probableRenderers => `Did you mean to enable the ${probableRenderers} integration?

See https://docs.astro.build/en/core-concepts/framework-components/ for more information on how to install and configure integrations.`,
	},
	NoClientEntrypoint: {
		code: 3008,
		message: (componentName, clientDirective, rendererName) =>
			`${componentName} component has a \`client:${clientDirective}\` directive, but no client entrypoint was provided by ${rendererName}!`,
		hint: 'See https://docs.astro.build/en/reference/integrations-reference/#addrenderer-option for more information on how to configure your renderer.',
	},
	NoClientOnlyHint: {
		code: 3009,
		message: componentName =>
			`Unable to render ${componentName}! When using the \`client:only\` hydration strategy, Astro needs a hint to use the correct renderer.`,
		hint: probableRenderers =>
			`Did you mean to pass client:only="${probableRenderers}"? See https://docs.astro.build/en/reference/directives-reference/#clientonly for more information on client:only`,
	},
	InvalidStaticPathParam: {
		code: 3010,
		message: paramType =>
			`Invalid params given to getStaticPaths path. Expected an object, got ${paramType}`,
		hint: 'See https://docs.astro.build/en/reference/api-reference/#getstaticpaths for more information on getStaticPaths.',
	},
	InvalidGetStaticPathsReturn: {
		code: 3011,
		message: returnType =>
			`Invalid type returned by getStaticPaths. Expected an array, got ${returnType}`,
		hint: 'See https://docs.astro.build/en/reference/api-reference/#getstaticpaths for more information on getStaticPaths.',
	},
	GetStaticPathsDeprecatedRSS: {
		code: 3012,
		message:
			'The RSS helper has been removed from getStaticPaths! Try the new @astrojs/rss package instead.',
		hint: 'See https://docs.astro.build/en/guides/rss/ for more information.',
	},
	GetStaticPathsExpectedParams: {
		code: 3013,
		message: 'Missing or empty required params property on getStaticPaths route',
		hint: 'See https://docs.astro.build/en/reference/api-reference/#getstaticpaths for more information on getStaticPaths.',
	},
	GetStaticPathsInvalidRouteParam: {
		code: 3014,
		message: (key, value) =>
			`Invalid getStaticPaths route parameter for \`${key}\`. Expected a string or number, received \`${typeof value}\` ("${value}")`,
		hint: 'See https://docs.astro.build/en/reference/api-reference/#getstaticpaths for more information on getStaticPaths.',
	},
	GetStaticPathsRequired: {
		code: 3015,
		message:
			'getStaticPaths() function is required for dynamic routes. Make sure that you `export` a `getStaticPaths` function from your dynamic route.',
		hint: `See https://docs.astro.build/en/core-concepts/routing/#dynamic-routes for more information on dynamic routes.

Alternatively, set \`output: "server"\` in your Astro config file to switch to a non-static server build.
See https://docs.astro.build/en/guides/server-side-rendering/ for more information on non-static rendering.`,
	},
	ReservedSlotName: {
		code: 3016,
		message: slotName =>
			`Unable to create a slot named "${slotName}". ${slotName}" is a reserved slot name! Please update the name of this slot.`,
	},
	NoAdapterInstalled: {
		code: 3017,
		message: `Cannot use \`output: 'server'\` without an adapter. Please install and configure the appropriate server adapter for your final deployment.`,
		hint: 'See https://docs.astro.build/en/guides/server-side-rendering/ for more information.',
	},
	NoMatchingImport: {
		code: 3018,
		message: componentName =>
			`Could not render ${componentName}. No matching import has been found for ${componentName}.`,
		hint: 'Please make sure the component is properly imported.',
	},
	UnknownCSSError: {
		code: 4e3,
	},
	CSSSyntaxError: {
		code: 4001,
	},
	UnknownViteError: {
		code: 5e3,
	},
	FailedToLoadModuleSSR: {
		code: 5001,
		message: importName => `Could not import "${importName}".`,
		hint: 'This is often caused by a typo in the import path. Please make sure the file exists.',
	},
	InvalidGlob: {
		code: 5002,
		message: globPattern =>
			`Invalid glob pattern: "${globPattern}". Glob patterns must start with './', '../' or '/'.`,
		hint: 'See https://docs.astro.build/en/guides/imports/#glob-patterns for more information on supported glob patterns.',
	},
	UnknownMarkdownError: {
		code: 6e3,
	},
	MarkdownFrontmatterParseError: {
		code: 6001,
	},
	UnknownConfigError: {
		code: 7e3,
	},
	ConfigNotFound: {
		code: 7001,
		message: configFile => `Unable to resolve --config "${configFile}"! Does the file exist?`,
	},
	ConfigLegacyKey: {
		code: 7002,
		message: legacyConfigKey => `Legacy configuration detected: "${legacyConfigKey}".`,
		hint: 'Please update your configuration to the new format!\nSee https://astro.build/config for more information.',
	},
	UnknownError: {
		code: 99999,
	},
})

function normalizeLF(code) {
	return code.replace(/\r\n|\r(?!\n)|\n/g, '\n')
}
function getErrorDataByCode(code) {
	const entry = Object.entries(AstroErrorData).find(data => data[1].code === code)
	if (entry) {
		return {
			name: entry[0],
			data: entry[1],
		}
	}
}

function codeFrame(src, loc) {
	if (!loc || loc.line === void 0 || loc.column === void 0) {
		return ''
	}
	const lines = normalizeLF(src)
		.split('\n')
		.map(ln => ln.replace(/\t/g, '  '))
	const visibleLines = []
	for (let n = -2; n <= 2; n++) {
		if (lines[loc.line + n]) visibleLines.push(loc.line + n)
	}
	let gutterWidth = 0
	for (const lineNo of visibleLines) {
		let w = `> ${lineNo}`
		if (w.length > gutterWidth) gutterWidth = w.length
	}
	let output = ''
	for (const lineNo of visibleLines) {
		const isFocusedLine = lineNo === loc.line - 1
		output += isFocusedLine ? '> ' : '  '
		output += `${lineNo + 1} | ${lines[lineNo]}
`
		if (isFocusedLine)
			output += `${Array.from({ length: gutterWidth }).join(' ')}  | ${Array.from({
				length: loc.column,
			}).join(' ')}^
`
	}
	return output
}

class AstroError extends Error {
	constructor(props, ...params) {
		var _a
		super(...params)
		this.type = 'AstroError'
		const { code, name, message, stack, location, hint, frame } = props
		this.code = code
		if (name) {
			this.name = name
		} else {
			this.name =
				((_a = getErrorDataByCode(this.code)) == null ? void 0 : _a.name) ?? 'UnknownError'
		}
		if (message) this.message = message
		this.stack = stack ? stack : this.stack
		this.loc = location
		this.hint = hint
		this.frame = frame
	}
	setErrorCode(errorCode) {
		var _a
		this.code = errorCode
		this.name = ((_a = getErrorDataByCode(this.code)) == null ? void 0 : _a.name) ?? 'UnknownError'
	}
	setLocation(location) {
		this.loc = location
	}
	setName(name) {
		this.name = name
	}
	setMessage(message) {
		this.message = message
	}
	setHint(hint) {
		this.hint = hint
	}
	setFrame(source, location) {
		this.frame = codeFrame(source, location)
	}
	static is(err) {
		return err.type === 'AstroError'
	}
}

const PROP_TYPE = {
	Value: 0,
	JSON: 1,
	RegExp: 2,
	Date: 3,
	Map: 4,
	Set: 5,
	BigInt: 6,
	URL: 7,
	Uint8Array: 8,
	Uint16Array: 9,
	Uint32Array: 10,
}
function serializeArray(value, metadata = {}, parents = /* @__PURE__ */ new WeakSet()) {
	if (parents.has(value)) {
		throw new Error(`Cyclic reference detected while serializing props for <${metadata.displayName} client:${metadata.hydrate}>!

Cyclic references cannot be safely serialized for client-side usage. Please remove the cyclic reference.`)
	}
	parents.add(value)
	const serialized = value.map(v => {
		return convertToSerializedForm(v, metadata, parents)
	})
	parents.delete(value)
	return serialized
}
function serializeObject(value, metadata = {}, parents = /* @__PURE__ */ new WeakSet()) {
	if (parents.has(value)) {
		throw new Error(`Cyclic reference detected while serializing props for <${metadata.displayName} client:${metadata.hydrate}>!

Cyclic references cannot be safely serialized for client-side usage. Please remove the cyclic reference.`)
	}
	parents.add(value)
	const serialized = Object.fromEntries(
		Object.entries(value).map(([k, v]) => {
			return [k, convertToSerializedForm(v, metadata, parents)]
		}),
	)
	parents.delete(value)
	return serialized
}
function convertToSerializedForm(value, metadata = {}, parents = /* @__PURE__ */ new WeakSet()) {
	const tag = Object.prototype.toString.call(value)
	switch (tag) {
		case '[object Date]': {
			return [PROP_TYPE.Date, value.toISOString()]
		}
		case '[object RegExp]': {
			return [PROP_TYPE.RegExp, value.source]
		}
		case '[object Map]': {
			return [PROP_TYPE.Map, JSON.stringify(serializeArray(Array.from(value), metadata, parents))]
		}
		case '[object Set]': {
			return [PROP_TYPE.Set, JSON.stringify(serializeArray(Array.from(value), metadata, parents))]
		}
		case '[object BigInt]': {
			return [PROP_TYPE.BigInt, value.toString()]
		}
		case '[object URL]': {
			return [PROP_TYPE.URL, value.toString()]
		}
		case '[object Array]': {
			return [PROP_TYPE.JSON, JSON.stringify(serializeArray(value, metadata, parents))]
		}
		case '[object Uint8Array]': {
			return [PROP_TYPE.Uint8Array, JSON.stringify(Array.from(value))]
		}
		case '[object Uint16Array]': {
			return [PROP_TYPE.Uint16Array, JSON.stringify(Array.from(value))]
		}
		case '[object Uint32Array]': {
			return [PROP_TYPE.Uint32Array, JSON.stringify(Array.from(value))]
		}
		default: {
			if (value !== null && typeof value === 'object') {
				return [PROP_TYPE.Value, serializeObject(value, metadata, parents)]
			} else {
				return [PROP_TYPE.Value, value]
			}
		}
	}
}
function serializeProps(props, metadata) {
	const serialized = JSON.stringify(serializeObject(props, metadata))
	return serialized
}

function serializeListValue(value) {
	const hash = {}
	push(value)
	return Object.keys(hash).join(' ')
	function push(item) {
		if (item && typeof item.forEach === 'function') item.forEach(push)
		else if (item === Object(item))
			Object.keys(item).forEach(name => {
				if (item[name]) push(name)
			})
		else {
			item = item === false || item == null ? '' : String(item).trim()
			if (item) {
				item.split(/\s+/).forEach(name => {
					hash[name] = true
				})
			}
		}
	}
}
function isPromise(value) {
	return !!value && typeof value === 'object' && typeof value.then === 'function'
}

const HydrationDirectivesRaw = ['load', 'idle', 'media', 'visible', 'only']
const HydrationDirectives = new Set(HydrationDirectivesRaw)
const HydrationDirectiveProps = new Set(HydrationDirectivesRaw.map(n => `client:${n}`))
function extractDirectives(displayName, inputProps) {
	let extracted = {
		isPage: false,
		hydration: null,
		props: {},
	}
	for (const [key, value] of Object.entries(inputProps)) {
		if (key.startsWith('server:')) {
			if (key === 'server:root') {
				extracted.isPage = true
			}
		}
		if (key.startsWith('client:')) {
			if (!extracted.hydration) {
				extracted.hydration = {
					directive: '',
					value: '',
					componentUrl: '',
					componentExport: { value: '' },
				}
			}
			switch (key) {
				case 'client:component-path': {
					extracted.hydration.componentUrl = value
					break
				}
				case 'client:component-export': {
					extracted.hydration.componentExport.value = value
					break
				}
				case 'client:component-hydration': {
					break
				}
				case 'client:display-name': {
					break
				}
				default: {
					extracted.hydration.directive = key.split(':')[1]
					extracted.hydration.value = value
					if (!HydrationDirectives.has(extracted.hydration.directive)) {
						throw new Error(
							`Error: invalid hydration directive "${key}". Supported hydration methods: ${Array.from(
								HydrationDirectiveProps,
							).join(', ')}`,
						)
					}
					if (
						extracted.hydration.directive === 'media' &&
						typeof extracted.hydration.value !== 'string'
					) {
						throw new AstroError({
							...AstroErrorData.MissingMediaQueryDirective,
							message: AstroErrorData.MissingMediaQueryDirective.message(displayName),
						})
					}
					break
				}
			}
		} else if (key === 'class:list') {
			if (value) {
				extracted.props[key.slice(0, -5)] = serializeListValue(value)
			}
		} else {
			extracted.props[key] = value
		}
	}
	for (const sym of Object.getOwnPropertySymbols(inputProps)) {
		extracted.props[sym] = inputProps[sym]
	}
	return extracted
}
async function generateHydrateScript(scriptOptions, metadata) {
	const { renderer, result, astroId, props, attrs } = scriptOptions
	const { hydrate, componentUrl, componentExport } = metadata
	if (!componentExport.value) {
		throw new Error(
			`Unable to resolve a valid export for "${metadata.displayName}"! Please open an issue at https://astro.build/issues!`,
		)
	}
	const island = {
		children: '',
		props: {
			uid: astroId,
		},
	}
	if (attrs) {
		for (const [key, value] of Object.entries(attrs)) {
			island.props[key] = escapeHTML(value)
		}
	}
	island.props['component-url'] = await result.resolve(decodeURI(componentUrl))
	if (renderer.clientEntrypoint) {
		island.props['component-export'] = componentExport.value
		island.props['renderer-url'] = await result.resolve(decodeURI(renderer.clientEntrypoint))
		island.props['props'] = escapeHTML(serializeProps(props, metadata))
	}
	island.props['ssr'] = ''
	island.props['client'] = hydrate
	let beforeHydrationUrl = await result.resolve('astro:scripts/before-hydration.js')
	if (beforeHydrationUrl.length) {
		island.props['before-hydration-url'] = beforeHydrationUrl
	}
	island.props['opts'] = escapeHTML(
		JSON.stringify({
			name: metadata.displayName,
			value: metadata.hydrateArgs || '',
		}),
	)
	return island
}

function validateComponentProps(props, displayName) {
	var _a
	if (
		((_a = Object.assign(
			{ BASE_URL: '/', MODE: 'production', DEV: false, PROD: true },
			{ _: process.env._ },
		)) == null
			? void 0
			: _a.DEV) &&
		props != null
	) {
		for (const prop of Object.keys(props)) {
			if (HydrationDirectiveProps.has(prop)) {
				console.warn(
					`You are attempting to render <${displayName} ${prop} />, but ${displayName} is an Astro component. Astro components do not render in the client and should not have a hydration directive. Please use a framework component for client rendering.`,
				)
			}
		}
	}
}
class AstroComponent {
	constructor(htmlParts, expressions) {
		this.htmlParts = htmlParts
		this.error = void 0
		this.expressions = expressions.map(expression => {
			if (isPromise(expression)) {
				return Promise.resolve(expression).catch(err => {
					if (!this.error) {
						this.error = err
						throw err
					}
				})
			}
			return expression
		})
	}
	get [Symbol.toStringTag]() {
		return 'AstroComponent'
	}
	async *[Symbol.asyncIterator]() {
		const { htmlParts, expressions } = this
		for (let i = 0; i < htmlParts.length; i++) {
			const html = htmlParts[i]
			const expression = expressions[i]
			yield markHTMLString(html)
			yield* renderChild(expression)
		}
	}
}
function isAstroComponent(obj) {
	return (
		typeof obj === 'object' && Object.prototype.toString.call(obj) === '[object AstroComponent]'
	)
}
function isAstroComponentFactory(obj) {
	return obj == null ? false : obj.isAstroComponentFactory === true
}
async function* renderAstroComponent(component) {
	for await (const value of component) {
		if (value || value === 0) {
			for await (const chunk of renderChild(value)) {
				switch (chunk.type) {
					case 'directive': {
						yield chunk
						break
					}
					default: {
						yield markHTMLString(chunk)
						break
					}
				}
			}
		}
	}
}
async function renderToString(result, componentFactory, props, children) {
	const Component = await componentFactory(result, props, children)
	if (!isAstroComponent(Component)) {
		const response = Component
		throw response
	}
	let parts = new HTMLParts()
	for await (const chunk of renderAstroComponent(Component)) {
		parts.append(chunk, result)
	}
	return parts.toString()
}
async function renderToIterable(result, componentFactory, displayName, props, children) {
	validateComponentProps(props, displayName)
	const Component = await componentFactory(result, props, children)
	if (!isAstroComponent(Component)) {
		console.warn(
			`Returning a Response is only supported inside of page components. Consider refactoring this logic into something like a function that can be used in the page.`,
		)
		const response = Component
		throw response
	}
	return renderAstroComponent(Component)
}
async function renderTemplate(htmlParts, ...expressions) {
	return new AstroComponent(htmlParts, expressions)
}

async function* renderChild(child) {
	child = await child
	if (child instanceof SlotString) {
		if (child.instructions) {
			yield* child.instructions
		}
		yield child
	} else if (isHTMLString(child)) {
		yield child
	} else if (Array.isArray(child)) {
		for (const value of child) {
			yield markHTMLString(await renderChild(value))
		}
	} else if (typeof child === 'function') {
		yield* renderChild(child())
	} else if (typeof child === 'string') {
		yield markHTMLString(escapeHTML(child))
	} else if (!child && child !== 0);
	else if (
		child instanceof AstroComponent ||
		Object.prototype.toString.call(child) === '[object AstroComponent]'
	) {
		yield* renderAstroComponent(child)
	} else if (ArrayBuffer.isView(child)) {
		yield child
	} else if (
		typeof child === 'object' &&
		(Symbol.asyncIterator in child || Symbol.iterator in child)
	) {
		yield* child
	} else {
		yield child
	}
}

const slotString = Symbol.for('astro:slot-string')
class SlotString extends HTMLString {
	constructor(content, instructions) {
		super(content)
		this.instructions = instructions
		this[slotString] = true
	}
}
function isSlotString(str) {
	return !!str[slotString]
}
async function renderSlot(_result, slotted, fallback) {
	if (slotted) {
		let iterator = renderChild(slotted)
		let content = ''
		let instructions = null
		for await (const chunk of iterator) {
			if (chunk.type === 'directive') {
				if (instructions === null) {
					instructions = []
				}
				instructions.push(chunk)
			} else {
				content += chunk
			}
		}
		return markHTMLString(new SlotString(content, instructions))
	}
	return fallback
}
async function renderSlots(result, slots = {}) {
	let slotInstructions = null
	let children = {}
	if (slots) {
		await Promise.all(
			Object.entries(slots).map(([key, value]) =>
				renderSlot(result, value).then(output => {
					if (output.instructions) {
						if (slotInstructions === null) {
							slotInstructions = []
						}
						slotInstructions.push(...output.instructions)
					}
					children[key] = output
				}),
			),
		)
	}
	return { slotInstructions, children }
}

const Fragment = Symbol.for('astro:fragment')
const Renderer = Symbol.for('astro:renderer')
const encoder = new TextEncoder()
const decoder = new TextDecoder()
function stringifyChunk(result, chunk) {
	switch (chunk.type) {
		case 'directive': {
			const { hydration } = chunk
			let needsHydrationScript = hydration && determineIfNeedsHydrationScript(result)
			let needsDirectiveScript =
				hydration && determinesIfNeedsDirectiveScript(result, hydration.directive)
			let prescriptType = needsHydrationScript ? 'both' : needsDirectiveScript ? 'directive' : null
			if (prescriptType) {
				let prescripts = getPrescripts(prescriptType, hydration.directive)
				return markHTMLString(prescripts)
			} else {
				return ''
			}
		}
		default: {
			if (isSlotString(chunk)) {
				let out = ''
				const c = chunk
				if (c.instructions) {
					for (const instr of c.instructions) {
						out += stringifyChunk(result, instr)
					}
				}
				out += chunk.toString()
				return out
			}
			return chunk.toString()
		}
	}
}
class HTMLParts {
	constructor() {
		this.parts = ''
	}
	append(part, result) {
		if (ArrayBuffer.isView(part)) {
			this.parts += decoder.decode(part)
		} else {
			this.parts += stringifyChunk(result, part)
		}
	}
	toString() {
		return this.parts
	}
	toArrayBuffer() {
		return encoder.encode(this.parts)
	}
}

const ClientOnlyPlaceholder = 'astro-client-only'
class Skip {
	constructor(vnode) {
		this.vnode = vnode
		this.count = 0
	}
	increment() {
		this.count++
	}
	haveNoTried() {
		return this.count === 0
	}
	isCompleted() {
		return this.count > 2
	}
}
Skip.symbol = Symbol('astro:jsx:skip')
let originalConsoleError
let consoleFilterRefs = 0
async function renderJSX(result, vnode) {
	switch (true) {
		case vnode instanceof HTMLString:
			if (vnode.toString().trim() === '') {
				return ''
			}
			return vnode
		case typeof vnode === 'string':
			return markHTMLString(escapeHTML(vnode))
		case typeof vnode === 'function':
			return vnode
		case !vnode && vnode !== 0:
			return ''
		case Array.isArray(vnode):
			return markHTMLString((await Promise.all(vnode.map(v => renderJSX(result, v)))).join(''))
	}
	let skip
	if (vnode.props) {
		if (vnode.props[Skip.symbol]) {
			skip = vnode.props[Skip.symbol]
		} else {
			skip = new Skip(vnode)
		}
	} else {
		skip = new Skip(vnode)
	}
	return renderJSXVNode(result, vnode, skip)
}
async function renderJSXVNode(result, vnode, skip) {
	if (isVNode(vnode)) {
		switch (true) {
			case !vnode.type: {
				throw new Error(`Unable to render ${result._metadata.pathname} because it contains an undefined Component!
Did you forget to import the component or is it possible there is a typo?`)
			}
			case vnode.type === Symbol.for('astro:fragment'):
				return renderJSX(result, vnode.props.children)
			case vnode.type.isAstroComponentFactory: {
				let props = {}
				let slots = {}
				for (const [key, value] of Object.entries(vnode.props ?? {})) {
					if (key === 'children' || (value && typeof value === 'object' && value['$$slot'])) {
						slots[key === 'children' ? 'default' : key] = () => renderJSX(result, value)
					} else {
						props[key] = value
					}
				}
				return markHTMLString(await renderToString(result, vnode.type, props, slots))
			}
			case !vnode.type && vnode.type !== 0:
				return ''
			case typeof vnode.type === 'string' && vnode.type !== ClientOnlyPlaceholder:
				return markHTMLString(await renderElement$1(result, vnode.type, vnode.props ?? {}))
		}
		if (vnode.type) {
			let extractSlots2 = function (child) {
				if (Array.isArray(child)) {
					return child.map(c => extractSlots2(c))
				}
				if (!isVNode(child)) {
					_slots.default.push(child)
					return
				}
				if ('slot' in child.props) {
					_slots[child.props.slot] = [...(_slots[child.props.slot] ?? []), child]
					delete child.props.slot
					return
				}
				_slots.default.push(child)
			}
			if (typeof vnode.type === 'function' && vnode.type['astro:renderer']) {
				skip.increment()
			}
			if (typeof vnode.type === 'function' && vnode.props['server:root']) {
				const output2 = await vnode.type(vnode.props ?? {})
				return await renderJSX(result, output2)
			}
			if (typeof vnode.type === 'function') {
				if (skip.haveNoTried() || skip.isCompleted()) {
					useConsoleFilter()
					try {
						const output2 = await vnode.type(vnode.props ?? {})
						let renderResult
						if (output2 && output2[AstroJSX]) {
							renderResult = await renderJSXVNode(result, output2, skip)
							return renderResult
						} else if (!output2) {
							renderResult = await renderJSXVNode(result, output2, skip)
							return renderResult
						}
					} catch (e) {
						if (skip.isCompleted()) {
							throw e
						}
						skip.increment()
					} finally {
						finishUsingConsoleFilter()
					}
				} else {
					skip.increment()
				}
			}
			const { children = null, ...props } = vnode.props ?? {}
			const _slots = {
				default: [],
			}
			extractSlots2(children)
			for (const [key, value] of Object.entries(props)) {
				if (value['$$slot']) {
					_slots[key] = value
					delete props[key]
				}
			}
			const slotPromises = []
			const slots = {}
			for (const [key, value] of Object.entries(_slots)) {
				slotPromises.push(
					renderJSX(result, value).then(output2 => {
						if (output2.toString().trim().length === 0) return
						slots[key] = () => output2
					}),
				)
			}
			await Promise.all(slotPromises)
			props[Skip.symbol] = skip
			let output
			if (vnode.type === ClientOnlyPlaceholder && vnode.props['client:only']) {
				output = await renderComponent(
					result,
					vnode.props['client:display-name'] ?? '',
					null,
					props,
					slots,
				)
			} else {
				output = await renderComponent(
					result,
					typeof vnode.type === 'function' ? vnode.type.name : vnode.type,
					vnode.type,
					props,
					slots,
				)
			}
			if (typeof output !== 'string' && Symbol.asyncIterator in output) {
				let parts = new HTMLParts()
				for await (const chunk of output) {
					parts.append(chunk, result)
				}
				return markHTMLString(parts.toString())
			} else {
				return markHTMLString(output)
			}
		}
	}
	return markHTMLString(`${vnode}`)
}
async function renderElement$1(result, tag, { children, ...props }) {
	return markHTMLString(
		`<${tag}${spreadAttributes(props)}${markHTMLString(
			(children == null || children == '') && voidElementNames.test(tag)
				? `/>`
				: `>${children == null ? '' : await renderJSX(result, children)}</${tag}>`,
		)}`,
	)
}
function useConsoleFilter() {
	consoleFilterRefs++
	if (!originalConsoleError) {
		originalConsoleError = console.error
		try {
			console.error = filteredConsoleError
		} catch (error) {}
	}
}
function finishUsingConsoleFilter() {
	consoleFilterRefs--
}
function filteredConsoleError(msg, ...rest) {
	if (consoleFilterRefs > 0 && typeof msg === 'string') {
		const isKnownReactHookError =
			msg.includes('Warning: Invalid hook call.') &&
			msg.includes('https://reactjs.org/link/invalid-hook-call')
		if (isKnownReactHookError) return
	}
	originalConsoleError(msg, ...rest)
}

/**
 * shortdash - https://github.com/bibig/node-shorthash
 *
 * @license
 *
 * (The MIT License)
 *
 * Copyright (c) 2013 Bibig <bibig@me.com>
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use,
 * copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following
 * conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 */
const dictionary = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXY'
const binary = dictionary.length
function bitwise(str) {
	let hash = 0
	if (str.length === 0) return hash
	for (let i = 0; i < str.length; i++) {
		const ch = str.charCodeAt(i)
		hash = (hash << 5) - hash + ch
		hash = hash & hash
	}
	return hash
}
function shorthash(text) {
	let num
	let result = ''
	let integer = bitwise(text)
	const sign = integer < 0 ? 'Z' : ''
	integer = Math.abs(integer)
	while (integer >= binary) {
		num = integer % binary
		integer = Math.floor(integer / binary)
		result = dictionary[num] + result
	}
	if (integer > 0) {
		result = dictionary[integer] + result
	}
	return sign + result
}

const voidElementNames =
	/^(area|base|br|col|command|embed|hr|img|input|keygen|link|meta|param|source|track|wbr)$/i
const htmlBooleanAttributes =
	/^(allowfullscreen|async|autofocus|autoplay|controls|default|defer|disabled|disablepictureinpicture|disableremoteplayback|formnovalidate|hidden|loop|nomodule|novalidate|open|playsinline|readonly|required|reversed|scoped|seamless|itemscope)$/i
const htmlEnumAttributes = /^(contenteditable|draggable|spellcheck|value)$/i
const svgEnumAttributes = /^(autoReverse|externalResourcesRequired|focusable|preserveAlpha)$/i
const STATIC_DIRECTIVES = /* @__PURE__ */ new Set(['set:html', 'set:text'])
const toIdent = k =>
	k.trim().replace(/(?:(?!^)\b\w|\s+|[^\w]+)/g, (match, index) => {
		if (/[^\w]|\s/.test(match)) return ''
		return index === 0 ? match : match.toUpperCase()
	})
const toAttributeString = (value, shouldEscape = true) =>
	shouldEscape ? String(value).replace(/&/g, '&#38;').replace(/"/g, '&#34;') : value
const kebab = k =>
	k.toLowerCase() === k ? k : k.replace(/[A-Z]/g, match => `-${match.toLowerCase()}`)
const toStyleString = obj =>
	Object.entries(obj)
		.map(([k, v]) => `${kebab(k)}:${v}`)
		.join(';')
function defineScriptVars(vars) {
	let output = ''
	for (const [key, value] of Object.entries(vars)) {
		output += `const ${toIdent(key)} = ${JSON.stringify(value)};
`
	}
	return markHTMLString(output)
}
function formatList(values) {
	if (values.length === 1) {
		return values[0]
	}
	return `${values.slice(0, -1).join(', ')} or ${values[values.length - 1]}`
}
function addAttribute(value, key, shouldEscape = true) {
	if (value == null) {
		return ''
	}
	if (value === false) {
		if (htmlEnumAttributes.test(key) || svgEnumAttributes.test(key)) {
			return markHTMLString(` ${key}="false"`)
		}
		return ''
	}
	if (STATIC_DIRECTIVES.has(key)) {
		console.warn(`[astro] The "${key}" directive cannot be applied dynamically at runtime. It will not be rendered as an attribute.

Make sure to use the static attribute syntax (\`${key}={value}\`) instead of the dynamic spread syntax (\`{...{ "${key}": value }}\`).`)
		return ''
	}
	if (key === 'class:list') {
		const listValue = toAttributeString(serializeListValue(value), shouldEscape)
		if (listValue === '') {
			return ''
		}
		return markHTMLString(` ${key.slice(0, -5)}="${listValue}"`)
	}
	if (key === 'style' && !(value instanceof HTMLString) && typeof value === 'object') {
		return markHTMLString(` ${key}="${toAttributeString(toStyleString(value), shouldEscape)}"`)
	}
	if (key === 'className') {
		return markHTMLString(` class="${toAttributeString(value, shouldEscape)}"`)
	}
	if (value === true && (key.startsWith('data-') || htmlBooleanAttributes.test(key))) {
		return markHTMLString(` ${key}`)
	} else {
		return markHTMLString(` ${key}="${toAttributeString(value, shouldEscape)}"`)
	}
}
function internalSpreadAttributes(values, shouldEscape = true) {
	let output = ''
	for (const [key, value] of Object.entries(values)) {
		output += addAttribute(value, key, shouldEscape)
	}
	return markHTMLString(output)
}
function renderElement(name, { props: _props, children = '' }, shouldEscape = true) {
	const { lang: _, 'data-astro-id': astroId, 'define:vars': defineVars, ...props } = _props
	if (defineVars) {
		if (name === 'style') {
			delete props['is:global']
			delete props['is:scoped']
		}
		if (name === 'script') {
			delete props.hoist
			children = defineScriptVars(defineVars) + '\n' + children
		}
	}
	if ((children == null || children == '') && voidElementNames.test(name)) {
		return `<${name}${internalSpreadAttributes(props, shouldEscape)} />`
	}
	return `<${name}${internalSpreadAttributes(props, shouldEscape)}>${children}</${name}>`
}

function componentIsHTMLElement(Component) {
	return typeof HTMLElement !== 'undefined' && HTMLElement.isPrototypeOf(Component)
}
async function renderHTMLElement(result, constructor, props, slots) {
	const name = getHTMLElementName(constructor)
	let attrHTML = ''
	for (const attr in props) {
		attrHTML += ` ${attr}="${toAttributeString(await props[attr])}"`
	}
	return markHTMLString(
		`<${name}${attrHTML}>${await renderSlot(
			result,
			slots == null ? void 0 : slots.default,
		)}</${name}>`,
	)
}
function getHTMLElementName(constructor) {
	const definedName = customElements.getName(constructor)
	if (definedName) return definedName
	const assignedName = constructor.name
		.replace(/^HTML|Element$/g, '')
		.replace(/[A-Z]/g, '-$&')
		.toLowerCase()
		.replace(/^-/, 'html-')
	return assignedName
}

const rendererAliases = /* @__PURE__ */ new Map([['solid', 'solid-js']])
function guessRenderers(componentUrl) {
	const extname = componentUrl == null ? void 0 : componentUrl.split('.').pop()
	switch (extname) {
		case 'svelte':
			return ['@astrojs/svelte']
		case 'vue':
			return ['@astrojs/vue']
		case 'jsx':
		case 'tsx':
			return ['@astrojs/react', '@astrojs/preact', '@astrojs/solid', '@astrojs/vue (jsx)']
		default:
			return [
				'@astrojs/react',
				'@astrojs/preact',
				'@astrojs/solid',
				'@astrojs/vue',
				'@astrojs/svelte',
			]
	}
}
function getComponentType(Component) {
	if (Component === Fragment) {
		return 'fragment'
	}
	if (Component && typeof Component === 'object' && Component['astro:html']) {
		return 'html'
	}
	if (isAstroComponentFactory(Component)) {
		return 'astro-factory'
	}
	return 'unknown'
}
async function renderComponent(result, displayName, Component, _props, slots = {}, route) {
	var _a, _b
	Component = (await Component) ?? Component
	switch (getComponentType(Component)) {
		case 'fragment': {
			const children2 = await renderSlot(result, slots == null ? void 0 : slots.default)
			if (children2 == null) {
				return children2
			}
			return markHTMLString(children2)
		}
		case 'html': {
			const { slotInstructions: slotInstructions2, children: children2 } = await renderSlots(
				result,
				slots,
			)
			const html2 = Component.render({ slots: children2 })
			const hydrationHtml = slotInstructions2
				? slotInstructions2.map(instr => stringifyChunk(result, instr)).join('')
				: ''
			return markHTMLString(hydrationHtml + html2)
		}
		case 'astro-factory': {
			async function* renderAstroComponentInline() {
				let iterable = await renderToIterable(result, Component, displayName, _props, slots)
				yield* iterable
			}
			return renderAstroComponentInline()
		}
	}
	if (!Component && !_props['client:only']) {
		throw new Error(
			`Unable to render ${displayName} because it is ${Component}!
Did you forget to import the component or is it possible there is a typo?`,
		)
	}
	const { renderers } = result._metadata
	const metadata = { displayName }
	const { hydration, isPage, props } = extractDirectives(displayName, _props)
	let html = ''
	let attrs = void 0
	if (hydration) {
		metadata.hydrate = hydration.directive
		metadata.hydrateArgs = hydration.value
		metadata.componentExport = hydration.componentExport
		metadata.componentUrl = hydration.componentUrl
	}
	const probableRendererNames = guessRenderers(metadata.componentUrl)
	const validRenderers = renderers.filter(r => r.name !== 'astro:jsx')
	const { children, slotInstructions } = await renderSlots(result, slots)
	let renderer
	if (metadata.hydrate !== 'only') {
		let isTagged = false
		try {
			isTagged = Component && Component[Renderer]
		} catch {}
		if (isTagged) {
			const rendererName = Component[Renderer]
			renderer = renderers.find(({ name }) => name === rendererName)
		}
		if (!renderer) {
			let error
			for (const r of renderers) {
				try {
					if (await r.ssr.check.call({ result }, Component, props, children)) {
						renderer = r
						break
					}
				} catch (e) {
					error ?? (error = e)
				}
			}
			if (!renderer && error) {
				throw error
			}
		}
		if (!renderer && typeof HTMLElement === 'function' && componentIsHTMLElement(Component)) {
			const output = renderHTMLElement(result, Component, _props, slots)
			return output
		}
	} else {
		if (metadata.hydrateArgs) {
			const passedName = metadata.hydrateArgs
			const rendererName = rendererAliases.has(passedName)
				? rendererAliases.get(passedName)
				: passedName
			renderer = renderers.find(
				({ name }) => name === `@astrojs/${rendererName}` || name === rendererName,
			)
		}
		if (!renderer && validRenderers.length === 1) {
			renderer = validRenderers[0]
		}
		if (!renderer) {
			const extname = (_a = metadata.componentUrl) == null ? void 0 : _a.split('.').pop()
			renderer = renderers.filter(
				({ name }) => name === `@astrojs/${extname}` || name === extname,
			)[0]
		}
	}
	if (!renderer) {
		if (metadata.hydrate === 'only') {
			throw new AstroError({
				...AstroErrorData.NoClientOnlyHint,
				message: AstroErrorData.NoClientOnlyHint.message(metadata.displayName),
				hint: AstroErrorData.NoClientOnlyHint.hint(
					probableRendererNames.map(r => r.replace('@astrojs/', '')).join('|'),
				),
			})
		} else if (typeof Component !== 'string') {
			const matchingRenderers = validRenderers.filter(r => probableRendererNames.includes(r.name))
			const plural = validRenderers.length > 1
			if (matchingRenderers.length === 0) {
				throw new AstroError({
					...AstroErrorData.NoMatchingRenderer,
					message: AstroErrorData.NoMatchingRenderer.message(
						metadata.displayName,
						(_b = metadata == null ? void 0 : metadata.componentUrl) == null
							? void 0
							: _b.split('.').pop(),
						plural,
						validRenderers.length,
					),
					hint: AstroErrorData.NoMatchingRenderer.hint(
						formatList(probableRendererNames.map(r => '`' + r + '`')),
					),
				})
			} else if (matchingRenderers.length === 1) {
				renderer = matchingRenderers[0]
				;({ html, attrs } = await renderer.ssr.renderToStaticMarkup.call(
					{ result },
					Component,
					props,
					children,
					metadata,
				))
			} else {
				throw new Error(`Unable to render ${metadata.displayName}!

This component likely uses ${formatList(probableRendererNames)},
but Astro encountered an error during server-side rendering.

Please ensure that ${metadata.displayName}:
1. Does not unconditionally access browser-specific globals like \`window\` or \`document\`.
   If this is unavoidable, use the \`client:only\` hydration directive.
2. Does not conditionally return \`null\` or \`undefined\` when rendered on the server.

If you're still stuck, please open an issue on GitHub or join us at https://astro.build/chat.`)
			}
		}
	} else {
		if (metadata.hydrate === 'only') {
			html = await renderSlot(result, slots == null ? void 0 : slots.fallback)
		} else {
			;({ html, attrs } = await renderer.ssr.renderToStaticMarkup.call(
				{ result },
				Component,
				props,
				children,
				metadata,
			))
		}
	}
	if (
		renderer &&
		!renderer.clientEntrypoint &&
		renderer.name !== '@astrojs/lit' &&
		metadata.hydrate
	) {
		throw new AstroError({
			...AstroErrorData.NoClientEntrypoint,
			message: AstroErrorData.NoClientEntrypoint.message(
				displayName,
				metadata.hydrate,
				renderer.name,
			),
		})
	}
	if (!html && typeof Component === 'string') {
		const childSlots = Object.values(children).join('')
		const iterable = renderAstroComponent(
			await renderTemplate`<${Component}${internalSpreadAttributes(props)}${markHTMLString(
				childSlots === '' && voidElementNames.test(Component)
					? `/>`
					: `>${childSlots}</${Component}>`,
			)}`,
		)
		html = ''
		for await (const chunk of iterable) {
			html += chunk
		}
	}
	if (!hydration) {
		return (async function* () {
			if (slotInstructions) {
				yield* slotInstructions
			}
			if (isPage || (renderer == null ? void 0 : renderer.name) === 'astro:jsx') {
				yield html
			} else {
				yield markHTMLString(html.replace(/\<\/?astro-slot\>/g, ''))
			}
		})()
	}
	const astroId = shorthash(
		`<!--${metadata.componentExport.value}:${metadata.componentUrl}-->
${html}
${serializeProps(props, metadata)}`,
	)
	const island = await generateHydrateScript({ renderer, result, astroId, props, attrs }, metadata)
	let unrenderedSlots = []
	if (html) {
		if (Object.keys(children).length > 0) {
			for (const key of Object.keys(children)) {
				if (!html.includes(key === 'default' ? `<astro-slot>` : `<astro-slot name="${key}">`)) {
					unrenderedSlots.push(key)
				}
			}
		}
	} else {
		unrenderedSlots = Object.keys(children)
	}
	const template =
		unrenderedSlots.length > 0
			? unrenderedSlots
					.map(
						key =>
							`<template data-astro-template${key !== 'default' ? `="${key}"` : ''}>${
								children[key]
							}</template>`,
					)
					.join('')
			: ''
	island.children = `${html ?? ''}${template}`
	if (island.children) {
		island.props['await-children'] = ''
	}
	async function* renderAll() {
		if (slotInstructions) {
			yield* slotInstructions
		}
		yield { type: 'directive', hydration, result }
		yield markHTMLString(renderElement('astro-island', island, false))
	}
	return renderAll()
}

const uniqueElements = (item, index, all) => {
	const props = JSON.stringify(item.props)
	const children = item.children
	return index === all.findIndex(i => JSON.stringify(i.props) === props && i.children == children)
}
function renderHead(result) {
	result._metadata.hasRenderedHead = true
	const styles = Array.from(result.styles)
		.filter(uniqueElements)
		.map(style => renderElement('style', style))
	result.styles.clear()
	const scripts = Array.from(result.scripts)
		.filter(uniqueElements)
		.map((script, i) => {
			return renderElement('script', script, false)
		})
	const links = Array.from(result.links)
		.filter(uniqueElements)
		.map(link => renderElement('link', link, false))
	return markHTMLString(links.join('\n') + styles.join('\n') + scripts.join('\n'))
}
async function* maybeRenderHead(result) {
	if (result._metadata.hasRenderedHead) {
		return
	}
	yield renderHead(result)
}

typeof process === 'object' && Object.prototype.toString.call(process) === '[object process]'

function createComponent(cb) {
	cb.isAstroComponentFactory = true
	return cb
}
function spreadAttributes(values, _name, { class: scopedClassName } = {}) {
	let output = ''
	if (scopedClassName) {
		if (typeof values.class !== 'undefined') {
			values.class += ` ${scopedClassName}`
		} else if (typeof values['class:list'] !== 'undefined') {
			values['class:list'] = [values['class:list'], scopedClassName]
		} else {
			values.class = scopedClassName
		}
	}
	for (const [key, value] of Object.entries(values)) {
		output += addAttribute(value, key, true)
	}
	return markHTMLString(output)
}

const AstroJSX = 'astro:jsx'
const Empty = Symbol('empty')
const toSlotName = slotAttr => slotAttr
function isVNode(vnode) {
	return vnode && typeof vnode === 'object' && vnode[AstroJSX]
}
function transformSlots(vnode) {
	if (typeof vnode.type === 'string') return vnode
	const slots = {}
	if (isVNode(vnode.props.children)) {
		const child = vnode.props.children
		if (!isVNode(child)) return
		if (!('slot' in child.props)) return
		const name = toSlotName(child.props.slot)
		slots[name] = [child]
		slots[name]['$$slot'] = true
		delete child.props.slot
		delete vnode.props.children
	}
	if (Array.isArray(vnode.props.children)) {
		vnode.props.children = vnode.props.children
			.map(child => {
				if (!isVNode(child)) return child
				if (!('slot' in child.props)) return child
				const name = toSlotName(child.props.slot)
				if (Array.isArray(slots[name])) {
					slots[name].push(child)
				} else {
					slots[name] = [child]
					slots[name]['$$slot'] = true
				}
				delete child.props.slot
				return Empty
			})
			.filter(v => v !== Empty)
	}
	Object.assign(vnode.props, slots)
}
function markRawChildren(child) {
	if (typeof child === 'string') return markHTMLString(child)
	if (Array.isArray(child)) return child.map(c => markRawChildren(c))
	return child
}
function transformSetDirectives(vnode) {
	if (!('set:html' in vnode.props || 'set:text' in vnode.props)) return
	if ('set:html' in vnode.props) {
		const children = markRawChildren(vnode.props['set:html'])
		delete vnode.props['set:html']
		Object.assign(vnode.props, { children })
		return
	}
	if ('set:text' in vnode.props) {
		const children = vnode.props['set:text']
		delete vnode.props['set:text']
		Object.assign(vnode.props, { children })
		return
	}
}
function createVNode(type, props) {
	const vnode = {
		[Renderer]: 'astro:jsx',
		[AstroJSX]: true,
		type,
		props: props ?? {},
	}
	transformSetDirectives(vnode)
	transformSlots(vnode)
	return vnode
}

const slotName = str => str.trim().replace(/[-_]([a-z])/g, (_, w) => w.toUpperCase())
async function check(Component, props, { default: children = null, ...slotted } = {}) {
	if (typeof Component !== 'function') return false
	const slots = {}
	for (const [key, value] of Object.entries(slotted)) {
		const name = slotName(key)
		slots[name] = value
	}
	try {
		const result = await Component({ ...props, ...slots, children })
		return result[AstroJSX]
	} catch (e) {}
	return false
}
async function renderToStaticMarkup(
	Component,
	props = {},
	{ default: children = null, ...slotted } = {},
) {
	const slots = {}
	for (const [key, value] of Object.entries(slotted)) {
		const name = slotName(key)
		slots[name] = value
	}
	const { result } = this
	const html = await renderJSX(result, createVNode(Component, { ...props, ...slots, children }))
	return { html }
}
var server_default = {
	check,
	renderToStaticMarkup,
}

const SITE_TITLE = 'vegetalope'
const SITE_DESCRIPTION = 'Large fancy site filled with crap'

const $$Astro$6 = createAstro(
	'/Users/brnrd/Projects/vegetalope/src/components/BaseHead.astro',
	'https://www.vegetalope.com/',
	'file:///Users/brnrd/Projects/vegetalope/',
)
const $$BaseHead = createComponent(async ($$result, $$props, $$slots) => {
	const Astro2 = $$result.createAstro($$Astro$6, $$props, $$slots)
	Astro2.self = $$BaseHead
	const { title, description, image = '/placeholder-social.png' } = Astro2.props
	return renderTemplate`<!-- Global Metadata --><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="alternate" href="https://www.vegetalope.com/rss.xml" type="application/rss+xml">
<meta name="generator"${addAttribute(Astro2.generator, 'content')}>

<!-- Primary Meta Tags -->
<title>${title} | ${SITE_TITLE} </title>
<meta name="title"${addAttribute(title, 'content')}>
<meta name="description"${addAttribute(description, 'content')}>

<!-- Open Graph / Facebook -->
<meta property="og:type" content="website">
<meta property="og:url"${addAttribute(Astro2.url, 'content')}>
<meta property="og:title"${addAttribute(title, 'content')}>
<meta property="og:description"${addAttribute(description, 'content')}>
<meta property="og:image"${addAttribute(new URL(image, Astro2.url), 'content')}>

<!-- Twitter -->
<meta property="twitter:card" content="summary_large_image">
<meta property="twitter:url"${addAttribute(Astro2.url, 'content')}>
<meta property="twitter:title"${addAttribute(title, 'content')}>
<meta property="twitter:description"${addAttribute(description, 'content')}>
<meta property="twitter:image"${addAttribute(new URL(image, Astro2.url), 'content')}>

<!-- Secondary Meta Tags -->
<meta name="pocket-site-verification" content="7d224a8d64116b08c6daec8fc08a43">
<meta name="msvalidate.01" content="C26C7601A7BC06EDD0773BD8B09723CF">
`
})

const $$Astro$5 = createAstro(
	'/Users/brnrd/Projects/vegetalope/src/components/HeaderLink.astro',
	'https://www.vegetalope.com/',
	'file:///Users/brnrd/Projects/vegetalope/',
)
const $$HeaderLink = createComponent(async ($$result, $$props, $$slots) => {
	const Astro2 = $$result.createAstro($$Astro$5, $$props, $$slots)
	Astro2.self = $$HeaderLink
	const { href, class: className, ...props } = Astro2.props
	const { pathname } = Astro2.url
	const isActive = href === pathname || href === pathname.replace(/\/$/, '')
	return renderTemplate`${maybeRenderHead($$result)}<a${addAttribute(href, 'href')}${addAttribute(
		[[className, { active: isActive }], 'astro-FPRMATIO'],
		'class:list',
	)}${spreadAttributes(props)}>
	${renderSlot($$result, $$slots['default'])}
</a>
`
})

const $$Astro$4 = createAstro(
	'/Users/brnrd/Projects/vegetalope/src/components/Header.astro',
	'https://www.vegetalope.com/',
	'file:///Users/brnrd/Projects/vegetalope/',
)
const $$Header = createComponent(async ($$result, $$props, $$slots) => {
	const Astro2 = $$result.createAstro($$Astro$4, $$props, $$slots)
	Astro2.self = $$Header
	return renderTemplate`${maybeRenderHead($$result)}<header>
	<nav>
		${renderComponent(
			$$result,
			'HeaderLink',
			$$HeaderLink,
			{ href: '/' },
			{ default: () => renderTemplate`Home` },
		)}
		${renderComponent(
			$$result,
			'HeaderLink',
			$$HeaderLink,
			{ href: '/blog' },
			{ default: () => renderTemplate`Blog` },
		)}
		${renderComponent(
			$$result,
			'HeaderLink',
			$$HeaderLink,
			{ href: '/about' },
			{ default: () => renderTemplate`About` },
		)}
		${renderComponent(
			$$result,
			'HeaderLink',
			$$HeaderLink,
			{ href: 'https://twitter.com/vegetalope', target: '_blank' },
			{ default: () => renderTemplate`Twitter` },
		)}
		${renderComponent(
			$$result,
			'HeaderLink',
			$$HeaderLink,
			{ href: 'https://github.com/brnrd', target: '_blank' },
			{ default: () => renderTemplate`GitHub` },
		)}
	</nav>
	<a id="home" href="/">
		<svg id="logo" alt="vegetalope logo" title="vegetalope logo, looks like a inverted triangle but really is a capital V">
			<title>vegetalope logo, looks like a inverted triangle but really is a capital V</title>
			<use xlink:href="#vegetalope-logo"></use>
		</svg>
	</a>

	<!-- Logo SVG trick: https://css-tricks.com/change-color-of-svg-on-hover/#article-header-id-1 -->
	<svg id="logo-hidden" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" preserveAspectRatio="xMidYMid meet">
		<symbol id="vegetalope-logo" viewBox="0 0 640 640">
			<path id="a33aR4SSJs" d="M320 558L488 93.81L217 93.81L217 113L461 113L320 500.95L172.38 93.81L150.95 93.81L320 558Z"></path>
		</symbol>
	</svg>
</header>`
})

const $$Astro$3 = createAstro(
	'/Users/brnrd/Projects/vegetalope/src/components/Footer.astro',
	'https://www.vegetalope.com/',
	'file:///Users/brnrd/Projects/vegetalope/',
)
const $$Footer = createComponent(async ($$result, $$props, $$slots) => {
	const Astro2 = $$result.createAstro($$Astro$3, $$props, $$slots)
	Astro2.self = $$Footer
	return renderTemplate`${maybeRenderHead($$result)}<footer class="astro-FYJ2TJSN">
	<p class="astro-FYJ2TJSN">HELLO my name is vegetalope.</p>
	<p class="astro-FYJ2TJSN">I don’t have anything to sell. Care about <a href="/movies" class="astro-FYJ2TJSN">movies</a> or <a href="/tv-shows" class="astro-FYJ2TJSN">TV shows</a>?</p>
	<p class="astro-FYJ2TJSN"><sub class="astro-FYJ2TJSN"><sup class="astro-FYJ2TJSN">No tracking, no cookies.</sup></sub></p>
</footer>
`
})

const $$Astro$2 = createAstro(
	'/Users/brnrd/Projects/vegetalope/src/pages/index.astro',
	'https://www.vegetalope.com/',
	'file:///Users/brnrd/Projects/vegetalope/',
)
const $$Index = createComponent(async ($$result, $$props, $$slots) => {
	const Astro2 = $$result.createAstro($$Astro$2, $$props, $$slots)
	Astro2.self = $$Index
	return renderTemplate`<html lang="en">
	<head>
		${renderComponent($$result, 'BaseHead', $$BaseHead, {
			title: SITE_TITLE,
			description: SITE_DESCRIPTION,
		})}
	${renderHead($$result)}</head>
	<body>
		${renderComponent($$result, 'Header', $$Header, { title: SITE_TITLE })}
		<main>

		</main>
		${renderComponent($$result, 'Footer', $$Footer, {})}
	</body></html>`
})

const $$file$1 = '/Users/brnrd/Projects/vegetalope/src/pages/index.astro'
const $$url$1 = ''

const _page0 = /*#__PURE__*/ Object.freeze(
	/*#__PURE__*/ Object.defineProperty(
		{
			__proto__: null,
			default: $$Index,
			file: $$file$1,
			url: $$url$1,
		},
		Symbol.toStringTag,
		{ value: 'Module' },
	),
)

const $$Astro$1 = createAstro(
	'/Users/brnrd/Projects/vegetalope/src/layouts/BlogPost.astro',
	'https://www.vegetalope.com/',
	'file:///Users/brnrd/Projects/vegetalope/',
)
const $$BlogPost = createComponent(async ($$result, $$props, $$slots) => {
	const Astro2 = $$result.createAstro($$Astro$1, $$props, $$slots)
	Astro2.self = $$BlogPost
	const {
		content: { title, description, pubDate, updatedDate, heroImage },
	} = Astro2.props
	return renderTemplate`<html lang="en" class="astro-56V6Q725">
	<head>
		${renderComponent($$result, 'BaseHead', $$BaseHead, {
			title: title,
			description: description,
			class: 'astro-56V6Q725',
		})}
		
	${renderHead($$result)}</head>

	<body class="astro-56V6Q725">
		${renderComponent($$result, 'Header', $$Header, { class: 'astro-56V6Q725' })}
		<main class="astro-56V6Q725">
			<article class="astro-56V6Q725">
				${
					heroImage &&
					renderTemplate`<img${addAttribute(720, 'width')}${addAttribute(
						360,
						'height',
					)}${addAttribute(heroImage, 'src')} alt="" class="astro-56V6Q725">`
				}
				<h1 class="title astro-56V6Q725">${title}</h1>
				${pubDate && renderTemplate`<time class="astro-56V6Q725">${pubDate}</time>`}
				${
					updatedDate &&
					renderTemplate`<div class="astro-56V6Q725">
							Last updated on <time class="astro-56V6Q725">${updatedDate}</time>
						</div>`
				}
				<hr class="astro-56V6Q725">
				${renderSlot($$result, $$slots['default'])}
			</article>
		</main>
		${renderComponent($$result, 'Footer', $$Footer, { class: 'astro-56V6Q725' })}
	</body></html>`
})

const html$4 =
	'<p>A raw non-exhaustive list of TV shows we liked.</p>\n<p>The list:</p>\n<ul>\n<li>Äkta människor</li>\n<li>Band of Brothers</li>\n<li>Betwitched</li>\n<li>Black Mirror</li>\n<li>Carnivàle</li>\n<li>Cruel Summer</li>\n<li>Escape at Dannemora</li>\n<li>Fargo</li>\n<li>Freaks and Geeks</li>\n<li>Love On The Spectrum</li>\n<li>Mad Men</li>\n<li>Misfits</li>\n<li>Sherlock</li>\n<li>Ojing-eo geim</li>\n<li>Stranger Things</li>\n<li>The Bible</li>\n<li>The Crown</li>\n<li>The Dick Van Dyke Show</li>\n<li>The Leftovers</li>\n<li>The Mandalorian</li>\n<li>The OA</li>\n<li>The Prisoner (2009)</li>\n<li>The Twilight Zone</li>\n<li>The War at Home</li>\n<li>True Blood</li>\n<li>Wonderfalls</li>\n</ul>'

const frontmatter$4 = {
	layout: '../layouts/BlogPost.astro',
	title: 'TV shows',
	pubDate: '2022-01-05',
}
const file$4 = '/Users/brnrd/Projects/vegetalope/src/pages/tv-shows.md'
const url$4 = '/tv-shows'
function rawContent$4() {
	return '\nA raw non-exhaustive list of TV shows we liked.\n\nThe list:\n\n- Äkta människor\n- Band of Brothers\n- Betwitched\n- Black Mirror\n- Carnivàle\n- Cruel Summer\n- Escape at Dannemora\n- Fargo\n- Freaks and Geeks\n- Love On The Spectrum\n- Mad Men\n- Misfits\n- Sherlock\n- Ojing-eo geim\n- Stranger Things\n- The Bible\n- The Crown\n- The Dick Van Dyke Show\n- The Leftovers\n- The Mandalorian\n- The OA\n- The Prisoner (2009)\n- The Twilight Zone\n- The War at Home\n- True Blood\n- Wonderfalls\n'
}
function compiledContent$4() {
	return html$4
}
function getHeadings$4() {
	return []
}
function getHeaders$4() {
	console.warn('getHeaders() have been deprecated. Use getHeadings() function instead.')
	return getHeadings$4()
}
async function Content$4() {
	const { layout, ...content } = frontmatter$4
	content.file = file$4
	content.url = url$4
	content.astro = {}
	Object.defineProperty(content.astro, 'headings', {
		get() {
			throw new Error(
				'The "astro" property is no longer supported! To access "headings" from your layout, try using "Astro.props.headings."',
			)
		},
	})
	Object.defineProperty(content.astro, 'html', {
		get() {
			throw new Error(
				'The "astro" property is no longer supported! To access "html" from your layout, try using "Astro.props.compiledContent()."',
			)
		},
	})
	Object.defineProperty(content.astro, 'source', {
		get() {
			throw new Error(
				'The "astro" property is no longer supported! To access "source" from your layout, try using "Astro.props.rawContent()."',
			)
		},
	})
	const contentFragment = createVNode(Fragment, { 'set:html': html$4 })
	return createVNode($$BlogPost, {
		file: file$4,
		url: url$4,
		content,
		frontmatter: content,
		headings: getHeadings$4(),
		rawContent: rawContent$4,
		compiledContent: compiledContent$4,
		'server:root': true,
		children: contentFragment,
	})
}
Content$4[Symbol.for('astro.needsHeadRendering')] = false

const _page1 = /*#__PURE__*/ Object.freeze(
	/*#__PURE__*/ Object.defineProperty(
		{
			__proto__: null,
			frontmatter: frontmatter$4,
			file: file$4,
			url: url$4,
			rawContent: rawContent$4,
			compiledContent: compiledContent$4,
			getHeadings: getHeadings$4,
			getHeaders: getHeaders$4,
			Content: Content$4,
			default: Content$4,
		},
		Symbol.toStringTag,
		{ value: 'Module' },
	),
)

const get = () =>
	rss({
		title: SITE_TITLE,
		description: SITE_DESCRIPTION,
		site: 'https://www.vegetalope.com/',
		items: /* #__PURE__ */ Object.assign({
			'./blog/google-blocking-themselves.md': () => Promise.resolve().then(() => _page5),
			'./blog/wintersmith-on-netlify.md': () => Promise.resolve().then(() => _page6),
		}),
	})

const _page2 = /*#__PURE__*/ Object.freeze(
	/*#__PURE__*/ Object.defineProperty(
		{
			__proto__: null,
			get,
		},
		Symbol.toStringTag,
		{ value: 'Module' },
	),
)

const html$3 =
	'<p>A raw non-exhaustive list of movies I watched with my wife and that we liked enough to give them our “good movie” seal of approval.</p>\n<p>You’ll find a subsequent list of regular movies at the end that are good enough to list and to watch, but that don’t meet our subjective criteria of being a “good movie”.</p>\n<p>The good movies:</p>\n<ul>\n<li>12 Angry Men</li>\n<li>3 Women</li>\n<li>A bout de souffle</li>\n<li>A Clockwork Orange</li>\n<li>A Few Good Men</li>\n<li>An Affair to Remember</li>\n<li>Anatomy of a Murder</li>\n<li>Angst essen Seele auf</li>\n<li>Annie Hall</li>\n<li>Arizona Dream</li>\n<li>Arrival</li>\n<li>Artificial Intelligence</li>\n<li>Baisers volés</li>\n<li>Bande à part</li>\n<li>Beetlejuice</li>\n<li>Benny and Joon</li>\n<li>Big Fish</li>\n<li>Blue Valentine</li>\n<li>Boyhood</li>\n<li>Breakfast at Tiffany’s</li>\n<li>Bullitt</li>\n<li>But I’m a Cheerleader</li>\n<li>Butterflies Are Free</li>\n<li>Cactus Flower</li>\n<li>Charade</li>\n<li>Closer</li>\n<li>Comment c’est loin</li>\n<li>Cool Hand Luke</li>\n<li>Detachment</li>\n<li>Dial M For Murder</li>\n<li>District 9</li>\n<li>Django Unchained</li>\n<li>Drive</li>\n<li>Dunkirk</li>\n<li>Edge of Tomorrow</li>\n<li>Edward Scissorhands</li>\n<li>Eyes Wide Shut</li>\n<li>Frost Nixon</li>\n<li>Funny Face</li>\n<li>Fury</li>\n<li>Get Out</li>\n<li>Girl, Interrupted</li>\n<li>Good Bye Lenin</li>\n<li>Hail Caesar</li>\n<li>Happy Go Lucky</li>\n<li>Happythankyoumoreplease</li>\n<li>Hard Candy</li>\n<li>Harold and Maude</li>\n<li>Heathers</li>\n<li>Her</li>\n<li>Howl</li>\n<li>I Heart Huckabees</li>\n<li>In The Mood For Love</li>\n<li>Inglourious Basterds</li>\n<li>Inside Man</li>\n<li>Into The Wild</li>\n<li>James Dean</li>\n<li>Judgment at Nuremberg</li>\n<li>Jules et Jim</li>\n<li>Juno</li>\n<li>Kûki ningyô</li>\n<li>Kynodontas</li>\n<li>L’Armée des Ombres</li>\n<li>L’enfant sauvage</li>\n<li>La Maman et la Putain</li>\n<li>La meglio gioventù</li>\n<li>La Tête Haute</li>\n<li>Lars and the Real Girl</li>\n<li>Le Havre</li>\n<li>Le Mépris</li>\n<li>Le Samouraï</li>\n<li>Léon Morin, Prêtre</li>\n<li>Les quatre cents coups</li>\n<li>Les Valseuses</li>\n<li>Leviathan</li>\n<li>Lila dit ça</li>\n<li>Lincoln</li>\n<li>Little Children</li>\n<li>Little Miss Sunshine</li>\n<li>Lola Rennt</li>\n<li>Lord of the Rings</li>\n<li>Lost in Translation</li>\n<li>Lucky Number Slevin</li>\n<li>Marie-Antoinette</li>\n<li>Martha Marcy May Marlene</li>\n<li>Masculin Féminin</li>\n<li>Memories of Murder</li>\n<li>Mermaids</li>\n<li>Mesrine 1 L’instinct de Mort</li>\n<li>Mesrine 2 L’ennemi public n°1</li>\n<li>Mid90s</li>\n<li>Mon Oncle</li>\n<li>Mon Roi</li>\n<li>Monty Python and the Holy Grail</li>\n<li>Moonrise Kingdom</li>\n<li>Mother!</li>\n<li>My Name Is Nobody</li>\n<li>Napoleon Dynamite</li>\n<li>Narco</li>\n<li>Network</li>\n<li>No Country For Old Men</li>\n<li>Nowhere Boy</li>\n<li>Okja</li>\n<li>Once Upon a Time in the West</li>\n<li>One Flew Over The Cuckoo’s Nest</li>\n<li>One Hour Photo</li>\n<li>Paper Moon</li>\n<li>Pierrot le Fou</li>\n<li>Playtime</li>\n<li>Rabbit Hole</li>\n<li>Rear Window</li>\n<li>Roma</li>\n<li>Rushmore</li>\n<li>Saving Mr. Banks</li>\n<li>Shimotsuma monogatari</li>\n<li>Silver Linings Playbook</li>\n<li>Snowpiercer</li>\n<li>Steel Magnolias</li>\n<li>Stoker</li>\n<li>Submarine</li>\n<li>Sweeney Todd The Demon Barber of Fleet Street</li>\n<li>Take Shelter</li>\n<li>Taking Off</li>\n<li>Thank You For Smoking</li>\n<li>The Americanization of Emily</li>\n<li>The Apartment</li>\n<li>The Believer</li>\n<li>The Book of Eli</li>\n<li>The Curious Case of Benjamin Button</li>\n<li>The Darjeeling Limited</li>\n<li>The Dirty Dozen</li>\n<li>The Godfather</li>\n<li>The History Boys</li>\n<li>The Hobbit</li>\n<li>The Innocents</li>\n<li>The Life And Death Of Colonel Blimp</li>\n<li>The Life Aquatic with Steve Zissou</li>\n<li>The Martian</li>\n<li>The Notebook</li>\n<li>The Philadelphia Story</li>\n<li>The Reader</li>\n<li>The Royal Tenenbaums</li>\n<li>The Shining</li>\n<li>The Sound Of Music</li>\n<li>The Sting</li>\n<li>The Sugarland Express</li>\n<li>The Treasure Of The Sierra Madre</li>\n<li>The Tree of Life</li>\n<li>The Truman Show</li>\n<li>The Wizard Of Oz</li>\n<li>There Will Be Blood</li>\n<li>Top Hat</li>\n<li>True Grit</li>\n<li>Une Femme Est Une Femme</li>\n<li>Valley Of The Dolls</li>\n<li>Vanilla Sky</li>\n<li>Vicky Cristina Barcelona</li>\n<li>Walk the Line</li>\n<li>Yes Man</li>\n<li>Yi Yi</li>\n</ul>\n<p>The Movies :</p>\n<ul>\n<li>13 Going On 30</li>\n<li>1917</li>\n<li>A Fistful of Dollars</li>\n<li>A Swedish Love Story</li>\n<li>Alita Battle Angel</li>\n<li>American Made</li>\n<li>Auntie Mame</li>\n<li>Belle de Jour</li>\n<li>Birthday Girl</li>\n<li>Busanhaeng</li>\n<li>Calvaire</li>\n<li>Captain Fantastic</li>\n<li>Captive State</li>\n<li>Carnal Knowledge</li>\n<li>Castaway on the Moon</li>\n<li>Chappie</li>\n<li>Chinatown</li>\n<li>Clue</li>\n<li>Clueless</li>\n<li>Coffee and Cigarettes</li>\n<li>Copacabana</li>\n<li>Cry Baby</li>\n<li>Dallas Buyers Club</li>\n<li>Donnie Brasco</li>\n<li>Dr. Strangelove or: How I Learned to Stop Worrying and Love the Bomb</li>\n<li>Dune</li>\n<li>East Is East</li>\n<li>Essaye moi</li>\n<li>Et Dieu… créa la femme</li>\n<li>Ex Machina</li>\n<li>Ferris Bueller’s Day Off</li>\n<li>Forbidden Planet</li>\n<li>From Hell</li>\n<li>Ghost Dog: The Way of the Samurai</li>\n<li>Good Time</li>\n<li>Gosford Park</li>\n<li>Grease</li>\n<li>Green Book</li>\n<li>Groundhog Day</li>\n<li>JCVD</li>\n<li>Kramer vs. Kramer</li>\n<li>L’hermine</li>\n<li>La Belle Verte</li>\n<li>La Chinoise</li>\n<li>La classe américaine</li>\n<li>La Cloche a Sonné</li>\n<li>La Macchina ammazzacattivi</li>\n<li>Le Charme Discret De La Bourgeoisie</li>\n<li>Les cinq parties du monde</li>\n<li>Les Demoiselles de Rochefort</li>\n<li>Les Parisiennes</li>\n<li>Liar Liar</li>\n<li>Ma Loute</li>\n<li>Mad Max: Fury Road</li>\n<li>Magnolia</li>\n<li>Minari</li>\n<li>Monty Python and the Holy Grail</li>\n<li>Ohayo</li>\n<li>Parasite</li>\n<li>Passengers</li>\n<li>Persona</li>\n<li>Pretty In Pink</li>\n<li>Private Benjamin</li>\n<li>Ready or Not</li>\n<li>Ridicule</li>\n<li>Sedmikrásky</li>\n<li>Shaun Of The Dead</li>\n<li>Spring Summer Fall Winter and Spring</li>\n<li>Stand by Me</li>\n<li>The Band Wagon</li>\n<li>The Beatles Help!</li>\n<li>The Favourite</li>\n<li>The Fifth Element</li>\n<li>The Girl Next Door</li>\n<li>The Girl on the Train</li>\n<li>The Great Escape</li>\n<li>The Master</li>\n<li>The Stepford Wives (2004)</li>\n<li>The Ten Commandments</li>\n<li>To Catch a Thief</li>\n<li>Trainspotting</li>\n<li>Versus</li>\n<li>Vertigo</li>\n<li>WarGames</li>\n<li>What Happened To Monday</li>\n<li>What’s Eating Gilbert Grape</li>\n<li>Whatever Works</li>\n<li>Yuke yuke nidome no shojo</li>\n</ul>'

const frontmatter$3 = {
	layout: '../layouts/BlogPost.astro',
	title: 'Good movies',
	pubDate: '2022-01-05',
}
const file$3 = '/Users/brnrd/Projects/vegetalope/src/pages/movies.md'
const url$3 = '/movies'
function rawContent$3() {
	return "\nA raw non-exhaustive list of movies I watched with my wife and that we liked enough to give them our \"good movie\" seal of approval.\n\nYou'll find a subsequent list of regular movies at the end that are good enough to list and to watch, but that don't meet our subjective criteria of being a \"good movie\".\n\nThe good movies:\n\n- 12 Angry Men\n- 3 Women\n- A bout de souffle\n- A Clockwork Orange\n- A Few Good Men\n- An Affair to Remember\n- Anatomy of a Murder\n- Angst essen Seele auf\n- Annie Hall\n- Arizona Dream\n- Arrival\n- Artificial Intelligence\n- Baisers volés\n- Bande à part\n- Beetlejuice\n- Benny and Joon\n- Big Fish\n- Blue Valentine\n- Boyhood\n- Breakfast at Tiffany's\n- Bullitt\n- But I'm a Cheerleader\n- Butterflies Are Free\n- Cactus Flower\n- Charade\n- Closer\n- Comment c'est loin\n- Cool Hand Luke\n- Detachment\n- Dial M For Murder\n- District 9\n- Django Unchained\n- Drive\n- Dunkirk\n- Edge of Tomorrow\n- Edward Scissorhands\n- Eyes Wide Shut\n- Frost Nixon\n- Funny Face\n- Fury\n- Get Out\n- Girl, Interrupted\n- Good Bye Lenin\n- Hail Caesar\n- Happy Go Lucky\n- Happythankyoumoreplease\n- Hard Candy\n- Harold and Maude\n- Heathers\n- Her\n- Howl\n- I Heart Huckabees\n- In The Mood For Love\n- Inglourious Basterds\n- Inside Man\n- Into The Wild\n- James Dean\n- Judgment at Nuremberg\n- Jules et Jim\n- Juno\n- Kûki ningyô\n- Kynodontas\n- L'Armée des Ombres\n- L'enfant sauvage\n- La Maman et la Putain\n- La meglio gioventù\n- La Tête Haute\n- Lars and the Real Girl\n- Le Havre\n- Le Mépris\n- Le Samouraï\n- Léon Morin, Prêtre\n- Les quatre cents coups\n- Les Valseuses\n- Leviathan\n- Lila dit ça\n- Lincoln\n- Little Children\n- Little Miss Sunshine\n- Lola Rennt\n- Lord of the Rings\n- Lost in Translation\n- Lucky Number Slevin\n- Marie-Antoinette\n- Martha Marcy May Marlene\n- Masculin Féminin\n- Memories of Murder\n- Mermaids\n- Mesrine 1 L'instinct de Mort\n- Mesrine 2 L'ennemi public n°1\n- Mid90s\n- Mon Oncle\n- Mon Roi\n- Monty Python and the Holy Grail\n- Moonrise Kingdom\n- Mother!\n- My Name Is Nobody\n- Napoleon Dynamite\n- Narco\n- Network\n- No Country For Old Men\n- Nowhere Boy\n- Okja\n- Once Upon a Time in the West\n- One Flew Over The Cuckoo's Nest\n- One Hour Photo\n- Paper Moon\n- Pierrot le Fou\n- Playtime\n- Rabbit Hole\n- Rear Window\n- Roma\n- Rushmore\n- Saving Mr. Banks\n- Shimotsuma monogatari\n- Silver Linings Playbook\n- Snowpiercer\n- Steel Magnolias\n- Stoker\n- Submarine\n- Sweeney Todd The Demon Barber of Fleet Street\n- Take Shelter\n- Taking Off\n- Thank You For Smoking\n- The Americanization of Emily\n- The Apartment\n- The Believer\n- The Book of Eli\n- The Curious Case of Benjamin Button\n- The Darjeeling Limited\n- The Dirty Dozen\n- The Godfather\n- The History Boys\n- The Hobbit\n- The Innocents\n- The Life And Death Of Colonel Blimp\n- The Life Aquatic with Steve Zissou\n- The Martian\n- The Notebook\n- The Philadelphia Story\n- The Reader\n- The Royal Tenenbaums\n- The Shining\n- The Sound Of Music\n- The Sting\n- The Sugarland Express\n- The Treasure Of The Sierra Madre\n- The Tree of Life\n- The Truman Show\n- The Wizard Of Oz\n- There Will Be Blood\n- Top Hat\n- True Grit\n- Une Femme Est Une Femme\n- Valley Of The Dolls\n- Vanilla Sky\n- Vicky Cristina Barcelona\n- Walk the Line\n- Yes Man\n- Yi Yi\n\nThe Movies :\n\n- 13 Going On 30\n- 1917\n- A Fistful of Dollars\n- A Swedish Love Story\n- Alita Battle Angel\n- American Made\n- Auntie Mame\n- Belle de Jour\n- Birthday Girl\n- Busanhaeng\n- Calvaire\n- Captain Fantastic\n- Captive State\n- Carnal Knowledge\n- Castaway on the Moon\n- Chappie\n- Chinatown\n- Clue\n- Clueless\n- Coffee and Cigarettes\n- Copacabana\n- Cry Baby\n- Dallas Buyers Club\n- Donnie Brasco\n- Dr. Strangelove or: How I Learned to Stop Worrying and Love the Bomb\n- Dune\n- East Is East\n- Essaye moi\n- Et Dieu... créa la femme\n- Ex Machina\n- Ferris Bueller's Day Off\n- Forbidden Planet\n- From Hell\n- Ghost Dog: The Way of the Samurai\n- Good Time\n- Gosford Park\n- Grease\n- Green Book\n- Groundhog Day\n- JCVD\n- Kramer vs. Kramer\n- L'hermine\n- La Belle Verte\n- La Chinoise\n- La classe américaine\n- La Cloche a Sonné\n- La Macchina ammazzacattivi\n- Le Charme Discret De La Bourgeoisie\n- Les cinq parties du monde\n- Les Demoiselles de Rochefort\n- Les Parisiennes\n- Liar Liar\n- Ma Loute\n- Mad Max: Fury Road\n- Magnolia\n- Minari\n- Monty Python and the Holy Grail\n- Ohayo\n- Parasite\n- Passengers\n- Persona\n- Pretty In Pink\n- Private Benjamin\n- Ready or Not\n- Ridicule\n- Sedmikrásky\n- Shaun Of The Dead\n- Spring Summer Fall Winter and Spring\n- Stand by Me\n- The Band Wagon\n- The Beatles Help!\n- The Favourite\n- The Fifth Element\n- The Girl Next Door\n- The Girl on the Train\n- The Great Escape\n- The Master\n- The Stepford Wives (2004)\n- The Ten Commandments\n- To Catch a Thief\n- Trainspotting\n- Versus\n- Vertigo\n- WarGames\n- What Happened To Monday\n- What's Eating Gilbert Grape\n- Whatever Works\n- Yuke yuke nidome no shojo\n"
}
function compiledContent$3() {
	return html$3
}
function getHeadings$3() {
	return []
}
function getHeaders$3() {
	console.warn('getHeaders() have been deprecated. Use getHeadings() function instead.')
	return getHeadings$3()
}
async function Content$3() {
	const { layout, ...content } = frontmatter$3
	content.file = file$3
	content.url = url$3
	content.astro = {}
	Object.defineProperty(content.astro, 'headings', {
		get() {
			throw new Error(
				'The "astro" property is no longer supported! To access "headings" from your layout, try using "Astro.props.headings."',
			)
		},
	})
	Object.defineProperty(content.astro, 'html', {
		get() {
			throw new Error(
				'The "astro" property is no longer supported! To access "html" from your layout, try using "Astro.props.compiledContent()."',
			)
		},
	})
	Object.defineProperty(content.astro, 'source', {
		get() {
			throw new Error(
				'The "astro" property is no longer supported! To access "source" from your layout, try using "Astro.props.rawContent()."',
			)
		},
	})
	const contentFragment = createVNode(Fragment, { 'set:html': html$3 })
	return createVNode($$BlogPost, {
		file: file$3,
		url: url$3,
		content,
		frontmatter: content,
		headings: getHeadings$3(),
		rawContent: rawContent$3,
		compiledContent: compiledContent$3,
		'server:root': true,
		children: contentFragment,
	})
}
Content$3[Symbol.for('astro.needsHeadRendering')] = false

const _page3 = /*#__PURE__*/ Object.freeze(
	/*#__PURE__*/ Object.defineProperty(
		{
			__proto__: null,
			frontmatter: frontmatter$3,
			file: file$3,
			url: url$3,
			rawContent: rawContent$3,
			compiledContent: compiledContent$3,
			getHeadings: getHeadings$3,
			getHeaders: getHeaders$3,
			Content: Content$3,
			default: Content$3,
		},
		Symbol.toStringTag,
		{ value: 'Module' },
	),
)

const html$2 =
	'<h2 id="large">LARGE</h2>\n<h2 id="fancy">FANCY</h2>\n<h2 id="site">SITE</h2>\n<h2 id="filled">FILLED</h2>\n<h2 id="with">WITH</h2>\n<h2 id="crap">CRAP</h2>\n<style></style>'

const frontmatter$2 = {
	layout: '../layouts/BlogPost.astro',
	title: 'About',
	description: "What's a vegetalope?",
	updatedDate: '2022-11-24',
}
const file$2 = '/Users/brnrd/Projects/vegetalope/src/pages/about.md'
const url$2 = '/about'
function rawContent$2() {
	return '\n## LARGE\n## FANCY\n## SITE\n## FILLED\n## WITH\n## CRAP\n\n<style >'
}
function compiledContent$2() {
	return html$2
}
function getHeadings$2() {
	return [
		{ depth: 2, slug: 'large', text: 'LARGE' },
		{ depth: 2, slug: 'fancy', text: 'FANCY' },
		{ depth: 2, slug: 'site', text: 'SITE' },
		{ depth: 2, slug: 'filled', text: 'FILLED' },
		{ depth: 2, slug: 'with', text: 'WITH' },
		{ depth: 2, slug: 'crap', text: 'CRAP' },
	]
}
function getHeaders$2() {
	console.warn('getHeaders() have been deprecated. Use getHeadings() function instead.')
	return getHeadings$2()
}
async function Content$2() {
	const { layout, ...content } = frontmatter$2
	content.file = file$2
	content.url = url$2
	content.astro = {}
	Object.defineProperty(content.astro, 'headings', {
		get() {
			throw new Error(
				'The "astro" property is no longer supported! To access "headings" from your layout, try using "Astro.props.headings."',
			)
		},
	})
	Object.defineProperty(content.astro, 'html', {
		get() {
			throw new Error(
				'The "astro" property is no longer supported! To access "html" from your layout, try using "Astro.props.compiledContent()."',
			)
		},
	})
	Object.defineProperty(content.astro, 'source', {
		get() {
			throw new Error(
				'The "astro" property is no longer supported! To access "source" from your layout, try using "Astro.props.rawContent()."',
			)
		},
	})
	const contentFragment = createVNode(Fragment, { 'set:html': html$2 })
	return createVNode($$BlogPost, {
		file: file$2,
		url: url$2,
		content,
		frontmatter: content,
		headings: getHeadings$2(),
		rawContent: rawContent$2,
		compiledContent: compiledContent$2,
		'server:root': true,
		children: contentFragment,
	})
}
Content$2[Symbol.for('astro.needsHeadRendering')] = false

const _page4 = /*#__PURE__*/ Object.freeze(
	/*#__PURE__*/ Object.defineProperty(
		{
			__proto__: null,
			frontmatter: frontmatter$2,
			file: file$2,
			url: url$2,
			rawContent: rawContent$2,
			compiledContent: compiledContent$2,
			getHeadings: getHeadings$2,
			getHeaders: getHeaders$2,
			Content: Content$2,
			default: Content$2,
		},
		Symbol.toStringTag,
		{ value: 'Module' },
	),
)

const html$1 =
	'<p>As a good concerned netcitizen here I was reading the cookies policy on a website I was on, as you do, living my best life when I noticed a footnote that said:</p>\n<blockquote>\n<p>We also use Google Analytics Advertising Features. Read more about it and how you can opt out here: <a href="https://tools.google.com/dlpage/gaoptout/">https://tools.google.com/dlpage/gaoptout/</a></p>\n</blockquote>\n<p>Now you got me interested. Just to think that there was a hidden thing somewhere to completely opt-out of Google Analytics got me all reved up.</p>\n<blockquote>\n<p>Google Analytics Opt-out Browser Add-on</p>\n</blockquote>\n<p>What now? A browser extension? Supported by Chrome, Internet Explorer 11, Safari, Firefox and Opera?\nI have to admit I’m a bit disappointed. I was expecting a setting on my Google account, a browser extension is a bit lazy Google.</p>\n<p>But let’s check this out: last updated April 2019, 4 out of 5 stars, 1M+ users. Wow, just wow. I mean, you have to be pretty motivated to just block GA and that’s it. And by blocking I mean, loading the script, running it, just not pushing the data to Google.</p>\n<p>How does it work?</p>\n<p>I had to extract the code from the <code>.xpi</code> (which is just a renamed <code>.zip</code>) and have a peek.\nThe only thing it does is make the page run an extra bit of JS through a content script applied on all pages:</p>\n<pre is:raw="" class="astro-code" style="background-color: #0d1117; overflow-x: auto;"><code><span class="line"><span style="color: #C9D1D9">window[</span><span style="color: #A5D6FF">\'_gaUserPrefs\'</span><span style="color: #C9D1D9">] </span><span style="color: #FF7B72">=</span><span style="color: #C9D1D9"> {</span></span>\n<span class="line"><span style="color: #C9D1D9">\t</span><span style="color: #D2A8FF">ioo</span><span style="color: #C9D1D9">: </span><span style="color: #FF7B72">function</span><span style="color: #C9D1D9"> () {</span></span>\n<span class="line"><span style="color: #C9D1D9">\t\t</span><span style="color: #FF7B72">return</span><span style="color: #C9D1D9"> </span><span style="color: #79C0FF">true</span></span>\n<span class="line"><span style="color: #C9D1D9">\t},</span></span>\n<span class="line"><span style="color: #C9D1D9">}</span></span></code></pre>\n<p>It does not communicate with Google or anything. My guess is that when GA executes, it checks the existence of this <code>_gaUserPrefs</code> key on the window object, calls the function and doesn’t send the data or doesn’t run if the <code>ioo</code> function returns true.</p>\n<p>That’s something I guess right? RIGHT!</p>\n<p>Oh wait, what do I see now?</p>\n<p><a href="https://addons.mozilla.org/en-US/firefox/addon/interest-advertising-opt-out/">IBA Opt-out (by Google)</a>! Another extension, also made by Google, to opt-out the Interest Based Advertising. Only half a million users for the Chrome version, 3365 for the Firefox one, 3 out of 5 stars. Ouch!</p>\n<p>Does it mean I’m not going to get ads? No, of course not. They just won’t be “pertinent”, not be based on my activity. And it apparently breaks the web too: it seems that some website don’t work too well if doubleclick is not allowed to perform. Since it was last updated in August 2013 for Chrome, and in December 2018 for Firefox (it broke when Firefox Quantum was released) people dropping reviews are not too happy about it. But who leaves positive feedback amirite?\nThat might be nice if I don’t want to block ads on my favourite websites and still block Google from knowing everything about me.</p>\n<p>How does this one work?</p>\n<p>Google was a bit kinder for that one, as the code is open-source on <a href="https://code.google.com/archive/p/google-opt-out-plugin/source/default/source">Google Code</a>.</p>\n<p>It asks me for permission for <code>http://doubleclick.net/</code> and the cookies.</p>\n<p>The solution was a cookie.</p>\n<pre is:raw="" class="astro-code" style="background-color: #0d1117; overflow-x: auto;"><code><span class="line"><span style="color: #C9D1D9">{</span></span>\n<span class="line"><span style="color: #C9D1D9">\t</span><span style="color: #FFA657">name</span><span style="color: #C9D1D9">: </span><span style="color: #A5D6FF">\'id\'</span><span style="color: #C9D1D9">,</span></span>\n<span class="line"><span style="color: #C9D1D9">\t</span><span style="color: #FFA657">value</span><span style="color: #C9D1D9">: </span><span style="color: #A5D6FF">\'OPT_OUT\'</span><span style="color: #C9D1D9">,</span></span>\n<span class="line"><span style="color: #C9D1D9">\t</span><span style="color: #FFA657">domain</span><span style="color: #C9D1D9">: </span><span style="color: #A5D6FF">\'.doubleclick.net\'</span><span style="color: #C9D1D9">,</span></span>\n<span class="line"><span style="color: #C9D1D9">\t</span><span style="color: #FFA657">url</span><span style="color: #C9D1D9">: </span><span style="color: #A5D6FF">\'http://doubleclick.net\'</span><span style="color: #C9D1D9">,</span></span>\n<span class="line"><span style="color: #C9D1D9">\t</span><span style="color: #FFA657">expirationDate</span><span style="color: #C9D1D9">: </span><span style="color: #79C0FF">1920499146</span></span>\n<span class="line"><span style="color: #C9D1D9">}</span></span></code></pre>\n<p>What happens after 1920499146/Sat, 09 Nov 2030 23:59:06 GMT? I’ll let you know when I get there.</p>\n<p>Thank you Google but I’ll stick with <a href="https://github.com/gorhill/uBlock">uBlock Origin</a> and <a href="https://pi-hole.net/">Pi-hole</a>.</p>\n<p>Why you ask? That’s a story for another time.</p>'

const frontmatter$1 = {
	layout: '../../layouts/BlogPost.astro',
	title: 'Google blocking itself?',
	description: 'Are we in 2030 yet?',
	pubDate: '2019-09-18',
}
const file$1 = '/Users/brnrd/Projects/vegetalope/src/pages/blog/google-blocking-themselves.md'
const url$1 = '/blog/google-blocking-themselves'
function rawContent$1() {
	return "\nAs a good concerned netcitizen here I was reading the cookies policy on a website I was on, as you do, living my best life when I noticed a footnote that said:\n\n> We also use Google Analytics Advertising Features. Read more about it and how you can opt out here: [https://tools.google.com/dlpage/gaoptout/](https://tools.google.com/dlpage/gaoptout/)\n\nNow you got me interested. Just to think that there was a hidden thing somewhere to completely opt-out of Google Analytics got me all reved up.\n\n> Google Analytics Opt-out Browser Add-on\n\nWhat now? A browser extension? Supported by Chrome, Internet Explorer 11, Safari, Firefox and Opera?\nI have to admit I'm a bit disappointed. I was expecting a setting on my Google account, a browser extension is a bit lazy Google.\n\nBut let's check this out: last updated April 2019, 4 out of 5 stars, 1M+ users. Wow, just wow. I mean, you have to be pretty motivated to just block GA and that's it. And by blocking I mean, loading the script, running it, just not pushing the data to Google.\n\nHow does it work?\n\nI had to extract the code from the `.xpi` (which is just a renamed `.zip`) and have a peek.\nThe only thing it does is make the page run an extra bit of JS through a content script applied on all pages:\n\n```javascript\nwindow['_gaUserPrefs'] = {\n\tioo: function () {\n\t\treturn true\n\t},\n}\n```\n\nIt does not communicate with Google or anything. My guess is that when GA executes, it checks the existence of this `_gaUserPrefs` key on the window object, calls the function and doesn't send the data or doesn't run if the `ioo` function returns true.\n\nThat's something I guess right? RIGHT!\n\nOh wait, what do I see now?\n\n[IBA Opt-out (by Google)](https://addons.mozilla.org/en-US/firefox/addon/interest-advertising-opt-out/)! Another extension, also made by Google, to opt-out the Interest Based Advertising. Only half a million users for the Chrome version, 3365 for the Firefox one, 3 out of 5 stars. Ouch!\n\nDoes it mean I'm not going to get ads? No, of course not. They just won't be \"pertinent\", not be based on my activity. And it apparently breaks the web too: it seems that some website don't work too well if doubleclick is not allowed to perform. Since it was last updated in August 2013 for Chrome, and in December 2018 for Firefox (it broke when Firefox Quantum was released) people dropping reviews are not too happy about it. But who leaves positive feedback amirite?\nThat might be nice if I don't want to block ads on my favourite websites and still block Google from knowing everything about me.\n\nHow does this one work?\n\nGoogle was a bit kinder for that one, as the code is open-source on [Google Code](https://code.google.com/archive/p/google-opt-out-plugin/source/default/source).\n\nIt asks me for permission for `http://doubleclick.net/` and the cookies.\n\nThe solution was a cookie.\n\n```javascript\n{\n\tname: 'id',\n\tvalue: 'OPT_OUT',\n\tdomain: '.doubleclick.net',\n\turl: 'http://doubleclick.net',\n\texpirationDate: 1920499146\n}\n```\n\nWhat happens after 1920499146/Sat, 09 Nov 2030 23:59:06 GMT? I'll let you know when I get there.\n\nThank you Google but I'll stick with [uBlock Origin](https://github.com/gorhill/uBlock) and [Pi-hole](https://pi-hole.net/).\n\nWhy you ask? That's a story for another time.\n"
}
function compiledContent$1() {
	return html$1
}
function getHeadings$1() {
	return []
}
function getHeaders$1() {
	console.warn('getHeaders() have been deprecated. Use getHeadings() function instead.')
	return getHeadings$1()
}
async function Content$1() {
	const { layout, ...content } = frontmatter$1
	content.file = file$1
	content.url = url$1
	content.astro = {}
	Object.defineProperty(content.astro, 'headings', {
		get() {
			throw new Error(
				'The "astro" property is no longer supported! To access "headings" from your layout, try using "Astro.props.headings."',
			)
		},
	})
	Object.defineProperty(content.astro, 'html', {
		get() {
			throw new Error(
				'The "astro" property is no longer supported! To access "html" from your layout, try using "Astro.props.compiledContent()."',
			)
		},
	})
	Object.defineProperty(content.astro, 'source', {
		get() {
			throw new Error(
				'The "astro" property is no longer supported! To access "source" from your layout, try using "Astro.props.rawContent()."',
			)
		},
	})
	const contentFragment = createVNode(Fragment, { 'set:html': html$1 })
	return createVNode($$BlogPost, {
		file: file$1,
		url: url$1,
		content,
		frontmatter: content,
		headings: getHeadings$1(),
		rawContent: rawContent$1,
		compiledContent: compiledContent$1,
		'server:root': true,
		children: contentFragment,
	})
}
Content$1[Symbol.for('astro.needsHeadRendering')] = false

const _page5 = /*#__PURE__*/ Object.freeze(
	/*#__PURE__*/ Object.defineProperty(
		{
			__proto__: null,
			frontmatter: frontmatter$1,
			file: file$1,
			url: url$1,
			rawContent: rawContent$1,
			compiledContent: compiledContent$1,
			getHeadings: getHeadings$1,
			getHeaders: getHeaders$1,
			Content: Content$1,
			default: Content$1,
		},
		Symbol.toStringTag,
		{ value: 'Module' },
	),
)

const html =
	'<p>I was looking for a static site generator with no fancy features, that took Markdown files as an input and finally settled on <a href="https://github.com/jnordberg/wintersmith">Wintersmith</a>.\nBut how to make it play nicely on Netlify?</p>\n<p>Admittedly I chose Wintersmith mostly because the CLI generated site that wintersmith provides is not a skeleton, but a working template. It thus means that you have nothing to do except updating your styling and writing some content (almost).</p>\n<p>My static single page website was already hosted on <a href="https://www.netlify.com/">Netlify</a> because it’s free.\nBut now I find myself with a globally installed tool to generate a site, but I can’t globally install npm packages on Netlify.</p>\n<ul>\n<li>\n<p>Option 1: run <code>wintersmith build</code> locally, commit the <code>/build</code> folder and push the whole thing and point the Netlify build setting to only point at the said folder. Nasty. (That said, it works, I tried)</p>\n</li>\n<li>\n<p>Option 2: add <code>wintersmith</code> as a dev dependency on the project and add a build npm script.</p>\n</li>\n</ul>\n<p>So in <code>package.json</code>, I added:</p>\n<pre is:raw="" class="astro-code" style="background-color: #0d1117; overflow-x: auto;"><code><span class="line"><span style="color: #A5D6FF">"devDependencies"</span><span style="color: #C9D1D9">: {</span></span>\n<span class="line"><span style="color: #C9D1D9">    </span><span style="color: #7EE787">"wintersmith"</span><span style="color: #C9D1D9">: </span><span style="color: #A5D6FF">"^2.5.0"</span></span>\n<span class="line"><span style="color: #C9D1D9">},</span></span>\n<span class="line"><span style="color: #A5D6FF">"scripts"</span><span style="color: #C9D1D9">: {</span></span>\n<span class="line"><span style="color: #C9D1D9">    </span><span style="color: #7EE787">"build"</span><span style="color: #C9D1D9">: </span><span style="color: #A5D6FF">"wintersmith build"</span></span>\n<span class="line"><span style="color: #C9D1D9">}</span></span></code></pre>\n<p>The only thing left to do now was to update the Netifly build settings as such:</p>\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n<table><thead><tr><th>Setting</th><th>Value</th></tr></thead><tbody><tr><td>Base directory</td><td></td></tr><tr><td>Build command</td><td>npm run build</td></tr><tr><td>Publish directory</td><td>build</td></tr></tbody></table>\n<p>Save, (delete your local <code>\\build</code> directory), commit your changes and push. Netlify will do the rest.</p>'

const frontmatter = {
	layout: '../../layouts/BlogPost.astro',
	title: 'Wintersmith on Netlify',
	description: 'Who uses Wintersmith anymore?',
	pubDate: '2019-09-12',
}
const file = '/Users/brnrd/Projects/vegetalope/src/pages/blog/wintersmith-on-netlify.md'
const url = '/blog/wintersmith-on-netlify'
function rawContent() {
	return '\nI was looking for a static site generator with no fancy features, that took Markdown files as an input and finally settled on [Wintersmith][wintersmith].\nBut how to make it play nicely on Netlify?\n\nAdmittedly I chose Wintersmith mostly because the CLI generated site that wintersmith provides is not a skeleton, but a working template. It thus means that you have nothing to do except updating your styling and writing some content (almost).\n\nMy static single page website was already hosted on [Netlify][netlify] because it\'s free.\nBut now I find myself with a globally installed tool to generate a site, but I can\'t globally install npm packages on Netlify.\n\n- Option 1: run `wintersmith build` locally, commit the `/build` folder and push the whole thing and point the Netlify build setting to only point at the said folder. Nasty. (That said, it works, I tried)\n\n- Option 2: add `wintersmith` as a dev dependency on the project and add a build npm script.\n\nSo in `package.json`, I added:\n\n```json\n"devDependencies": {\n    "wintersmith": "^2.5.0"\n},\n"scripts": {\n    "build": "wintersmith build"\n}\n```\n\nThe only thing left to do now was to update the Netifly build settings as such:\n\n| Setting           | Value         |\n| ----------------- | ------------- |\n| Base directory    |               |\n| Build command     | npm run build |\n| Publish directory | build         |\n\nSave, (delete your local `\\build` directory), commit your changes and push. Netlify will do the rest.\n\n[netlify]: https://www.netlify.com/\n[wintersmith]: https://github.com/jnordberg/wintersmith\n'
}
function compiledContent() {
	return html
}
function getHeadings() {
	return []
}
function getHeaders() {
	console.warn('getHeaders() have been deprecated. Use getHeadings() function instead.')
	return getHeadings()
}
async function Content() {
	const { layout, ...content } = frontmatter
	content.file = file
	content.url = url
	content.astro = {}
	Object.defineProperty(content.astro, 'headings', {
		get() {
			throw new Error(
				'The "astro" property is no longer supported! To access "headings" from your layout, try using "Astro.props.headings."',
			)
		},
	})
	Object.defineProperty(content.astro, 'html', {
		get() {
			throw new Error(
				'The "astro" property is no longer supported! To access "html" from your layout, try using "Astro.props.compiledContent()."',
			)
		},
	})
	Object.defineProperty(content.astro, 'source', {
		get() {
			throw new Error(
				'The "astro" property is no longer supported! To access "source" from your layout, try using "Astro.props.rawContent()."',
			)
		},
	})
	const contentFragment = createVNode(Fragment, { 'set:html': html })
	return createVNode($$BlogPost, {
		file,
		url,
		content,
		frontmatter: content,
		headings: getHeadings(),
		rawContent,
		compiledContent,
		'server:root': true,
		children: contentFragment,
	})
}
Content[Symbol.for('astro.needsHeadRendering')] = false

const _page6 = /*#__PURE__*/ Object.freeze(
	/*#__PURE__*/ Object.defineProperty(
		{
			__proto__: null,
			frontmatter,
			file,
			url,
			rawContent,
			compiledContent,
			getHeadings,
			getHeaders,
			Content,
			default: Content,
		},
		Symbol.toStringTag,
		{ value: 'Module' },
	),
)

const $$Astro = createAstro(
	'/Users/brnrd/Projects/vegetalope/src/pages/blog.astro',
	'https://www.vegetalope.com/',
	'file:///Users/brnrd/Projects/vegetalope/',
)
const $$Blog = createComponent(async ($$result, $$props, $$slots) => {
	const Astro2 = $$result.createAstro($$Astro, $$props, $$slots)
	Astro2.self = $$Blog
	const posts = (
		await Astro2.glob(
			/* #__PURE__ */ Object.assign({
				'./blog/google-blocking-themselves.md': () => Promise.resolve().then(() => _page5),
				'./blog/wintersmith-on-netlify.md': () => Promise.resolve().then(() => _page6),
			}),
			() => './blog/*.{md,mdx}',
		)
	).sort(
		(a, b) => new Date(b.frontmatter.pubDate).valueOf() - new Date(a.frontmatter.pubDate).valueOf(),
	)
	return renderTemplate`<html lang="en" class="astro-LFGF2FHQ">
	<head>
		${renderComponent($$result, 'BaseHead', $$BaseHead, {
			title: SITE_TITLE,
			description: SITE_DESCRIPTION,
			class: 'astro-LFGF2FHQ',
		})}
		
	${renderHead($$result)}</head>
	<body class="astro-LFGF2FHQ">
		${renderComponent($$result, 'Header', $$Header, { class: 'astro-LFGF2FHQ' })}
		<main class="astro-LFGF2FHQ">
			<section class="astro-LFGF2FHQ">
				<ul class="astro-LFGF2FHQ">
					${posts.map(
						post => renderTemplate`<li class="astro-LFGF2FHQ">
								<time${addAttribute(post.frontmatter.pubDate, 'datetime')} class="astro-LFGF2FHQ">
									${new Date(post.frontmatter.pubDate).toLocaleDateString('en-us', {
										year: 'numeric',
										month: 'short',
										day: 'numeric',
									})}
								</time>
								<a${addAttribute(post.url, 'href')} class="astro-LFGF2FHQ">${post.frontmatter.title}</a>
							</li>`,
					)}
				</ul>
			</section>
		</main>
		${renderComponent($$result, 'Footer', $$Footer, { class: 'astro-LFGF2FHQ' })}
	</body></html>`
})

const $$file = '/Users/brnrd/Projects/vegetalope/src/pages/blog.astro'
const $$url = '/blog'

const _page7 = /*#__PURE__*/ Object.freeze(
	/*#__PURE__*/ Object.defineProperty(
		{
			__proto__: null,
			default: $$Blog,
			file: $$file,
			url: $$url,
		},
		Symbol.toStringTag,
		{ value: 'Module' },
	),
)

const pageMap = new Map([
	['src/pages/index.astro', _page0],
	['src/pages/tv-shows.md', _page1],
	['src/pages/rss.xml.js', _page2],
	['src/pages/movies.md', _page3],
	['src/pages/about.md', _page4],
	['src/pages/blog/google-blocking-themselves.md', _page5],
	['src/pages/blog/wintersmith-on-netlify.md', _page6],
	['src/pages/blog.astro', _page7],
])
const renderers = [
	Object.assign(
		{ name: 'astro:jsx', serverEntrypoint: 'astro/jsx/server.js', jsxImportSource: 'astro' },
		{ ssr: server_default },
	),
]

if (typeof process !== 'undefined') {
	if (process.argv.includes('--verbose'));
	else if (process.argv.includes('--silent'));
	else;
}

const SCRIPT_EXTENSIONS = /* @__PURE__ */ new Set(['.js', '.ts'])
new RegExp(
	`\\.(${Array.from(SCRIPT_EXTENSIONS)
		.map(s => s.slice(1))
		.join('|')})($|\\?)`,
)

const STYLE_EXTENSIONS = /* @__PURE__ */ new Set([
	'.css',
	'.pcss',
	'.postcss',
	'.scss',
	'.sass',
	'.styl',
	'.stylus',
	'.less',
])
new RegExp(
	`\\.(${Array.from(STYLE_EXTENSIONS)
		.map(s => s.slice(1))
		.join('|')})($|\\?)`,
)

function getRouteGenerator(segments, addTrailingSlash) {
	const template = segments
		.map(segment => {
			return (
				'/' +
				segment
					.map(part => {
						if (part.spread) {
							return `:${part.content.slice(3)}(.*)?`
						} else if (part.dynamic) {
							return `:${part.content}`
						} else {
							return part.content
								.normalize()
								.replace(/\?/g, '%3F')
								.replace(/#/g, '%23')
								.replace(/%5B/g, '[')
								.replace(/%5D/g, ']')
								.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
						}
					})
					.join('')
			)
		})
		.join('')
	let trailing = ''
	if (addTrailingSlash === 'always' && segments.length) {
		trailing = '/'
	}
	const toPath = compile(template + trailing)
	return toPath
}

function deserializeRouteData(rawRouteData) {
	return {
		route: rawRouteData.route,
		type: rawRouteData.type,
		pattern: new RegExp(rawRouteData.pattern),
		params: rawRouteData.params,
		component: rawRouteData.component,
		generate: getRouteGenerator(rawRouteData.segments, rawRouteData._meta.trailingSlash),
		pathname: rawRouteData.pathname || void 0,
		segments: rawRouteData.segments,
	}
}

function deserializeManifest(serializedManifest) {
	const routes = []
	for (const serializedRoute of serializedManifest.routes) {
		routes.push({
			...serializedRoute,
			routeData: deserializeRouteData(serializedRoute.routeData),
		})
		const route = serializedRoute
		route.routeData = deserializeRouteData(serializedRoute.routeData)
	}
	const assets = new Set(serializedManifest.assets)
	return {
		...serializedManifest,
		assets,
		routes,
	}
}

const _manifest = Object.assign(
	deserializeManifest({
		adapterName: '@astrojs/netlify/functions',
		routes: [
			{
				file: '',
				links: ['assets/about.0fc66a5a.css'],
				scripts: [],
				routeData: {
					route: '/',
					type: 'page',
					pattern: '^\\/$',
					segments: [],
					params: [],
					component: 'src/pages/index.astro',
					pathname: '/',
					_meta: { trailingSlash: 'ignore' },
				},
			},
			{
				file: '',
				links: ['assets/about.0fc66a5a.css', 'assets/about.cd791a1a.css'],
				scripts: [],
				routeData: {
					route: '/tv-shows',
					type: 'page',
					pattern: '^\\/tv-shows\\/?$',
					segments: [[{ content: 'tv-shows', dynamic: false, spread: false }]],
					params: [],
					component: 'src/pages/tv-shows.md',
					pathname: '/tv-shows',
					_meta: { trailingSlash: 'ignore' },
				},
			},
			{
				file: '',
				links: ['assets/about.0fc66a5a.css', 'assets/about.cd791a1a.css'],
				scripts: [],
				routeData: {
					route: '/rss.xml',
					type: 'endpoint',
					pattern: '^\\/rss\\.xml$',
					segments: [[{ content: 'rss.xml', dynamic: false, spread: false }]],
					params: [],
					component: 'src/pages/rss.xml.js',
					pathname: '/rss.xml',
					_meta: { trailingSlash: 'ignore' },
				},
			},
			{
				file: '',
				links: ['assets/about.0fc66a5a.css', 'assets/about.cd791a1a.css'],
				scripts: [],
				routeData: {
					route: '/movies',
					type: 'page',
					pattern: '^\\/movies\\/?$',
					segments: [[{ content: 'movies', dynamic: false, spread: false }]],
					params: [],
					component: 'src/pages/movies.md',
					pathname: '/movies',
					_meta: { trailingSlash: 'ignore' },
				},
			},
			{
				file: '',
				links: ['assets/about.0fc66a5a.css', 'assets/about.cd791a1a.css'],
				scripts: [],
				routeData: {
					route: '/about',
					type: 'page',
					pattern: '^\\/about\\/?$',
					segments: [[{ content: 'about', dynamic: false, spread: false }]],
					params: [],
					component: 'src/pages/about.md',
					pathname: '/about',
					_meta: { trailingSlash: 'ignore' },
				},
			},
			{
				file: '',
				links: ['assets/about.0fc66a5a.css', 'assets/about.cd791a1a.css'],
				scripts: [],
				routeData: {
					route: '/blog/google-blocking-themselves',
					type: 'page',
					pattern: '^\\/blog\\/google-blocking-themselves\\/?$',
					segments: [
						[{ content: 'blog', dynamic: false, spread: false }],
						[{ content: 'google-blocking-themselves', dynamic: false, spread: false }],
					],
					params: [],
					component: 'src/pages/blog/google-blocking-themselves.md',
					pathname: '/blog/google-blocking-themselves',
					_meta: { trailingSlash: 'ignore' },
				},
			},
			{
				file: '',
				links: ['assets/about.0fc66a5a.css', 'assets/about.cd791a1a.css'],
				scripts: [],
				routeData: {
					route: '/blog/wintersmith-on-netlify',
					type: 'page',
					pattern: '^\\/blog\\/wintersmith-on-netlify\\/?$',
					segments: [
						[{ content: 'blog', dynamic: false, spread: false }],
						[{ content: 'wintersmith-on-netlify', dynamic: false, spread: false }],
					],
					params: [],
					component: 'src/pages/blog/wintersmith-on-netlify.md',
					pathname: '/blog/wintersmith-on-netlify',
					_meta: { trailingSlash: 'ignore' },
				},
			},
			{
				file: '',
				links: [
					'assets/blog.5437ed76.css',
					'assets/about.0fc66a5a.css',
					'assets/about.cd791a1a.css',
				],
				scripts: [],
				routeData: {
					route: '/blog',
					type: 'page',
					pattern: '^\\/blog\\/?$',
					segments: [[{ content: 'blog', dynamic: false, spread: false }]],
					params: [],
					component: 'src/pages/blog.astro',
					pathname: '/blog',
					_meta: { trailingSlash: 'ignore' },
				},
			},
		],
		site: 'https://www.vegetalope.com/',
		base: '/',
		markdown: {
			drafts: false,
			syntaxHighlight: 'shiki',
			shikiConfig: { langs: [], theme: 'github-dark', wrap: false },
			remarkPlugins: [],
			rehypePlugins: [],
			remarkRehype: {},
			extendDefaultPlugins: false,
			isAstroFlavoredMd: false,
		},
		pageMap: null,
		renderers: [],
		entryModules: {
			'\u0000@astrojs-ssr-virtual-entry': 'entry.mjs',
			'astro:scripts/before-hydration.js': '',
		},
		assets: [
			'/assets/about.0fc66a5a.css',
			'/assets/about.cd791a1a.css',
			'/assets/blog.5437ed76.css',
			'/favicon.svg',
			'/placeholder-social.png',
			'/robots.txt',
		],
	}),
	{
		pageMap: pageMap,
		renderers: renderers,
	},
)
const _args = {}

const _exports = adapter.createExports(_manifest, _args)
const handler = _exports['handler']

const _start = 'start'
if (_start in adapter) {
	adapter[_start](_manifest, _args)
}

export { handler }
