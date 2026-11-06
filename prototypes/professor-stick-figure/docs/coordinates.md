# Body / shoulder / board coordinate contract

This adapter connects a body landmark to the existing Drawing Arm world space. It never moves strokes to compensate for an unreachable pose.

## Coordinate spaces

All spaces use SVG axes: +x right and +y down.

| Space | Origin | Units / transform |
| --- | --- | --- |
| Body local | Floor point between feet, `[0,0]` | Relative anatomy; positive uniform scale only |
| World / SVG viewBox | Top-left of scene | `960 × 570` world units |
| Writing board | JSON `board.origin` in world space | Original Drawing Arm `origin`, `scale`, `rotation` contract |

For any body-local point `p`:

```
world(p) = body.origin + body.scale * p
```

The default body origin is `[230,505]`, scale is `1`, and lean is `0`. The local right shoulder is `[24 + lean,-240]`, giving the world anchor `[254,265]`. The default board transform is `{origin:[355,140],scale:1,rotation:0}`. Writing points start at `[0,0]` in board space. The board's decorative frame spans world `[320,85]` to `[890,365]`; it does not define a separate implicit transform.

`lean` is a horizontal **upper-body offset in local units**, not an angle or playback animation. The UI restricts it to ±25; the API validates ±35. It moves the head, neck and shoulders, half-shifts the left elbow, and leaves the hips, knees and foot contacts fixed. It does not rotate the body root or move the figure across the floor. `origin` and `scale` are configuration, never modified by time sampling. Negative scale/mirroring is disallowed so that the character's right-shoulder identity stays unambiguous.

## Landmarks and attachment

`bodyLandmarks(body)` returns local head center, neck, shoulders, torso top, hips, left elbow/hand, knees and feet. `bodyToWorld()` transforms one landmark; `ProfessorFigure.getAnchors()` transforms them all.

`attachedArm(body, rig)` calls the original `configureArm` with:

```
shoulder = bodyToWorld(bodyLandmarks(body).rightShoulder, body)
upper    = rig.upper   * body.scale
forearm  = rig.forearm * body.scale
tip      = rig.tip     * body.scale
```

Rig lengths are body-local, while the engine receives world lengths. Angles and joint limits stay in radians and do not scale. A supplied `rig.shoulder` is deliberately overwritten by the body landmark. The same default `rig` is used for initial construction and later edits; body scaling therefore never accumulates.

The adapter does not place the arm SVG inside the transformed body group. Its body, world-space arm and debug groups are **siblings**. Transforming the arm a second time would double-apply the origin and scale. Tests compare both the engine pose shoulder and its rendered shoulder circle with the world landmark.

## Rear view and paint order

The simplified view is rear three-quarter, turned screen-right. The silhouette has a back/nape mark, no eyes or facial features, and a small rightward profile projection. The character's right shoulder is the visible shoulder on screen-right. Its left arm hangs on the far side and never writes. Both feet touch the same fixed floor y-coordinate.

Draw order is board/frame → far left arm → legs/feet → spine/shoulders/head → original Drawing Arm group → optional anchor overlay. The original renderer owns both chalk and arm inside its group. The default writing lies to the right of the figure, and the preferred negative bend keeps the elbow on the board side instead of folding the upper arm across the head. This prototype does not add collision avoidance or occlusion correction for arbitrary imported paths; those limitations remain explicit.

## Replacing the artwork later

A future renderer may replace `drawBody()` while preserving the local landmark contract. Keep the returned shoulder landmark consistent with the visible shoulder and keep the engine group in world space. `ProfessorFigure.render(ms)` forwards time to the original SVG renderer; it never updates body landmarks or transforms. `setConfiguration()` is the explicit place to change the body's pose or dimensions.

For non-SVG artwork, use `attachedArm()` and the original `sampleArm()` with the same timeline. The art consumes shoulder, elbow, wrist and tip world points. Chalk contact must use the original `state.chalkDown`, so unreachable requests lift the chalk instead of drawing a false trace.
