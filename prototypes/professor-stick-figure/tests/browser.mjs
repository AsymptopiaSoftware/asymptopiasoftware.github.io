// Optional browser smoke tests. Development-only Playwright prerequisite.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=resolve(fileURLToPath(new URL('../../',import.meta.url)));
const server=createServer(async(req,res)=>{try{const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);let path=resolve(root,'.'+pathname);if(path!==root&&!path.startsWith(root+sep))throw Error('invalid path');if(pathname.endsWith('/'))path=resolve(path,'index.html');res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json'})[extname(path)]||'text/plain');res.end(await readFile(path));}catch{res.writeHead(404);res.end();}});
await new Promise(done=>server.listen(0,'127.0.0.1',done));let browser;
try{
 browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`http://127.0.0.1:${server.address().port}/professor-stick-figure/`);await page.waitForFunction(()=>document.querySelector('[data-part="right-arm"]'));
 assert.equal(await page.locator('header,.intro,.notes,h1').count(),0);assert.equal(await page.locator('#advanced').getAttribute('open'),null);
 const before=await page.locator('[data-layer="body"]').getAttribute('transform');
 await page.getByRole('button',{name:'Play',exact:true}).click();await page.waitForFunction(()=>Number(document.querySelector('#seek').value)>400);await page.getByRole('button',{name:'Pause',exact:true}).click();
 assert.notEqual(await page.locator('[data-layer="body"]').getAttribute('transform'),before);assert.match(await page.locator('#contact').textContent(),/CHALK LIFTED/);
 await page.locator('#seek').evaluate(el=>{el.value=el.max;el.dispatchEvent(new Event('input',{bubbles:true}));});
 assert.ok(await page.locator('[data-layer="chalk"] path').evaluateAll(els=>els.some(el=>(el.getAttribute('d')||'').length>0)));
 assert.match(await page.locator('[data-part="right-arm"]').getAttribute('d'),/C/);
 await page.getByText('Advanced / Body Rig',{exact:true}).click();
 for(const [id,value]of [['headSize','1.25'],['neckLength','32'],['shoulderWidth','70'],['torsoLength','135'],['hipWidth','40'],['legHeight','135'],['footLength','28'],['lean','10'],['shoulderY','-18'],['rightShoulderX','20'],['rightShoulderY','10']])await page.locator('#'+id).evaluate((el,v)=>{el.value=v;el.dispatchEvent(new Event('input',{bubbles:true}));},value);
 assert.match(await page.locator('#arm-lengths').textContent(),/87.8 \/ 74.3/);
 await page.getByRole('checkbox',{name:'Show skeleton / anchors'}).check();assert.equal(await page.locator('[data-part="body-skeleton"]').getAttribute('visibility'),'visible');
 const download=page.waitForEvent('download');await page.getByRole('button',{name:'Export JSON ↓'}).click();assert.equal((await download).suggestedFilename(),'professor-timeline.json');
 await page.locator('#import').setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from('{"version":2,"strokes":[]}')});assert.match(await page.locator('#message').textContent(),/Import failed/);
 await page.locator('#import').setInputFiles(resolve(root,'professor-stick-figure/examples/writing.json'));assert.match(await page.locator('#message').textContent(),/Ready/);
 await page.getByRole('button',{name:'Restore body rig'}).click();assert.match(await page.locator('#arm-lengths').textContent(),/74.8 \/ 63.3/);
 for(const width of [390,768,1440]){await page.setViewportSize({width,height:950});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
 await page.goto(`file://${resolve(root,'professor-stick-figure/standalone.html')}`);await page.waitForFunction(()=>document.querySelector('[data-part="right-arm"]'));assert.equal(await page.locator('#advanced').getAttribute('open'),null);assert.deepEqual(errors,[]);console.log('B1.2 browser smoke checks passed');
}finally{await browser?.close();await new Promise(done=>server.close(done));}
