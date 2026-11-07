# B1.9.2 — exact algebra and written multiplication dots

The reported `1/4-7/x=-5/8` problem now has an explicitly balanced sign-change presentation and the verified final answer **x=8**. The previous exact solver also returned 8, but canceled the left-side factor immediately while displaying multiplication only on the right. The revised line visibly contains multiplication on **both sides**, followed by a separate simplification:

```
1/4-7/x=-5/8
-(7/x)=-5/8-1/4
-(7/x)=-7/8
-(7/x)*(-1)=-7/8*(-1)
7/x=7/8
x=8
```

These are canonical parser strings. On the board every `/` becomes a stacked fraction and every `*` becomes `·`. The last operation's certificate explicitly multiplies both sides by nonzero x, divides both sides by nonzero 7/8, simplifies and swaps to put x first. Its sidebar/spoken explanation names those same operations. Every step preserves the original x≠0 restriction.

## Before a candidate becomes a step

`math-problems/src/operations.js` derives each operation's effect, transformed equation(s), changed/simplified sides, nonzero conditions and explanation. Simple operations are checked against **both** previous expressions using exact rational-function cross-polynomials; simplification must preserve each affected expression. Denominator isolation provides three full-equation transformation records. The solver checks exact solution-set equivalence under original denominator restrictions, then appends the candidate. Failure produces an invalid result with no usable steps. `verifySolution()` independently repeats this work and final substitution; cached verification flags cannot authorize a step.

A change that happens to retain the same final root is insufficient if it does not implement the claimed operation. Explanation text must equal the text derived from operation metadata. Side-effect audio code receives that validated text, not a separately authored algebra narrative.

## Before writing or speaking a lesson

`solutionToTimeline()` re-verifies the complete solution before layout. The resulting engine-v1 timeline contains `math.version:2`, the full solution certificate, and layout/timing options. `validateMathTimeline()` runs at the UI load/import boundary before `ProfessorFigure.setTimeline()`. It repeats mathematical verification, regenerates the expected instructions, and compares board coordinates, stroke geometry/timing, equation/operation metadata and layout. It also rejects mathematical narration overrides that differ from the next verified explanation. No invalid candidate can enter the UI's writing or speech sequence through a cached `valid:true` flag or altered import.

This certificate requirement applies to mathematical lessons. Free-writing JSON remains a generic drawing interface and does not claim mathematical validation. Older math exports without the new certificate are rejected with a message to solve their original equation again. The original Drawing Arm schema/algorithms remain v1 and can ignore all certificate metadata.

## Multiplication dot

Math layout emits `·` on the mathematical axis with .3-em cell spacing. Drawing Arm's font writes it using one small closed stroke (about .1 em across). Legacy `*`/`×` text inputs use the same dot; lowercase x and baseline decimal points remain different glyphs. The math adapter gives the dot at least 80 ms of contact, followed by the normal lift. No static operator elements or extra drawing pipeline are used. Existing stacked bars, explicit baselines, clear operator gaps and aligned equals columns remain.

## Regression and preview

Select **Regression: 1/4-7/x=-5/8** in the existing Problem selector. Auto/Step, Continue, seeking, speaking, turns/gestures, walking and reaching keep their previous behavior. Only the verified operation text changes; longer explanations naturally take longer to present. The source for those character/transport modules is unchanged.

- `math-problems/tests/step-validation.test.js`: exact x=8 answer, explicit both-side -1 products, separate simplification, normalized cross-polynomial equality, exact witnesses, same-root/one-sided tamper rejection, canonical explanation/certificate validation.
- `math-layout/tests/multiplication.test.js`: small centered dot, spacing, multiplication aliases, distinction from decimal/variable, aligned fraction rows.
- `tests/math-safety.test.js`: timed partial/complete dot strokes, zero blocked writing, matching presentation explanations, rejection of altered proof/text/narration/geometry, valid JSON round trips.
- Browser checks select the regression in both previews, inspect progressive dots and captions, seek to x=8 and reject a tampered import without replacing the chalkboard. Existing speech lifecycle checks still pass.

97 automated tests pass (15 math, 12 layout, 55 Professor, 15 Drawing Arm). Chromium has no installed speech voices; native fallback and controlled speech lifecycle are verified, while audible voice quality remains unverified. The standalone HTML is tested over localhost because managed Chrome blocks file URLs. No environment setup, merge or deployment.
