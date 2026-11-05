# Asymptopia Software — new permanent website

Public site: https://asymptopiasoftware.github.io/

This is the new standalone Astro/Vue website in the `AsymptopiaSoftware` organization. It is **not** a migration of the full current asymptopia.com content.

## Current homepage

- Compact seven-reel WELCOME demo supplied by the original `ccosse/slotmachine` project, pinned to a commit. See [docs/SLOT_MACHINE_ORIGINAL.md](docs/SLOT_MACHINE_ORIGINAL.md).
- Restored SVG Asymptopia logo and original cherries favicon.
- Automatic GitHub Pages build version badge.
- SEO and GA4 metadata are in `src/content/brand.json` and `src/content/analytics.json`.

Only projects supplying a functioning demo belong on the homepage. Slot Machine is currently the only included project. Reading Edge remains deferred.

## Local development

Node.js 24 or 22.12+:

```sh
npm install
npm test
npm run dev
npm run build
```

The site publishes via GitHub Actions on pushes to `main`. GitHub Pages is configured from Settings → Pages → GitHub Actions.

## Editing and stewardship

- Edit the logo, SEO title/description and other site identity fields in `src/content/brand.json`.
- Replace images through GitHub's UI in `public/images/`.
- Keep Slot Machine logic in its original repository; update the pinned dependency to consume reviewed changes.
- The current GitHub Pages site remains `noindex` until project content and SEO migration are approved.
- See [PROJECT_CHARTER.md](PROJECT_CHARTER.md) for preservation, SEO, editing and security principles.

No Linode instance, database, or live `asymptopia.com` application is required to run this website.
