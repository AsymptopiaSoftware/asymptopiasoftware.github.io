# B1.9 validation — November 7, 2026

Baseline: PR #12 / B1.8 `394e5db7d57a46643cf5245ebf83261f0699aa03`. Separate branch `feature/professor-b1.9-talk-gesture`.

- **90 automated tests pass**: 53 Professor (44 baseline behavior tests, 5 presentation, 3 speech, 1 added timed-operator regression), 12 exact-math, 10 math-layout (4 added alignment regressions), 15 original Drawing Arm.
- Presentation tests verify arbitrary story/chart actions independent of mathematics, all five gestures, independent left/right movement, constant skeletal link lengths across proportions, fixed feet, continuous board/audience turns, deterministic arbitrary seeking, unchanged chalk, original writing-shoulder/IK restoration, next-operation text and Step gates after speech.
- Speech tests verify single utterances, pause/resume, cancellation, replay, mute/unmute, stale callbacks, missing/delayed voices, unsupported API, backend errors/watchdog and live-audio end gating. Replay after canceling paused speech clears the browser's paused synthesis queue state.
- Real Chromium/Playwright checks pass for modular and self-contained HTML over localhost. They retain existing Auto/Step, Continue, Play/Pause/Reset, seeking, generation, fractions, walking, rig controls, imports/exports and responsive checks. Added browser checks verify front/transition/board states, independent arms, captions, speech lifecycle, preserving chalk through presentations, and writing again after turning back.
- **Native Chromium reports zero installed speech voices.** Native silent fallback passes. Speech API lifecycle and long-utterance transport behavior are verified with a controllable backend in both previews. Audible output/voice quality is not verified in this environment. Screenshot evidence uses that controlled backend; it is a real browser screenshot, not proof of audible speech.
- Standalone build verifies all 5 pinned Drawing Arm hashes. B1.8 `src/teaching.js` is byte-for-byte unchanged. Math generator/solver, glyphs, IK/timeline/renderer, locomotion, range planning, gait and anatomical body definitions remain unchanged. This follow-up changes only mathematical layout metrics/spacing and generated preview artifacts.
- `docs/browser-evidence.svg` shows a paused audience-facing explanation. `docs/solution-evidence.svg` shows final board geometry/rest pose. Source timeline coordinates and explicit row metadata are regenerated from the corrected layout; canonical equations, operation metadata and writing-stroke timing are unchanged. Presentations still exist only in the derived playback plan, with optional generic overrides.

Local browser testing required approved execution outside the command sandbox after its localhost socket restriction was observed. No dependencies, environment setup or browser policies changed. Managed Chrome blocks file URLs, so self-contained HTML was tested over localhost; direct file-scheme navigation remains unverified there.

No B1.8 branch changes, homepage edits, merge or deployment.

## Operator-alignment regression coverage

Ten adjacent/signed/nested/mixed equations are checked at font sizes 12, 24 and 36. Tests verify explicit text/child baselines, complete-box axis centering, actual plus/minus/equals ink centers, horizontal clearance beyond chalk caps, safe custom-gap floors and equals alignment after multiline fitting. The original arm renderer is sampled before/mid/after every operator/bar stroke in the default example; ink is absent, partial, then complete, with normal lifted transitions and zero blocked writing. One existing timing assertion now uses a 1e-8 ms numerical tolerance instead of strict equality after coordinate-driven playback offsets changed; cadence code is unchanged.
