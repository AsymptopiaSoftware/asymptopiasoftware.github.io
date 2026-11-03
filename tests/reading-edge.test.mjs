import test from 'node:test';
import assert from 'node:assert/strict';
import {
  tokenizeParagraph, chooseMissingTokens, choicesForPlaceholder,
  checkReconstruction, pointsForReconstruction
} from '../src/lib/reading-edge.js';

const text = 'Boeing tested the Dash 80. It flew in 1954, with four jet engines.';
const tokens = tokenizeParagraph(text);
const ids = tokens.filter(t => t.isWord).map(t => t.id);

test('tokenization preserves the entire paragraph, word order, case and punctuation', () => {
  assert.equal(tokens.map(t => t.value).join(''), text);
  assert.ok(tokens.some(t => t.value === '80.'));
  assert.ok(tokens.some(t => t.value === '1954,'));
  assert.ok(tokens.some(t => !t.isWord));
});

test('missing tokens use in-place positions with configurable percentage', () => {
  const missing = chooseMissingTokens(tokens, 20, [], () => 0.61);
  assert.equal(missing.length, Math.round(ids.length * .2));
  assert.ok(missing.every(id => ids.includes(id)));
  assert.deepEqual(missing, [...missing].sort((a, b) => a - b));
});

test('retry always selects a fresh set of missing positions when possible', () => {
  const previous = chooseMissingTokens(tokens, 20, [], () => 0);
  const next = chooseMissingTokens(tokens, 20, previous, () => 0);
  assert.notDeepEqual(next, previous);
  assert.equal(next.length, previous.length);
});

test('word dialog offers the exact original word and four unique distractors', () => {
  const missing = ids.slice(0, 7);
  const target = missing[2];
  const choices = choicesForPlaceholder(tokens, missing, target, () => 0.42);
  assert.ok(choices.includes(tokens[target].value));
  assert.equal(new Set(choices).size, choices.length);
  assert.equal(choices.length, 5);
});

test('correct reconstruction earns one point per missing word, never partial credit', () => {
  const missing = ids.slice(2, 6);
  const answers = Object.fromEntries(missing.map(id => [id, tokens[id].value]));
  assert.equal(checkReconstruction(tokens, missing, answers), true);
  assert.equal(pointsForReconstruction(missing, true), missing.length);
  answers[missing[0]] = 'WRONG';
  assert.equal(checkReconstruction(tokens, missing, answers), false);
  assert.equal(pointsForReconstruction(missing, false), 0);
});

test('empty answers are not counted as a completed reconstruction', () => {
  assert.equal(checkReconstruction(tokens, ids.slice(0, 2), {}), false);
  assert.equal(checkReconstruction(tokens, [], {}), false);
});
