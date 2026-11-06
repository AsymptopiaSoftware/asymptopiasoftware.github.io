# Professor B1.1 — configurable SVG body rig

A reduced rear three-quarter SVG skeleton facing screen-right, with the completed Drawing Arm attached at its right shoulder. Head, neck, shoulders, torso, hips, legs and feet derive from configurable proportions. The figure remains planted during writing. No character artwork, walking, facial animation or lesson logic is included.

## Standalone preview

Download **standalone.html** from `feature/reduced-professor-stick-figure` and open it directly in a modern browser. Writing and controls need no network, server or installation. Documentation links go to GitHub.

For modular development, from the repository:

```sh
cd prototypes/professor-stick-figure
npm run dev
# Open http://localhost:5173/professor-stick-figure/
```

The convenience server requires Python 3 and serves the parent `prototypes/` directory so imports from `drawing-arm/` resolve. Tests/build scripts require Node 22.8+. No package dependencies.

Press Play to write the default equation, or pause, reset, seek and change speed. Import/export uses Drawing Arm JSON v1 without coordinate conversion. Unsupported characters retain the engine's font-only fallback. Long text does not wrap automatically, and the decorative board does not clip or relocate imported instructions.

Eleven body sliders adjust head size, neck length, shoulder width, torso length, hip width, leg height, foot length, upper-body offset, shared shoulder height, and independent right-shoulder X/Y offsets. Drawing arm lengths remain available in the expandable section. Edits pause at the current writing time, update the skeleton and reattach the arm immediately. **Heel anchors and floor height stay fixed**; changing foot length extends the toe forward. Restore resets the body and arm dimensions without changing writing instructions or the playhead. Show coordinate anchors exposes the floor origin, body-derived right shoulder and original board origin.

Some proportions put a requested point outside arm reach. The original engine keeps link lengths intact, clamps to a feasible pose, marks the target and lifts the chalk. It does not move the board, stretch the arm or detach the shoulder to hide that failure.

## Exact Drawing Arm reuse

All drawing logic imports directly from `../drawing-arm/src/`. IK, joint limits, timeline interpolation, glyphs, pen contact and SVG chalk rendering are unchanged from commit `611e0af2d6ec2b8a007ae2b93e4ef027162010b9` (PR #9). `engine-lock.json` pins the original Git blob hashes for all five source modules. Tests and the standalone builder verify those hashes.

The standalone build embeds those same sources, removing only module import/export declarations. No Drawing Arm files are edited or forked. No homepage, production route, hosting or workflow changes are made. PR #11 stays draft and stacked on the Drawing Arm branch.

## Composition API

```js
import { ProfessorFigure } from './src/figure.js';
const figure = new ProfessorFigure(svgGroup, timelineJSON, {
  body: {
    origin: [230, 505], scale: 1,
    headSize: 1.2, neckLength: 28,
    shoulderWidth: 60, shoulderOffset: [1, -10],
    rightShoulderOffset: [12, -5], leftShoulderOffset: [0, -4],
    torsoLength: 125, hipWidth: 32, legHeight: 130, footLength: 24
  },
  rig: { upper: 195, forearm: 180, tip: 10, elbow: 'negative' }
});
figure.render(lessonElapsedMs); // caller owns time; body remains stationary
figure.setConfiguration({ ...figure.body, rightShoulderOffset: [20, 0] });
figure.setDebug(true);
figure.setTimeline(otherTimelineJSON); // validates atomically, then rewinds
figure.destroy();
```

`setConfiguration(body, rig)` replaces supplied configuration objects, applying defaults for omitted fields; omit an entire argument to preserve its current object. It preserves the current playhead and compiled timeline. `getAnchors()` exposes all body landmarks in world space. `attachedArm(body, rig)` is the renderer-independent attachment function. Unknown body fields are ignored; invalid proportions and crossed shoulders are rejected before visible state changes.

[Coordinate contract](docs/coordinates.md) documents parameter ranges, derivation and attachment invariants. The original [Drawing Arm timeline contract](../drawing-arm/docs/professor-integration.md) is authoritative. [examples/writing.json](examples/writing.json) remains the same ready-to-import timeline.

## Validation

```sh
npm test                       # 16 body, attachment and integrity tests
npm run build:standalone        # verifies engine hashes and generates HTML
npm run evidence                # regenerates default and proportion comparison SVGs
cd ../drawing-arm && npm test   # 15 original engine/renderer tests
```

Tests sweep proportions and shoulder offsets at many writing timestamps. They verify coincident visible/engine shoulder anchors, arm link lengths, wrist/tip endpoints, unchanged board targets and timeline, planted foot anchors, unchanged body SVG during playback, current-time reattachment, invalid-edit atomicity and contact suppression for unreachable points.

`docs/evidence.svg` shows the default composition; `docs/body-profiles.svg` compares three skeletons consuming the same writing. They are deterministic output of the adapter and original renderer, not browser screenshots. Optional real-browser coverage in `tests/browser.mjs` includes all body sliders, attachment checks and playback stability. Run with a separately available Playwright installation (`PLAYWRIGHT_MODULE`, optional `CHROMIUM_PATH`). Browser tests remain unrun because the authorized browser-control tool is unavailable in this session. See [validation record](docs/validation.md).
