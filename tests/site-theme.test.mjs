import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read = p => readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('root, body and shell have consistent full-height dark backgrounds', () => {
  const css = read('src/styles/global.css');
  assert.match(css, /:root\s*\{[^}]*background:\s*#111312/s);
  assert.match(css, /body\s*\{[^}]*min-height:\s*100vh;[^}]*background:\s*#111312/s);
  assert.match(css, /\.shell\s*\{[^}]*min-height:\s*100vh;[^}]*background:\s*#111312/s);
});
test('full d3SRT image is featured while the homepage masks keep their original asset', () => {
  const page = read('src/pages/projects/d3srt.astro');
  const home = read('src/pages/index.astro');
  assert.ok(page.includes('/images/d3SightReadingTrainer_CosmicHarmony.png'));
  assert.ok(home.includes('/images/d3srt-unified-harmony-focus-20261023.png'));
});
test('project story text stays readable on dark theme', () => {
 for (const name of ['d3srt','d3plot','tuxmathscrabble']) {
  const page=read('src/pages/projects/'+name+'.astro');
  assert.match(page, /color:#e0e8e1/);
 }
});
