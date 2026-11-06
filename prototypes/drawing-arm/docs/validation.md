# Validation record — November 6, 2026

- `npm test`: **15 tests passed**, including thousands of FK/IK round trips and numerical checks against sampled feasible joint poses.
- `node scripts/standalone.js`: generated self-contained `standalone.html` from the shipping modules and stylesheet.
- `node scripts/evidence.js`: generated `docs/evidence.svg` through the shipping SVG adapter at a deterministic late-timeline frame. This is geometry/rendering evidence, not a browser screenshot.
- Node syntax checks passed for all JavaScript modules and the generated standalone script.
- The same default equation is reachable for both configured rigs at every 17 ms sampled frame; all link lengths are preserved.
- Optional browser smoke tests are in `tests/browser.mjs`. They were **not run**: the authorized cloud browser-control tool was unavailable. No browser runtime or environment configuration changes were attempted to work around that limitation. Visual appearance, downloads and real browser event handling still need a browser run before accepting the PR.
- Direct Git clone failed because the configured environment HTTP proxy was unreachable. GitHub connector access was available, so feature branch/commit/PR operations used that connector. No production files, deployment settings, or homepage source were changed.

The standalone HTML is the browser preview deliverable and works without a server. No hosted preview URL was created and no site was deployed.
