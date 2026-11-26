import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { chromium } from 'playwright';

test('Music Buddy reference layout and shared key selection work in a browser', async t => {
  const root = resolve('dist');
  const types = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css' };
  const server = createServer(async (req, res) => {
    const pathname = new URL(req.url, 'http://localhost').pathname;
    const path = resolve(root, '.' + pathname, pathname.endsWith('/') ? 'index.html' : '');
    if (!path.startsWith(root + '/')) {res.writeHead(403).end();return;}
    try {res.setHeader('Content-Type', types[extname(path)] || 'application/octet-stream');res.end(await readFile(path));}
    catch {res.writeHead(404).end();}
  });
  await new Promise(done => server.listen(0, '127.0.0.1', done));
  t.after(() => server.close());
  const browser = await chromium.launch({executablePath:process.env.BROWSER_PATH || undefined,args:['--no-sandbox']});
  t.after(() => browser.close());
  const page = await browser.newPage();
  const errors=[];
  await page.addInitScript(() => {
    window.__fakeMidiInput = {id:'fake-midi',name:'Test MIDI',onmidimessage:null};
    Object.defineProperty(navigator,'requestMIDIAccess',{
      configurable:true,value:async()=>({
        inputs:new Map([['fake-midi',window.__fakeMidiInput]]),onstatechange:null
      })
    });
  });
  page.on('pageerror', e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:'+server.address().port+'/musicbuddy/');
  await page.waitForSelector('.chord');
  assert.equal(await page.locator('#key-menu .key-option').count(),12);
  assert.equal(await page.locator('#key-menu .priority').count(),7);
  assert.equal(await page.locator('.explanation:visible').count(),0);
  await page.locator('#descriptions').check();
  assert.equal(await page.locator('.explanation:visible').count(),5);
  await page.locator('#descriptions').uncheck();
  assert.equal(await page.locator('.explanation:visible').count(),0);
  await page.locator('#key-trigger').click();
  const selected = page.locator('#key-menu .key-option[data-key="C"]');
  assert.equal(await selected.evaluate(el=>getComputedStyle(el).fontWeight),'800');
  await selected.click();
  assert.equal(await page.locator('#key-trigger').textContent(),'C');
  assert.match(await page.locator('#journey-title').textContent(),/C$/);
  assert.equal(await page.locator('.ch-pane').count(),1);
  assert.equal(await page.locator('#ch-graph svg').count(),1);
  assert.equal(await page.locator('#ch-arrows').isChecked(),true);
  // The borrowed Ebm7 has no exact major-mode node, leaving two honest path gaps.
  assert.equal(await page.locator('.ch-journey-arrow').count(),14);
  await page.locator('#ch-arrows').uncheck();
  assert.equal(await page.locator('.ch-journey-arrow').count(),0);
  assert.ok(await page.locator('.expected-ring').count()>0);
  await page.locator('#ch-arrows').check();
  assert.equal(await page.locator('.ch-journey-arrow').count(),14);
  // Hover a non-target chord: transient preview is independent of the journey.
  await page.locator('.chord[data-step="2"]').hover();
  assert.ok(await page.locator('.ch-node.preview').count()>0);
  assert.equal(await page.locator('#position').textContent(),'1 / 17');
  assert.ok(await page.locator('.expected-ring').count()>0);
  await page.locator('.panel-head').hover();
  assert.equal(await page.locator('.ch-node.preview').count(),0);
  // Borrowed minor iv is not in the current major map; do not fake a match.
  await page.locator('.chord[data-step="11"]').hover();
  assert.equal(await page.locator('.ch-node.preview').count(),0);
  await page.locator('.panel-head').hover();
  assert.ok(await page.locator('.expected-ring').count()>0, 'C major tonic should have a mapped target');
  assert.equal(await page.locator('.played-ring').count(),0);
  await page.locator('#scan').click();
  await page.waitForFunction(() => document.querySelector('#midi-status').textContent.includes('Test MIDI'));
  await page.locator('#start').click();
  // Dm7 is a mapped C-major planet, but the journey currently expects CM7.
  await page.evaluate(() => {
    for(const note of [62,65,69,72])
      window.__fakeMidiInput.onmidimessage({data:[0x90,note,100]});
  });
  await page.waitForFunction(() => document.querySelectorAll('.played-ring').length>0);
  assert.match(await page.locator('#played-name').textContent(),/D-7/);
  assert.match(await page.locator('#expected-name').textContent(),/CM7/);
  assert.equal(await page.locator('#position').textContent(),'1 / 17');
  assert.ok(await page.locator('.expected-ring').count()>0, 'target highlight must persist independently');
  // Release the non-target chord; recognize CM7 and advance.
  await page.evaluate(() => {
    for(const note of [62,65,69,72])
      window.__fakeMidiInput.onmidimessage({data:[0x80,note,0]});
    for(const note of [60,64,67,71])
      window.__fakeMidiInput.onmidimessage({data:[0x90,note,100]});
  });
  await page.waitForFunction(() => document.querySelector('#position').textContent.startsWith('2 /'));
  assert.deepEqual(errors,[]);
});
