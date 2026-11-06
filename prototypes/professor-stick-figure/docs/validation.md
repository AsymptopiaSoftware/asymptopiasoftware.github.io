# B1.1 validation — November 6, 2026

Passed:

- **16 body/composition tests**, including all 10 existing attachment tests and 6 B1.1 tests. Sweeps cover 14 proportion/shoulder configurations across many writing timestamps: fixed heel anchors, derived hips/knees/neck/head, visible shoulder/engine-anchor coincidence, wrist/tool endpoints, unchanged world writing targets and compiled timeline, preserved arm lengths, saved-time reattachment without cumulative transforms, invalid-edit atomicity and explicit unreachable contact suppression.
- All five Drawing Arm source hashes match pinned original Git blobs. No engine source edits.
- **15 original Drawing Arm engine and SVG adapter tests**.
- Standalone build verifies the original hashes and packages the same engine modules with the new skeleton. JavaScript syntax checks pass for modular sources, scripts, optional browser test and the embedded standalone script.
- Default and three-profile evidence generated with the actual body adapter and original SVG renderer. The rasterized profile comparison was inspected for derived body proportions, planted feet and correctly attached right shoulders. The writing/board coordinates are identical across profiles.

Outstanding:

- Authorized browser-control tools remain unavailable. The expanded optional browser smoke tests in `tests/browser.mjs` are included but unrun; they cover each slider, current-time reattachment, fixed feet, body stability while playing, JSON import/export and mobile overflow. Browser event handling, controls and layout need real-browser verification before accepting draft PR #11.
- `standalone.html` is a local-file browser preview. No hosted preview or deployment is claimed.

Scope: only the existing `prototypes/professor-stick-figure/` directory changes. Drawing Arm modules, writing JSON, engine lock, homepage, production routes, hosting and workflow configuration stay unchanged. PR #11 remains draft on `feature/reduced-professor-stick-figure`. No merge or deployment.
