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

Boxes return `{version,width,height,axis,size,items}`; equations also expose `equalsX`. Multiline layout returns measured `rows` and flattened positioned items, with a `row` index. Units use +x right, +y down. These are logical geometry units, not solver values or SVG elements.

Items:

```
{ kind:'glyph', text:'4', x, y, width, height, role, row }
{ kind:'fraction-bar', x, y, width, height:0,
  points:[[left,y],[right,y]], role, row }
```

Each division AST node creates a true stacked fraction. Numerator and denominator boxes are independently measured and centered on a padded horizontal bar. Arbitrarily sized integers, x, negative values, simple expressions and nested fractions use the same recursive algorithm. Numerator comes first, then the left-to-right bar, then the denominator. Roles retain nesting (`numerator/...`, `denominator/...`). No slash glyph is emitted for structured division.

Operators share the fraction's math axis. Parentheses are stretched around expression boxes where precedence/grouping needs them. Multiple equation rows align their equals signs by default, and measured row heights plus a positive gap prevent collisions. The selected root size fits both width and total height; inability to meet `minSize` fails explicitly, rather than clipping or silently dropping rows.

Default unit metrics: glyph width .62, advance .95, operator gap .25, fraction child scale .78, numerator/bar/denominator clearance .15, bar side padding .16. `layoutExpression/Equation` accept metric overrides for a different font. Row gap is measured in root-size units. Nested fraction children shrink recursively; consumers choose appropriate root sizes for readability.

## Stroke placement

The injected font has the same simple shape as Drawing Arm's vector library:

```
{ '4': [ [[.25,0],[0,.6],[1,.6]], [[.75,0],[.75,1]] ] }
```

Every inner path is one ordered pen-down stroke. Paths are copied and scaled to the positioned glyph box, **never sorted or reversed**. Each fraction bar becomes one ordinary pen-down polyline. Output is `{version,width,height,strokes}`; each stroke carries `points`, `pen:true`, `kind`, `row`, item index, and glyph symbol/stroke index where applicable. No stroke duration is assigned here. Missing or malformed vector glyphs throw an explicit error; font fallback is not used to fake mathematical writing.

Run `npm test`: tests cover centering, vertical separation, negative/compound/nested fractions, precedence parentheses, operator axes, measured row fitting, consumer fonts and normal left-to-right bar paths.
