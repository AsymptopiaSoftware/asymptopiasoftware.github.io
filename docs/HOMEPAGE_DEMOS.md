# Interactive homepage demos

The Astro homepage contains two Vue islands, deliberately separate from the original `ccosse` projects and from any server/database.

## WELCOME slot machine

Files: `src/components/WelcomeSlots.vue`, `src/content/demos.json`, and four images under `public/images/slot/`.

The original [ccosse/slotmachine](https://github.com/ccosse/slotmachine) contributed the slot reel concept and the original fruit artwork. The new component uses responsive seven-letter reels to spell WELCOME. A spin runs automatically for visitors unless they prefer reduced motion, then the letters appear immediately. An accessible replay button is available. Results snap to the intended letters rather than relying on time-based angular estimates.

No third-party animation library, database, account, or advertising service is required.

## Reading Edge — faithful core exercise

Files: `src/components/ReadingEdgeDemo.vue`, `src/lib/reading-edge.js`, `tests/reading-edge.test.mjs`, and `src/content/demos.json`.

The source of truth is [the original Reading Edge exercise](https://github.com/ccosse/readingedge/blob/master/src/pages/MyAssignment.vue) and [the owner's whitepaper](https://github.com/ccosse/ccosse.github.io/blob/main/whitepaper.md), not an invented word-bank puzzle.

1. Read the complete paragraph with an illustrative photograph.
2. See the same paragraph with a configurable percentage of words replaced by inline `[choose]` markers.
3. Click a marker to choose from a dialog of possible original words.
4. Check **all** missing words against the originals. Only a completely correct paragraph earns one point per replaced word.
5. An error keeps the learner on the same paragraph and lets them retry with freshly selected missing words.
6. Rotate through the example photographs, adjust difficulty, or optionally enable browser text-to-speech.

The first curated sample is the Boeing 367-80. Its paragraph is written for the demo from historical sources; it is **not** copied from Wikipedia. The photographs are external Wikimedia Commons images referenced in the original Reading Edge demonstration code, with visible attribution and source/license links. If the goal becomes full offline independence, copy approved appropriately licensed media into `public/images/reading-edge/` and update the JSON paths.

### Change the sample yourself

Edit `src/content/demos.json` in GitHub. The fields `welcome.letters`, `welcome.symbols`, `readingEdge.paragraph`, `readingEdge.missingPercent`, and `readingEdge.images` configure the two demos. Upload new graphics into `public/images/`, then change the image paths. Commit to trigger GitHub Pages.

### Status and test limitations

- GitHub Actions runs `npm test` for paragraph tokenization, random replacement selection, unchanged word order, exact answer matching, point awards, and all-or-nothing scoring.
- The Astro build and GitHub Pages deployment have passed.
- Visual behavior in a full browser could not be independently inspected in this environment. The [owner's YouTube demo](https://youtu.be/JbOJ6Jzabic) has not yet been played for side-by-side visual verification.
- The samples and layout are therefore **prototypes pending owner review**, not a claim of full original-application parity.
