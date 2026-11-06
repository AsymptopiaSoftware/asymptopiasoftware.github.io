# Professor B1.2 development tool

Short body-derived arms, reach-driven grounded horizontal repositioning, and curved SVG limbs. The view remains rear three-quarter, facing the board, with the writing arm attached to the right shoulder. No character artwork, facial behavior, personality or lesson system.

## Preview

Download **standalone.html** from `feature/reduced-professor-stick-figure` and open directly in a modern browser. No server, package installation or network is needed to run it. Alternatively:

```sh
cd prototypes/professor-stick-figure
npm run dev
# Open http://localhost:5173/professor-stick-figure/
```

The server serves sibling prototype modules and requires Python 3. Tests/build scripts require Node 22.8+. There are no runtime package dependencies.

The page opens directly to the tool. Play, Pause, Reset, seek and speed operate on the **planned playback duration**, which includes extra time for movement and pen-up reaching. Writing text and original Drawing Arm JSON import/export remain available. The existing eleven body sliders are in the **collapsed Advanced / Body Rig** panel. Manual arm-length sliders are removed: lengths now derive from the torso. The existing debug checkbox shows skeleton and anchors; no additional configuration controls were introduced.

## Anatomical arm defaults

Body-local lengths are `upper = .65 × torsoLength`, `forearm = .55 × torsoLength`, and `tool = .04 × torsoLength`, then multiplied by body scale. At default torso length 115 this gives **74.75 / 63.25 / 4.6**, replacing the old 195 / 180 / 10 values. The adapter owns these lengths and the right-shoulder anchor; supplied rig length/shoulder fields cannot stretch or detach the arm. Original engine bend preferences and joint-limit options remain usable through the API.

## Reach-driven movement

`src/locomotion.js` plans around the unchanged engine. It checks the complete next stroke at the current shoulder. If it cannot be reached, it finds a horizontal root offset before writing, translates the entire body/shoulder/feet smoothly at fixed floor height, and keeps chalk lifted. A pen-up angle interpolation then reaches the next writing point before ink resumes. The default equation makes seven horizontal moves, completes every stroke, and takes about 15.38 s instead of 4.80 s of source writing time.

Movement is a grounded horizontal glide, not an articulated walking gait. Both feet remain on the ground and move with the root. The body stays stationary within every writing phase. There is no teleportation, limb stretching, automatic board relocation or source-point scaling. Very long paths split along their original straight edges, with lifted-chalk moves between portions. Previous chalk stays in world coordinates, independent of later root positions.

Horizontal movement cannot repair excessive vertical separation or every joint-limit restriction. Such portions are explicitly marked **blocked**, never drawn, and summarized in the tool's status. The default equation has no blocked portions. The planner is bounded to 5000 pieces and 100,000 spatial subdivision probes and fails atomically if that budget is exceeded. It does not silently stretch the body or solve vertical locomotion.

## Curved rendering

`src/curves.js` builds closed, smooth, tapered silhouettes around joint-derived offsets. Arm skin uses shoulder/elbow/wrist; legs use hips/knees/ankle anchors; feet extend from those grounded anchors. The tool line still uses the original wrist and chalk-tip points exactly. Bone geometry remains authoritative and can be inspected with the debug checkbox. The skeleton is hidden by default. The head is a simple rightward profile without facial animation.

## Engine and timeline preservation

All five Drawing Arm modules are imported directly from `../drawing-arm/src/`, unchanged from commit `611e0af2d6ec2b8a007ae2b93e4ef027162010b9`. `engine-lock.json`, tests and the standalone builder verify their original Git blob hashes. IK, mathematical glyphs, interpolation, reachability and chalk rendering are not reimplemented.

The source JSON remains v1 and is exported without retiming or coordinate conversion. The planner adds a separate playback schedule; it does not mutate the original compiled timeline or board transform. Each writing portion uses an instance of the **original SVGArmRenderer** at its planned fixed shoulder, which preserves completed chalk when the figure moves. The adapter only hides those renderers' straight bone artwork and draws curved skin from the same poses. Font-only fallbacks remain explicit and do not pretend to have traced arm motion.

## API

```js
import { ProfessorFigure } from './src/figure.js';
const figure = new ProfessorFigure(svgGroup, sourceTimelineJSON, {
  body: { torsoLength: 115, legHeight: 115, rightShoulderOffset: [0, 0] },
  rig: { elbow: 'negative' }
});
const state = figure.render(playbackElapsedMs);
// state.kind: move | approach | hold | write | done
// state.chalkDown is false throughout repositioning and pen-up reaching.
console.log(figure.duration, figure.timeline.duration, figure.plan.blocked);
figure.setConfiguration({ ...figure.body, torsoLength: 130 });
figure.setDebug(true);
figure.setTimeline(otherSourceJSON);
figure.destroy();
```

`figure.body` is the configured home pose; `figure.currentBody` includes the sampled horizontal offset. `getAnchors()` returns current world landmarks. `setConfiguration()` validates and replans atomically at the saved playback time (clamped to the new duration); explicit editing pauses the demo and can immediately change the pose. Changing proportions can change the schedule, so the same playback time need not refer to the same source stroke after an edit. `setTimeline()` validates/replans before replacing the view, then rewinds. Seek and Reset are explicit time jumps; normal forward playback is continuous.

See [coordinate/motion contract](docs/coordinates.md), the original [timeline format](../drawing-arm/docs/professor-integration.md), and [example JSON](examples/writing.json).

## Validation

```sh
npm test                       # 18 body, motion, curve and integrity tests
npm run build:standalone        # verifies engine hashes and generates HTML
npm run evidence               # generates default and motion-sequence SVG evidence
cd ../drawing-arm && npm test   # 15 original engine/renderer tests
```

The motion tests check both directions, continuity at every phase boundary, bounded horizontal speed, grounded feet, stationary writing roots, exact reachable tip targets, unchanged bone lengths/JSON, long-path splitting, blocked vertical reach, persistent chalk and deterministic seeking. Curves are finite, closed and non-mutating. Original engine tests remain unchanged. B1.1's whole-timeline stationary-body expectation is intentionally superseded by movement between stationary writing phases.

`docs/evidence.svg` and `docs/motion.svg` are deterministic adapter/original-renderer output, not browser screenshots. Their rasterized motion sequence was visually inspected. Optional browser smoke tests are included in `tests/browser.mjs` (separate Playwright installation, `PLAYWRIGHT_MODULE` and optional `CHROMIUM_PATH`), but remain unrun because authorized browser-control tools are unavailable. No hosted preview is claimed. No homepage integration, production configuration changes, merge or deployment.
