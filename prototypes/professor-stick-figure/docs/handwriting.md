# B1.7 handwriting and fraction strokes

The reusable Drawing Arm glyph arrays encode **pen motion in order**, not unordered outlines. Every inner path is a separate pen-down stroke. The existing timeline and Professor planner lift chalk between paths/reaching phases; there is no path-reversal or nearest-end optimization.

The digit 4 now follows the requested two-stroke form exactly:

1. Start at `[.25,0]` (upper-left), move down-left to `[0,.6]`, then right across to `[1,.6]`.
2. Lift the chalk.
3. Move to `[.75,0]` with chalk lifted, then draw vertically downward to `[.75,1]`.

Glyph audit:

| Glyph | Stroke choice |
| --- | --- |
| 0 | Retain one continuous oval |
| 1 | Retain entry tick/downstroke, lift, left-to-right baseline |
| 2 | Retain top bow, descending diagonal and rightward baseline |
| 3 | Remove the redundant middle touch-up; draw top and lower bows continuously |
| 4 | Requested down-left/rightward crossbar, lift, top-to-bottom vertical |
| 5 | Downward left portion and lower bowl, lift, left-to-right top bar |
| 6 | Retain top entry/down-left motion and continuous lower loop |
| 7 | Retain left-to-right top bar and descending diagonal |
| 8 | Retain a continuous connected upper/lower loop |
| 9 | Close the upper loop, then continue into a downward tail; remove the extra bottom bar |
| + | Retain left-to-right horizontal, lift, top-to-bottom vertical |
| − / - | Retain left-to-right horizontal |
| = | Retain upper left-to-right bar, lift, lower left-to-right bar |
| x | Retain the variable's two downward diagonals separated by a lift |
| · / × / * | B1.9.2: one small centered closed dot stroke; legacy multiplication inputs share the dot |
| ÷ | Upper dot, lift, left-to-right bar, lift, lower dot |
| Parentheses / decimal | Retain top-to-bottom curves / short dot stroke |
| / | Retain its legacy free-writing diagonal; structured fractions use an arm-drawn bar instead |

These are conventional handwriting choices, not recognition or font-outline tracing. Shape and order remain character-independent. The original IK, arc-length interpolation, chalk contact and SVG renderer are unchanged.

Stacked fraction bars are ordinary two-point left-to-right strokes. They have a real duration and go through the same reach planner, inverse kinematics, walking/lift logic and renderer as glyph strokes. Browser and unit checks inspect an empty bar before writing, a partial bar midway, and a completed path afterward. There are no prepainted fraction bars or text overlays.

B1.9.2 uses a closed multiplication dot centered on the mathematical axis, distinctly above the decimal point. The math timing adapter gives it at least 80 ms of actual chalk contact. Its points are approximately .1 em across, not two full-height diagonals; it is never a text overlay or static SVG circle. The engine lock pins this approved font change while preserving IK, interpolation and chalk rendering.
