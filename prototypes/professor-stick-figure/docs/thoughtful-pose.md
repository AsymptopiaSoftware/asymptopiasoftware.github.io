# B1.9.3b — thoughtful explainer

`thoughtful-explain` replaces symmetric, horizontally spread arms as the default audience explanation pose. All automatically sequenced mathematical explanations use it; applications can explicitly request another gesture. No playback controls, mathematical data or speech logic change.

## Reusable action

```json
{
  "type": "talk-and-gesture",
  "text": "Let us think about this carefully.",
  "gesture": "thoughtful-explain",
  "orientation": "audience"
}
```

The primary vocabulary is `thoughtful-explain`, `present`, `emphasize`, `idle`. Omitting gesture selects thoughtful explanation. Legacy `explain` aliases it, so old records no longer request the arms-out style. Legacy explicit `count` remains compatible through a compact emphasis cue and number marker. Explicit per-action gestures override the lesson's default; the sequencer no longer cycles through different gestures merely by step index.

## Coordinated arm model

`src/thoughtful-pose.js` is independent of mathematics, SVG and speech. `thoughtfulArms(armDefinitions, elapsed, duration)` constructs both arms together. Anatomical right is raised, its elbow slightly outward and below the shoulder, with a compact forearm angled up toward the upper chest. Anatomical left crosses the torso, and its hand is solved to a target just below the right elbow. A small forward allowance places the palm beneath the supported arm's skin.

The right hand makes one small indicating movement over the speech slot, rather than continuous waving or a rigid extension. A tiny elbow shift accompanies it; the supporting target follows that elbow, preserving contact. The renderer uses a compact hand outline and short soft finger cue. The held pose has no motion. The raised forearm stays visually separated from its upper arm in projection.

The supporting forearm is a deliberate inward-crossing exception; the raised elbow keeps a modest outward preference where proportions allow. Both true upper-arm and forearm lengths stay fixed. The old outward pole helper remains available for support IK and explicit presentation reach. Neutral idle uses gently bent downward arms. Emphasize/count raise one compact arm with the other relaxed; present reaches toward the board with one arm, so none introduces a symmetric ordinary explanation posture.

`audienceGestureTargets()` selects these targets. `presentationRig()` blends them through the existing board/audience turn using the established length-preserving bone interpolation. Anatomical left/right IDs and the existing camera/depth layers remain authoritative. Board progress zero uses the exact previous writing shoulder, elbow, wrist and tip.

## Contact, proportions and diagnostics

Arm definitions supply each side's shoulder and actual segment lengths. The solver prefers a modest outward raised elbow; it adapts that target for broader shoulders/shorter arms so the supporting hand can reach. Default and tested normal configurations have exact target reach with the palm a few body units beneath the elbow.

`anatomical.supportContact` exposes supporting/supported side IDs, current contact target, sampled gap, reachability and whether the full audience pose is active. During the turn, the arms are forming or releasing support, so contact need not already hold. During speech and the held pause, the target is maintained. For physically impossible proportions, the support arm stops at a reachable position and reports a nonzero gap instead of stretching or pretending contact. This is a diagnostic for custom rigs; the default prototype has contact throughout its explanations.

Every pose is a pure function of time and proportions. Seeking reconstructs the contact, raised hand, depth order and lesson position. Pausing speech freezes animation normally; no extra clicks or speech events are needed to form the pose. At the end of speaking, the small cue returns to its base position; the thoughtful pose stays calm through Auto/Step waiting, then releases during the existing return turn.

## Verification

Five regressions check action/lesson defaults and aliases, explicit overrides, support contact across body proportions, fixed true lengths, compact elbows/raised forearm, projected separation, sub-8-unit hand motion, still holds, stable arm identities/depth, arbitrary seeks, exact writing restoration and honest unreachable-contact diagnostics. Existing pole tests now exempt the intentional thoughtful crossing and test the relaxed neutral pose separately. Present is an intentional reach; other compact poses remain bent.

Browser checks inspect actual support-hand/opposite-elbow clearance, raised wrist height, compact upper-arm position and the held Continue pose in modular and self-contained previews. Existing speech, mathematics, walking, seeking and control checks remain.
