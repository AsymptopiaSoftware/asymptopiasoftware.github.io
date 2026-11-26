# Music Buddy — CHANGES

Newest first. Earlier command-line milestones are reconstructed from our development discussions; they are not a verified release-tag history.

## 2026-11-26 — Consistent icon toggles
- Loop, Arrows, Octaves and Descriptions now share an icon-button convention: highlighted when on, muted when off.
- Controls retain their previous positions and musical behavior, with hover tooltips and pressed-state accessibility labels.

## 2026-11-26 — Major, minor, and blues CH modes for all journeys
- Enabled the original major, minor and blues Cosmic Harmony node grammars, including their distinct sun qualities and moon placements.
- Home and Standards use the major graph; Minor uses the minor graph; Blues uses the blues graph.
- Chromatic and Tritone select the appropriate graph tonic per phrase as their tonal centers shift. The journey key dropdown remains the overall transposition control.
- Display current CH mode and tonic in the graph header.
- Preserve target, live You played, mouseover preview, and arrow toggle; paths in multi-center journeys are drawn within the active phrase.
- Only exact matches are highlighted. Minor seventh tonic chords are not falsely identified with the original minor graph's tonic triad.

## 2026-11-26 — Compact matched practice and MIDI panels
- Place live Ex / You and MIDI connection in separate, equal-height rounded panels.
- Replace Start/Pause, Repeat prompt, Restart journey, and MIDI rescan text buttons with accessible icons and tooltips.
- Move the Loop toggle beside the practice controls; keep the same looping behavior.
- Remove the visible “Select a MIDI input, then start” prompt without discarding screen-reader status updates.
- Keep the MIDI, journey, and Cosmic Harmony logic unchanged.

## 2026-11-26 — Transient journey chord preview
- Hover or keyboard-focus any journey chord to preview its exact CH node(s) in purple.
- Remove the preview when the pointer or focus leaves; no click-to-unhighlight mechanism.
- Keep the current journey target, live MIDI recognition, and arrow state independent.
- Do not invent highlights when a borrowed chord has no exact node in the selected graph.

## 2026-11-26 — Cosmic Harmony journey arrows
- Draw the ordered Standards journey across exact CH nodes, using the existing CH-style curved arrows.
- Arrows are visible by default, with an independent show/hide checkbox in the CH header.
- Show earlier, current, and future transitions distinctly and offset repeated edges.
- Preserve gaps at chords with no exact node rather than inventing a connection.
- Target and You played highlights remain independent of arrow visibility.

## 2026-11-26 — Cosmic Harmony mapping (Standards first)
- Integrated a major-mode Cosmic Harmony diagram based on the original d3SRT sun, planet, and moon definitions.
- Place the diagram to the left of the Standards journey.
- Follow the current journey chord and independently highlight the chord recognized from live MIDI.
- Match pitch class and chord quality exactly; indicate when a chord is not represented by a node.
- The graph follows key transposition; it does not open a second MIDI listener.
- Other journeys, minor/blues graph modes, graph-driven exploration, and the Circle of Fifths sidebar remain for subsequent integration.

## 2026-11-26 — Web UI refinements
- Key selector: emphasize the seven priority jam keys with bold text instead of stars.
- Simplify the page heading and practice instructions; remove promotional wording.
- Describe the application's vibe-coded development and its roughly twenty years of sight-reading-trainer predecessors.
- Keep phrase descriptions under their own headings, hidden by default behind a Descriptions toggle.
- Reserve a right-side workspace pane for the actual Cosmic Harmony planetary graph; do not replace it with a fake diagram.
- Add this chronological CHANGES record to About this release.

## 2026-11-26 — Factbook 0.1
- Added a separate-tab help/reference page containing only recently requested relationships and glossary entries.

## 2026-11-25 — Music Buddy Web 0.1
- Implemented browser Web MIDI, spoken chord-name prompts, six journeys, chord checking, transposition and names/numbers display.
- Brought the live Ex / You chord feedback to the browser.
- Published the development build through the Asymptopia Software GitHub Pages workflow; preserved d3SRT's earlier repositories and URLs.

## 2026-11-25 — Command-line tritone journey
- Added ordinary ii–V–I and tritone-substituted versions across several target keys.

## 2026-11-24 — Command-line live chord feedback
- Added single-line Ex / You display showing suggested voicing and actual played notes.
- Showed the identified chord even when practicing earlier chords outside the current exercise step.
- Added optional octave numbers, off by default.
- Adopted jazz chord notation (-7, 7, M7) for chord labels and Roman-numeral displays.
- Added interactive MIDI scanning/selection, startup settings, reusable key/journey menus, and consistent Esc/Home/Q navigation.
- Noted possible future partial-chord interpretations and a miniature staff; not implemented.

## 2026-11-22–23 — Command-line interface and exercise evolution
- Added a curses interface with grouped journey phrases, active-chord highlighting and descriptions.
- Added interactive journey and key selection, a highlighted seven-key practice focus, and transposition.
- Improved chord recognition so the next step could listen without waiting for complete key release.
- Added longer harmonic journeys: Home, Standards, Minor, Blues and Chromatic.
- Changed speech from eSpeak to a local Piper option, with pre-generated prompts and persistent audio playback.
- Added repeated practice loops and discussed a repeat-by-default menu.

## 2026-11-20 — Original command-line Music Buddy (Ear & Hands)
- Began as a small Python program using mido / python-rtmidi.
- Spoke chord **names**, listened for the notes on a MIDI keyboard, accepted inversions and advanced through a predefined chord sequence.
- This was a focused practice experiment, not a complete sight-reading or Cosmic Harmony interface.

## Before Music Buddy — prior work
- MusicTeX/LaTeX music flashcards and the older Java SightReadingTrainer.
- d3 Sight Reading Trainer, later incorporating interactive staff, piano/fretboard, MIDI and recording ideas.
- Randy Halberstadt's harmonic approach and the subsequent Cosmic Harmony / Cosmic Challenge exploration.

These earlier applications are predecessors, not obsolete files to overwrite. Music Buddy draws selectively on their ideas.
