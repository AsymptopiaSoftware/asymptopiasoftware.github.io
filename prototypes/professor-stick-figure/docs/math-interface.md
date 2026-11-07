# B1.6 math-to-writing contract

Pure math API: [math-problems README](../../math-problems/README.md). Source provenance: [NOTICE](../../math-problems/NOTICE.md). The independent package implements the fraction-toggle-OFF approach of `ccosse/crosswordbuilder/jsrc/config_table_stuff.js`, with exact arithmetic and deterministic seeds.

`solveEquation()` returns JSON-safe equation ASTs, ordered steps, exact solutions and original denominator restrictions. Each step supplies an operation kind, operand, explanation, optional nonzero conditions and exact calculation metadata. `verifySolution()` re-derives classifications, verifies every equation/operation and substitutes the answer into the original input. The renderer must never invent a step or treat a nonunique result as one solved value.

`solutionToTimeline(result, options)` is the sole math/drawing boundary. It requires status `unique` and fresh verification success, then passes each step's text through Drawing Arm's existing glyph/timeline interface. It assigns increasing source times, pen-up gaps and board-space line positions. It preserves the input solution object. The default transform remains `{origin:[355,140],scale:1,rotation:0}`.

Returned JSON:

```
{ version: 1, board, strokes, fallbacks,
  mathSteps: [{ index, at, end, text, operation }],
  layout: { size, lineHeight },
  math: { version: 1, status: 'unique', problem, solutions } }
```

`strokes` and `fallbacks` are unchanged Drawing Arm v1 records. The optional `mathSteps` metadata is consumed only by the prototype explanation line. Other v1 consumers may ignore it. These timing fields belong to the adapter, not the independent math package. Source time differs from playback time when the existing planner inserts walking/reaching.

Default layout uses width 515, height 220, maximum size 24, minimum size 12, line-height factor 1.8, original writing speed 135, pen-up lifts 100 ms and inter-step pause 650 ms. Size is the minimum of the width/height fit and maximum size. A solution too large for the minimum size fails explicitly instead of overflowing the board or producing unreachable hidden rows. A future consumer can page the same structured steps without changing the math module.

Only the required lowercase-x glyph was added to Drawing Arm. The original operator glyphs, exact IK, reachability/contact gate, board transform and all body/walking code are unchanged. Existing source-range/gait tests remain authoritative.
