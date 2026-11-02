# Asymptopia Software — website framework

This is a new, intentionally minimal website. It is **not** a migration of the current asymptopia.com content and does not replace or modify any `ccosse` repositories.

## Architecture

- Astro static-site generator: build-time HTML, no application server.
- Vue 3 via `@astrojs/vue`: optional interactive islands where appropriate.
- GitHub Actions + GitHub Pages: deploy from the `main` branch.
- No Django, database, Linode, or paid hosting dependency.
- Placeholder homepage with a tiny Vue interaction check. **No project catalog or imported text.**

The current placeholder carries `noindex, nofollow` deliberately. We will remove this when there is a genuine public site to index.

## Develop locally

Install Node.js 24 (or compatible Node 22.12+) and run:

```sh
npm install
npm run dev
npm run build
npm run preview
```

## GitHub Pages

Repository: `AsymptopiaSoftware/asymptopiasoftware.github.io`

Planned Pages address: https://asymptopiasoftware.github.io/

In **Settings → Pages**, set **Build and deployment → Source** to **GitHub Actions**. Every push to `main` then runs `.github/workflows/deploy.yml`.

We intentionally use the GitHub Pages *organization site* repo name, so there is no `base` subpath in the Astro config.

## Files

```
astro.config.mjs
package.json
tsconfig.json
src/pages/index.astro
src/layouts/BaseLayout.astro
src/styles/global.css
src/components/VueCheck.vue
public/.nojekyll
.github/workflows/deploy.yml
```

## Future principles

Software first, minimal maintenance, self-contained content, stable public URLs and independently preserved code. No design, rankings, descriptions, images or content imports are committed yet. Any old live sites and the `ccosse` repositories remain unchanged.

Once we install dependencies successfully, we should commit a `package-lock.json` and change the workflow to `npm ci` to make future builds reproducible.
