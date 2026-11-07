# Professor B1.9.3b — thoughtful explanations

The new [math-problems ES module](../math-problems/README.md) generates and solves fraction equations without any Professor, Drawing Arm, SVG, DOM or clock dependency. The board now typesets those ASTs as centered stacked fractions using a separate reusable math-layout package, then writes their paths using the existing body, B1.5 range planner and B1.4 gait.

After writing a line, the Professor lifts and lowers the chalk, turns toward the viewer, and speaks the **next transformation** in a thoughtful supported-elbow pose. **Auto** proceeds after the explanation and 1.5 s pause; **Step** waits for **Continue** with the figure facing the viewer and holding the supported pose calmly. He then turns back and continues from the same writing position. Play/Pause, Reset, seeking, speed and the collapsed Advanced panel remain available. **Mute** is the only new control and defaults off.

The general-purpose [talk-and-gesture interface](docs/presentation-actions.md) also supports arbitrary stories or chart explanations. It is separate from mathematics and from speech side effects. B1.8 PR #12 remains unchanged on its own branch; this work is on `feature/professor-b1.9-talk-gesture`.

## Preview

Download **standalone.html** from this branch and open it in a modern browser. It contains all code/styles inline, with no runtime dependencies. Or run the modular demo:

```sh
cd prototypes/professor-stick-figure
npm run dev
# http://localhost:5173/professor-stick-figure/
```

The convenience server uses Python 3 and serves sibling `drawing-arm/` and `math-problems/` modules. Node 22.8+ runs the tests/build scripts. No package installation is needed for normal use.

The existing Problem selector offers the original example, the B1.9.2 regression `1/4-7/x=-5/8` (answer `x=8`), three seeded generated problems covering `+`, `-`, `*`, and Free writing. Edit the equation and press Solve & write. The solver still returns exactly the following canonical text; the chalkboard now draws each division as a stacked numerator/bar/denominator rather than a slash:

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
- `src/thoughtful-pose.js`: coordinated support contact, subtle hand cue, compact emphasis and relaxed neutral poses.
- `src/audience-arm.js`: audience-only two-link pole preference and relaxed extension limit.
- `src/orientation.js`: pure anatomical projection, bone-direction interpolation and arm depth ordering.
- `src/presentation-plan.js`: thin lesson adapter and live-audio transport guard; `src/presentation-rig.js`: oriented skeleton and independent arm poses.
- `src/speech.js`: browser speech lifecycle, isolated from deterministic animation.
- `ProfessorFigure` renders the resulting skeleton; range planning and gait remain unchanged. Source math steps have no milliseconds; consumer adapters add timing.

The adapter starts at the existing board origin `[355,140]`, records a 650 ms source gap between lines (replaced by B1.8 teaching cadence during Professor playback), and fits measured expression boxes inside the existing board at a root size up to 24. Numerators and denominators shrink to .78 of their fraction size and are centered on a padded, arm-drawn bar. Equals signs align across rows; row heights and clearance come from the measured boxes. It does not add a font-size control. Long solutions that would require a size below 12 are rejected explicitly; a different consumer can implement paging. Default four-step example stays at size 24. Each line remains in fixed board coordinates throughout walking.

The B1.6 traced x remains. B1.7 corrects glyph 4 to the requested two-stroke order, removes the redundant middle touch-up from 3, gives 5 a separate left-to-right top bar, improves 9's loop/tail and orders ÷ top-to-bottom. Other reviewed directions are retained. Each stroke path is kept in writing order with chalk lifted between paths. [Full handwriting audit](docs/handwriting.md).

The approved handwriting definitions plus the B1.9.2 centered multiplication dot remain pinned; kinematics, timeline algorithms, renderer and exports remain unchanged. The approved source lock records the handwriting revision. Fraction bars are real timed paths drawn by the arm, never instantaneous SVG lines. [Layout package API](../math-layout/README.md).

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

Arm dimensions still derive from torso length; the right shoulder stays forward of the body and left of the chalk target. B1.5 plans whole-line symbol runs using original reach constraints. B1.4 alternates planted stance shoes with lifted swing feet, includes the same subtle upright bob, and settles both feet before writing. Chalk is lifted through every move/reach. The board writing pose, body proportion controls, range policy, gait source and joint limits remain unchanged. B1.9.3 projects a permanent anatomical skeleton through intermediate views and puts each arm/palm in its own depth layer. Existing face cues and limb artwork remain. Notation/glyph geometry can change the number of necessary moves, but the positioning policy and physical reach constraints are unchanged.

## B1.9.3b thoughtful explainer

