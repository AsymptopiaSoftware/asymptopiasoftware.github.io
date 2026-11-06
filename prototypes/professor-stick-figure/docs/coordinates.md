# B1.1 body / shoulder / board coordinate contract

The skeleton derives a body-local right shoulder; the original Drawing Arm consumes that shoulder in world coordinates. Editing proportions never remaps writing points.

## Spaces and defaults

SVG axes apply everywhere: +x screen-right, +y down. The body has a floor origin between fixed heel anchors. World is the `960 × 570` SVG viewBox. The board uses the original JSON transform, independently of the body:

```
body world point = body.origin + body.scale * local point
board world point = board.origin + board.scale * rotate(board point, board.rotation)
```

Default body origin `[230,505]`, scale `1`. Default board `{origin:[355,140],scale:1,rotation:0}`. Its decorative frame spans `[320,85]` to `[890,365]`; the frame does not transform or clip writing. Imported timelines retain their own board coordinates.

All lengths/offsets below are body-local. `headSize` is a dimensionless multiplier. The validated API ranges cover the sliders; changing a body config replaces supplied fields and fills omitted fields with defaults.

| Parameter | Default | Valid range / meaning |
| --- | --- | --- |
| `origin` | `[230,505]` | Finite world floor anchor |
| `scale` | `1` | Positive finite uniform body scale; no mirroring |
| `lean` | `0` | −35…35; horizontal upper-body offset, not an angle |
| `headSize` | `1` | 0.6…1.5; scales the right-facing profile around its derived center |
| `neckLength` | `21` | 8…40; torso-top to neck anchor |
| `shoulderWidth` | `46` | 24…90; span before per-shoulder offsets |
| `shoulderOffset` | `[1,-10]` | Center offset from torso top; each component ±60 |
| `rightShoulderOffset` | `[0,0]` | Additional right anchor offset; each component ±60 |
| `leftShoulderOffset` | `[0,-4]` | Additional far/left anchor offset; each component ±60 |
| `torsoLength` | `115` | 70…160; vertical hip-center to torso-top distance |
| `hipWidth` | `24` | 12…60; pelvic joint separation |
| `legHeight` | `115` | 80…160; floor to hip-center vertical height |
| `footLength` | `19` | 10…40; toe extension from each fixed heel |

The right shoulder must remain screen-right of the left (`shoulderWidth + rightShoulderOffset.x - leftShoulderOffset.x > 0`); otherwise configuration is rejected. The UI's independent right-X slider uses −20…30 to preserve this ordering across all slider combinations. Body inputs are cloned so later mutation of caller-owned offset arrays cannot move a live rig.

## Landmark derivation

```
hips            = [-3, -legHeight]
torsoTop        = [lean, hips.y - torsoLength]
neck            = [lean, torsoTop.y - neckLength]
head            = [7 + lean, neck.y - 31 * headSize]
shoulderCenter  = torsoTop + shoulderOffset
rightShoulder   = shoulderCenter + [ shoulderWidth/2, 0] + rightShoulderOffset
leftShoulder    = shoulderCenter + [-shoulderWidth/2, 0] + leftShoulderOffset
leftHip         = hips + [-hipWidth/2, 0]
rightHip        = hips + [ hipWidth/2, 0]
leftFoot        = [-34, 0]
rightFoot       = [31, 0]
toes            = respective foot + [footLength, 0]
```

Knees sit halfway between their hip and heel in X, at `-legHeight/2` in Y. Legs are a simple connected skeleton, not a separate leg IK system. The far left elbow and hand derive from the left shoulder and torso length. The head profile scales with `headSize`; the nape marker and lack of eyes preserve the rear three-quarter view facing screen-right. The pelvis explicitly connects left hip → hip center → right hip. All parts use these landmarks rather than independently hard-coded world coordinates.

`bodyLandmarks()` returns local landmarks; `bodyToWorld()` transforms one; `ProfessorFigure.getAnchors()` returns all in world space. Across proportion edits the heel coordinates remain fixed. Foot-length edits move toes along the same floor. Changing root `origin` or `scale` is explicit relocation/resizing, not a promise to preserve existing world heel positions. During playback no body config or landmark changes at all.

## Attachment invariant

```
engine.shoulder = bodyToWorld(bodyLandmarks(body).rightShoulder, body)
engine.upper    = rig.upper   * body.scale
engine.forearm  = rig.forearm * body.scale
engine.tip      = rig.tip     * body.scale
```

The shoulder endpoint of the visible SVG shoulder bar, rendered arm shoulder circle and IK shoulder must coincide. A supplied `rig.shoulder` is overwritten by this body-derived anchor. Angular limits stay in radians. Changing head/neck size leaves the shoulder alone; changing torso/leg height, shoulder width or offsets moves the anchor as derived above. Arm dimensions do not stretch with torso/head changes; only explicit body scale multiplies arm lengths.

Body, engine arm and debug groups remain **siblings**. Only the body group receives the body transform. Arm geometry already comes from the engine in world space; nesting it inside the body group would apply translation/scale twice. `setConfiguration()` recomputes the anchor, updates the original renderer and renders at the saved writing time. It does not replace the compiled timeline, change its board transform or reset the playhead. The demo pauses while editing. Repeated edits always derive from local dimensions, so transforms never accumulate.

For reachable points the chalk tip still equals the same board/world target, solved by the original IK. For unreachable points the original feasible pose and `chalkDown:false` apply. The adapter does not fake contact, stretch links, shift strokes or move the planted body. Configuration edits recompute chalk history through the original renderer at the same timestamp; there is no persistent physical chalk simulation.

## Later artwork

Replace `drawBody()` while keeping its visible right shoulder at the same landmark. The engine and timeline interface need no changes. Non-SVG artwork can consume `attachedArm()` and the original `sampleArm()`. Use `state.chalkDown` for contact, and retain explicit handling of unreachable poses. The prototype has no collision avoidance or occlusion correction for arbitrary proportions/imported paths, facial animation, locomotion or lesson behavior.
