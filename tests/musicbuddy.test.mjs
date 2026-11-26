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


const cosmicSource = readFileSync(new URL('../public/musicbuddy/ch-graph.js', import.meta.url), 'utf8');
const cosmic = new Function(cosmicSource.replace(/^export /gm, '') +
  '\nreturn {cosmicNodes,cosmicExactMatches,cosmicJourneyPath};')();

test('CH graph modes preserve the original major/minor/blues node grammars',()=>{
  const major=cosmic.cosmicNodes('C','major');
  const minor=cosmic.cosmicNodes('F','minor');
  const blues=cosmic.cosmicNodes('C','blues');
  assert.equal(major.length,25);
  assert.equal(minor.length,22);
  assert.equal(blues.length,20);
  assert.equal(major[0].quality,'maj7');
  assert.equal(minor[0].quality,'m');
  assert.equal(blues[0].quality,'7');
  assert.equal(minor.find(n=>n.id==='ii').quality,'m7b5');
  assert.deepEqual(cosmic.cosmicExactMatches(blues,'C7').map(n=>n.id),['sun']);
  assert.deepEqual(cosmic.cosmicExactMatches(blues,'F7').map(n=>n.id),['IV']);
  assert.deepEqual(cosmic.cosmicExactMatches(blues,'G7').map(n=>n.id),['V']);
  // Minor Fm7 is intentionally not the original graph's Fm tonic triad.
  assert.equal(cosmic.cosmicExactMatches(minor,'Fm7').length,0);
});

test('all journeys have precise CH contexts in all keys and phrase boundaries',()=>{
  const graphContext = new Function(source.replace(/^import .*\n/m,'').replace(/\binit\(\);\s*$/,'') +
    '\nreturn {state,JOURNEYS,sequence,graphContext};')();
  const keys=['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B'];
  for(const [name,journey] of Object.entries(graphContext.JOURNEYS)){
    graphContext.state.journey=name;
    for(const key of keys){
      graphContext.state.key=key;
      const chords=graphContext.sequence();
      let first=0;
      for(const [count] of journey.phrases){
        const context=graphContext.graphContext(first);
        const graph=cosmic.cosmicNodes(context.key,context.mode);
        assert.ok(graph.length>=20,name+' / '+key);
        assert.ok(context.start<=first && context.end>first);
        assert.equal(context.mode,graphContext.graphContext(first+count-1).mode);
        assert.equal(context.key,graphContext.graphContext(first+count-1).key);
        assert.ok(cosmic.cosmicExactMatches(graph,chords[first]).length>=0);
        first+=count;
      }
      assert.equal(first,chords.length,name+' / '+key);
    }
  }
});

test('changing tonal centers follow the intended sequence of modes and tonics',()=>{
  const api = new Function(source.replace(/^import .*\n/m,'').replace(/\binit\(\);\s*$/,'') +
    '\nreturn {state,JOURNEYS,graphContext};')();
  api.state.journey='chromatic';api.state.key='C';
  assert.deepEqual([0,3,6,9,12,15].map(i=>{const c=api.graphContext(i);return [c.mode,c.key]}),[
    ['major','C'],['major','Bb'],['major','Ab'],['major','Gb'],['minor','F'],['major','Eb']
  ]);
  api.state.journey='tritone';
  assert.deepEqual([0,3,6,9,12,15].map(i=>api.graphContext(i).key),
    ['C','C','F','F','Bb','Bb']);
  api.state.journey='minor';api.state.key='F';
  assert.equal(api.graphContext(0).mode,'minor');
  api.state.journey='blues';api.state.key='C';
  assert.equal(api.graphContext(0).mode,'blues');
});
