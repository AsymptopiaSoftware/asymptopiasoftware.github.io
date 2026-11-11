# Asymptopia Software — new permanent website

Development site: https://asymptopiasoftware.github.io/\n\nProduction site (separate, unchanged): https://www.asymptopia.com/

This repository publishes the development homepage at the GitHub Pages root (`/`). There is no separate `/dev/` route. The independent production website remains `www.asymptopia.com` and is not deployed from this workflow.

## Current homepage

- Compact seven-reel WELCOME demo supplied by the original `ccosse/slotmachine` project, pinned to a commit. See [docs/SLOT_MACHINE_ORIGINAL.md](docs/SLOT_MACHINE_ORIGINAL.md).
- Restored SVG Asymptopia logo and original cherries favicon.
- Automatic GitHub Pages build version badge.
- SEO and GA4 metadata are in `src/content/brand.json` and `src/content/analytics.json`.

The development homepage includes the WELCOME demo, masked project screenshot portals, and the rotating Professor demo. Reading Edge remains deferred.

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
