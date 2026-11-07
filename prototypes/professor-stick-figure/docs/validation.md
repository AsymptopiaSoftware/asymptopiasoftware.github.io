# B1.9.2 validation — November 7, 2026

Branch: `feature/professor-b1.9-talk-gesture`; existing draft PR #13.

- **97 automated tests pass**: 15 independent exact-math, 12 math-layout, 55 Professor, 15 original Drawing Arm. This includes 7 new regressions for certified algebra, dot geometry and fail-closed lesson rendering.
- Required equation `1/4-7/x=-5/8` returns x=8. Exact normalized cross-polynomials match across all six equations; exact original-domain witnesses agree. The -1 line displays the factor on both sides, then separately simplifies both sides. Cached proof flags, one-sided changes, false same-root operations, incorrect explanations/effects/certificates and altered lesson imports are rejected.
- Multiplication dots are centered on the mathematical axis, small relative to digit height and distinct from decimal/variable glyphs. Both dots in the required example have ≥80 ms durations and progress from absent to partial to complete ink through the original arm renderer. Zero blocked writing.
- Chromium/Playwright passes for modular and self-contained previews: required regression, incremental dots, x=8, certified captions, unchanged board after invalid import, plus existing Auto/Step/Continue, seeking, generation, fractions, walking, rig controls, responsive layout, talk/gesture and speech lifecycle checks.
- Native Chromium has **zero installed voices**. Silent fallback is verified; speaking/pause/resume/mute/cancel/replay tests use a controlled synthesis backend. The final regression screenshot is native Chromium with the silent fallback visible. Audible voice quality is unverified here.
- Build verifies all 5 approved Drawing Arm hashes. Only the font adds a multiplication dot and maps legacy multiplication inputs to it. Original IK, timeline/renderer, body/rig, locomotion/range planner, gait, B1.8 sequencer, gesture/orientation and speech controller source are unchanged. Seeded generation remains deterministic.
- Certified JSON examples, dot-aware legacy examples, standalone bundles and vector/browser evidence are regenerated. `docs/correctness-evidence.svg` and `examples/negative-denominator.json` contain the required case. Raw math metadata is now version 2; old mathematical exports need re-solving to obtain certificates. Generic free-writing imports remain supported.

Browser checks ran with approved localhost socket access after the command sandbox blocked listening. No dependencies, environment configuration or browser policy changes. Self-contained HTML was tested over localhost; managed Chrome blocks file URLs.

No merge, deployment, homepage or production changes.
