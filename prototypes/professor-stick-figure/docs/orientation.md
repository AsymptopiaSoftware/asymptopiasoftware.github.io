# B1.9.3 — anatomical identity and character facing

Baseline: B1.9.2 commit `d7f0a4e0fa6f13b0d64775c6f9aa5853439cf5c9`. Same branch/draft PR: `feature/professor-b1.9-talk-gesture` / #13.

## Coordinates and permanent identities

`src/orientation.js` is a lightweight pure model with no DOM, mathematics, speech, character artwork or Drawing Arm dependency. Anatomical coordinates are `[x,y,z]`: x points toward the **character's right**, y down, z forward. Thus anatomical right remains positive x even when it projects to the viewer's left. The current adapter registers permanent `left/rightShoulder`, `left/rightElbow`, `left/rightWrist`, `left/rightHand` and tool-tip joints. The minimal hand and wrist anchors coincide; their IDs stay separate so later hand rigs can extend them.

```js
import { characterFacing, projectSkeleton } from './src/orientation.js';
const joints = {
  leftShoulder: [-30, -100, 0],
  rightShoulder: [30, -100, 0]
};
const facing = characterFacing(progress, { // 0: board, 1: audience
  boardYaw: Math.PI / 6, audienceYaw: Math.PI, pivot: [15, 0]
});
const projected = projectSkeleton(joints, facing);
// Same keys, each { point:[screenX,screenY], depth }.
// Rear: right shoulder at screen-right. Front: right at screen-left.
```

For yaw θ, the orthographic projection is:

```
screenX = pivotX + anatomicalX cos θ + anatomicalZ sin θ
screenY = pivotY + anatomicalY
depth   = -anatomicalX sin θ + anatomicalZ cos θ
```

Depth increases away from the viewer. `liftProjected(point, depth, facing)` is the inverse transform. `characterFacing()` returns plain deterministic data, so another renderer or differently proportioned character can use it directly. Its yaw endpoints/pivot are configurable; the existing stick figure calibrates a 30° rear three-quarter pose and 180° front pose. No global SVG reflection or side-ID swap is used.

## Prototype calibration and gestures

`src/presentation-rig.js` converts the established board skeleton into anatomical coordinates without changing its rear projection. Shoulder depth is calibrated from the existing shoulder offsets, with the yaw pivot midway between them. The right writing arm lifts into a camera-parallel plane, preserving its exact original segment lengths and attachment.

The historical left rest silhouette was shorter in screen projection. It now recovers depth for its elbow/forearm using torso-derived anatomical lengths, rather than becoming a physically short arm in front view. If a configured rear segment already exceeds that default length, its existing length sets the minimum. Inverse projection reconstructs the same rear joints. Both arms keep constant **true 3D lengths** during turning; their 2D projected lengths naturally foreshorten.

`turnBone(fromVector,toVector,blend)` interpolates unit directions on the sphere and restores the original length, including stable large/antipodal rotations. The existing eased turn progress drives both yaw and the transition from the calibrated rest pose to an anatomical gesture. Neither whole bones nor the entire character are mirrored.

Gesture targets and bend directions are defined in anatomical coordinates. `thoughtful-explain` coordinates support/indicating roles while explicit present/emphasize/idle use compact targets; front-facing anatomical right appears on the viewer's left. The neutral audience wrist target allows a relaxed bend, with the elbow pole described below keeping elbows outward. `present` uses the anatomical left arm toward the screen-right board when facing the viewer, with the right arm relaxed. Hands/count markers belong to the same permanent arm throughout.

Head/neck/upper-torso landmarks project through the same facing model; the existing head silhouette/face cues follow those positions. The lower rig retains its established hip/foot constraints and walking landmarks. During a turn the body origin and both floor anchors are fixed. Returning to board progress zero uses the original IK pose exactly, with its original shoulder, elbow, wrist, tip, contact and target.

## SVG depth ordering

`armDepthOrder(projectedJoints,facing,surfaceAllowance)` computes mean shoulder/elbow/wrist camera depth for each anatomical arm. The prototype uses a small torso-relative surface allowance in front view. Far arms render before the torso; near arms after it, sorted back-to-front with stable ties. This is a coarse whole-arm painter model; it does not claim per-pixel mesh occlusion.

