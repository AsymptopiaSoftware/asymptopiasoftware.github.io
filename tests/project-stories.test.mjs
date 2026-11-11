import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const read = path => readFileSync(new URL('../'+path,import.meta.url),'utf8');
test('project stories feature verified screenshots while preserving the existing portal images',()=>{
 const dev=read('src/pages/index.astro');
 for(const [slug,file] of [
  ['d3srt','d3SightReadingTrainer_CosmicHarmony.png'],
  ['d3plot','d3plot-multiwindow-session.png'],
  ['tuxmathscrabble','tuxmathscrabble.png']
 ]){
  const page=read('src/pages/projects/'+slug+'.astro');
  assert.ok(page.includes('FeaturedScreenshot'),slug);
  assert.ok(page.includes('/images/'+file),slug);
  assert.ok(dev.includes('/images/'+(slug==='d3srt'?'d3srt-unified-harmony-focus-20261023.png':file)),slug);
  assert.ok(existsSync(new URL('../public/images/'+file,import.meta.url)),slug);
 }
});
test('full screenshot opens independently of shallow portal framing',()=>{
 const component=read('src/components/FeaturedScreenshot.astro');
 assert.match(component,/href=\{src\}/);
 assert.match(component,/width:100%;height:auto/);
 assert.match(component,/View full-size image/);
});
