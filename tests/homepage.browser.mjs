import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { chromium } from 'playwright';

test('built homepage renders working source-owned WELCOME demo at desktop and mobile widths', async t => {
  const root = resolve('dist');
  const types = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.png':'image/png', '.svg':'image/svg+xml', '.woff':'font/woff' };
  const server = createServer(async (req, res) => {
    const path = resolve(root, '.' + new URL(req.url, 'http://localhost').pathname);
    if (path !== root && !path.startsWith(root + '/')) { res.writeHead(403).end(); return; }
    const file = path === root ? resolve(root, 'index.html') : path;
    try { res.setHeader('Content-Type', types[extname(file)] || 'application/octet-stream'); res.end(await readFile(file)); }
    catch { res.writeHead(404).end(); }
  });
  await new Promise(done => server.listen(0, '127.0.0.1', done));
  t.after(() => server.close());
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_PATH || undefined, args:['--no-sandbox'] });
  t.after(() => browser.close());
  const page = await browser.newPage({ viewport:{ width:1200, height:1000 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  await page.waitForFunction(() => document.querySelectorAll('.q-img__image--loaded').length === 140);
  assert.equal(await page.locator('.reel').count(), 7);
  assert.equal(await page.locator('.demo-actions .demo-action').count(), 3);
  assert.equal(await page.getByRole('link', { name: 'Source', exact: true }).getAttribute('href'), 'https://github.com/ccosse/slotmachine');
  assert.equal(await page.getByRole('link', { name: 'Launch', exact: true }).getAttribute('href'), 'https://www.asymptopia.com/slotmachine/#/');
  await page.locator('.demo-more summary').click();
  assert.ok(await page.locator('.demo-more').evaluate(el => el.open));
  await page.locator('.demo-more summary').click();
  assert.ok(await page.locator('.slot-machine.compact').evaluate(el => { const h = el.getBoundingClientRect().height; return h > 0 && h <= 191; }), 'Compact badge should fit its 190px design height');
  await page.waitForFunction(() => document.querySelector('#resultsLabel').textContent === 'WELCOME', { timeout: 15000 });
  const sources = await page.locator('.q-img img').evaluateAll(es => es.map(e => e.src));
  for (const width of [1200, 375]) {
    await page.setViewportSize({ width, height: width === 375 ? 700 : 1000 });
    await page.getByRole('button', { name:'Spin', exact:true }).click();
    await page.waitForTimeout(400);
    const moving = await page.locator('.reel').first().evaluate(e => getComputedStyle(e).transform);
    assert.notEqual(moving, 'none');
    await page.waitForFunction(() => document.querySelector('#resultsLabel').textContent === 'WELCOME');
    assert.deepEqual(await page.locator('.q-img img').evaluateAll(es => es.map(e => e.src)), sources);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.waitForFunction(() => {
      const logo = document.querySelector('.brand-home')?.getBoundingClientRect();
      const panel = document.querySelector('.slotmachine-embed')?.getBoundingClientRect();
      const reels = document.querySelector('.slot-machine.compact .machine-canvas')?.getBoundingClientRect();
      if (!logo || !panel || !reels) return false;
      const reelRatio = reels.width / panel.width;
      const centered = Math.abs((reels.left + reels.right) / 2 - (panel.left + panel.right) / 2) <= 3;
      return Math.abs(logo.width - panel.width) <= 3
        && reelRatio >= 0.69 && reelRatio <= 0.71 && centered;
    }, { timeout: 5000 });
    const button = await page.getByRole('button', { name:'Spin', exact:true }).boundingBox();
    assert.ok(button.height >= 25 && button.height <= 36, `Spin button height ${button.height}`);
    if (process.env.EVIDENCE_DIR) {
      // Let celebratory confetti finish so the reel faces remain unobscured.
      await page.waitForTimeout(5100);
      await page.screenshot({ path:`${process.env.EVIDENCE_DIR}/homepage-${width}.png`, fullPage:true });
    }
  }
  assert.deepEqual(errors, []);
});
