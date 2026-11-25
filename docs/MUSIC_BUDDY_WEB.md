# Music Buddy Web 0.1 — deployment

## Stable URLs

- Development: https://asymptopiasoftware.github.io/musicbuddy/
- Intended production: https://www.asymptopia.com/musicbuddy/
- Existing d3SRT/Cosmic Harmony applications and GitHub repositories: preserved as-is, linked under the Music Buddy feature on the development homepage.

## Source of truth

The browser application is intentionally contained in `public/musicbuddy/` in the authoritative Asymptopia Software website repository:

- `index.html`: accessible controls and practice layout
- `style.css`: responsive visual design
- `music.js`: journeys, chord rules, speech, MIDI adapter, and exercise loop

There is no Python or paid back end. Six journeys are embedded in `music.js`; this is a 0.1 implementation, not a decision about a future central data model.

## Development deployment

The existing GitHub Actions Pages workflow publishes the development site when changes land on `main`. It builds Astro and runs the site's tests. The /musicbuddy/ directory is copied unchanged from `public/` into `dist/`.

The workflow is pinned to ubuntu-24.04 so its Playwright 1.56 browser installation works; do not bypass the existing browser checks just to force deployment.

## Production deployment — requires server access

The production website is separate from this GitHub Pages development site. The legacy production deployment in `ccosse/asymptopiasoftware/deploy.sh` connects over SSH port 420 to `root@software.vegas` and uses `/var/www/asymptopia/`. That historical script deploys the old homepage; **do not run it for Music Buddy**.

A safe Music Buddy-only release procedure is:

1. Verify the development URL, MIDI permissions, spoken prompts, and full journey operation in Chromium on the intended keyboard.
2. Confirm with the current server's Apache/Django configuration that `/musicbuddy/` can be served as static files without shadowing another route.
3. Copy only the contents of `public/musicbuddy/` to a dedicated directory on the production server, for example `/var/www/asymptopia/static/musicbuddy/` if the existing static alias makes that appropriate. Keep d3SRT files untouched.
4. Configure the `/musicbuddy/` route to serve that directory, including `index.html`. Validate Apache configuration and reload only if needed.
5. Verify `https://www.asymptopia.com/musicbuddy/` on the live site before changing the production homepage feature.
6. Update production homepage to feature Music Buddy; move the old d3SRT link lower rather than deleting it.

The exact remote static path and Apache alias must be checked on the running server before executing any copy or configuration command. This document does **not** claim that production has been deployed.

## Browsers and MIDI

Web MIDI requires a supported browser, a secure HTTPS origin and user-granted MIDI access. Hardware piano audio is independent: the keyboard can drive an external sound module while the browser observes MIDI. Browser speech synthesis supplies chord *names*, not synthesized piano chords in 0.1.

## Acceptance checks

- Connect and disconnect a MIDI keyboard; rescan.
- Play a journey while keeping the instrument's own sound output independent of browser audio.
- Confirm the exact chord advances in any inversion; play an incorrect chord and inspect the live `You:` identifier.
- Choose any of twelve keys; seven jam-priority keys are marked.
- Switch all six journeys, notation styles and loop setting.
- Keep old d3SRT URLs and source unchanged.
