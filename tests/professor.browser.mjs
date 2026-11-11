import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,stat,mkdir} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {chromium} from 'playwright';
test('Professor homepage and published full app work independently on desktop, mobile and reduced motion',async t=>{
 const root=resolve('dist'),types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.woff':'font/woff'};
 const server=createServer(async(req,res)=>{try{let path=resolve(root,'.'+new URL(req.url,'http://localhost').pathname);if(path!==root&&!path.startsWith(root+'/'))throw Error('invalid path');if((await stat(path)).isDirectory())path=resolve(path,'index.html');res.setHeader('Content-Type',types[extname(path)]||'application/octet-stream');res.end(await readFile(path));}catch{res.writeHead(404).end();}});
 await new Promise(done=>server.listen(0,'127.0.0.1',done));t.after(()=>server.close());
 const browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||undefined,args:['--no-sandbox']});t.after(()=>browser.close());
 const page=await browser.newPage({viewport:{width:1200,height:1050}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
 const base=`http://127.0.0.1:${server.address().port}`;await page.goto(base);
 await page.waitForFunction(()=>document.querySelector('professor-auto-demo')?.controller?.getState().time>200);
 assert.equal(await page.locator('.professor-embed button,.professor-embed input,.professor-embed select,.professor-embed aside').count(),0);
 assert.equal(await page.locator('.professor-embed .demo-action').count(),3);
 const links=await page.locator('.professor-embed .demo-action').evaluateAll(es=>es.map(e=>({href:e.getAttribute('href'),title:e.title})));assert.deepEqual(links.map(l=>l.title),['Source','Live','Page']);
 assert.equal(links[0].href,'https://github.com/AsymptopiaSoftware/asymptopiasoftware.github.io/tree/main/prototypes/professor-stick-figure');
 for(const link of links.slice(1)){const response=await page.request.get(base+link.href);assert.equal(response.status(),200);}
 const originalProblem=await page.locator('professor-auto-demo').evaluate(el=>el.currentProblem);
 await page.evaluate(()=>{const d=document.querySelector('professor-auto-demo').controller;d.seek(d.getState().duration);});
 await page.waitForFunction(original=>document.querySelector('professor-auto-demo').currentProblem!==original,originalProblem,{timeout:9000});
 await page.evaluate(()=>document.querySelector('professor-auto-demo').controller.pause());
 const stopped=await page.evaluate(()=>document.querySelector('professor-auto-demo').controller.getState().time);
 await page.getByRole('button',{name:'Spin',exact:true}).click();await page.waitForTimeout(250);
 assert.equal(await page.evaluate(()=>document.querySelector('professor-auto-demo').controller.getState().time),stopped);
 await page.waitForFunction(()=>document.querySelector('#resultsLabel').textContent==='WELCOME');assert.equal(await page.locator('.reel').count(),7);
 await page.evaluate(()=>{const d=document.querySelector('professor-auto-demo').controller;d.seek(d.getState().duration);});
 for(const width of [1200,375,320]){
  await page.setViewportSize({width,height:width<400?850:1050});await page.waitForTimeout(80);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  const geom=await page.locator('.professor-embed').evaluate(el=>{const b=el.getBoundingClientRect(),svg=el.querySelector('svg'),s=svg.getBoundingClientRect();return {w:b.width,h:b.height,sw:s.width,sh:s.height,ratio:svg.getAttribute('preserveAspectRatio')};});
  assert.ok(geom.w>0&&geom.h>=280&&geom.sw<=geom.w+.1&&geom.sh<=geom.h+.1);assert.equal(geom.ratio,'xMidYMid meet');
  if(process.env.EVIDENCE_DIR){await mkdir(process.env.EVIDENCE_DIR,{recursive:true});await page.screenshot({path:`${process.env.EVIDENCE_DIR}/professor-homepage-${width}.png`,fullPage:true});}
 }
 const speech=await page.evaluate(()=>speechSynthesis.speaking);assert.equal(speech,false);
 await page.emulateMedia({reducedMotion:'reduce'});await page.reload();
 await page.waitForFunction(()=>document.querySelector('professor-auto-demo')?.controller?.getState().reducedMotion);
 const reduced=await page.evaluate(()=>document.querySelector('professor-auto-demo').controller.getState());assert.equal(reduced.time,reduced.duration);assert.equal(reduced.playing,false);
 assert.ok(await page.locator('.professor-embed [data-layer="chalk"] path[d]').count()>0);
 await page.goto(base+links[1].href);await page.waitForSelector('#seek');
 assert.equal(await page.locator('#writing').inputValue(),'x/5-4/4=2/5');assert.equal(await page.locator('#advanced').getAttribute('open'),null);
 await page.getByRole('button',{name:'Play',exact:true}).click();await page.waitForFunction(()=>Number(document.querySelector('#seek').value)>20);await page.getByRole('button',{name:'Pause',exact:true}).click();
 await page.getByRole('button',{name:'Reset',exact:true}).click();assert.equal(await page.locator('#seek').inputValue(),'0');
 assert.deepEqual(errors,[]);
});
