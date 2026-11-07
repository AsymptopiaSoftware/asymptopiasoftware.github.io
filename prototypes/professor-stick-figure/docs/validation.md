# B1.7 validation — November 6, 2026

Passed:

- **6 independent math-layout tests**: numerator/denominator centering and clearance, numbers/x/negative/simple/nested expressions, math-axis operator alignment, precedence parentheses, equal-sign alignment, measured multiline fit, supplied vector fonts, normal left-to-right bar paths and explicit invalid-input errors.
- **38 Professor tests**, including 3 new handwriting/notation tests. The requested 4 path is checked exactly (down-left/rightward crossbar, lift, downward vertical). Audited 3/5/9/division directions and reusable stroke separation are verified. The four-step example has eight timed fraction-bar strokes, no slash glyphs, unchanged solver data, and zero unreachable portions. The actual original arm renderer is checked before/mid/after a bar: empty, partial and complete.
- **12 unchanged math-generator/solver tests** and **15 original Drawing Arm tests**. Total: **71 tests**. Generator/solver source, body rig, artwork, gait, line-range planner, IK, timeline algorithms and SVG renderer source are unchanged. Only approved glyph definitions change inside Drawing Arm.
- Standalone source-hash verification and JavaScript syntax checks pass. Updated solution timeline/vector evidence and actual browser screenshot are included.
- Real Chromium/Playwright checks pass for modular source and self-contained HTML over localhost. The browser verifies eight fraction-bar paths, no slash glyphs, incremental arm-drawn bar progress, the original four-step algebra, all seeded demo problems, walking/controls, imports/exports, responsive layouts and DONE/chalk-lift status. The Advanced panel remains collapsed initially. A sub-pixel range-input serialization difference at the exact start of a bar is handled by checking just before its start rather than treating an invisible ~1e-13-unit segment as visible ink.

Browser execution uses the previously approved outside-command-sandbox run because Chromium needs socket permissions. No packages or environment settings were changed. Managed Chrome still blocks `file://`; the self-contained HTML was tested over localhost without disabling that policy. The file has all code/styles inline, but direct file-scheme navigation is not verified in that managed browser.

`docs/browser-evidence.svg` embeds an actual completed Chromium screenshot. `docs/solution-evidence.svg` is deterministic output from the adapter and original renderer. Canonical source equations in logs/JSON still use B1.6 text notation; board layout uses their ASTs. Free-writing mode intentionally retains literal vector text and its slash glyph.

No new character artwork, controls or UI redesign. No production homepage, hosting/workflow, merge or deployment changes.
