# Neon Tux Professor — Prototype B

Review-only implementation of [Issue #8](https://github.com/AsymptopiaSoftware/asymptopiasoftware.github.io/issues/8). No homepage integration, deployment, fireworks, or carousel.

Open **standalone.html** directly in a browser. It embeds the exact same modules, SVG artwork, scene configuration and JSON timeline as the modular preview. No installation, server or Internet is needed for playback. Start with **Play lesson**; reset, seek, change tempo, or choose the compact proportion profile. Playback starts paused, including for reduced-motion users. All controls work from the keyboard.

For modular editing, serve this directory with any static HTTP server and open `index.html`. Do not open modular `index.html` with file:// because its module and fetch requests need HTTP. The standalone build avoids those requests.

## Editing and responsibility boundaries

- `examples/scene.json`: character body scale, resting stage position, shoulder in original 148×181 SVG coordinates, upper/forearm/tip lengths in character-local units, handedness/bend, and phase durations in milliseconds. Stage coordinates use the SVG's 1000×620 viewBox. `startX` and character position establish left/right travel. Profiles override the character configuration; choose them in the UI (URL fragment persists the selection).
- `examples/equation.json`: actual Drawing Arm JSON v1 strokes for `2+3=5`. Geometry and timing are editable independently from the character and lesson. Produced once with upstream `textTimeline`; runtime does not evaluate mathematics or generate another solver.
- `src/character.js`: deterministic walk, flattened turn, gesture/reaction, left/right facing, body/shoulder transforms. Walking uses body bob and simple foot accents. The source art is a planar neon presenter; this prototype's turn is a 2D squash, not newly invented side/back artwork.
- `src/lesson.js`: owns a supplied elapsed clock and phase boundaries. `createLesson(scene,json,onFrame)` creates an independent driver; `frame(ms)` is deterministic and seekable. Completion comes from the compiled engine timeline duration and `done`; reaction follows completion. An unreachable authored lesson explicitly produces incomplete writing rather than invented chalk marks; it still completes its timeline.
- `src/view.js`: character art, easel, and integration with the upstream SVG renderer. Shoulder, elbow, wrist, tip, reachability and chalk contact come from Prototype A. Original raised flipper is clipped during writing and the engine's articulated limb is rendered over its shoulder. The original art returns during the reaction. Original paths are unchanged. Artwork and foot accents are separate from arm geometry.
- `src/app.js`: one requestAnimationFrame clock, controls and status. Background-tab elapsed time advances the lesson on return. Tempo changes affect elapsed speed; seek and reset reconstruct chalk deterministically.

One instance owns one scene, driver, view and clock. Future concurrent characters should each have their own groups and unique SVG definition IDs (the current single-scene view uses fixed IDs). No shared mutable engine state is required. Different artwork can implement the same anchors; its arm dimensions need not follow the original character's ratios. There is no obstacle/collision solver, semantic tutoring engine, audio, or 3D turn in this prototype.

## Exact dependency and artwork provenance

`vendor/drawing-arm/` is an **unchanged** snapshot of the engine, callback driver, example JSON, integration docs/schema and tests from [PR #9](https://github.com/AsymptopiaSoftware/asymptopiasoftware.github.io/pull/9), branch `feature/prototype-a-drawing-arm`, commit `611e0af2d6ec2b8a007ae2b93e4ef027162010b9`. It is vendored under Prototype B so this independent branch can run before PR #9 merges, without importing PR #9's commit or changing production paths. Do not edit this snapshot; refresh it explicitly or switch the imports to the eventual shared dependency after integration review. No new inverse-kinematics engine is implemented here. Read `vendor/drawing-arm/docs/professor-integration.md` and `examples/professor-driver.js` for the contract.

`assets/blue-neon-tux.svg` is byte-for-byte `ccosse/NeTux/docs/static/netux/hero/presenter_tux.svg` at `0528e3c29d8b09d3b0b2e878562cc19ffca61916` (`v2.2.28-finalfireworksfx`). Source artwork belongs to the original Asymptopia project; copying it here is for the owner's requested prototype, not a claim of a new license. The recovered SVG was visually inspected. Blue paths, face, proportions, magenta throat and neon strokes are preserved. No surrounding carousel/firework code or images are copied.

Research also inspected NeTux `master` (`38f5253`), `neon-character-animation` (`c637977`) and available native-D3 branch, plus Animator's only remote branch `master` (`480ee8c`), especially `js/animator.js` movement categories and actor queues. Their global page-oriented animation bootstrap is not imported. The accessible reference is https://ccosse.github.io/NeTux/; local source recovery avoids depending on that page's effects or availability.

## Reproduce checks and preview

Requires Node 24+ for the test runner flags used here.

```sh
cd prototypes/neon-tux-professor
npm ci
npm test
npm run standalone
node scripts/evidence.js
```

`linkedom` is a locked development-only dependency for XML DOM integration tests and deterministic SVG evidence. Runtime has no third-party packages. `docs/writing.svg` and `docs/reaction.svg` are frames from the same view and lesson; accompanying PNGs are CairoSVG rasterizations, **not browser screenshots**. Tests cover both profiles' pen-contact reachability, phase boundaries, completion, reverse travel, seek/rewind, inaccessible targets, SVG contact suppression and original artwork, plus all 15 upstream tests.

Browser QA could not run in the attached environment: no supported `cua_repl.js` browser tool was exposed. No replacement browser was installed and no site was deployed. Follow `docs/validation.md` for remaining checks before approving the draft PR.
