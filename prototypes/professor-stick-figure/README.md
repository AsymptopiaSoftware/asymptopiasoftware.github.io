# Professor B1.6 — independent fraction mathematics

The new [math-problems ES module](../math-problems/README.md) generates and solves fraction equations without any Professor, Drawing Arm, SVG, DOM or clock dependency. This prototype adds a thin adapter that writes verified solution steps using the existing body, B1.5 range planner and B1.4 gait.

## Preview

Download **standalone.html** from this branch and open it in a modern browser. It contains all code/styles inline, with no runtime dependencies. Or run the modular demo:

```sh
cd prototypes/professor-stick-figure
npm run dev
# http://localhost:5173/professor-stick-figure/
```

The convenience server uses Python 3 and serves sibling `drawing-arm/` and `math-problems/` modules. Node 22.8+ runs the tests/build scripts. No package installation is needed for normal use.

The new Problem selector offers the requested example, three seeded generated problems covering `+`, `-`, `*`, and Free writing. Edit the equation and press Solve & write. The initial example writes exactly:

```
x/5-4/4=2/5
x/5=2/5+4/4
x/5=7/5
x=7
```

An explanation line displays each step's operation as it is written. Invalid, ambiguous and unsupported equations are reported without replacing the current board with an unverified solution. Free writing retains the previous text-writing behavior. Timeline JSON import/export, playback, seeking, speed, skeleton inspection and the collapsed Advanced / Body Rig panel remain available.

## Separation of responsibilities

- `../math-problems/src/`: BigInt rational arithmetic, parser/AST, original-source-inspired seeded generation, algebraic solver and verification. Independent package, own tests/API, no rendering imports. See its [NOTICE](../math-problems/NOTICE.md) and GPL license.
- `src/math-timeline.js`: `solutionToTimeline(solution, options)` validates a unique solution and compiles its ordered step text through the original `textTimeline()` function. It returns ordinary JSON v1 strokes with optional `mathSteps` explanation metadata. No body or walking code is involved in this adapter.
- Existing `ProfessorFigure`, range planning, gait and curved skeleton consume the resulting timeline as before. Source math steps have no milliseconds; only the adapter adds timing.

The adapter starts at the existing board origin `[355,140]`, adds a 650 ms pen-up pause between lines, and fits the complete solution inside the existing board by selecting a presentation size up to 24 units. It does not add a font-size control. Long solutions that would require a size below 12 are rejected explicitly; a different consumer can implement paging. Default four-step example stays at size 24. Each line remains in fixed board coordinates throughout walking.

The x glyph is now traced with two reusable vector strokes, instead of font fallback. This is the only Drawing Arm source change: kinematics, timeline logic, SVG renderer and export entry point remain unchanged. `engine-lock.json` pins all five approved modules and records the original glyph hash plus the B1.6 extension. Original lowercase-x fallback wording and historical glyph counts from B1.5 therefore no longer apply.

## Reuse

```js
import { solveEquation, generateProblem } from '../math-problems/src/index.js';
import { solutionToTimeline } from './src/math-timeline.js';
const result = solveEquation('x/5-4/4=2/5');
const json = solutionToTimeline(result);
figure.setTimeline(json);
// The caller still owns figure.render(playbackElapsedMs).
```

`mathSteps` records have `{index,at,end,text,operation}`; `at/end` are **source writing** times. The existing planner inserts movement/reach time; the UI selects the explanatory operation using its sampled `sourceTime`. Export preserves these optional records alongside the ordinary timeline. `examples/solution-timeline.json` is a complete consumer example.

Other educational apps can import only `math-problems/src/index.js`, receive structured equations/operations/verification, and supply an entirely different renderer. They do not need this adapter, SVG or the Professor. Its [README](../math-problems/README.md) documents statuses, original denominator domains and scope limits.

## Preserved body/movement behavior

Arm dimensions still derive from torso length; the right shoulder stays forward of the body and left of the chalk target. B1.5 plans whole-line symbol runs using original reach constraints. B1.4 alternates planted stance shoes with lifted swing feet, includes the same subtle upright bob, and settles both feet before writing. Chalk is lifted through every move/reach. No body artwork, rig proportions, range policy, gait source or joint limits change in B1.6. The vector-x extension adds a traced symbol where there was previously a font fallback, so imported lines containing x can have a different number of necessary moves.

## Validation

```sh
cd prototypes/math-problems && npm test       # 12 independent math tests
cd ../professor-stick-figure && npm test       # 35 prototype/adapter tests
npm run build:standalone
npm run evidence
cd ../drawing-arm && npm test                 # 15 original engine tests
```

62 automated tests pass. Generation tests cover all three operators × all six missing slots × 16 seeds, including signed ranges. Every generated problem is solved and independently verified before release. Tests also cover exact arithmetic beyond safe Number precision, negative/reducible fractions, zero denominators, no/infinite/multiple solutions, tamper detection, source preservation, ordered timelines and unchanged walking/contact behavior.

Real Chromium/Playwright integration checks passed for the modular demo **and self-contained HTML over localhost**, including example/generated solutions, walking, controls, JSON import/export and responsive layouts. Managed Chrome blocks file URLs; direct `file://` navigation could not be verified in that managed browser. The HTML itself contains all assets inline. Screenshot evidence is in `docs/browser-evidence.svg`; `docs/solution-evidence.svg` is deterministic renderer evidence.

To reproduce browser checks with a separately installed Playwright/Chromium:

```sh
STANDALONE_HTTP=1 PLAYWRIGHT_MODULE=/path/to/playwright/index.mjs \
CHROMIUM_PATH=/path/to/chromium node tests/browser.mjs
```

No homepage, production route, hosting or workflow changes. Feature branch/draft PR only; no merge or deployment.
