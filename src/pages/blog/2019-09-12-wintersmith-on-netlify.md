---
layout: '../../layouts/BlogPost.astro'
title: 'Wintersmith on Netlify'
description: 'Who uses Wintersmith anymore?'
pubDate: '2019-09-12'
---

I was looking for a static site generator with no fancy features, that took Markdown files as an input and finally settled on [Wintersmith][wintersmith].
But how to make it play nicely on Netlify?

Admittedly I chose Wintersmith mostly because the CLI generated site that wintersmith provides is not a skeleton, but a working template. It thus means that you have nothing to do except updating your styling and writing some content (almost).

My static single page website was already hosted on [Netlify][netlify] because it's free.
But now I find myself with a globally installed tool to generate a site, but I can't globally install npm packages on Netlify.

- Option 1: run `wintersmith build` locally, commit the `/build` folder and push the whole thing and point the Netlify build setting to only point at the said folder. Nasty. (That said, it works, I tried)

- Option 2: add `wintersmith` as a dev dependency on the project and add a build npm script.

So in `package.json`, I added:

```json
"devDependencies": {
    "wintersmith": "^2.5.0"
},
"scripts": {
    "build": "wintersmith build"
}
```

The only thing left to do now was to update the Netifly build settings as such:

| Setting           | Value         |
| ----------------- | ------------- |
| Base directory    |               |
| Build command     | npm run build |
| Publish directory | build         |

Save, (delete your local `\build` directory), commit your changes and push. Netlify will do the rest.

[netlify]: https://www.netlify.com/
[wintersmith]: https://github.com/jnordberg/wintersmith
