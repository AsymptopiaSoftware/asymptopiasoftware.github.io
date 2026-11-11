import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const read = path => readFileSync(new URL('../'+path,import.meta.url),'utf8');
test('every Story/About page features the original full screenshot from the portal',()=>{
 const dev=read('src/pages/dev/index.astro');
 for(const [slug,file] of [
  ['d3srt','d3srt-unified-harmony-focus-20261023.png'],
  ['d3plot','d3plot-multiwindow-session.png'],
  ['tuxmathscrabble','tuxmathscrabble.png']
 ]){
  const page=read('src/pages/projects/'+slug+'.astro');
  assert.ok(page.includes('FeaturedScreenshot'),slug);
  assert.ok(page.includes('/images/'+file),slug);
  assert.ok(dev.includes('/images/'+file),slug);
  assert.ok(existsSync(new URL('../public/images/'+file,import.meta.url)),slug);
 }
});
test('full screenshot opens independently of shallow portal framing',()=>{
 const component=read('src/components/FeaturedScreenshot.astro');
 assert.match(component,/href=\{src\}/);
 assert.match(component,/width:100%;height:auto/);
 assert.match(component,/View full-size image/);
});
