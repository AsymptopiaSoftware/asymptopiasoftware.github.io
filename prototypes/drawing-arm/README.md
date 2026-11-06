# Prototype A — Drawing Arm

Review-only implementation of [Issue #7](https://github.com/AsymptopiaSoftware/asymptopiasoftware.github.io/issues/7). A dependency-free JavaScript/SVG engine, independent of characters, frameworks, and the production Asymptopia website. Nothing in this directory is wired into Astro, the homepage, or deployment workflows.

## Run

Open **standalone.html** directly in a modern browser (no server, network, or install needed). Or, with Node 22.8+ and Python 3:

```sh
cd prototypes/drawing-arm
npm test
npm run dev
# Open http://localhost:5173
```

`index.html` loads ES modules; use HTTP for that version. `standalone.html` embeds the same sources and CSS. Regenerate after edits with `node scripts/standalone.js`. No dependencies or build step are required for the engine. The demo starts paused; press Play. Adjust either rig independently, flip its elbow, constrain its shoulder, scrub, change speed, load math, and import/export timeline JSON. Reset rewinds; Restore resets both rigs' dimensions. Changing a rig recomputes its whole chalk history at the current time. Unsupported characters appear as explicit system chalkboard/cursive font fallbacks; the arm does not pretend to trace font outlines.

## Modules

- `src/kinematics.js`: validated rig configuration, forward kinematics, two-link inverse kinematics, board transform.
- `src/glyphs.js`: original reusable single-line vector digits, operators, parentheses, decimal, slash. Use a custom two-point stroke for any fraction bar length.
- `src/timeline.js`: JSON validation, text compilation, arc-length interpolation, deterministic time sampling and chalk contact.
- `src/svg-renderer.js`: optional SVG adapter; owns only the caller-supplied group, with `render(ms)`, `setArm(config)`, and `destroy()`.
- `src/index.js`: public exports; import individual modules for a renderer-free integration.

```js
import { configureArm, textTimeline, compileTimeline, sampleArm } from './src/index.js';
const rig = configureArm({ upper: 215, forearm: 200, shoulder: [95, 285], tip: 10 });
const instructions = textTimeline('2 × (3 + 4)\n= 14', { x: 150, y: 106, size: 30 });
const timeline = compileTimeline(instructions);
const state = sampleArm(timeline, 1200, rig);
// state.pose: world-space shoulder, elbow, wrist, tip and radian angles
// state.chalkDown: true only for pen-down instructions with a reachable pose
```

The engine has no internal timers. Milliseconds come from the consumer. Compile once, sample on your own animation clock. Pause stops advancing time; seek samples any time deterministically. Two differently proportioned arms consume exactly the same timeline in the demo: upper/forearm 215/200 and 170/255, with a 10-unit tool tip.

## Kinematics contract

World and board coordinates use SVG axes: +x right, +y down. Angles are radians, positive clockwise. Shoulder angle is absolute; elbow is relative to the upper link. Rig fields:

| Field | Default | Meaning |
| --- | --- | --- |
| `upper`, `forearm` | 190, 170 | Positive link lengths in world units |
| `shoulder` | `[80,280]` | World-space anchor |
| `tip` | 8 | Nonnegative rigid extension along forearm, beyond wrist |
| `side` | `"right"` | `left` reverses preferred bend; does not mirror board text |
| `elbow` | `"positive"` | `positive` or `negative` preferred signed relative bend |
| `limits.shoulder` | `[-π,π]` | Ordered inclusive angular interval |
| `limits.elbow` | `[-π,π]` | Ordered inclusive relative angular interval |

Each angular interval spans at most 2π. For an interval crossing the ±π seam, express it continuously, e.g. `[2.5,3.8]`. Orientation is a preference: if only the opposite analytic branch satisfies limits, it wins. The effective second link for IK is `forearm + tip`; returned wrist still preserves the configured forearm length.

`solveIK(rig,target)` returns `{ shoulder, elbow, wrist, tip, angles, target, error, reachable, reason }`. `error` is tip-to-requested-target distance. `reason` is `reachable`, `out-of-reach` (outside the unrestricted reach annulus), or `joint-limits`. Reachability uses a 1e-6 world-unit tolerance. Radial singularities, inner dead zones, and full extension produce finite poses. Unreachable targets resolve to a closest feasible pose by considering analytic branches and joint-domain boundary optima, without stretching links. At coincident equal-link folding, the direction is deterministic. There is no temporal smoothing or collision avoidance; exact branch changes can be discontinuous near limits. Consumers may add transitions while keeping chalk lifted.

`sampleArm` returns both requested contact (`penDown`) and permitted contact (`chalkDown`). Always use the latter. The optional renderer suppresses unreachable chalk segments with ≤2-world-unit subdivisions and endpoint/midpoint reach tests; it is a visual approximation near limit boundaries, not a physical contact simulator. Red target rings explain unreachable writing. Shortening a rig can intentionally leave incomplete writing.

## Professor interface and examples

See [Professor integration](docs/professor-integration.md), [JSON Schema](docs/timeline.schema.json), [runnable clock adapter](examples/professor-driver.js), and [equation timeline](examples/equation.json). A character should use the supplied pose to place its own arm art. No Tux assets or character assumptions are embedded here.

## Validation and evidence

`npm test` exercises FK/IK round trips across lengths and bends, finite singularities, mirrored handedness, reach clamping, alternate limit branches, closest joint boundaries, angular seams, invalid inputs, transformed coordinates, arc-length motion, pen lifts, time seeking, math vocabulary, JSON round trips, shared instructions and contact suppression. SVG adapter tests use a minimal DOM fixture; no browser is required. `docs/evidence.svg` is an engine-rendered deterministic frame of both default rigs, not a browser screenshot.

For real browser smoke coverage, install Playwright outside production dependencies and run `node tests/browser.mjs`; it launches its own local static fixture server and checks controls, real SVG, timeline import/export, playback, reach failure, and mobile overflow. Set `PLAYWRIGHT_MODULE` to an installed module path and `CHROMIUM_PATH` when using system Chromium. Browser checks were authored but could not be run in the implementation environment because the authorized browser-control tool was unavailable. Unit and SVG adapter tests were run successfully; see `docs/validation.md`.

## Provenance

New implementation and glyphs written from scratch. Research on November 6, 2026:

- Inspected `ccosse/Animator` at `480ee8c52d875a31c11873778900d23b61f2843e`, especially [js/animator.js](https://github.com/ccosse/Animator/blob/480ee8c52d875a31c11873778900d23b61f2843e/js/animator.js). Its per-player maneuver queues and completion callback informed the decision to expose an explicit clock/completion state; no source was copied. The accessible branch list contained `master`.
- Searched accessible `ccosse` code for arm-related material. Results in `ccosse/asymptopiasoftware` point to the Observable drawing-arm notebook, but did not expose a reusable IK engine. No notebook export was requested or awaited. This bounded search does not establish that no implementation exists elsewhere.
- `ccosse/crosswordbuilder` is an educational problem source, not an engine dependency.

No upstream code, third-party font, character asset, or package was copied. Existing website files and production configuration remain untouched. Feature branch only; do not merge or deploy without owner authorization.
