// Curated, bounded fraction equations for the silent homepage Professor.
// Every entry is an exact-rational, uniquely solvable equation in x.
export const PROFESSOR_PROBLEMS = Object.freeze([
  "x/2-1/2=1/2",
  "x/3-1/3=2/3",
  "x/4-1/4=2/4",
  "x/5-2/5=1/5",
  "x/6-1/6=3/6",
  "x/7-2/7=3/7",
  "x/8-3/8=2/8",
  "x/9-2/9=4/9",
  "x/5-4/4=2/5",
  "x/3-2/3=1/3",
  "x/4+1/4=3/4",
  "x/5+1/5=4/5",
  "x/6+2/6=5/6",
  "x/7+1/7=5/7",
  "x/8+3/8=6/8",
  "x/9+2/9=7/9",
  "x/3+1/3=2/3",
  "x/4+2/4=4/4",
  "x/5+2/5=3/5",
  "x/6+1/6=4/6",
  "x/2+1/4=3/4",
  "x/3+1/6=3/6",
  "x/4-1/2=1/4",
  "x/5+1/5=3/5",
  "x/6-2/3=1/6",
  "x/7-1/7=4/7",
  "x/8-1/4=3/8",
  "x/9-1/3=2/9",
  "x/5-2/5=2/5",
  "x/6+3/6=5/6"
])

/** Pick another curated problem without immediately repeating the previous one. */
export function chooseProfessorProblem(previous, random = Math.random) {
  const choices = PROFESSOR_PROBLEMS.filter(problem => problem !== previous)
  const index = Math.min(choices.length - 1, Math.max(0, Math.floor(random() * choices.length)))
  return choices[index]
}
