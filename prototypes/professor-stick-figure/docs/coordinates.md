# B1.2 coordinates, anatomy and motion contract

## Three independent spaces

SVG axes apply throughout: +x right, +y down. The body has local skeletal coordinates, the SVG has world coordinates, and writing uses the original board transform.

```
body world point = body.origin + [horizontalOffset, 0] + body.scale * local point
board world point = board.origin + board.scale * rotate(board point, board.rotation)
```

Default home origin `[230,505]`, scale `1`. Board `{origin:[355,140],scale:1,rotation:0}`. The board frame spans `[320,85]` to `[890,365]`; it is not a source transform or clipping operation. Locomotion never changes this board transform or any writing point. Grounded heel/ankle anchors are at world `y=505`; the 5-unit foot silhouette reaches the drawn floor line at `y=510`.

## Body parameters

| Parameter | Default | Valid range / meaning |
| --- | --- | --- |
| `origin` | `[230,505]` | Finite home floor origin; sampled motion adds X only |
| `scale` | `1` | Positive finite uniform scale, no mirroring |
| `lean` | `0` | −35…35 local horizontal upper-body offset |
| `headSize` | `1` | 0.6…1.5 normalized head profile scale |
| `neckLength` | `21` | 8…40 local units |
| `shoulderWidth` | `46` | 24…90 local units |
| `shoulderOffset` | `[1,-10]` | Offset from torso top; each component ±60 |
| `rightShoulderOffset` | `[0,0]` | Additional right anchor offset, each component ±60 |
| `leftShoulderOffset` | `[0,-4]` | Additional far-side anchor offset, each component ±60 |
| `torsoLength` | `115` | 70…160 local hip-center to torso-top height |
| `hipWidth` | `24` | 12…60 pelvic joint separation |
| `legHeight` | `115` | 80…160 local floor-to-hip height |
| `footLength` | `19` | 10…40 toe extension from the heel/ankle anchor |

The right shoulder must remain screen-right of the left. Offsets are detached from caller arrays; invalid or crossed geometry is rejected. The collapsed panel exposes the same eleven B1.1 body sliders. No new motion or skin controls are added.

Local landmarks:

```
hips           = [-3, -legHeight]
torsoTop       = [lean, hips.y - torsoLength]
neck           = [lean, torsoTop.y - neckLength]
head           = [7 + lean, neck.y - 31 * headSize]
shoulderCenter = torsoTop + shoulderOffset
rightShoulder  = shoulderCenter + [ shoulderWidth/2, 0] + rightShoulderOffset
leftShoulder   = shoulderCenter + [-shoulderWidth/2, 0] + leftShoulderOffset
left/rightHip  = hips + [−/+ hipWidth/2, 0]
leftFoot       = [-34, 0]
rightFoot      = [31, 0]
toes           = respective foot + [footLength, 0]
```

Knees are halfway between each hip and heel in X, at `-legHeight/2` in Y. `leftAnkle` and `rightAnkle` currently coincide with heel anchors in this reduced skeleton. The far left arm derives from its shoulder and torso length. Proportion edits preserve local heels, though explicit origin/scale editing relocates/resizes the body. Locomotion adds the same X offset to every landmark and never changes ground Y.

## Anatomical right-arm attachment

```
engine.shoulder = world(bodyLandmarks(body).rightShoulder)
engine.upper    = .65 * torsoLength * body.scale
engine.forearm  = .55 * torsoLength * body.scale
engine.tip      = .04 * torsoLength * body.scale
```

The adapter overrides supplied rig length/shoulder fields with these derived values. Original bend/handedness/joint-limit options are forwarded unchanged to the original engine. Body, world-space chalk and world-space curved arm are sibling groups; the arm is never nested inside the transformed body group. The shoulder skin endpoint and IK shoulder therefore move with the body without applying its transform twice.

## Planning and playback

`planWriting(compiledSource,body,rig)` returns a separate deterministic schedule. It checks complete polylines at the current root before deciding to move. Reach tests use original `solveIK`, endpoint outer-radius constraints, exact segment-to-shoulder inner-annulus checks and intermediate solver checks at ≤2 world-unit spacing. A horizontal interval from the outer reach circle is intersected over stroke vertices. The planner first tries a 6% extension reserve, then full reach; bounded candidate sampling handles inner dead zones and configured joint limits. Candidate sampling resolution is at most 2 world units. This is a bounded prototype planner, not a general collision-aware optimization system.

Phases:

| Kind | Root / arm | Chalk |
| --- | --- | --- |
| `move` | Smoothstep horizontal root translation, joint angles held | Lifted |
| `approach` | Root fixed, smooth joint-angle interpolation to next point | Lifted |
| `hold` | Root and pose fixed during source gaps or blocked portions | Lifted |
| `write` | Root fixed, original stroke interpolation and IK | Original pen/reachability gate |
| `done` | Final pose held | Lifted |

Move duration is at least 120 ms and `1.5 × distance / 90` seconds, limiting smoothstep peak horizontal speed to 90 world units/s. This is a grounded glide, not gait animation: both feet translate on the floor together. Pen-up approach duration scales with angular change. Tests check shoulder and hand continuity on both sides of every boundary.

If a long stroke cannot fit one placement, original straight edges subdivide into portions no longer than 12 world units. They retain original coordinates, vertex order and proportional source duration; chalk lifts between portions when repositioning is needed. At most 5000 pieces and 100,000 input spatial subdivision probes may be planned. A budget failure leaves the previous composition intact. Transformed nonfinite coordinates and overflowing planned durations are rejected.

Horizontal motion cannot solve excessive vertical separation or some joint limits. Infeasible portions become `hold` phases with `reason:'blocked'`, remain chalk-free and appear in `plan.blocked`. The UI reports their count. The default equation has zero blocked portions. There is no automatic vertical movement or limb stretching.

`figure.duration` is the new playback duration; `figure.timeline.duration` remains the original writing duration. Export always returns original JSON, not retimed phases. Source fallbacks are mapped to their corresponding planned writing time and remain font-only. Source gaps remain pen-up holds; extra time is inserted for repositioning/reaching. Configuration edits replan at saved playback time; no source coordinates are modified.

## Rendering and later artwork

Each writing portion uses the original `SVGArmRenderer` with a fixed planned shoulder and an unchanged world-space stroke. Its chalk path persists as later portions use different shoulders. Only the old straight skeletal artwork is hidden; no chalk algorithm or IK is replaced. Curved body and arm silhouettes are closed cubic/quadratic outlines built from joint-derived tangents and tapered widths. Arm endpoints still use original shoulder, elbow and wrist coordinates. The chalk tool line connects original wrist and tip exactly. Debug skeletons can be hidden without affecting geometry.

No collision avoidance or general occlusion correction is added. In this rear view the body can naturally occlude existing chalk as it passes in front of the board. Imported writing may leave the visible board; it is not clipped or relocated. Future art can replace the silhouette while consuming the same authoritative skeletal poses, source JSON and board coordinates.
