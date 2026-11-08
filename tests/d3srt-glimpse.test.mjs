import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const root = new URL('../', import.meta.url);
const read = path => readFile(new URL(path, root), 'utf8');

test('d3SRT still is an original archived screenshot, not autoplay media', async () => {
  const image = await readFile(new URL('public/images/d3srt-cosmic-workstation-m25.png', root));
  assert.equal(image.subarray(0,8).toString('hex'), '89504e470d0a1a0a');
  const component = await read('src/components/D3SRTGlimpse.astro');
  const homepage = await read('src/pages/index.astro');
  assert.match(component, /d3srt-cosmic-workstation-m25\.png/);
  assert.match(component, /object-fit:cover/);
  assert.doesNotMatch(component, /<iframe|<video|<audio|autoplay|speechSynthesis/i);
  assert.match(homepage, /<D3SRTGlimpse\s*\/>/);
  assert.match(homepage, /sourceUrl="https:\/\/github\.com\/ccosse\/d3SightReadingTrainer"/);
  assert.match(homepage, /pageUrl="\/projects\/d3srt\/"/);
});

test('d3SRT project page and links exist', async () => {
  const page = await read('src/pages/projects/d3srt.astro');
  assert.match(page, /d3SightReadingTrainer \+ Cosmic Harmony/);
  assert.match(page, /https:\/\/ccosse\.github\.io\/d3SightReadingTrainer/);
});
