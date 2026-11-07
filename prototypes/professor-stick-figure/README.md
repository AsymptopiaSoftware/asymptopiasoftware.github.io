# Professor B1.9 — talk and gesture

The new [math-problems ES module](../math-problems/README.md) generates and solves fraction equations without any Professor, Drawing Arm, SVG, DOM or clock dependency. The board now typesets those ASTs as centered stacked fractions using a separate reusable math-layout package, then writes their paths using the existing body, B1.5 range planner and B1.4 gait.

After writing a line, the Professor lifts and lowers the chalk, turns toward the viewer, and speaks the **next transformation** while gesturing with both arms. **Auto** proceeds after the explanation and 1.5 s pause; **Step** waits for **Continue** with the figure facing the viewer and arms at rest. He then turns back and continues from the same writing position. Play/Pause, Reset, seeking, speed and the collapsed Advanced panel remain available. **Mute** is the only new control and defaults off.

The general-purpose [talk-and-gesture interface](docs/presentation-actions.md) also supports arbitrary stories or chart explanations. It is separate from mathematics and from speech side effects. B1.8 PR #12 remains unchanged on its own branch; this work is on `feature/professor-b1.9-talk-gesture`.

## Preview

Download **standalone.html** from this branch and open it in a modern browser. It contains all code/styles inline, with no runtime dependencies. Or run the modular demo:

```sh
cd prototypes/professor-stick-figure
npm run dev
# http://localhost:5173/professor-stick-figure/
```

The convenience server uses Python 3 and serves sibling `drawing-arm/` and `math-problems/` modules. Node 22.8+ runs the tests/build scripts. No package installation is needed for normal use.

The existing Problem selector offers the requested example, three seeded generated problems covering `+`, `-`, `*`, and Free writing. Edit the equation and press Solve & write. The solver still returns exactly the following canonical text; the chalkboard now draws each division as a stacked numerator/bar/denominator rather than a slash:

```
x/5-4/4=2/5
x/5=2/5+4/4
x/5=7/5
x=7
```

The sidebar displays the solver operation while writing, and the next operation while presenting it. Invalid, ambiguous and unsupported equations are reported without replacing the current board with an unverified solution. Free writing retains the previous text-writing behavior. Timeline JSON import/export, playback, seeking, speed, skeleton inspection and the collapsed Advanced / Body Rig panel remain available.

## Separation of responsibilities

- `../math-problems/src/`: BigInt rational arithmetic, parser/AST, original-source-inspired seeded generation, algebraic solver and verification. Independent package, own tests/API, no rendering imports. See its [NOTICE](../math-problems/NOTICE.md) and GPL license.
- `../math-layout/src/layout.js`: structured equations → measured fraction/expression boxes and positioned symbols.
- `../math-layout/src/strokes.js`: positioned symbols + a consumer-supplied vector font → ordered glyph/bar polylines, with no SVG or timing dependency.
- `src/math-timeline.js`: validates a unique solution and assigns those paths normal Drawing Arm v1 durations and lift intervals. Canonical solver text remains unchanged; the AST supplies the board notation.
- `src/teaching.js`: unchanged B1.8 structured cadence and Continue gates.
- `src/presentation-action.js`: standalone action schema, clip timing and pure sampling without mathematics, SVG or audio.
- `src/presentation-plan.js`: thin lesson adapter and live-audio transport guard; `src/presentation-rig.js`: oriented skeleton and independent arm poses.
- `src/speech.js`: browser speech lifecycle, isolated from deterministic animation.
- `ProfessorFigure` renders the resulting skeleton; range planning and gait remain unchanged. Source math steps have no milliseconds; consumer adapters add timing.

The adapter starts at the existing board origin `[355,140]`, records a 650 ms source gap between lines (replaced by B1.8 teaching cadence during Professor playback), and fits measured expression boxes inside the existing board at a root size up to 24. Numerators and denominators shrink to .78 of their fraction size and are centered on a padded, arm-drawn bar. Equals signs align across rows; row heights and clearance come from the measured boxes. It does not add a font-size control. Long solutions that would require a size below 12 are rejected explicitly; a different consumer can implement paging. Default four-step example stays at size 24. Each line remains in fixed board coordinates throughout walking.

