# Neon Tux Professor consumption contract

The Professor supplies character artwork, shoulder anchors, rig dimensions, its animation clock, and any speech/lesson sequencing. Drawing Arm supplies pose geometry and vector writing. Import `src/index.js` or just the kinematics/timeline modules; no application bootstrap is required.

## JSON v1

```json
{
  "version": 1,
  "board": { "origin": [0, 0], "scale": 1, "rotation": 0 },
  "strokes": [
    { "at": 0, "duration": 400, "points": [[150, 120], [180, 120]], "pen": true },
    { "at": 550, "duration": 400, "points": [[165, 105], [165, 135]], "pen": true }
  ],
  "fallbacks": []
}
```

This writes a plus sign, lifting and traveling between its bars. Fields:

| Field | Contract |
| --- | --- |
| `version` | Exactly `1`; reject unknown versions |
| `board` | Optional; local-to-world positive uniform `scale`, clockwise radian `rotation`, world `origin`. Defaults to identity. Board transform applies to strokes and font fallbacks, never to rig lengths/anchors. |
| `strokes` | Ordered, nonoverlapping array; empty is valid |
| `at` | Finite nonnegative absolute start in milliseconds, ≥ previous stroke's end |
| `duration` | Finite positive milliseconds |
| `points` | At least two finite `[x,y]` board-space points forming one polyline; vertices are connected without lifting |
| `pen` | Optional boolean; default true. False means travel without chalk |
| `fallbacks` | Optional `{text, position:[x,y], size, at}` records for unsupported font glyphs. Positive local `size`, nonnegative start. Displayed from `at` onward, with no traced outline. |

Points interpolate at constant arc-length speed per stroke. Repeated points and zero-length strokes hold position. Gaps interpolate linearly from the previous stroke's end to the next stroke's start, with chalk lifted. Before the first stroke, hold its first point. After the last stroke, hold its endpoint and lift. Empty timelines have no pose. Time <0 holds the initial point with pen up; nonfinite times fail. `duration` is computed from the last stroke end and any fallback starts; an input `duration` is not authoritative. `done` becomes true at that computed duration. No easing is imposed.

`validateTimeline(json)` clones, validates and calculates duration. `compileTimeline(json)` additionally transforms coordinates and computes cumulative lengths; its result is an internal runtime representation, **not** the JSON interchange format. Save/export the original JSON. Validation rejects overlap, malformed coordinates, invalid transforms and unsupported versions. Import a new timeline atomically only after compilation succeeds. A machine-readable structural schema is beside this document; chronological constraints are enforced at runtime.

## Consume with the Professor's clock

```js
import { configureArm, compileTimeline, sampleArm } from '../src/index.js';
const timeline = compileTimeline(await (await fetch('./equation.json')).json());
const arm = configureArm({
  shoulder: [95, 285], upper: 215, forearm: 200, tip: 10,
  side: 'right', elbow: 'positive',
  limits: { shoulder: [-Math.PI, Math.PI], elbow: [-Math.PI, Math.PI] }
});
function updateProfessor(lessonElapsedMs) {
  const state = sampleArm(timeline, lessonElapsedMs, arm);
  if (!state.pose) return;
  // Render the Professor's own art between these world-space anchors:
  professor.setArmAnchors(state.pose.shoulder, state.pose.elbow, state.pose.wrist);
  professor.setChalkTip(state.pose.tip);
  professor.setChalkContact(state.chalkDown);
  // state.pose.reachable / reason / error can drive repositioning or a pause.
  // state.done can advance the lesson after the complete writing timeline.
}
```

The `professor.*` calls above are illustrative consumer methods, not dependencies or methods implemented by this engine. `examples/professor-driver.js` supplies an actual reusable callback adapter. To change the character's shoulder, call `driver.setArm(newConfig)` and sample again. For SVG writing, construct `SVGArmRenderer` with your own group and compiled timeline, then call `render(elapsedMs)` on that same lesson clock. Keep SVG viewBox/world units consistent with the rig; scale the surrounding SVG to fit the screen. Use one shared JSON timeline for differently proportioned characters.

For a fraction, place numerator/denominator glyph timelines in separate board positions and insert a two-point horizontal bar at the intended time; concatenate by shifting subsequent `at` values so they never overlap. The engine interprets strokes, not mathematical semantics, and does not evaluate equations.

## Responsibility boundaries

Never draw chalk merely because a requested stroke has `pen:true`: contact requires `state.chalkDown`. A clamped wrist does not mean the requested glyph was reached. Handle unreachable portions by repositioning the shoulder/board, changing scale, or explicitly accepting incomplete writing. No automatic character movement, collision detection, text wrapping, handwriting recognition, or audio synchronization is included. Unsupported characters are font-only fallback and should be described as such to lesson authors.
