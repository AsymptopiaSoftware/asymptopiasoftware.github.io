// Optional browser smoke tests; Playwright is a development-only prerequisite.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = resolve(fileURLToPath(new URL('../../', import.meta.url)));
const server = createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    let path = resolve(root, '.' + pathname);
    if (path !== root && !path.startsWith(root + sep)) throw new Error('Invalid path');
    if (pathname.endsWith('/')) path = resolve(path, 'index.html');
    res.setHeader('Content-Type', ({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json'})[extname(path)] || 'text/plain');
    res.end(await readFile(path));
  } catch { res.writeHead(404); res.end(); }
});
await new Promise(done => server.listen(0, '127.0.0.1', done));
let browser;
try {
  browser = await chromium.launch({headless:true, ...(process.env.CHROMIUM_PATH ? {executablePath:process.env.CHROMIUM_PATH} : {})});
  const page = await browser.newPage({viewport:{width:1440,height:1100}}), errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}/professor-stick-figure/`);
  await page.waitForFunction(() => document.querySelector('[data-part="head"]'));
  const body = await page.locator('[data-layer="body"]').evaluate(el => el.outerHTML);
  await page.getByRole('button',{name:'Play',exact:true}).click();
  await page.waitForFunction(() => Number(document.querySelector('#seek').value) > 200);
  await page.getByRole('button',{name:'Pause',exact:true}).click();
  assert.equal(await page.locator('[data-layer="body"]').evaluate(el => el.outerHTML),body);
  assert.ok(await page.locator('[data-layer="drawing-arm"] > path').first().getAttribute('d'));
  await page.locator('#lean').evaluate(el => {el.value='20';el.dispatchEvent(new Event('input',{bubbles:true}));});
  assert.equal(await page.locator('#shoulder-value').textContent(),'274, 265');
  const shoulder = page.locator('[data-layer="drawing-arm"] > circle').first();
  assert.equal(await shoulder.getAttribute('cx'),'274');assert.equal(await shoulder.getAttribute('cy'),'265');
  // Sweep each new body slider at a fixed writing time. The board targets and
  // playhead stay fixed; both heel contacts remain fixed while the arm reattaches.
  const feet = await page.locator('[data-part="left-foot"], [data-part="right-foot"]').evaluateAll(els => els.map(el => el.getAttribute('d').split('L')[0]));
  const playhead = await page.locator('#seek').inputValue();
  for (const [id,value] of [['headSize','1.25'],['neckLength','32'],['shoulderWidth','70'],['torsoLength','135'],['hipWidth','40'],['legHeight','135'],['footLength','28'],['shoulderY','-18'],['rightShoulderX','20'],['rightShoulderY','10']]) {
    await page.locator('#'+id).evaluate((el,v) => {el.value=v;el.dispatchEvent(new Event('input',{bubbles:true}));},value);
    assert.equal(await page.locator('#seek').inputValue(),playhead);
    assert.deepEqual(await page.locator('[data-part="left-foot"], [data-part="right-foot"]').evaluateAll(els => els.map(el => el.getAttribute('d').split('L')[0])),feet);
    const anchors = await page.locator('#shoulder-value').textContent();
    const [x,y] = anchors.split(', ').map(Number);
    assert.equal(Number(await shoulder.getAttribute('cx')),x);assert.equal(Number(await shoulder.getAttribute('cy')),y);
  }
  const adjustedBody = await page.locator('[data-layer="body"]').evaluate(el => el.outerHTML);
  await page.getByRole('button',{name:'Play',exact:true}).click();
  await page.waitForFunction(value => Number(document.querySelector('#seek').value)>Number(value)+100,playhead);
  await page.getByRole('button',{name:'Pause',exact:true}).click();
  assert.equal(await page.locator('[data-layer="body"]').evaluate(el => el.outerHTML),adjustedBody);
  await page.getByRole('checkbox',{name:'Show coordinate anchors'}).check();
  assert.equal(await page.locator('[data-layer="anchors"]').getAttribute('visibility'),'visible');
  const download = page.waitForEvent('download');await page.getByRole('button',{name:'Export JSON ↓'}).click();assert.equal((await download).suggestedFilename(),'professor-timeline.json');
  await page.locator('#import').setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from('{"version":2,"strokes":[]}')});assert.match(await page.locator('#message').textContent(),/Import failed/);
  await page.locator('#import').setInputFiles(resolve(root,'professor-stick-figure/examples/writing.json'));assert.match(await page.locator('#message').textContent(),/imported without conversion/);
  await page.getByRole('button',{name:'Restore body rig'}).click();assert.equal(await page.locator('#shoulder-value').textContent(),'254, 265');
  for(const width of [390,768,1440]){await page.setViewportSize({width,height:950});assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));}
  await page.goto(`file://${resolve(root,'professor-stick-figure/standalone.html')}`);await page.waitForFunction(() => document.querySelector('[data-part="head"]'));
  await page.getByRole('button',{name:'Play',exact:true}).click();await page.waitForFunction(() => Number(document.querySelector('#seek').value)>100);
  assert.deepEqual(errors,[]);console.log('Professor browser smoke checks passed');
} finally {await browser?.close();await new Promise(done => server.close(done));}