`thoughtful-explain` is now the preferred default for every spoken explanation. Anatomical left crosses the torso and supports the right elbow; the raised right forearm and hand make a small, soft indicating gesture. Support follows the elbow rather than using an independent approximate wrist target. The pose remains held calmly at a Continue gate and releases during the existing return turn. Primary gestures are `thoughtful-explain`, `present`, `emphasize` and `idle`. Legacy `explain` aliases the thoughtful pose; explicit `count` remains supported. No controls are added. See [thoughtful pose](docs/thoughtful-pose.md).

## B1.9.3a outward elbow preference

B1.9.3a introduced a reusable lateral 3D elbow pole. It remains available for explicit reach/support solving and outward bias in uncrossed poses. B1.9.3b makes the thoughtful supporting forearm a deliberate crossing exception and uses a calmer, downward neutral stance. Original rear writing, arm identity, depth layers, timing and mathematics remain unchanged. See [elbow preference](docs/orientation.md#outward-audience-elbow-preference-b193a).

## B1.9.3 anatomical facing

Permanent left/right shoulders, elbows, wrists and hands now live in anatomical 3D coordinates and project through a reusable yaw model. The gold right arm moves from screen-right in rear view to screen-left in front view, with smooth intermediate poses and correct near/far SVG layers. True bone lengths stay constant while their screen projections foreshorten. Returning restores the exact original writing attachment; feet and body origin stay planted during the turn. [Orientation contract](docs/orientation.md) · [Four-pose evidence](docs/orientation-evidence.svg).

## B1.9.2 mathematical safety

Multiplication is a small centered `·`, written as a timed stroke with a minimum 80 ms duration. Legacy `*` and `×` glyph inputs also draw a dot; decimal points and lowercase variable `x` stay distinct.

Every solver candidate is checked symbolically and by exact solution-set equivalence before it enters the lesson. Both-side operations carry full transformed-equation certificates; simplifications explicitly name their sides. The `-1` sign change in `1/4-7/x=-5/8` now visibly multiplies both sides, then simplifies both in a separate step. Explanations are derived from and checked against those operations. The existing layout, writing, movement and presentation systems consume the verified steps unchanged.

`solutionToTimeline()` embeds a version-2 math certificate; `validateMathTimeline()` re-verifies it and regenerates the expected strokes/step metadata before UI loading/importing, so altered equations, explanations, narration overrides or geometry cannot become a mathematical lesson. Older mathematical exports without certificates must be regenerated by solving their original equation again; plain free-writing JSON remains supported. See [correctness contract](docs/math-correctness.md) and [regression timeline](examples/negative-denominator.json).

## Fraction operator alignment

The math-layout module now names the text baseline, mathematical axis, fraction-bar position and numerator/denominator baselines explicitly. Complete fraction boxes balance nested child extents about the axis. Binary plus/minus and equals stay centered on that axis, with .55-em gaps to neighboring fractions so a minus does not visually join a bar. Equals columns remain aligned across solution rows. Operators and bars remain timed arm strokes with normal chalk lifts; no solver or character behavior changes. See [layout metrics](../math-layout/README.md).

## Validation

```sh
cd prototypes/math-problems && npm test       # 15 independent math tests
cd ../math-layout && npm test                 # 12 layout/placement tests
cd ../professor-stick-figure && npm test       # 70 prototype/adapter tests
npm run build:standalone
npm run evidence
cd ../drawing-arm && npm test                 # 15 original engine tests
```

112 automated tests pass (15 math, 12 layout, 70 prototype/adapter, 15 Drawing Arm). Generation tests cover all three operators × all six missing slots × 16 seeds, including signed ranges. Every generated problem is solved and independently verified before release. Tests also cover exact arithmetic beyond safe Number precision, negative/reducible fractions, zero denominators, no/infinite/multiple solutions, tamper detection, source preservation, ordered timelines and unchanged walking/contact behavior.

Real Chromium/Playwright integration checks passed for the modular demo **and self-contained HTML over localhost**, including example/generated solutions, walking, controls, JSON import/export and responsive layouts. Managed Chrome blocks file URLs; direct `file://` navigation could not be verified in that managed browser. The HTML itself contains all assets inline. Browser checks additionally verify turns, independent gestures, unchanged chalk, speech pause/resume/mute/cancel/replay, audio completion gates and return to writing, using a controllable speech backend. Native Chromium has no installed voices, so audible voice quality is unverified there; the native silent fallback works. A browser with an installed voice can speak using Web Speech. No external speech API is used. Screenshot evidence is in `docs/browser-evidence.svg`; `docs/solution-evidence.svg` is deterministic renderer evidence. [Math layout/timeline contract](docs/math-interface.md).

To reproduce browser checks with a separately installed Playwright/Chromium:

```sh
STANDALONE_HTTP=1 PLAYWRIGHT_MODULE=/path/to/playwright/index.mjs \
CHROMIUM_PATH=/path/to/chromium node tests/browser.mjs
```

No homepage, production route, hosting or workflow changes. Feature branch/draft PR only; no merge or deployment.
