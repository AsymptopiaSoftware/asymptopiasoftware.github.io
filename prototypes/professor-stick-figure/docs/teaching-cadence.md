# B1.8 teaching cadence

Baseline: B1.7 commit `7f143423c8a3a5852d43a1f4dda08464b008a1f4`. Work lives on `feature/professor-b1.8-teaching-cadence`; B1.7 is unchanged.

## Data flow

The exact solver emits structured steps with an equation and operation/explanation. The existing math adapter records each step's source `at`/`end`, index, text and operation in timeline `mathSteps`. Layout remains in `math-layout`. Neither math package knows about cadence or the figure.

`teachingPlan(baseSpatialPlan, mathSteps)` in `src/teaching.js` copies the B1.5/B1.4 spatial plan and inserts a 450 ms lowering, 1500 ms relaxed hold and (except after the final line) 450 ms return to the previous writing pose. It replaces the source inter-line gap, avoiding a second unexplained pause. Each boundary comes from structured step times and must match complete planned lines; displayed text and stroke counts are not used to discover boundaries. Blocked spatial pieces retain lifted-chalk behavior. Free-writing and legacy timelines without structured steps keep their existing playback.

The relaxed target is relative to shoulder and anatomical arm reach (10% forward, 92% down). The original IK computes that pose and respects existing joint limits; no limbs stretch and no fixed pixel pose is introduced. Curved skin continues to render the skeletal joints. No gait, range-planning, glyph, solver, layout or Drawing Arm source changes.

`ProfessorFigure` installs this augmented plan before changing its visible state, including on body-rig edits. Stroke writers get shifted playback start times; source times, points and durations are unchanged. The final arm remains lowered with both feet grounded.

## Deterministic sampling and transport

`sampleTeaching(plan, time)` reconstructs the same chalk, body/arm pose, current step and explanation independently of earlier frames. Each teaching step exposes `start`, `complete`, `gate` (lowering finished), `resume` (hold finished), `final` and the original operation. No history of visited steps or permanently drawn chalk is accumulated.

`advanceTeaching(plan, time, elapsed, mode)` is a pure transport helper. In Auto, time advances normally. In Step, even an oversized elapsed time stops at the first non-final gate. Continue jumps to that gate's `resume` and starts playback; the arm returns smoothly before any further writing. Each subsequent gate must be released separately. The final solution settles and finishes without requiring another Continue.

Seeking is explicit: it can inspect any time, including beyond gates. Seeking backward restores earlier chalk/explanation and arms the earlier gates again. Seeking into a relaxed hold enables Continue in Step mode. Play at a gate cannot silently bypass it. Auto selected at a waiting gate resumes playback. Reset returns to time zero and pauses, retaining the selected mode. Speed scales the entire animation clock, including rests (1500 ms at 1×).

Only two controls are added in the existing sidebar: Auto/Step and Continue. Continue is disabled except at a non-final relaxed hold in Step mode. Explanations are copied from the solver and updated for the equation currently being written, remaining visible throughout its pause. Advanced / Body Rig stays collapsed by default.

## Validation

Six cadence tests cover structured boundaries, preservation of every writing/movement phase, lowered arm and still/planted pauses, oversized frame gates, Auto, backward/forward reconstruction and atomic invalid imports. Existing 71 tests remain, for 77 total. Browser tests exercise Auto/Step, Continue, Pause/Reset, seeking and explanations in modular and self-contained previews, alongside existing walking, fraction-bar, generation, import/export and responsive checks.
