# Asymptopia math problems — independent ES module

Dependency-free seeded fraction-equation generator and exact step-by-step solver. Runs in Node or a browser, with no Professor, SVG, Drawing Arm, timeline or clock dependency. GPL-2.0-or-later; see [NOTICE](NOTICE.md) for the original `ccosse/crosswordbuilder` algorithm and attribution.

```js
import { generateProblem, solveEquation, verifySolution } from './src/index.js';
const problem = generateProblem({ seed: 'lesson-42', operator: '-', missingSlot: 'a' });
const result = solveEquation('x/5-4/4=2/5');
console.log(result.steps.map(s => s.text));
// x/5-4/4=2/5
// x/5=2/5+4/4
// x/5=7/5
// x=7
console.log(result.solutions); // [{ numerator: '7', denominator: '1' }]
console.log(verifySolution(result).valid); // true
```

## Public interface

- `Rational(numerator, denominator=1)`: immutable normalized BigInt arithmetic. Inputs are BigInt, safe integer numbers or signed decimal strings (≤128 digits). `add`, `sub`, `mul`, `div`, `neg`, `equals`, `toString`, `toJSON`. Denominators are positive; zero is `0/1`. Division by zero and unsafe/decimal Number inputs throw `MathProblemError`.
- `parseEquation(text)`, `validateEquation(textOrAST)`, `formatEquation(ast)`, `evaluateExpression(expression, xValue)`: explicit expression parser, not eval. Supports integers, lowercase `x`, unary signs, parentheses, `+ - * /`, and one equality. Unicode minus/multiply/divide normalize to ASCII operators. No implicit multiplication, decimal approximations or exponent syntax.
- `solveEquation(textOrAST)`: returns the result described below. Invalid/unsupported input returns an explicit status/error rather than a guessed answer.
- `verifySolution(result)`: recomputes exact solution sets, original domain restrictions, every step's operation/operand and final substitution. It does not trust cached verification flags or displayed strings.
- `generateProblem(options)`: one deterministic problem.
- `generateProblems({count=3,...options})`: sequence from one seeded stream.
- `createProblemGenerator(options)`: stateful `next()` closure for applications that request problems incrementally.

Generation options: `seed` (finite number or string, default 0), inclusive safe integer `min=1`, `max=9` within ±1,000,000, optional `operator` in `+ - *`, optional `missingSlot` in `a b c d e f`, and bounded `maxAttempts=500` (1…10000). Input zero is excluded from the four sampled integers; cancellation can produce a zero result numerator. Every candidate is independently solved and verified, and ambiguous choices (e.g. hiding the denominator of `0/f=0`) are retried. Impossible constraints fail with `GENERATION_EXHAUSTED`. No hidden clock/random source affects seeded output. PRNG uses integer state with a normalized 32-bit draw only for selection; fraction arithmetic uses BigInt exclusively.

The six slots follow the original `a/d op b/e = c/f` convention. The RHS is reduced before a slot is hidden. Generated records include the equation AST/text, operator, missing slot, exact answer, completed six integers and validation results. The answer may be negative or zero. The supplied seed produces the same sequence in Node and modern browsers.

## Structured result and steps

```js
{
  version: 1,
  status: 'unique',
  equation: { type: 'equation', left: /* expression */, right: /* expression */ },
  domain: [ /* original nonzero denominator expressions and polynomial certificates */ ],
  solutions: [{ numerator: '7', denominator: '1' }],
  steps: [{
    index: 1,
    equation: /* equation AST */,
    text: 'x/5=2/5+4/4',
    operation: {
      kind: 'add-both-sides',
      operand: /* 4/4 expression AST */,
      conditions: [],
      explanation: 'Add 4/4 to both sides.'
    }
  }],
  verification: { valid: true, method: '...', steps: /* per-step exact checks */, substitution: /* exact checks */ }
}
```

Expression nodes are `{type:'integer',value:'5'}`, `{type:'variable',name:'x'}`, `{type:'negate',operand}`, and `{type:'binary',op,left,right}`. All public records serialize to JSON without BigInt values. Each step includes the complete equation, an operation kind/operand, explanatory text, nonzero conditions where needed, and an exact calculation record when simplification is combined with isolation.

Statuses:

| Status | Meaning |
| --- | --- |
| `unique` | One exact rational solution, fully isolated and verified |
| `none` | No solution in the original denominator domain |
| `infinite` | Identity for all rational values permitted by the original domain |
| `multiple` | More than one exact rational solution; no false single answer |
| `invalid` | Syntax, missing unknown, identically zero denominator or invalid AST |
| `unsupported` | Outside implemented algebraic scope, e.g. irrational roots or degree >2 |

The generated six-slot family has at most one occurrence of x and solves by inverse operations, including unknown denominators and either side of the equality. Repeated-x affine equations are supported by collecting terms. Rational-root quadratics are classified exactly; higher-degree/irrational-root equations are explicitly unsupported. The intended solution domain is rational numbers. Limits are 2048 input characters, 256 tokens/nodes, nesting 48, polynomial degree 8 and isolation 64 operations. These are resource/scope limits, not floating-point tolerances.

## Verification

Expressions become exact polynomial rational functions. Each original denominator contributes a nonzero restriction. Cross-multiplication roots are filtered through those restrictions and then substituted into the **original** expressions. Each transformation is checked for equal solution sets under the carried original domain; inverse-operation metadata is also checked algebraically. This rejects `0/x=1`'s extraneous x=0, preserves `x/x=1`'s x≠0 domain, and distinguishes no-solution from ambiguous identities. Unknown nonlinear domain sets are not silently asserted equivalent.

Run `npm test` in this directory. Tests cover independent integer cross-product identities, large exact values, requested four-step output, signs/reduction, all operators × all six slots × 16 seeds, domain/cancellation cases, invalid/ambiguous input, tamper detection, JSON AST round trips and deterministic sequences.
