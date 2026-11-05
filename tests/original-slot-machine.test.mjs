import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const read = path => readFileSync(new URL(path, import.meta.url), 'utf8');
test('homepage consumes an immutable original-project demo without copied implementation', () => {
  const manifest = JSON.parse(read('../package.json'));
  assert.match(manifest.dependencies.slotmachine, /^https:\/\/codeload\.github\.com\/ccosse\/slotmachine\/tar\.gz\/[a-f0-9]{40}$/);
  assert.match(read('../src/components/slotmachine/SlotMachineOriginal.vue'), /import SlotMachine from 'slotmachine'/);
  assert.match(read('../src/components/slotmachine/SlotMachineOriginal.vue'), /<SlotMachine compact :reel-count="7" preset="WELCOME"/);
  assert.equal(existsSync(new URL('../src/components/slotmachine/original', import.meta.url)), false);
  const source = readFileSync(require.resolve('slotmachine'), 'utf8');
  assert.match(source, /default: 5/);
  assert.match(source, /default: false/);
});
