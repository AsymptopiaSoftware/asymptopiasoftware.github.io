import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../public/musicbuddy/music.js', import.meta.url), 'utf8');
const api = new Function(source.replace(/^import .*\n/m, '').replace(/\binit\(\);\s*$/, '') +
  '\nreturn { JOURNEYS, state, sequence, pitches, split, bestVoicing, numeralRows, identify };')();

test('Music Buddy journeys and transpositions remain valid in all twelve keys', () => {
  const keys = ['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B'];
  for (const [id, journey] of Object.entries(api.JOURNEYS)) {
    api.state.journey = id;
    for (const key of keys) {
      api.state.key = key;
      const sequence = api.sequence();
      assert.equal(sequence.length, journey.phrases.reduce((n, p) => n + p[0], 0), id + ':' + key);
      assert.equal(sequence.length, api.numeralRows().length, id + ': numeral count');
      for (const chord of sequence) {
        assert.ok(api.pitches(chord).length >= 3, chord);
        assert.equal(api.bestVoicing(chord, null).length, api.pitches(chord).length, chord);
      }
    }
  }
});

test('Chord identity is independent of inversion', () => {
  api.state.journey='standards'; api.state.key='Bb';api.state.index=0;
  assert.equal(api.identify([58,62,65,69]), 'B♭M7');
  assert.equal(api.identify([69,58,62,65]), 'B♭M7');
});

test('Three-note shells are not mislabeled as full seventh chords', () => {
  api.state.journey='standards'; api.state.key='Bb';api.state.index=0;
  assert.equal(api.identify([59,65,69]), '?');
});
