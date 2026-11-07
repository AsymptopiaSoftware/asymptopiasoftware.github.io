# Professor B1.5 development tool

Short body-derived arms, reach-driven horizontal walking, and curved SVG limbs. The view remains rear three-quarter, facing the board, with the writing arm attached to the right shoulder. No character artwork, facial behavior, personality or lesson system.

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

B1.5 plans whole lines rather than a short moving window. The target stays **18%–98% of total reach to the right of the shoulder**, subject to the original IK/physical reach limits. The wider upper range lets the arm extend and retract naturally while retaining the same forward clearance that prevents backward/over-head writing.

`src/range-planning.js` examines all upcoming stroke extents. It infers lines from vertical separation and symbols from overlapping horizontal stroke extents, so the bars of `+`/`=` and other multi-stroke glyphs stay together. It selects maximal feasible runs of consecutive symbol groups, without a 24-stroke cap. A current stance is kept when doing so saves a movement; when move counts tie, the figure pre-positions for the longer run at the line/group boundary. The arm then writes the whole run from one position. No fixed step/movement count is imposed; the unchanged gait derives its steps from each actual displacement.

For `4/8+7/x=5/3` at the existing 24-unit size and fixed board origin:

| Existing body settings | B1.4 movements | B1.5 movements | Groups per stance |
| --- | --- | --- | --- |
| Default torso/leg height 115/115 | 5 | 5 | 2, 2, 2, 2, 2 |
| Leg height 145, torso 115 | 3 | 3 | 4, 3, 3 |
| Torso and leg height 160/160 | 3 | **1** | 4 at home, then 6 after one walk |

The default's top row is 125 units above the shoulder with only 142.6 total tool reach: at that height the maximum horizontal reach is 68.6 units. Forward clearance leaves roughly 43 units of shared span. Two moves cannot cover that entire line with these unchanged proportions. An independent interval-cover oracle verifies that five movements is the minimum for the default inferred-symbol groups. The planner does not change the body, font size, board or arm lengths to force a lower number. With taller proportions, it achieves the requested one/two-movement behavior. Font-fallback `x` remains unchanged and is not counted as a traced glyph group.

`src/locomotion.js` plans around the unchanged engine. It checks complete line/group extents at the current shoulder before choosing writing ranges. If it cannot be reached, it finds a horizontal root offset before writing, translates the entire body/shoulder/feet smoothly at fixed floor height, and keeps chalk lifted. A pen-up angle interpolation then reaches the next writing point before ink resumes. The built-in two-line demo (`2 × (3 + 4)`, then `= 14`) makes six horizontal moves, completes every stroke, and takes about 17.70 s instead of 4.80 s of source writing time.

B1.4 replaces gliding with alternating footsteps. While one foot swings forward and lifts, the other shoe stays fixed in world space on the floor. Hips, knees, ankles and toes drive the existing curved leg/foot shapes; two fixed-length leg segments use the unchanged two-link solver. The head and torso stay upright with a subtle mid-step rise. Step count and stride derive from actual horizontal displacement and leg height, so the gait works in either direction and across body proportions. Both feet return smoothly to their resting stance before reaching/writing, and there is no gait when the root is stationary. There is no teleportation, limb stretching, automatic board relocation or source-point scaling. The forward band is never relaxed to allow backward writing. If it cannot coexist with the original reach/joint limits, that portion is blocked. Very long paths split along their original straight edges, with lifted-chalk moves between portions. Previous chalk stays in world coordinates, independent of later root positions.

Horizontal movement cannot repair excessive vertical separation or every joint-limit restriction. Such portions are explicitly marked **blocked**, never drawn, and summarized in the tool's status. The default equation has no blocked portions. The planner is bounded to 5000 pieces and 100,000 spatial subdivision probes and fails atomically if that budget is exceeded. It does not silently stretch the body or solve vertical locomotion.

## Walking implementation

`src/gait.js` derives a deterministic step phase from root travel. Each foot advances once per step pair; maximum stride is 35% of leg height. The stance shoe does not slide. The swing shoe follows an eased horizontal path, lifts by a proportion-based sine arc, and pitches its toes slightly upward. Each thigh/shin is 58% of leg height, with knees solved from hip/ankle joints using the original IK. A small 1.5%-of-leg-height body rise is compensated in foot-local coordinates so the stance remains on the floor. Chalk stays lifted and the writing arm moves with the shoulder during the bob. No new UI controls or character turning are added; Advanced / Body Rig stays collapsed.

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
// figure.plan.groups and .ranges expose inferred symbols and selected standing runs.
figure.setConfiguration({ ...figure.body, torsoLength: 130 });
figure.setDebug(true);
figure.setTimeline(otherSourceJSON);
figure.destroy();
```

`figure.body` is the configured home pose; `figure.currentBody` includes the sampled horizontal offset. `getAnchors()` returns current world landmarks. `setConfiguration()` validates and replans atomically at the saved playback time (clamped to the new duration); explicit editing pauses the demo and can immediately change the pose. Changing proportions can change the schedule, so the same playback time need not refer to the same source stroke after an edit. `setTimeline()` validates/replans before replacing the view, then rewinds. Seek and Reset are explicit time jumps; normal forward playback is continuous.

See [coordinate/motion contract](docs/coordinates.md), the original [timeline format](../drawing-arm/docs/professor-integration.md), and [example JSON](examples/writing.json).

## Validation

```sh
npm test                       # 32 body, motion, curve and integrity tests
npm run build:standalone        # verifies engine hashes and generates HTML
npm run evidence               # generates default and motion-sequence SVG evidence
cd ../drawing-arm && npm test   # 15 original engine/renderer tests
```

New line-range tests compare movement counts against an independent exact interval-cover oracle, verify symbol/line grouping, shared stances and no mid-glyph moves for ordinary math glyphs. The motion/gait tests check world-space stance locking, alternating lifted feet, fixed leg bone lengths across proportions, clean rest/stop poses, upright torso, deterministic stepping, both travel directions, continuity at every phase boundary, bounded horizontal speed, stationary writing roots, exact reachable tip targets, unchanged bone lengths/JSON, long-path splitting, blocked vertical reach, persistent chalk and deterministic seeking. Curves are finite, closed and non-mutating. Original engine tests remain unchanged. B1.1's whole-timeline stationary-body expectation is intentionally superseded by movement between stationary writing phases.

`docs/evidence.svg`, `docs/motion.svg`, `docs/walk-cycle.svg` and `docs/writing-ranges.svg` are deterministic adapter/original-renderer output, not browser screenshots. Their rasterized motion sequence was visually inspected. Optional browser smoke tests are included in `tests/browser.mjs` (separate Playwright installation, `PLAYWRIGHT_MODULE` and optional `CHROMIUM_PATH`), but remain unrun because authorized browser-control tools are unavailable. No hosted preview is claimed. No homepage integration, production configuration changes, merge or deployment.
