# Provenance and license

The generation algorithm is a modern rewrite of the fraction-toggle-OFF branch of `generate_fractions()` in Charles B. Cossé's Asymptopia Math Crossword Builder:

- Source: https://github.com/ccosse/crosswordbuilder/blob/master/jsrc/config_table_stuff.js
- Inspected source Git blob: `79084f60b04154a6cb2ddcaf0bc568e0da3f6443`
- Original notice: Copyright (C) 2001–2010 Asymptopia Software. Author: Charles B. Cossé. License: GNU Public License (GPL).

Preserved algorithm: draw two nonzero integer fractions, choose addition/subtraction/multiplication, calculate and reduce the result, then hide exactly one of `a`, `b`, `c`, `d`, `e`, `f` in `a/d op b/e = c/f`.

Modernization removes DOM/global state, floating-point fraction arithmetic, descending-factor searches, answer-word lookup, unbounded retries and ambient randomness. It adds BigInt rationals, Euclidean GCD, deterministic seeding, structured syntax, exact solving, domain restrictions and independent verification. Sampling uses an inclusive bounded integer range; signed answers are retained instead of the original 0…99 answer-word filter. The equation solver and step verifier are new code.

This standalone modernization is distributed under GPL-2.0-or-later; the GPL v2 text is included in LICENSE. Preserve this notice and the license when reusing the package. It has no Drawing Arm, Professor, DOM or rendering dependency.
