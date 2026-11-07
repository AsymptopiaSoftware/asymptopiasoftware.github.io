# B1.9 reusable talk-and-gesture actions

Baseline: B1.8 PR #12, commit `394e5db7d57a46643cf5245ebf83261f0699aa03`. Development branch: `feature/professor-b1.9-talk-gesture`. The B1.8 branch and `src/teaching.js` implementation remain unchanged.

## Public action interface

```json
{
  "type": "talk-and-gesture",
  "text": "This chart shows how the garden grows.",
  "gesture": "present",
  "orientation": "audience"
}
```

`src/presentation-action.js` is independent of lessons, mathematics, SVG, the arm engine and browser speech. `presentationAction(input)` validates and normalizes the record. Text is required (1–4000 characters); `gesture` defaults to `thoughtful-explain`, orientation to `audience`, and optional `count` to 1 (integer 1–20). Optional `duration` supplies the deterministic visual speech slot, 1000–120000 ms. Otherwise the slot is at least 2400 ms, estimated from word count. Long narratives should use multiple actions.

Vocabulary:

| Gesture | Behavior |
| --- | --- |
| `thoughtful-explain` | Preferred default. Left hand supports the right elbow across the torso; raised right forearm makes a small indicating gesture. |
| `present` | Left hand gestures toward the screen-right board; right remains relaxed. |
| `emphasize` | One compact raised-hand cue; the other arm stays relaxed. |
| `idle` | Relaxed neutral stance with small outward elbow clearance. |

Legacy `explain` normalizes to `thoughtful-explain`, preventing old explanation records from producing a wide arms-out pose. Explicit legacy `count` uses a compact raised-hand cue and retains its count marker. The public `GESTURES` list contains the four primary names above.

Thoughtful explanations hold a coordinated base pose through the turn and pause; only the indicating hand and a tiny following elbow motion animate while speaking. Explicit present/emphasize gestures ease from and back to neutral. All true anatomical link lengths remain fixed. Rear writing still uses the original IK; audience poses use anatomical target construction and pole solving where needed.

## Use without mathematics

```js
import { compilePresentationAction, samplePresentationAction }
  from './src/presentation-action.js';
const clip = compilePresentationAction({
  type: 'talk-and-gesture',
  text: 'Once upon a time, a gardener planted a seed.',
  gesture: 'thoughtful-explain', orientation: 'audience'
}, { at: 0, id: 'story-introduction', turn: 700, wait: 1500 });
const sample = samplePresentationAction(clip, elapsedMs);
// sample: { orientation, audience, presentation }
// orientation: board | transitioning | audience
// audience: smooth 0..1 turn blend
// presentation: action, stage, elapsed, timing and id (or null outside clip)
```

`compilePresentationAction` returns `{id,action,at,talkAt,talkEnd,gate,resume,end}`. It requires no teaching plan. `samplePresentationAction` is pure and reconstructs any time directly. Another application can consume these values with its own renderer. `examples/presentation-actions.json` contains story/chart examples of the four primary gestures.

For the current skeleton, `presentationRig(body, state, baseLandmarks, rig)` in `src/presentation-rig.js` takes the sampled orientation/presentation plus the board arm's `state.pose`, and returns anatomical 3D joints, facing/depth data, projected local landmarks and world-space left/right skeletal poses. `presentationHead` provides the continuous head outline. This renderer adapter reuses the original IK; the generic action module does not import it. Front shoulders and head are centered; two static face dots and a frontal head outline identify the audience view. Feet and hips keep their existing floor anchors.

## Thin B1.8 lesson integration

`presentationPlan(teachingPlan, overrides?)` in `src/presentation-plan.js` wraps B1.8's existing spatial/teaching plan. It replaces each teaching pause with:

1. B1.8's original final stroke, chalk lift and 450 ms lowering.
2. A 700 ms planted turn toward the audience.
3. A generic talk-and-gesture action.
4. B1.8's 1500 ms Auto pause or Step-mode Continue gate, facing the audience with arms relaxed.
5. A 700 ms planted return to the board, then the original arm return and subsequent writing/movement phases.

The explanation after a line comes from the **next structured solver step's operation**, so the Professor explains the transformation before writing it. After the final equation, he explains the final operation and returns to a relaxed board pose. The sidebar shows exactly the action text during its turn, speech and wait; during writing it shows the corresponding B1.8 operation. Canonical equations and solver operations are unchanged. No boundaries are inferred from text or geometry.

