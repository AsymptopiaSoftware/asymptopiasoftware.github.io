# B1.7 math → layout → strokes → writing

Pure algebra remains in [math-problems](../../math-problems/README.md), byte-for-byte unchanged from B1.6. The solver returns ASTs, canonical text and explanatory operation metadata; it has no coordinates or font knowledge.

The new [math-layout package](../../math-layout/README.md) supplies two pure stages:

1. `layoutEquations(stepEquations, bounds)` recursively measures expressions, stacks every division as a fraction, centers numerator/denominator boxes, aligns operators/equals signs and places nonoverlapping rows.
2. `positionStrokes(layout, suppliedGlyphs)` maps reusable normalized vector strokes to those positions and emits explicit fraction-bar paths. No timing, SVG, body or IK is involved.

`src/math-timeline.js` is the only timing adapter. It requires a freshly verified unique solution, calls those two stages, assigns normal v1 stroke starts/durations and pen-up gaps, and retains `mathSteps` explanation metadata. It no longer typesets `step.text` or counts slash-string characters. `step.text` stays canonical B1.6 notation for logs/input/export; the board uses the equation AST.

Returned JSON:

```
{ version:1, board, strokes, fallbacks:[],
  mathSteps:[{index,at,end,text,operation}],
  layout:{notation:'stacked-fractions',size,width,height,rows},
  math:{version:1,status:'unique',problem,solutions} }
```

Stroke records are unchanged v1 polylines with optional annotations (`kind`, `symbol`, `role`, `row`, `item`, `stroke`). The Drawing Arm engine can ignore those annotations. `kind:'fraction-bar'` is a normal timed pen stroke, not an SVG decoration. Every separate glyph path and bar is separated by a positive lift interval. Source `at/end` still differ from playback time when the existing planner inserts movement/reaching.

Defaults preserve board origin `[355,140]`, width 515, height 220, root size up to 24 (minimum 12), writing speed 135, lift 100 ms and inter-step pause 650 ms. Rows use measured heights plus a .5-root-size gap, with equals alignment. A legacy explicit `lineHeight` option maps to `max(.1,lineHeight-1)` row gap; `rowGap` takes precedence. Very large solutions that cannot fit at the minimum size fail explicitly for a future paged consumer. The layout/adapter adds no font-size control.

The requested four-step example fits at size 24, has eight actual fraction-bar strokes and no slash glyphs. New source example: `examples/solution-timeline.json`. Numerators/denominators can contain numbers, x, signs, simple expressions and nested fractions; precedence parentheses outside a bar remain explicit.

Only the audited glyph stroke definitions and layout/timing adapter change. B1.5 writing ranges, B1.4 gait, shoulder/body rig, original IK and chalk renderer consume the new polylines unchanged. See [handwriting audit](handwriting.md).

## B1.8 playback consumer

The Professor now consumes `mathSteps` with `teachingPlan()` after spatial planning. It replaces source inter-line gaps with lowering/rest/return phases and exposes deterministic Auto/Step playback; the reusable solver, layout, glyph paths and raw timeline above are unchanged. See [teaching cadence](teaching-cadence.md).

B1.9 adds a consumer-only presentation adapter after B1.8 sequencing, using the next operation explanation as generic action text. The mathematical modules and this raw timeline format are unchanged. See [talk-and-gesture actions](presentation-actions.md).
