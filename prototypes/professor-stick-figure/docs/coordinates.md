# B1.5 coordinates, anatomy and motion contract

## Three independent spaces

SVG axes apply throughout: +x right, +y down. The body has local skeletal coordinates, the SVG has world coordinates, and writing uses the original board transform.

```
body world point = body.origin + [horizontalOffset, bodyLift] + body.scale * local point
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

Each thigh/shin is `0.58 * legHeight` in local units. The original two-link IK solves each knee from its hip and ankle, keeping these lengths fixed during stance and swing. `leftAnkle` and `rightAnkle` currently coincide with heel anchors in this reduced skeleton. The far left arm derives from its shoulder and torso length. Proportion edits preserve local heels, though explicit origin/scale editing relocates/resizes the body. Locomotion translates the upright torso and head while adding alternating leg articulation. Stance shoes remain fixed in world space; swing shoes lift above the unchanged floor. The configured home origin defines ground Y; the current body root includes a small vertical bob.

## Anatomical right-arm attachment

```
engine.shoulder = world(bodyLandmarks(body).rightShoulder)
engine.upper    = .65 * torsoLength * body.scale
engine.forearm  = .55 * torsoLength * body.scale
engine.tip      = .04 * torsoLength * body.scale
```

The adapter overrides supplied rig length/shoulder fields with these derived values. Original bend/handedness/joint-limit options are forwarded unchanged to the original engine. Body, world-space chalk and world-space curved arm are sibling groups; the arm is never nested inside the transformed body group. The shoulder skin endpoint and IK shoulder therefore move with the body without applying its transform twice.

## Planning and playback

B1.5 uses the same forward clearance with a wider natural extension band: `0.18R <= target.x - shoulder.x <= 0.98R`, for total tool reach `R`. Intersect this with the original physical reach envelope and joint limits. This never permits backward writing or stretches a link. A stance is accepted only if the whole intended range is reachable. The 6% reserve remains a preference for a required move, not a hard limit on how much of a line can be written.

Before a line begins, `groupWritingStrokes()` examines all source extents. Median nonzero stroke height (or width-derived fallback) provides a scale-aware nominal symbol height. A disjoint vertical gap over 45% of nominal height, or an explicit pen-up stroke, starts a new inferred line. Within a line, strokes whose horizontal bounds overlap within an 8%-height margin form an inferred symbol. This keeps ordinary multi-stroke digits/operators together without changing the original glyph library or requiring new JSON metadata. Arbitrary custom paths can be ambiguous; grouping is a geometric heuristic, not handwriting recognition.

`chooseWritingRange()` scans the remaining complete line, finding the longest feasible consecutive prefix of whole groups. It compares keeping the current free prefix with pre-positioning for a longer run: choose fewer movements, breaking a tie in favor of fewer standing positions. The selected end is committed; there is no creeping lookahead window. Longest feasible prefixes give a minimum-new-stance cover for these ordered groups, subject to the placement solver. The tests independently check optimal movement counts against exact interval-cover dynamic programming for unrestricted rigs. There is no fixed step count or walk quota. A custom glyph/path too large for one feasible range uses the existing lifted-chalk subdivision fallback; the whole-glyph boundary guarantee applies when a glyph group itself fits.

`plan.groups` exposes inferred line IDs and source stroke index spans. `plan.ranges` exposes selected group/stroke spans and body offsets. These are derived runtime data; source JSON remains unchanged. No semantic characters or geometry are added to the engine.

The default 24-unit `4/8+7/x=5/3` example needs five moved stances with the existing torso/leg height 115/115: vertical separation at the top row limits horizontal reach to 68.6 units, and forward clearance further limits shared span. Torso/leg height 160/160 writes four traced groups at home and six from one moved stance, reducing B1.4's three movements to one. Defaults are not changed to hide this geometric limit. `x` retains its original font-only fallback.

`planWriting(compiledSource,body,rig)` returns a separate deterministic schedule. It checks complete polylines at the current root before deciding to move. Reach tests use original `solveIK`, endpoint outer-radius constraints, exact segment-to-shoulder inner-annulus checks and intermediate solver checks at ≤2 world-unit spacing. A horizontal interval from the outer reach circle and the forward writing band is intersected over stroke vertices. For a required move the planner first tries a 6% extension reserve, then full reach (always inside the forward band); bounded candidate sampling handles inner dead zones and configured joint limits. Candidate sampling resolution is at most 2 world units. This is a bounded prototype planner, not a general collision-aware optimization system.

Phases:

| Kind | Root / arm | Chalk |
| --- | --- | --- |
| `move` | Smoothstep horizontal root translation plus subtle bob; arm angles held; alternating articulated legs | Lifted |
| `approach` | Root fixed, smooth joint-angle interpolation to next point | Lifted |
| `hold` | Root and pose fixed during source gaps or blocked portions | Lifted |
| `write` | Root fixed, original stroke interpolation and IK | Original pen/reachability gate |
| `done` | Final pose held | Lifted |

Move duration is at least 440 ms per step pair and `1.5 × distance / 90` seconds, keeping smoothstep peak horizontal speed ≤90 world units/s. Number of step pairs is `ceil(abs(horizontal displacement) / (0.35 * legHeight * scale))`, at least one for any nonzero move. Step phase derives from actual traveled fraction, not an independent time loop. The leading foot (right for rightward travel, left for leftward travel) swings first; the other shoe is planted. Each shoe advances by displacement divided by pair count, with smoothstep swing X and a sine-squared lift. Swing toes pitch up by at most 0.18 radians. Stance heel, ankle and toe world coordinates remain fixed.

The body stays upright and rises by up to `0.015 * legHeight * scale` at mid-step. That lift is subtracted from foot-local Y, keeping the stance shoe on the floor. Every move phase starts and ends with zero lift and both feet in the rest stance. The writing shoulder and pen-up arm receive the same body bob; writing positions/coordinates stay unchanged. There is no gait during hold/approach/write/done, no character turning and no new controls. Pen-up approach duration scales with angular change. Tests check shoulder and hand continuity on both sides of every boundary.

If a long stroke cannot fit one placement, original straight edges subdivide into portions no longer than 12 world units. They retain original coordinates, vertex order and proportional source duration; chalk lifts between portions when repositioning is needed. At most 5000 pieces and 100,000 input spatial subdivision probes may be planned. A budget failure leaves the previous composition intact. Transformed nonfinite coordinates and overflowing planned durations are rejected.

Horizontal motion cannot solve excessive vertical separation or some joint limits. Infeasible portions become `hold` phases with `reason:'blocked'`, remain chalk-free and appear in `plan.blocked`. The UI reports their count. The default equation has zero blocked portions. There is no automatic vertical movement or limb stretching.

`figure.duration` is the new playback duration; `figure.timeline.duration` remains the original writing duration. Export always returns original JSON, not retimed phases. Source fallbacks are mapped to their corresponding planned writing time and remain font-only. Source gaps remain pen-up holds; extra time is inserted for repositioning/reaching. Configuration edits replan at saved playback time; no source coordinates are modified.

## Rendering and later artwork

Each writing portion uses the original `SVGArmRenderer` with a fixed planned shoulder and an unchanged world-space stroke. Its chalk path persists as later portions use different shoulders. Only the old straight skeletal artwork is hidden; no chalk algorithm or IK is replaced. Curved body and arm silhouettes are closed cubic/quadratic outlines built from joint-derived tangents and tapered widths. Arm endpoints still use original shoulder, elbow and wrist coordinates. The chalk tool line connects original wrist and tip exactly. Debug skeletons can be hidden without affecting geometry.

No collision avoidance or general occlusion correction is added. In this rear view the body can naturally occlude existing chalk as it passes in front of the board. Imported writing may leave the visible board; it is not clipped or relocated. Future art can replace the silhouette while consuming the same authoritative skeletal poses, source JSON and board coordinates.

## B1.6 math adapter

The independent math module has no body, SVG, board or time concepts. `src/math-timeline.js` converts verified equation steps into this same world/board contract. It preserves origin `[355,140]`, places successive solution lines inside the existing board, adds pen-up source pauses and exposes optional operation metadata. All range planning, arm proportions, walking joints and contact gates above remain unchanged. See [math interface](math-interface.md). A single authorized lowercase-x glyph extension replaces the earlier font fallback; no drawing algorithms change.
