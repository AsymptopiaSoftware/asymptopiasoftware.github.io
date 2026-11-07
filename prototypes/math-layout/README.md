# Asymptopia mathematical layout

Reusable structured-expression layout and vector-stroke placement. This package has no SVG, DOM, character, IK or animation-clock dependency. It consumes the JSON AST from `math-problems` (its syntax validator is the sole sibling dependency) and accepts a consumer-supplied normalized vector font. GPL-2.0-or-later; LICENSE included.

```js
import { parseEquation } from '../math-problems/src/index.js';
import { layoutEquation, positionStrokes } from './src/index.js';
const equation = parseEquation('x/5-4/4=2/5');
const boxes = layoutEquation(equation, { size: 24 });
const geometry = positionStrokes(boxes, yourVectorGlyphs);
// geometry.strokes: ordered, positioned polylines including fraction bars.
// A consumer supplies timing, color, SVG/canvas rendering, or robot movement.
```

Two explicit stages keep mathematical layout separate from drawing instructions:

1. `src/layout.js`: AST → measured boxes and positioned glyph/bar items.
2. `src/strokes.js`: items + a supplied vector font → ordered polyline geometry.

Neither stage solves or simplifies the equation. The math solver knows nothing about this package. `positionStrokes()` knows nothing about time, the board or a drawing arm.

## Layout API

- `layoutExpression(expressionAST, {size=24,...metrics})`
- `layoutEquation(equationASTOrString, {size=24,...metrics})`
- `layoutEquations(equations, {maxSize=24,minSize=12,width=515,height=220,rowGap=.5,alignEquals=true})`
- `positionStrokes(layout, glyphs)`

Boxes return `{version,width,height,axis,mathAxis,baseline,size,items}`; equations also expose `equalsX`. Multiline layout returns measured `rows` and flattened positioned items, with a `row` index. Units use +x right, +y down. These are logical geometry units, not solver values or SVG elements.

Items:

```
{ kind:'glyph', text:'4', x, y, width, height, mathAxis, baseline, role, row }
{ kind:'fraction-bar', x, y, width, height:0,
  points:[[left,y],[right,y]], barY, mathAxis, baseline,
  numeratorBaseline, denominatorBaseline, fractionBounds, role, row }
```

Each division AST node creates a true stacked fraction. Numerator and denominator boxes are independently measured and centered on a padded horizontal bar. Arbitrarily sized integers, x, negative values, simple expressions and nested fractions use the same recursive algorithm. Numerator comes first, then the left-to-right bar, then the denominator. Roles retain nesting (`numerator/...`, `denominator/...`). No slash glyph is emitted for structured division.

The **mathematical axis** (`mathAxis`, with `axis` kept as a compatibility alias) is the vertical center for binary operators and complete expressions. The **text baseline** (`baseline`) is half the current font size below that axis, where an adjacent integer's glyph cell ends. A fraction's **bar position** (`barY`, also its `y`) is a separately named metric; it coincides with that fraction's math axis, not its text baseline. `numeratorBaseline` and `denominatorBaseline` describe the independently positioned child expressions. A nested child's baseline is its own text baseline, not the baseline of its lowest denominator.

Fractions balance the full measured numerator and denominator extents around the bar, adding empty space on the shorter side. Their bar/axis therefore remains the center of the **complete** fraction, even with a nested numerator or denominator. `fractionBounds` records that full box. All metrics, bounds and paths translate together when expressions are placed in rows. Operators carry `operator: 'binary' | 'relation' | 'unary'` in positioned items; numerator/denominator role paths retain the nesting.

Operators share the fraction's math axis. A subtraction stroke can correctly lie at the same y as a fraction bar; horizontal clearance keeps them visibly separate. The default gap is **.55 em on each side** of binary/relation operators and an external unary minus. Overrides cannot reduce it below .5 em. This leaves room beyond the 2.2-unit chalk's combined round caps at supported demo sizes, including tested nested fractions. Operators are not artificially raised off the shared axis. Parentheses are stretched around expression boxes where precedence/grouping needs them. Multiple equation rows align their equals signs by default, and measured row heights plus a positive gap prevent collisions. The selected root size fits both width and total height; inability to meet `minSize` fails explicitly, rather than clipping or silently dropping rows.

Default unit metrics: glyph width .62, advance .95, operator gap .55 (minimum .5), fraction child scale .78, numerator/bar/denominator clearance .15, bar side padding .16. `layoutExpression/Equation` accept metric overrides for a different font. Row gap is measured in root-size units. Nested fraction children shrink recursively; consumers choose appropriate root sizes for readability.

## Stroke placement

The injected font has the same simple shape as Drawing Arm's vector library:

```
{ '4': [ [[.25,0],[0,.6],[1,.6]], [[.75,0],[.75,1]] ] }
```

Every inner path is one ordered pen-down stroke. Paths are copied and scaled to the positioned glyph box, **never sorted or reversed**. Each fraction bar becomes one ordinary pen-down polyline. Output is `{version,width,height,strokes}`; each stroke carries `points`, `pen:true`, `kind`, `row`, item index, and glyph symbol/stroke index where applicable. No stroke duration is assigned here. Missing or malformed vector glyphs throw an explicit error; font fallback is not used to fake mathematical writing.

Run `npm test`: tests cover centering, vertical separation, negative/compound/nested fractions, precedence parentheses, operator axes, measured row fitting, consumer fonts and normal left-to-right bar paths. Regression cases cover adjacent and signed fractions, nested fractions on either side, mixed integer/fraction operands, actual operator-ink centers and cap clearance at sizes 12/24/36, aligned equals columns and translated baseline metadata.
