# B1.6 validation — November 6, 2026

Passed:

- **12 independent math tests**, including 288 signed generated cases across all three operators and six hidden-number slots, independent integer cross-product arithmetic identities, large exact values, required four-step example, denominator/numerator/either-side unknowns, rational/negative/zero answers, reducible fractions, invalid syntax/zero denominators, domain-filtered extraneous roots, no/infinite/multiple solutions, exact operation verification, tamper rejection and deterministic seed sequences.
- **35 Professor/adapter tests**. Three new integration tests verify ordered solution timelines, unchanged source solution objects, zero fallback glyphs, generated solutions fitting the existing board, reachable math strokes, chalk lift during movement and rejection of unverified/nonunique/oversized solutions. All existing rig, line-range, forward-reach, planted-foot, gait and continuity checks pass.
- **15 original Drawing Arm tests**. Its kinematics/timeline/renderer/export source modules are unchanged. Only the necessary lowercase-x vector glyph was added; the lock records that approved extension and original glyph hash. Previously font-only x now participates in writing/positioning, and the corresponding default-range test correctly counts eleven traced groups rather than ten.
- Standalone build verifies all approved source hashes. Modular source and embedded script syntax checks pass.
- Real Chromium/Playwright browser integration passes for modular source and self-contained HTML over localhost: requested example sequence, all three seeded generated problems, nonunique-input rejection without replacing a valid board, free writing, walking, body sliders, skeleton toggle, JSON downloads/imports, responsive widths 390/768/1440, and final completion with chalk lifted. Actual screenshot evidence is embedded in `browser-evidence.svg`; deterministic solution rendering is in `solution-evidence.svg`.

Browser execution details:

- Chromium initially failed inside the command sandbox with `setsockopt: Operation not permitted`. The updated Cloud runtime guidance permitted an approved retry outside the command sandbox; browser tests ran successfully there using the already installed Chromium and Playwright, with no package/environment configuration changes.
- Managed Chrome explicitly blocks `file://` navigation (`ERR_BLOCKED_BY_ADMINISTRATOR`). The same self-contained HTML was tested via localhost with `STANDALONE_HTTP=1`; no browser policy was disabled. All code/styles are inline, but direct file-scheme navigation is not verified in that managed browser.
- Browser checks exposed an asynchronous import assertion race in the test and an actual seek-slider rounding issue. Tests now wait for completed file imports; `step="any"` plus a tiny endpoint snap handles browser range-value serialization so the slider reaches a noninteger playback duration exactly, and the browser test asserts DONE/chalk-lifted status.

The math package knows nothing about rendering, the Professor or animation timing. Only its adapter emits milliseconds. Original mathematical steps are derived and verified with exact rational arithmetic before drawing; no text is guessed by the character.

No homepage, production route, hosting or workflow changes. Existing draft PR/feature branch only; no merge or deployment.
