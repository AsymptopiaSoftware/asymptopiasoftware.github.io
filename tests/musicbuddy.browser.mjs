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
  assert.deepEqual(errors,[]);
});