The B1.6 traced x remains. B1.7 corrects glyph 4 to the requested two-stroke order, removes the redundant middle touch-up from 3, gives 5 a separate left-to-right top bar, improves 9's loop/tail and orders ÷ top-to-bottom. Other reviewed directions are retained. Each stroke path is kept in writing order with chalk lifted between paths. [Full handwriting audit](docs/handwriting.md).

The B1.7 approved vector glyph definitions remain pinned; kinematics, timeline algorithms, renderer and exports remain unchanged. The approved source lock records the handwriting revision. Fraction bars are real timed paths drawn by the arm, never instantaneous SVG lines. [Layout package API](../math-layout/README.md).

## Reuse

```js
import { solveEquation, generateProblem } from '../math-problems/src/index.js';
import { solutionToTimeline } from './src/math-timeline.js';
const result = solveEquation('x/5-4/4=2/5');
const json = solutionToTimeline(result);
figure.setTimeline(json);
// The caller still owns figure.render(playbackElapsedMs).
```

`mathSteps` records have `{index,at,end,text,operation}`; `at/end` are **source writing** times. The existing planner inserts movement/reach time; the B1.8 sequencer and B1.9 presentation adapter attach the explanatory operation to their deterministic step/action timing. Export preserves these optional records alongside the ordinary timeline. `examples/solution-timeline.json` is a complete consumer example, including `layout.notation="stacked-fractions"` and optional glyph/bar annotations.

Other educational apps can import only `math-problems/src/index.js`, receive structured equations/operations/verification, and supply an entirely different renderer. They do not need this adapter, SVG or the Professor. Its [README](../math-problems/README.md) documents statuses, original denominator domains and scope limits.

## Preserved body/movement behavior

Arm dimensions still derive from torso length; the right shoulder stays forward of the body and left of the chalk target. B1.5 plans whole-line symbol runs using original reach constraints. B1.4 alternates planted stance shoes with lifted swing feet, includes the same subtle upright bob, and settles both feet before writing. Chalk is lifted through every move/reach. The writing pose, anatomical dimensions, range policy, gait source and joint limits remain unchanged. B1.9 adds a projected front-facing skeleton, static face cues and small palm outlines during presentation. Notation/glyph geometry can change the number of necessary moves, but the positioning policy and physical reach constraints are unchanged.

## Validation

```sh
cd prototypes/math-problems && npm test       # 12 independent math tests
cd ../math-layout && npm test                 # 6 layout/placement tests
cd ../professor-stick-figure && npm test       # 52 prototype/adapter tests
npm run build:standalone
npm run evidence
cd ../drawing-arm && npm test                 # 15 original engine tests
```

85 automated tests pass (12 math, 6 layout, 52 prototype/adapter, 15 Drawing Arm). Generation tests cover all three operators × all six missing slots × 16 seeds, including signed ranges. Every generated problem is solved and independently verified before release. Tests also cover exact arithmetic beyond safe Number precision, negative/reducible fractions, zero denominators, no/infinite/multiple solutions, tamper detection, source preservation, ordered timelines and unchanged walking/contact behavior.

Real Chromium/Playwright integration checks passed for the modular demo **and self-contained HTML over localhost**, including example/generated solutions, walking, controls, JSON import/export and responsive layouts. Managed Chrome blocks file URLs; direct `file://` navigation could not be verified in that managed browser. The HTML itself contains all assets inline. Browser checks additionally verify turns, independent gestures, unchanged chalk, speech pause/resume/mute/cancel/replay, audio completion gates and return to writing, using a controllable speech backend. Native Chromium has no installed voices, so audible voice quality is unverified there; the native silent fallback works. A browser with an installed voice can speak using Web Speech. No external speech API is used. Screenshot evidence is in `docs/browser-evidence.svg`; `docs/solution-evidence.svg` is deterministic renderer evidence. [Math layout/timeline contract](docs/math-interface.md).

To reproduce browser checks with a separately installed Playwright/Chromium:

```sh
STANDALONE_HTTP=1 PLAYWRIGHT_MODULE=/path/to/playwright/index.mjs \
CHROMIUM_PATH=/path/to/chromium node tests/browser.mjs
```

No homepage, production route, hosting or workflow changes. Feature branch/draft PR only; no merge or deployment.