Optional timeline metadata `presentationActions` can supply one normalized action per teaching pause. This is a consumer override, not part of the mathematical solver. Export/import preserves it. Free-writing timelines without structured steps retain their original behavior and do not synthesize a lesson.

## Deterministic poses versus live audio

`samplePresentation` reconstructs orientation, gesture, chalk, source position and teaching state from the plan/time alone. Seeking never accumulates pose state. Original stroke points/durations and all movement phases remain unchanged; only playback start times shift. Seeking backward restores earlier chalk and re-arms earlier Continue gates. Both feet remain planted during every turn, action and pause.

`PresentationSpeech` in `src/speech.js` owns Web Speech side effects. It accepts `{id,text}` with a playing flag and rate. It starts once per action, pauses/resumes with transport, and cancels before a new action, seek, reset, rig edit, reload, page exit or replay. Mute defaults off. Muting cancels; unmuting within a playing speech slot restarts that current explanation. Changing speed also restarts the current utterance at the selected rate. Reset/replay uses the existing controls; there is no extra narration click or replay button.

Seeking cancels audio and pauses transport. Play within a speech slot restarts its whole explanation; it does not pretend to recover a word offset. Seeking past a speech slot does not narrate skipped content. `presentationAdvance` ensures a talk slot is observed and holds just before its deterministic end while live audio is still active, so the figure cannot turn away mid-sentence. Pose time freezes there; on audio completion, normal cadence resumes. Step gates are reached only after speech, and Continue skips just the existing pause, never an active utterance. A completed utterance is not restarted at the held time. Canceled utterance callbacks cannot affect a newer utterance.

The speech controller prefers an English local voice, then another English/default browser voice. Delayed `voiceschanged` is supported. Missing APIs/voices, synthesis errors and a bounded stalled-backend watchdog fall back to visible explanations without blocking the lesson indefinitely. No external API, backend, voice installation or browser policy changes are required by the prototype. The browser's own speech service determines actual voice availability and fraction pronunciation.

## Verification and preview

Run `npm test` and `npm run build:standalone` in this prototype. Existing B1.8 tests remain unchanged. New tests cover all gesture types/proportions, constant limb lengths, planted feet, turn continuity, arbitrary seeking, preserved chalk, return to the original shoulder/IK, general story actions, audio gates and speech lifecycle failures.

The browser suite exercises both modular and self-contained previews with the native speech API, plus a controllable synthesis backend for speaking/pause/resume/mute/cancel/replay and long-utterance gating. The managed Chromium environment has **zero installed speech voices**: native silent fallback is verified, but audible voice quality cannot be verified there. Screenshot evidence uses the controlled backend. An ordinary browser with an installed voice can speak after Play. Advanced remains collapsed; Mute is the only added control.

## B1.9.3 anatomical projection

Anatomical right is now viewer-left in front view, while remaining the same rig/group/hand throughout. Gestures operate in anatomical coordinates, then project through yaw; far/near SVG layers follow depth. The right drawing shoulder is restored exactly on return. No action data, sequencing, math, speech or playback control changes are required. See [orientation model](orientation.md).

## B1.9.3a elbow preference

All audience actions default to laterally outward elbows, including the idle/held pose. Wrist targets and gesture timing remain unchanged except for a more relaxed bent neutral target. Optional `elbowPreference:'inward'` explicitly permits a deliberately crossing gesture; invalid preference names are rejected. This adds no controls. The pole is solved in anatomy space before projection, preserving side identity and depth order. See [audience pole](orientation.md#outward-audience-elbow-preference-b193a).

## B1.9.3b coordinated explanation pose

Default actions and all ordinary lesson explanations use `thoughtful-explain`. Supporting/indicating arm roles and the exact support target are sampled from time, without speech or pose history. The supporting arm intentionally crosses the torso; other gestures retain compact outward bias. Hand cues are small and the pause stays still. See [thoughtful pose](thoughtful-pose.md).

## Compact board indication (B2.1)

`present` optionally accepts `indicatingArm: "right"`. This keeps anatomical left
relaxed and uses a restrained, bent right-arm indication. The existing default
left-arm present pose and thoughtful-explain default remain unchanged. The
compact component selects the right-arm variant explicitly for its lessons.
