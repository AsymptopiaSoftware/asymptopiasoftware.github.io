# Validation and review

Automated: `npm test` — 19 passing tests (4 Professor tests and 15 unchanged upstream engine/renderer tests). Standalone generation and JavaScript syntax checks pass. Vendored engine files and source artwork compared byte-for-byte with their pinned origins.

Visual evidence: generated `writing.svg` and `reaction.svg` from the real Professor view with the XML DOM adapter. Rasterized with CairoSVG for PNG review. These establish deterministic frame appearance, not browser playback. The source artwork was separately rasterized and visually inspected before adaptation.

Browser status: not executed; the managed environment exposes no supported browser-control tool. Do not interpret the PNGs as browser screenshots. Draft PR retains this verification limitation.

Manual browser checklist (standalone.html, Chrome/Firefox):

- Starts paused; no network fetches required; no console errors.
- Play: walks right, turns, touches the board with chalk, writes 2+3=5, lifts chalk between strokes, reacts, walks left and stops.
- Pause freezes all layers. Resume continues without jumping. Reset clears all chalk and returns to the starting pose.
- Seek forward/back through writing, reaction, return and start. Marks match lesson time; the writing limb is absent outside the writing phase.
- Half and double tempo alter the entire lesson consistently.
- Compact profile reloads with changed body and arm proportions, preserving the same JSON targets and full reachable equation.
- Keyboard controls and visible focus work; narrow screens retain all controls and a readable scene.

The two-dimensional turn, added foot accents and clipped writing flipper are prototype animation techniques; owner visual fidelity review remains necessary.
