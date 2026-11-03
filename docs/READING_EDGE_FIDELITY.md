# Reading Edge demo — fidelity requirements

**Status: paused; the unapproved prototype was removed from the current homepage and source.** This document replaces an incorrect conceptual word-picker UI suggested on November 2, 2026. That sketch was **not** Reading Edge and must never serve as the design reference.

## Authoritative references

1. Original source: [ccosse/readingedge](https://github.com/ccosse/readingedge), especially [src/pages/MyAssignment.vue](https://github.com/ccosse/readingedge/blob/master/src/pages/MyAssignment.vue), [src/components/MyText.vue](https://github.com/ccosse/readingedge/blob/master/src/components/MyText.vue), and the relevant data/store/UI components.
2. Owner's written description and photos: [ccosse/ccosse.github.io README](https://github.com/ccosse/ccosse.github.io/blob/main/README.md).
3. Owner's [Reading Edge whitepaper](https://github.com/ccosse/ccosse.github.io/blob/main/whitepaper.md) (September 24, 2023).
4. Owner-linked [YouTube demonstration](https://youtu.be/JbOJ6Jzabic).
5. Current public [Reading Edge site](https://www.readingedge.org/).

**Video verification:** The video link was located in the original README, but its playback has not yet been directly reviewed. Do not claim visual fidelity to the recording until inspected and compared.

## Non-negotiable exercise sequence

- **Stage 1: Read.** Present a full, readable source paragraph together with relevant imagery. Let the learner read carefully before proceeding.
- **Stage 2: Reconstruct the *same* paragraph.** Retain the continuous paragraph in its original word order, randomly replace a configurable share of words (roughly 15–20% in the whitepaper) with clickable `[choose]` placeholders.
- **Word selection is in place.** Clicking a placeholder opens the established multiple-choice selection UI. It is **not** a loose word-bank/sentence-reordering exercise.
- **Context matters.** Retain case, punctuation, grammatical context and close-reading accountability. Preserve the intended interaction and distinctions in the original code.
- **All-or-nothing validation.** Check every replaced word against the original. A complete correct reconstruction earns points equal to the number of replaced words; **do not award partial points**.
- **Repeat on failure.** According to the whitepaper, on an incorrect reconstruction the same source paragraph is presented again with a newly randomized selection of replaced words; proceed to another passage only after successful reconstruction.
- **Feedback and continuation.** Preserve the original success/failure feedback and navigation, including audio/voice and points where applicable. The existing demo has a replace-percentage control, an image-cycle control and a TTS toggle; inspect and faithfully translate any controls actually intended for the new homepage.
- **Images and Wikipedia context.** The original can use Wikipedia article summaries and multiple associated images, emphasizing interest and curiosity. The proposed homepage example is curated and canned, so it must not require Wikipedia availability at runtime. Retain appropriate source/credit links and media license obligations.

## Original technical detail observed

The original `MyAssignment.vue` renders its paragraph into `#slideTextDiv`, uses `[choose]` markers and a `q-option-group` dialog for replacement choices, compares `store.words` and `store.answers`, and tracks `store.points`. The original `MyText.vue` contains a related, earlier reconstruction mechanism. Reference the written whitepaper where implementations or branches differ; confirm the real behavior before porting.

## Scope of homepage integration

- Reuse/port *existing logic* into a self-contained Vue 3 island in the new Astro website. The demo should not duplicate unnecessary Firebase/teacher/student features or alter the original repositories.
- Do not silently reinterpret the game, scoring, failure behavior, or UI interaction for convenience.
- Implement test fixtures to verify unchanged-word order, missing word choice logic, exact reconstruction matching, success/failure behavior, point awards and replay behavior.
- Validate visually against original screenshots and the YouTube demonstration **before** publishing the interactive demo.
- The eventual separate Reading Edge rewrite will also use the core exercise as its reference.

**Current status:** No Reading Edge implementation is present on the homepage. The previously invented component was deleted in commit 26292cf; its history remains in Git. A future faithful port should begin with the original source, whitepaper, and video, and only proceed after owner review.
