// Browser integration: existing rig/gait plus exact-math UI and file:// bundle.
import assert from 'node:assert/strict';
import {checkPresentationBrowser} from './browser-presentation.mjs';
import {compileTimeline} from '../../drawing-arm/src/timeline.js';
import {presentationPlan} from '../src/presentation-plan.js';
import {teachingPlan} from '../src/teaching.js';
import {planWriting} from '../src/locomotion.js';
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
 assert.equal(initial.layout.notation,'stacked-fractions');assert.equal(initial.strokes.filter(s=>s.kind==='fraction-bar').length,8);assert.ok(!initial.strokes.some(s=>s.symbol==='/'));
 const planned=presentationPlan(teachingPlan(planWriting(compileTimeline(initial)),initial.mathSteps)),firstBar=initial.strokes.find(s=>s.kind==='fraction-bar'),barIndex=planned.writes.findIndex(p=>Math.abs(p.sourceAt-firstBar.at)<1e-6),bar=planned.writes[barIndex];
 const chalkBar=page.locator('[data-layer="chalk"] > g').nth(barIndex).locator('path').first();
 const seekTo=async time=>page.locator('#seek').evaluate((el,value)=>{el.value=String(value);el.dispatchEvent(new Event('input',{bubbles:true}));},time);
 const checkTeaching=async()=>{
  const step=planned.teachingSteps[0],second=planned.teachingSteps[1];
  await page.locator('#teaching-mode').selectOption('step');
  await seekTo(step.gate-40);await page.getByRole('button',{name:'Play',exact:true}).click();
  await page.waitForFunction(()=>!document.querySelector('#continue').disabled);
  const stopped=Number(await page.locator('#seek').inputValue());assert.ok(Math.abs(stopped-step.gate)<.01);
  const arm=await page.locator('[data-part="right-arm"]').getAttribute('d'),chalk=await page.locator('[data-layer="chalk"]').innerHTML();
  await page.waitForTimeout(100);assert.equal(Number(await page.locator('#seek').inputValue()),stopped);assert.equal(await page.locator('[data-part="right-arm"]').getAttribute('d'),arm);
  assert.match(await page.locator('#contact').textContent(),/CHALK LIFTED/);assert.match(await page.locator('#operation').textContent(),/Step 2\/4/);
  await page.getByRole('button',{name:'Continue',exact:true}).click();await page.waitForFunction(resume=>Number(document.querySelector('#seek').value)>resume,step.resume);
  await seekTo(second.start+1);assert.match(await page.locator('#operation').textContent(),/Step 2\/4: Add 4\/4 to both sides/);
  await seekTo(planned.duration);await seekTo(step.gate);assert.equal(await page.locator('[data-layer="chalk"]').innerHTML(),chalk);assert.equal(await page.locator('[data-part="right-arm"]').getAttribute('d'),arm);assert.match(await page.locator('#operation').textContent(),/Step 2\/4/);
  await page.locator('#teaching-mode').selectOption('auto');await page.waitForFunction(resume=>Number(document.querySelector('#seek').value)>resume,step.resume);
  await page.getByRole('button',{name:'Reset',exact:true}).click();assert.equal(await page.locator('#seek').inputValue(),'0');assert.equal(await page.locator('#continue').isDisabled(),true);
 };
 await checkTeaching();
 await seekTo(Math.max(0,bar.at-.01));assert.equal(await chalkBar.getAttribute('d'),'');
 await seekTo(bar.at+bar.duration*.5);const halfBar=await chalkBar.getAttribute('d');assert.ok(halfBar.length>0);assert.match(await page.locator('#contact').textContent(),/CHALK DOWN/);
 await seekTo(bar.at+bar.duration+.001);assert.notEqual(await chalkBar.getAttribute('d'),halfBar);await page.getByRole('button',{name:'Reset',exact:true}).click();

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
 await checkTeaching();
 await seekTo(planned.teachingSteps[1].gate);
 const nativeVoices=await page.evaluate(()=>window.speechSynthesis?.getVoices()?.length??null);
 await checkPresentationBrowser(browser,`http://127.0.0.1:${server.address().port}/professor-stick-figure/`,planned);
 await checkPresentationBrowser(browser,standaloneHTTP,planned,process.env.SCREENSHOT_PATH);
 console.log(`Native browser voices: ${nativeVoices??'unsupported'}; speech lifecycle checked with controllable synthesis in both previews.`);
 assert.deepEqual(errors,[]);console.log(`B1.9 browser checks passed: modular + self-contained (${standaloneTransport}), turns, two-arm gestures, speech/mute/pause/replay, Auto/Step, deterministic seeking, fractions, math, walking and responsive layout`);
}finally{await browser?.close();await new Promise(done=>server.close(done));}
