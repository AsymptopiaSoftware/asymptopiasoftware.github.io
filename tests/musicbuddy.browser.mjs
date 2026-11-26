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
  assert.equal(await page.locator('#loop').count(),1);
  assert.equal(await page.locator('.toolbar #loop').count(),0);
  assert.equal(await page.locator('.play-panel #loop').getAttribute('aria-pressed'),'true');
  assert.equal(await page.locator('#loop').getAttribute('title'),'Loop on');
  assert.equal(await page.locator('#loop').evaluate(el=>el.classList.contains('secondary')),false);
  await page.locator('#loop').click();
  assert.equal(await page.locator('#loop').getAttribute('aria-pressed'),'false');
  assert.equal(await page.locator('#loop').getAttribute('title'),'Loop off');
  assert.equal(await page.locator('#loop').evaluate(el=>el.classList.contains('secondary')),true);
  await page.locator('#loop').click();
  assert.equal(await page.locator('#loop').getAttribute('aria-pressed'),'true');
  for (const id of ['start','repeat','restart','loop','scan']) {
    assert.ok(await page.locator('#'+id+'[title][aria-label] svg').count()>0, id+' has an icon and tooltip');
  }
  assert.ok(await page.locator('#feedback-status').evaluate(el=>el.classList.contains('sr-only') && el.textContent.trim()===''));
  const [left,right]=await Promise.all([
    page.locator('.hero .play-panel').boundingBox(),
    page.locator('.hero .connection').boundingBox()
  ]);
  assert.ok(Math.abs(left.y-right.y)<2 && Math.abs(left.height-right.height)<2,
    'top panels should align symmetrically');
  assert.equal(await page.locator('#key-menu .key-option').count(),12);
  assert.equal(await page.locator('#key-menu .priority').count(),7);
  assert.equal(await page.locator('.explanation:visible').count(),0);
  for(const id of ['descriptions','octaves','ch-arrows']){
    assert.equal(await page.locator('#'+id+'[title][aria-label] svg').count(),1);
  }
  assert.equal(await page.locator('#descriptions').getAttribute('aria-pressed'),'false');
  await page.locator('#descriptions').click();
  assert.equal(await page.locator('#descriptions').getAttribute('aria-pressed'),'true');
  assert.equal(await page.locator('#descriptions').evaluate(el=>el.classList.contains('secondary')),false);
  assert.equal(await page.locator('.explanation:visible').count(),5);
  await page.locator('#descriptions').click();
  assert.equal(await page.locator('#descriptions').getAttribute('aria-pressed'),'false');
  assert.equal(await page.locator('.explanation:visible').count(),0);
  assert.equal(await page.locator('#octaves').getAttribute('aria-pressed'),'false');
  await page.locator('#octaves').click();
  assert.equal(await page.locator('#octaves').getAttribute('aria-pressed'),'true');
  assert.match(await page.locator('#expected-notes').textContent(),/[0-9]/);
  await page.locator('#octaves').click();
  assert.equal(await page.locator('#octaves').getAttribute('aria-pressed'),'false');
  assert.doesNotMatch(await page.locator('#expected-notes').textContent(),/[0-9]/);
  await page.locator('#key-trigger').click();
  const selected = page.locator('#key-menu .key-option[data-key="C"]');
  assert.equal(await selected.evaluate(el=>getComputedStyle(el).fontWeight),'800');
  await selected.click();
  assert.equal(await page.locator('#key-trigger').textContent(),'C');
  assert.match(await page.locator('#journey-title').textContent(),/C$/);
  assert.equal(await page.locator('.ch-pane').count(),1);
  assert.equal(await page.locator('#ch-graph svg').count(),1);
  assert.equal(await page.locator('#ch-arrows').getAttribute('aria-pressed'),'true');
  // The borrowed Ebm7 has no exact major-mode node, leaving two honest path gaps.
  assert.equal(await page.locator('.ch-journey-arrow').count(),14);
  await page.locator('#ch-arrows').click();
  assert.equal(await page.locator('#ch-arrows').getAttribute('aria-pressed'),'false');
  assert.equal(await page.locator('#ch-arrows').evaluate(el=>el.classList.contains('secondary')),true);
  assert.equal(await page.locator('.ch-journey-arrow').count(),0);
  assert.ok(await page.locator('.expected-ring').count()>0);
  await page.locator('#ch-arrows').click();
  assert.equal(await page.locator('#ch-arrows').getAttribute('aria-pressed'),'true');
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
  assert.equal(await page.locator('#start').getAttribute('aria-label'),'Pause');
  assert.equal(await page.locator('#start .pause-icon:visible').count(),1);
  assert.equal(await page.locator('#start .play-icon:visible').count(),0);
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
  // Other journeys must display their own graph, not an empty CH placeholder.
  await page.selectOption('#journey','minor');
  await page.waitForFunction(()=>document.querySelector('#ch-context').textContent.includes('Minor · F'));
  assert.equal(await page.locator('#ch-graph svg').count(),1);
  assert.equal(await page.locator('.ch-node').count(),22);
  assert.match(await page.locator('#ch-map-status').textContent(),/no exact node/);
  await page.selectOption('#journey','blues');
  await page.waitForFunction(()=>document.querySelector('#ch-context').textContent.includes('Blues · C'));
  assert.equal(await page.locator('.ch-node').count(),20);
  assert.ok(await page.locator('.expected-ring').count()>0);
  await page.selectOption('#journey','home');
  await page.waitForFunction(()=>document.querySelector('#ch-context').textContent.includes('Major · Db'));
  assert.equal(await page.locator('.ch-node').count(),25);
  await page.selectOption('#journey','chromatic');
  await page.waitForFunction(()=>document.querySelector('#ch-context').textContent.includes('Major · C'));
  assert.equal(await page.locator('.ch-journey-arrow').count(),2);
  await page.selectOption('#journey','tritone');
  await page.waitForFunction(()=>document.querySelector('#ch-context').textContent.includes('Major · C'));
  assert.equal(await page.locator('.ch-journey-arrow').count(),2);
  assert.deepEqual(errors,[]);
});
