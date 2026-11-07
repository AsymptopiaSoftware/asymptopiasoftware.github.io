// Browser integration: existing rig/gait plus exact-math UI and file:// bundle.
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
 let page=await browser.newPage({viewport:{width:1440,height:1000}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const exportJSON=async()=>{const waiting=page.waitForEvent('download');await page.getByRole('button',{name:'Export JSON ↓'}).click();const download=await waiting;assert.equal(download.suggestedFilename(),'professor-timeline.json');return JSON.parse(await readFile(await download.path(),'utf8'));};
 await page.goto(`http://127.0.0.1:${server.address().port}/professor-stick-figure/`);await page.waitForFunction(()=>document.querySelector('[data-part="right-arm"]')?.getAttribute('d'));
 assert.equal(await page.locator('header,.intro,.notes,h1').count(),0);assert.equal(await page.locator('#advanced').getAttribute('open'),null);
 assert.equal(await page.locator('#writing').inputValue(),'x/5-4/4=2/5');assert.match(await page.locator('#operation').textContent(),/Step 1\/4/);
 const expected=['x/5-4/4=2/5','x/5=2/5+4/4','x/5=7/5','x=7'],initial=await exportJSON();
 assert.deepEqual(initial.mathSteps.map(s=>s.text),expected);assert.equal(initial.fallbacks.length,0);
 const before=await page.locator('[data-layer="body"]').getAttribute('transform');
 await page.getByRole('button',{name:'Play',exact:true}).click();await page.waitForFunction(()=>Number(document.querySelector('#seek').value)>150);
 const leg=await page.locator('[data-part="right-leg"]').getAttribute('d');await page.waitForFunction(()=>Number(document.querySelector('#seek').value)>300);await page.getByRole('button',{name:'Pause',exact:true}).click();
 assert.notEqual(await page.locator('[data-part="right-leg"]').getAttribute('d'),leg);assert.notEqual(await page.locator('[data-layer="body"]').getAttribute('transform'),before);
 await page.locator('#seek').evaluate(el=>{el.value=el.max;el.dispatchEvent(new Event('input',{bubbles:true}));});
 assert.match(await page.locator('#contact').textContent(),/CHALK LIFTED \/ DONE/);assert.match(await page.locator('#operation').textContent(),/Step 4\/4/);assert.ok(await page.locator('[data-layer="chalk"] path').evaluateAll(els=>els.some(el=>(el.getAttribute('d')||'').length>0)));
 for(const value of ['generated-0','generated-1','generated-2']){
  await page.locator('#math-example').selectOption(value);assert.match(await page.locator('#message').textContent(),/Ready/);
  const raw=await exportJSON();assert.ok(raw.mathSteps.length>=3);assert.equal(raw.mathSteps[0].text,await page.locator('#writing').inputValue());assert.match(raw.mathSteps.at(-1).text,/^x=/);assert.equal(raw.fallbacks.length,0);
 }
 const beforeInvalid=await exportJSON();await page.locator('#writing').fill('1/x=0');await page.getByRole('button',{name:'Solve & write ↗'}).click();assert.match(await page.locator('#message').textContent(),/No value/);assert.deepEqual(await exportJSON(),beforeInvalid);
 await page.locator('#math-example').selectOption('free');await page.locator('#writing').fill('2+3=5');await page.getByRole('button',{name:'Load writing ↗'}).click();assert.equal((await exportJSON()).mathSteps,undefined);
 await page.getByText('Advanced / Body Rig',{exact:true}).click();for(const [id,value]of [['headSize','1.25'],['neckLength','32'],['shoulderWidth','70'],['torsoLength','135'],['hipWidth','40'],['legHeight','135'],['footLength','28'],['lean','10'],['shoulderY','-18'],['rightShoulderX','20'],['rightShoulderY','10']])await page.locator('#'+id).evaluate((el,v)=>{el.value=v;el.dispatchEvent(new Event('input',{bubbles:true}));},value);
 assert.match(await page.locator('#arm-lengths').textContent(),/87.8 \/ 74.3/);await page.getByRole('checkbox',{name:'Show skeleton / anchors'}).check();assert.equal(await page.locator('[data-part="body-skeleton"]').getAttribute('visibility'),'visible');
 await page.locator('#import').setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from('{"version":2,"strokes":[]}')});await page.waitForFunction(()=>/Import failed/.test(document.querySelector('#message').textContent));
 await page.locator('#import').setInputFiles({name:'metadata.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({version:1,strokes:[],mathSteps:{invalid:true}}))});await page.waitForFunction(()=>/Ready/.test(document.querySelector('#message').textContent));assert.equal(await page.locator('#operation').textContent(),'');
 await page.locator('#import').setInputFiles(resolve(root,'professor-stick-figure/examples/writing.json'));await page.waitForFunction(()=>/Ready/.test(document.querySelector('#message').textContent));
 for(const width of [390,768,1440]){await page.setViewportSize({width,height:1000});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
 let standaloneTransport='file';
 const standaloneHTTP=`http://127.0.0.1:${server.address().port}/professor-stick-figure/standalone.html`;
 if(process.env.STANDALONE_HTTP){standaloneTransport='HTTP (self-contained package)';await page.goto(standaloneHTTP);}
 else try{await page.goto(`file://${resolve(root,'professor-stick-figure/standalone.html')}`);}catch(error){if(!String(error).includes('ERR_BLOCKED_BY_ADMINISTRATOR'))throw error;standaloneTransport='HTTP (managed Chrome blocks file URLs)';await page.close();page=await browser.newPage({viewport:{width:1440,height:1000}});page.on('pageerror',e=>errors.push(e.message));await page.goto(standaloneHTTP);}
 await page.waitForFunction(()=>document.querySelector('[data-part="right-arm"]')?.getAttribute('d'));assert.equal(await page.locator('#advanced').getAttribute('open'),null);assert.deepEqual((await exportJSON()).mathSteps.map(s=>s.text),expected);
 await page.locator('#seek').evaluate(el=>{el.value=el.max;el.dispatchEvent(new Event('input',{bubbles:true}));});
 assert.match(await page.locator('#contact').textContent(),/CHALK LIFTED \/ DONE/);
 if(process.env.SCREENSHOT_PATH)await page.screenshot({path:process.env.SCREENSHOT_PATH,fullPage:true});
 assert.deepEqual(errors,[]);console.log(`B1.6 browser checks passed: modular + self-contained (${standaloneTransport}), math, generation, walking, controls, import/export and responsive layout`);
}finally{await browser?.close();await new Promise(done=>server.close(done));}
