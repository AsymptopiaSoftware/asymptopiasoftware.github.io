# B1.9.3a validation — November 7, 2026

Existing branch/draft PR #13. Baseline: B1.9.3 `e66cdb96971fbd4f5b3af45c0f27cb9c91ff7f7d`.

- **107 automated tests pass**: 65 Professor, 15 exact-math, 12 math-layout, 15 original Drawing Arm. Four new elbow-pole regressions cover front idle/hold; explain/emphasize/count/present through their full envelopes and varied body proportions; constant anatomical lengths and relaxed bends; smoothly moving wrist targets; explicit inward opt-in; correct identity/depth layers; deterministic seeks and exact rear writing restoration.
- Chromium/Playwright passes both modular and self-contained previews. New assertions measure actual screen-space elbows outside both shoulder anchors during explanation and a held Continue gate. All existing orientation/node identity, near/far layering, speech, Auto/Step/Continue, math/dots/x=8, import rejection, walking/reaching, controls and responsive tests remain.
- The idle target is bent instead of almost straight; a lateral pole chooses the actual elbow from the two-link circle and follows wrist movement without planar branch flips. A small forward component can foreshorten front-view screen segments, so one existing cadence assertion now checks true anatomical length. All bone lengths remain fixed.
- Rear writing IK/attachment, anatomical coordinate projection, depth-order algorithm, walking/reach planner, math solver/layout/glyphs, teaching/presentation timing, speech controller and controls are unchanged. All five engine source hashes pass the standalone build.
- `docs/browser-evidence.svg` shows a real audience-facing Chromium pose with outward elbows. Four-pose renderer evidence and standalone HTML are regenerated. No new controls or artwork; Advanced remains collapsed.

Native Chromium still has no installed voices. Native silent fallback and a controlled speech backend verify speech behavior; audible voice quality remains unverified. Browser tests used approved localhost socket access after sandbox listening was blocked. No dependencies, environment configuration or browser policy changes; the self-contained HTML was tested over localhost because managed Chrome blocks file URLs.

No merge, deployment, homepage or production changes.
