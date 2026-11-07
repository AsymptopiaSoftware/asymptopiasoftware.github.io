# B1.9 validation — November 7, 2026

Baseline: PR #12 / B1.8 `394e5db7d57a46643cf5245ebf83261f0699aa03`. Separate branch `feature/professor-b1.9-talk-gesture`.

- **85 automated tests pass**: 52 Professor (44 unchanged B1.8 tests, 5 new presentation tests, 3 new speech tests), 12 exact-math, 6 math-layout, 15 original Drawing Arm.
- Presentation tests verify arbitrary story/chart actions independent of mathematics, all five gestures, independent left/right movement, constant skeletal link lengths across proportions, fixed feet, continuous board/audience turns, deterministic arbitrary seeking, unchanged chalk, original writing-shoulder/IK restoration, next-operation text and Step gates after speech.
- Speech tests verify single utterances, pause/resume, cancellation, replay, mute/unmute, stale callbacks, missing/delayed voices, unsupported API, backend errors/watchdog and live-audio end gating. Replay after canceling paused speech clears the browser's paused synthesis queue state.
- Real Chromium/Playwright checks pass for modular and self-contained HTML over localhost. They retain existing Auto/Step, Continue, Play/Pause/Reset, seeking, generation, fractions, walking, rig controls, imports/exports and responsive checks. Added browser checks verify front/transition/board states, independent arms, captions, speech lifecycle, preserving chalk through presentations, and writing again after turning back.
- **Native Chromium reports zero installed speech voices.** Native silent fallback passes. Speech API lifecycle and long-utterance transport behavior are verified with a controllable backend in both previews. Audible output/voice quality is not verified in this environment. Screenshot evidence uses that controlled backend; it is a real browser screenshot, not proof of audible speech.
- Standalone build verifies all 5 pinned Drawing Arm hashes. B1.8 `src/teaching.js` is byte-for-byte unchanged. Math generator/solver, layout, glyphs, IK/timeline/renderer, locomotion, range planning, gait and anatomical body definitions remain unchanged.
- `docs/browser-evidence.svg` shows a paused audience-facing explanation. `docs/solution-evidence.svg` shows final board geometry/rest pose. Original source timeline JSON remains unchanged; presentations exist only in the derived playback plan, with optional generic overrides.

Local browser testing required approved execution outside the command sandbox after its localhost socket restriction was observed. No dependencies, environment setup or browser policies changed. Managed Chrome blocks file URLs, so self-contained HTML was tested over localhost; direct file-scheme navigation remains unverified there.

No B1.8 branch changes, homepage edits, merge or deployment.
