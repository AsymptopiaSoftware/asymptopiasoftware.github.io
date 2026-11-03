import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (p) => readFileSync(new URL(p, import.meta.url), 'utf8');
const page = read('../src/components/slotmachine/original/IndexPage.vue');
const stage = read('../src/components/slotmachine/original/StageComponent.vue');
const reel = read('../src/components/slotmachine/original/ReelComponent.vue');
const controls = read('../src/components/slotmachine/original/ControlsComponent.vue');
test('seven reels, twenty panes each and original offset', () => {
  assert.match(page, /const offset = 3/);
  assert.match(page, /:t360="5"/);
  assert.equal((stage.match(/<ReelComponent/g) || []).length, 7);
  assert.equal((stage.match(/:numpanes="20"/g) || []).length, 7);
  assert.equal((reel.match(/\.pane:nth-child\(/g) || []).length, 20);
});
test('clock timing, numeric results and confetti remain original', () => {
  assert.match(controls, /this\.msPerTab\*10/);
  assert.match(controls, /this\.stop\(\)/);
  assert.match(controls, /this\.startNumbers\[6\]/);
  assert.match(controls, /this\.explode\(\)/);
  assert.match(controls, /timerLabel/);
  assert.match(controls, /resultsLabel/);
});

test('reel data, positions, callbacks and original symbols', () => {
  assert.equal((page.match(/reelImgs\.slice\(offset\*\d,20\)/g) || []).length, 7);
  assert.equal((reel.match(/#reelcontainer\d+\s*\{/g) || []).length, 7);
  assert.equal((controls.match(/d3\.select\("#reel\d+"\)/g) || []).length, 14);
  assert.equal((page.match(/'\/images\/slot\//g) || []).length, 20);
  assert.equal((controls.match(/this\.explode\(\)/g) || []).length, 1);
});
