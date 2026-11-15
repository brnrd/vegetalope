# vegetalope

This is a personal, content-focused website built with Astro and Svelte.
It is designed to stay simple, fast, and easy to maintain, while still allowing small interactive components where they make sense.

The project is deployed on Cloudflare Pages and fully statically generated.

## Live site

https://vegetalope.com

## About

This site is a personal space for curated content and small projects.
The site is intentionally kept lightweight and opinionated in its tooling and structure, favouring long-term maintainability over complexity.

The current focus is:

- fully static rendering
- minimal build and deployment surface
- good performance by default
- clear and readable project structure

## Technology stack

- Astro
- Svelte
- Vite (via Astro)
- Cloudflare Pages

Source code uses JavaScript. Keep interactive UI in Svelte components and shared
data, utilities, content configuration, and endpoints in `.js` modules. Astro
handles static pages and layouts. `jsconfig.json` provides editor support;
Astro generates its own declarations in the ignored `.astro/` directory.

There is no backend and no server-side runtime. All pages are generated at build time.

## Development

### Requirements

- Node.js 22.12.0 or later
- npm (or a compatible package manager)

### Install

```bash
git clone https://github.com/brnrd/vegetalope.git
cd vegetalope
npm install
```

### Local development

```bash
npm run dev
```

This starts a local development server with hot reload.

### Build

```bash
npm run build
```

The production output is generated in the `dist/` directory.

### Preview the production build

```bash
npm run preview
```

## Project structure

```
.
├─ public/        Static assets
├─ src/
│  ├─ components  Astro and Svelte components
│  ├─ pages       Pages and content
├─ astro.config.mjs
├─ package.json
```

## Deployment

This project is deployed using Cloudflare Pages.

Build configuration:

- Build command: `npm run build`
- Output directory: `dist`

Preview deployments are automatically created for pull requests.

## Performance notes

- The site is built in static mode.
- Assets use long-lived cache headers.
- Compression and edge caching are handled by the Cloudflare platform.
- Typography uses local system fonts, so reading does not depend on downloaded
  font assets.

No additional runtime or edge functions are required.

## Writing

Articles live in `src/content/write/en/` and `src/content/write/fr/`. Keep the
same filename for translations so language switching and related reading stay
aligned. Titles can change without changing the article URL.

Every article needs at least one `tags` value in its frontmatter:
`engineering-leadership`, `ai-at-work`, or `careers`. Use the same tags for both
translations. Topic labels and descriptions live in `src/data/articleTags.js`;
their English and French archives are generated automatically.

Choose related articles in `src/data/relatedArticles.js`. When a recommendation
is missing, the site fills the two slots using shared tags, then recency, within
the reader's language. Run `node --test src/data/relatedArticles.test.js` when
changing this selection logic.

## Contributing

This repository is primarily personal, but pull requests and suggestions are welcome.

If you plan to submit changes:

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Open a pull request

Please keep changes focused and aligned with the project’s lightweight and static-first philosophy.
