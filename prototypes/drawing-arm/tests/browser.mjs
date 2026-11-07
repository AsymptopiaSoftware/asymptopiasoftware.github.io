// Optional real-browser QA. Requires Playwright; no production dependencies.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve,extname,sep} from 'node:path';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root=fileURLToPath(new URL('../',import.meta.url)).replace(/\/$/,'');
const server=createServer(async(req,res)=>{try{const path=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(!path.startsWith(root+sep)&&path!==root)throw Error('invalid path');const file=path===root?resolve(root,'index.html'):path;res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json'})[extname(file)]||'text/plain');res.end(await readFile(file));}catch{res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
let browser;
try{
 browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`http://127.0.0.1:${server.address().port}/`);await page.waitForFunction(()=>document.querySelectorAll('.drawing path').length===4);
 assert.equal(await page.locator('.drawing').count(),2);
 await page.getByRole('button',{name:'Play',exact:true}).click();await page.waitForFunction(()=>Number(document.querySelector('#seek').value)>50);await page.getByRole('button',{name:'Pause',exact:true}).click();
 await page.locator('#seek').evaluate(el=>{el.value=el.max;el.dispatchEvent(new Event('input',{bubbles:true}));});
 assert.ok(await page.locator('.drawing path').first().getAttribute('d'));
 for(const id of ['upper','forearm'])await page.locator('#'+id).evaluate(el=>{el.value='40';el.dispatchEvent(new Event('input',{bubbles:true}));});assert.match(await page.locator('.readout').first().textContent(),/OUT-OF-REACH/);
 await page.getByRole('button',{name:'Restore both rigs'}).click();
 const download=page.waitForEvent('download');await page.getByRole('button',{name:/Download timeline/}).click();assert.equal((await download).suggestedFilename(),'drawing-arm-timeline.json');
 await page.locator('#import').setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from('{"version":2,"strokes":[]}')});assert.match(await page.locator('#message').textContent(),/Import failed/);
 await page.locator('#import').setInputFiles(resolve(root,'examples/equation.json'));assert.match(await page.locator('#message').textContent(),/Imported timeline/);
 await page.getByRole('button',{name:'Glyph set',exact:true}).click();await page.getByRole('button',{name:'Load writing ↗'}).click();
 for(const width of [390,768,1440]){await page.setViewportSize({width,height:900});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
 await page.goto(`file://${resolve(root,'standalone.html')}`);await page.waitForFunction(()=>document.querySelectorAll('.drawing path').length===4);assert.deepEqual(errors,[]);
 console.log('Browser smoke checks passed');
}finally{await browser?.close();await new Promise(r=>server.close(r));}
