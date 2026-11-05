# Slot Machine demo

Authoritative source: https://github.com/ccosse/slotmachine

The homepage imports the original project's exported Vue component via the
immutable commit archive in package.json (with integrity recorded in the lockfile). It passes `compact`, `reel-count=7`, and
`preset=WELCOME`. There is no local reel, timing, stopping, or symbol logic.
The package bundles the original artwork; no live backend is needed.

The original full-page app defaults to five reels and random stopping. Its
optional preset mode puts actual letter faces on the same twenty-pane reels
before animation. All spins, landings, and confetti belong to that project.

Do not add a homepage project without a functioning demo supplied by that
project. Reading Edge remains deferred. No catalog or additional project copy
has been added as part of this change.

## Updating and local development

Change the `slotmachine` dependency to a reviewed full commit SHA from the
original repository, then run `npm install`, `npm test`, and `npm run build`.
Commit package-lock.json. Never copy the component source into this repository.
For source development use the selected original checkout, run its browser tests,
and push its feature branch before pinning the homepage to that commit.

The homepage requires Node 22.12+ (Node 24 tested). `npm ci` installs the pinned
source package. `npm run dev` starts Astro. The app entrypoint registers Quasar
components and styles; the website wrapper supplies configuration only.

Review evidence is in `docs/evidence/`. Check desktop and narrow mobile layouts,
Spin and repeated WELCOME landings before approving either PR. The source PR
must be reviewed first; the homepage PR depends on its immutable commit.

Run `BROWSER_PATH=/usr/bin/chromium npm run test:browser` to build and exercise
the actual homepage demo on desktop and mobile; omit BROWSER_PATH when using
Playwright-managed Chromium (`npx playwright install chromium`).
