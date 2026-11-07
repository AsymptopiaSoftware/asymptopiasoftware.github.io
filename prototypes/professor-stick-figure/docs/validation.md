# B1.8 validation — November 7, 2026

Baseline: B1.7 `7f14342`; separate branch `feature/professor-b1.8-teaching-cadence`.

- **77 automated tests pass**: 44 Professor (including 6 new cadence tests), 12 unchanged exact-math, 6 unchanged math-layout, 15 original Drawing Arm.
- New tests check structured solver boundaries, unchanged writing geometry and movement phases, incremental lowering, relaxed/still pauses, chalk lift, planted feet, exact 1500 ms rests, large-frame Step gates, Auto progression, deterministic forward/backward chalk/pose/explanation reconstruction, final rest, legacy free writing, atomic malformed imports and different body proportions including blocked placements.
- Real Chromium/Playwright checks pass for modular source and self-contained HTML over localhost. They exercise Auto/Step, waiting, Continue, Auto resumption, seeking across completed/future lines, explanation restoration, Play/Pause/Reset, fraction-bar drawing, generated problems, walking, rig sliders, import/export and responsive widths. Advanced is collapsed by default. Timeline seeking snaps within 1e-6 ms of explicit boundaries to avoid range-input decimal serialization changing an exact gate into an instant just before it.
- Standalone build verifies all 5 pinned B1.7 Drawing Arm source hashes. No changes to math solver/generator, layout, glyphs, IK, original timeline/renderer, gait, range planning, locomotion or body artwork.
- `docs/browser-evidence.svg` embeds the actual Chromium screenshot at a teaching rest. `docs/solution-evidence.svg` shows the final relaxed pose. The source JSON timeline is unchanged; cadence exists only in the Professor's derived playback plan.

Browser tests require a localhost socket; they ran with approved execution outside the command sandbox after its socket restriction was observed. No dependencies, environment configuration or browser policies changed. Managed Chrome blocks file URLs, so the self-contained HTML was tested over localhost; direct file-scheme navigation remains unverified there.

No B1.7 branch changes, production homepage edits, merge or deployment.
