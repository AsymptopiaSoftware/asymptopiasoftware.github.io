import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PROFESSOR_PROBLEMS} from '../prototypes/professor-stick-figure/src/homepage-problems.js';
const read = path => readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('curated Professor pool covers both fraction families',()=>{
  assert.equal(PROFESSOR_PROBLEMS.length,30);
  assert.ok(PROFESSOR_PROBLEMS.some(x=>x.includes('*')));
  assert.ok(PROFESSOR_PROBLEMS.some(x=>/\/[0-9]+\/[0-9]+/.test(x)));
  assert.ok(PROFESSOR_PROBLEMS.some(x=>x.includes('+')));
  assert.ok(PROFESSOR_PROBLEMS.some(x=>x.includes('-')));
});

test('dev homepage keeps public homepage separate and previews all projects as masked images',()=>{
  const dev=read('src/pages/dev/index.astro'),live=read('src/pages/index.astro');
  assert.match(dev,/ProfessorAutoDemo/);
  for(const name of ['glimpse--harmony','glimpse--tms','glimpse--d3plot'])assert.ok(dev.includes(name));
  assert.match(dev,/overflow:hidden/);
  assert.match(dev,/position:absolute/);
  assert.match(dev,/width:var\(--portal-width,210%\)/);
  assert.equal((dev.match(/class="portal-window"/g)||[]).length,3);
  assert.match(dev,/padding:12px/);
  assert.match(dev,/\.portal-window\s*\{[^}]*border-radius:20px/s);
  assert.match(dev,/PUBLIC_BUILD_NUMBER/);
  assert.match(dev,/siteVersion.*buildNumber/);
  assert.match(dev,/aspect-ratio:1000 \/ 154/);
  assert.doesNotMatch(live,/ProfessorAutoDemo|glimpse-viewport/);
});

test('portal compositions maintain inset mask, distinct offsets and no TMS zoom on small screens',()=>{
  const dev=read('src/pages/dev/index.astro');
  assert.match(dev,/\.glimpse--tms\{--portal-width:100%;--portal-x:50%;--portal-y:50%\}/);
  assert.match(dev,/\.glimpse--harmony\{--portal-width:185%;--portal-x:56%;--portal-y:50%\}/);
  assert.match(dev,/\.glimpse--d3plot\{--portal-width:175%;--portal-x:58%;--portal-y:56%\}/);
  assert.doesNotMatch(dev,/portal-window>img\{width:max/);
  assert.match(dev,/\.portal-window\s*\{[^}]*overflow:hidden/s);
});