The SVG has persistent far-arms, body and near-arms layers. Permanent left/right groups move between those layers; their objects, `data-anatomical-side` attributes, hand nodes and right-arm Drawing Arm attachment never trade identities. Each palm now shares its own arm's depth group. There is no combined two-hand path incorrectly placed in front of the torso. The board/chalk remains behind these layers in fixed world coordinates.

The model supports either yaw direction and arbitrary projected joint lengths/depths. Future character renderers can consume the same projection/depth output with their own anatomy and surface allowance.

## Sampling, inspection and verification

`presentationRig()` returns `{landmarks,arms,anatomical,projected,facing,depthOrder}`. `arms` are projected world-space poses; `anatomical` contains body-local 3D joints/lengths. `ProfessorFigure.getAnchors()` returns screen/world anchors; `getAnatomicalJoints()` returns detached 3D coordinates. This separation prevents screen ordering from redefining anatomical sides.

All poses and draw ordering are derived from the current timeline sample. Forward/backward seeking, return turns and rig edits rebuild them without retained turn state. The lesson plan, its timing, speech side effects, chalk history and mathematical certificates are unchanged.

Six new orientation tests cover permanent IDs, front/rear ordering, forward/inverse projection, true bone lengths, antipodal continuity, differing proportions, both yaw directions/depth ordering, unchanged SVG objects, fixed feet/body origin, exact restored writing IK, independent gestures and arbitrary seeks. Existing tests now measure anatomical lengths in 3D rather than requiring foreshortened screen bones to stay constant. Browser tests check the actual left/right group ordering and node identity in both standalone and modular previews.

See [four-pose vector evidence](orientation-evidence.svg) (deterministic renderer output) and [audience browser screenshot](browser-evidence.svg). Gold always identifies anatomical right; gray identifies anatomical left. No UI controls were added; Advanced remains collapsed.

## Outward audience elbow preference (B1.9.3a)

`audienceArmPose(arm,target,side,{elbowPreference='outward',maxExtension=.95})` in `src/audience-arm.js` selects the anatomical elbow on the two-link shoulder/hand circle. Its pole biases laterally away from the torso; small downward and forward components maintain a natural bend and a continuous path as hands cross shoulder height. It never substitutes a single elbow angle for all gestures. Bone lengths are exact; the wrist/tool target determines the bend and the pose stays within reach. The default extension cap avoids a locked straight arm; a consumer can explicitly allow full extension for an intentional reach.

B1.9.3b constructs compact anatomical targets directly and coordinates the thoughtful support contact. Pole solving remains available for board presentation and supporting-arm reach, then the existing projection and depth sorter render the pose. Explicit idle uses a bent neutral target; B1.9.3b holds the thoughtful supporting pose during ordinary explanation pauses. The supporting forearm intentionally crosses inward while uncrossed poses retain modest outward elbow bias. `elbowPreference:'inward'` on a presentation action is an explicit opt-in for a future deliberately crossing gesture; no default gesture requests it.

The preference is blended through the existing turn and is fully disengaged at board progress zero. Original rear shoulder/elbow/wrist/tip and writing IK remain exact. It does not modify the orientation/depth algorithm, feet, timeline, mathematics, speech or playback controls. Projected audience bones can foreshorten even in front view because the elbow now has a small forward component; tests measure true anatomical lengths.

Four additional regression tests cover outward idle/hold, all gesture phases across body proportions, relaxed bending, variable joint angles, smooth hand-height crossings, explicit inward opt-in, anatomical identity, depth layers, seeking and restoration of writing. B1.9.3b browser checks now verify the intentional support-hand/opposite-elbow contact while explaining and at the Continue gate.

## B1.9.3b thoughtful support

The primary explanation pose now coordinates anatomical left as the supporting arm and right as the indicating arm. The supporting hand is placed just under the opposite elbow with a small palm-depth allowance; it follows that elbow throughout the subtle hand cue. This is an explicit crossing exception to the generic outward preference. It uses the same permanent IDs, 3D projection, depth sorting and return-to-board interpolation. See [thoughtful pose](thoughtful-pose.md) for contact metrics, gesture compatibility and reach limits.
