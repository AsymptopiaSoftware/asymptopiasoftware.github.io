# Reduced Professor — planted SVG stick figure

A standalone attachment study. A minimal rear three-quarter SVG figure stands on the floor, faces screen-right, and writes with its right arm. The body and feet remain planted throughout playback. The only animation is the completed Drawing Arm engine.

## Open the prototype

Download **standalone.html** from this branch and open it directly in a modern browser. It embeds the original engine, this adapter and the stylesheet; no network, server or package installation is needed for writing. Documentation links go to GitHub.

For the modular source, from the repository:

```sh
cd prototypes/professor-stick-figure
npm run dev
# Open http://localhost:5173/professor-stick-figure/
```

The server serves the parent `prototypes/` directory because this prototype imports the sibling `drawing-arm/` modules. Requires Python 3 for this convenience command, Node 22.8+ for tests/build scripts. There are no package dependencies.

Press Play to write the default equation. Pause, Reset, seek and playback speed use the Drawing Arm millisecond timeline. Load new math text or import/export the original JSON v1 format. Unsupported glyphs retain the engine's font-only fallback. The board is a visual frame, not a clip or a coordinate conversion step; imported world-space instructions are preserved exactly, even if they place strokes outside the visible board. A long equation does not automatically wrap or reposition the figure.

The attachment controls adjust upper-body offset and arm lengths. These edits pause playback and recompute the current arm/chalk view. Upper-body offset changes the shoulder/head/upper torso while keeping hips, legs and feet fixed. Restore returns the default attachment. Show coordinate anchors reveals body origin, right shoulder and board origin.

## Exact reuse of Drawing Arm

The Drawing Arm engine is imported directly from `../drawing-arm/src/`; there is no second IK solver, handwriting implementation, timeline parser or chalk renderer. All five source modules are unchanged from commit `611e0af2d6ec2b8a007ae2b93e4ef027162010b9` (Drawing Arm PR #9). `engine-lock.json` pins their Git blob hashes, and tests plus the standalone build verify them.

The generated standalone HTML flattens those same modules into one script, removing only module import/export declarations. It is a portable package of the same engine, not an alternate implementation. Regenerate it with `npm run build:standalone`. No files under `prototypes/drawing-arm/` are changed by this prototype.

This draft PR is stacked on `feature/prototype-a-drawing-arm` so review shows only the reduced Professor work. It does not merge the Drawing Arm PR or integrate anything into the homepage.

## Composition API

```js
import { ProfessorFigure } from './src/figure.js';
const figure = new ProfessorFigure(svgGroup, timelineJSON, {
  body: { origin: [230, 505], scale: 1, lean: 0 },
  rig: { upper: 195, forearm: 180, tip: 10, elbow: 'negative' }
});
figure.render(lessonElapsedMs); // caller owns the clock
figure.setDebug(true);
figure.setConfiguration({ origin: [230, 505], scale: 1, lean: 12 });
figure.setTimeline(otherTimelineJSON); // validate, replace atomically, rewind
figure.destroy();
```

`setConfiguration(body, rig)` replaces supplied configuration objects; omitted arguments preserve the current object. There is no internal motion, walking system, speech scheduling or character state machine. `getAnchors()` returns world-space body landmarks for inspecting attachment or supplying different artwork.

[Coordinate contract](docs/coordinates.md) explains the local landmarks, transforms, board separation and draw order. The Drawing Arm [timeline contract](../drawing-arm/docs/professor-integration.md) remains authoritative. [examples/writing.json](examples/writing.json) is a ready-to-import example.

## Checks and evidence

```sh
npm test                      # 10 composition and engine-integrity tests
npm run build:standalone       # verifies original engine hashes, generates HTML
npm run evidence               # generates example JSON and deterministic SVG
cd ../drawing-arm && npm test  # 15 original engine/renderer tests
```

Tests assert shoulder attachment across transforms and reconfiguration, fixed feet/hips during upper-body editing, unchanged body markup throughout the writing timeline, equality with direct engine samples, default writing reachability, invalid-import atomicity, unreachable chalk suppression and cleanup. `docs/evidence.svg` is generated through the actual body adapter and original SVG renderer; it is not a browser screenshot.

Optional real-browser checks are in `tests/browser.mjs`. Install Playwright separately and run `node tests/browser.mjs`, or select an existing installation with `PLAYWRIGHT_MODULE` and optional `CHROMIUM_PATH`. These tests were authored but **not run** because the authorized browser-control tool is unavailable in this session. No hosted preview is claimed. See [validation record](docs/validation.md).

Scope stops at the planted stick figure. There is no Neon Tux artwork, walking, fireworks, carousel, homepage route, deployment configuration or merge.
