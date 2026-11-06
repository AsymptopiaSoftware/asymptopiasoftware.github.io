# B1.3 validation — November 6, 2026

Passed:

- 22 body, motion, curved-rendering and integrity tests. The former whole-timeline stationary-body assertions were replaced with the B1.2 requirements: stationary root while writing, grounded translation between writing phases.
- Default equation: body-derived upper/forearm/tool = 74.75/63.25/4.6; 6 horizontal moves in both directions; 0 blocked portions; 4.805 s original writing becomes 17.379 s planned playback.
- Reachable writing tips match original board targets; hand/shoulder poses remain continuous at every phase boundary. Sampled root speed stays ≤90 world units/s. All move/approach phases lift chalk. Both feet retain fixed ground Y, and both translate by the same X increment.
- Long paths split without rescaling, missing reachable portions or changing summed source duration; vertical impossibility is explicitly blocked without movement loops or unreachable chalk.
- Completed chalk persists during later moves; seeking reproduces geometry and chalk deterministically. Source JSON and board transforms remain unchanged. Invalid import/config changes remain atomic.
- Curved outlines are closed, finite, tapered and non-mutating. Skin and tool follow the original joint/endpoint geometry.
- All five original Drawing Arm module blob hashes verify unchanged. All 15 original engine/renderer tests pass.
- Standalone build and JavaScript syntax checks pass. Default and four-frame motion evidence generated through the adapter and original renderer; rasterized evidence inspected visually.

Outstanding:

- Authorized browser-control tools are unavailable. Optional browser smoke tests were updated for the compact tool, initially collapsed panel, horizontal movement, curved arm, sliders, JSON import/export and responsive layout, but remain unrun. Actual browser interactions/layout require verification before accepting draft PR #11.
- `standalone.html` is the local-file preview; no hosted preview or deployment is claimed.

Scope stays in `prototypes/professor-stick-figure/`. Drawing Arm, original writing JSON, engine lock, homepage, production routes and hosting/workflow configuration are unchanged. The B1.1 comparison SVG is replaced by `motion.svg` to reflect the new behavior. No merge or deployment.

B1.3 regressions: every sampled writing target lies 18%–82% of reach ahead of the shoulder across default and scaled/adjusted bodies. A reachable backward target triggers a chalk-lifted leftward move before writing. Four nearby strokes share exactly one reposition and one stance. Already comfortable clusters require no moves. Source coordinates and prior hand-continuity/ground-contact/curve tests remain unchanged. No collision system, added joint restrictions or UI controls.
