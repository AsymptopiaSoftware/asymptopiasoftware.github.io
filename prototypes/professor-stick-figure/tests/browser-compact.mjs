import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=resolve(fileURLToPath(new URL('../../',import.meta.url)));
const server=createServer(async(req,res)=>{try{if(req.url==='/empty.html'){res.setHeader('Content-Type','text/html');res.end('<!doctype html><html><body></body></html>');return;}const path=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(!path.startsWith(root+sep))throw Error('invalid path');res.setHeader('Content-Type',extname(path)==='.js'?'text/javascript':'text/html');res.end(await readFile(path));}catch{res.writeHead(404);res.end();}});
await new Promise((done,reject)=>{server.on('error',reject);server.listen(0,'127.0.0.1',done);});let browser;
try{
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium'});
 const page=await browser.newPage({viewport:{width:900,height:600}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{window.spoken=0;if(window.speechSynthesis)window.speechSynthesis.speak=()=>window.spoken++;});
 const base=`http://127.0.0.1:${server.address().port}/professor-stick-figure/`;
 await page.goto(base+'demo-standalone.html');await page.waitForSelector('[data-professor-demo] path[data-part="head"]');
 assert.equal(await page.locator('button,input,select,textarea,h1,aside').count(),0);assert.equal(await page.locator('[id]').count(),0);
 await page.screenshot({path:'/tmp/professor-b2-autoplay.png'});
 // Import the modular API into the same page to test independent instances and deterministic transport.
 await page.evaluate(async()=>{
  const {mountProfessorDemo}=await import('./src/compact-demo.js');
  window.instances=[];
  for(let i=0;i<2;i++){const div=document.createElement('div');div.className='test-host';Object.assign(div.style,{width:'480px',height:'360px'});document.body.append(div);window.instances.push(mountProfessorDemo(div,{autoplay:false}));}
 });
 const result=await page.evaluate(()=>{
  const [a,b]=instances,hosts=[...document.querySelectorAll('.test-host')],first=hosts[0],second=hosts[1];
  a.seek(a.getState().duration);const complete=first.innerHTML;
  a.seek(13000);a.seek(a.getState().duration);const deterministic=first.innerHTML===complete;
  const untouched=b.getState().time===0;a.reset();a.play();a.pause();
  a.seek(a.getState().duration);return {deterministic,untouched,a:a.getState(),b:b.getState(),ratio:first.querySelector('svg').viewBox.baseVal.height};
 });assert.ok(result.deterministic);assert.ok(result.untouched);assert.ok(!result.a.playing);assert.equal(result.b.time,0);
 // Sweep the actual SVG silhouettes and chalk, not only the sampled camera model.
 const bounds=await page.evaluate(()=>{
  const a=instances[0],svg=document.querySelector('.test-host svg'),f=svg.viewBox.baseVal,fail=[];let maximumHeight=0;
  for(let t=0;t<=a.getState().duration;t+=125){a.seek(t);const group=svg.querySelector('[data-layer="professor"]');let x=Infinity,y=Infinity,right=-Infinity,bottom=-Infinity;for(const leaf of group.querySelectorAll('path,line,circle,text')){if(getComputedStyle(leaf).visibility==='hidden'||getComputedStyle(leaf).display==='none')continue;const r=leaf.getBBox();if(!r.width&&!r.height)continue;const m=svg.getScreenCTM().inverse().multiply(leaf.getScreenCTM());for(const p of [[r.x,r.y],[r.x+r.width,r.y+r.height]]){const q=new DOMPoint(...p).matrixTransform(m);x=Math.min(x,q.x);y=Math.min(y,q.y);right=Math.max(right,q.x);bottom=Math.max(bottom,q.y);}}const box={x,y,width:right-x,height:bottom-y};
   if(box.x<f.x-.2||box.y<f.y-.2||box.x+box.width>f.x+f.width+.2||box.y+box.height>f.y+f.height+.2)fail.push({t,box:{x:box.x,y:box.y,width:box.width,height:box.height},f:{x:f.x,y:f.y,width:f.width,height:f.height}});
   const body=svg.querySelector('[data-layer="body"]').getBBox();maximumHeight=Math.max(maximumHeight,body.height/f.height);
  }a.seek(a.getState().duration);return {fail,maximumHeight};
 });assert.deepEqual(bounds.fail.slice(0,3),[]);assert.ok(bounds.maximumHeight>=.8&&bounds.maximumHeight<=.9,JSON.stringify(bounds));
 await page.locator('.test-host').first().screenshot({path:'/tmp/professor-b2-desktop.png'});
 await page.evaluate(()=>{const a=instances[0];for(let t=0;t<a.getState().duration;t+=150){a.seek(t);if(document.querySelector('.test-host [data-orientation]').getAttribute('data-orientation')==='audience')break;}});
 await page.locator('.test-host').first().screenshot({path:'/tmp/professor-b2-gesture.png'});
 await page.evaluate(()=>instances[0].seek(instances[0].getState().duration));
 await page.evaluate(()=>{Object.assign(document.querySelector('.test-host').style,{width:'280px',height:'260px'});});await page.waitForTimeout(100);
 assert.equal(await page.locator('.test-host svg').first().getAttribute('width'),'280');
 await page.locator('.test-host').first().screenshot({path:'/tmp/professor-b2-mobile.png'});
 await page.evaluate(()=>{instances[0].destroy();instances[0].destroy();});assert.equal(await page.locator('.test-host').first().locator('svg').count(),0);assert.equal(await page.locator('.test-host').nth(1).locator('svg').count(),1);
 await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(50);
 assert.ok(await page.evaluate(()=>instances[1].getState().reducedMotion&&instances[1].getState().time===instances[1].getState().duration&&!instances[1].getState().playing));
 await page.evaluate(()=>instances[1].play());assert.equal(await page.evaluate(()=>instances[1].getState().playing),false);
 await page.emulateMedia({reducedMotion:'no-preference'});
 await page.goto(`http://127.0.0.1:${server.address().port}/empty.html`);
 // Fake only the rAF scheduler for fast, deterministic autoplay / loop / teardown tests.
 await page.evaluate(async()=>{
  window.observers=[];const OriginalObserver=window.ResizeObserver;window.ResizeObserver=class extends OriginalObserver{constructor(fn){super(fn);observers.push(this);this.disconnected=false;}disconnect(){this.disconnected=true;super.disconnect();}};
  let next=0;window.frames=new Map();window.requestAnimationFrame=fn=>{frames.set(++next,fn);return next;};window.cancelAnimationFrame=id=>frames.delete(id);
  window.frame=stamp=>{const pending=[...frames.values()];frames.clear();pending.forEach(fn=>fn(stamp));};
  const {mountProfessorDemo}=await import('/professor-stick-figure/src/compact-demo.js');const div=document.createElement('div');div.style.cssText='width:300px;height:300px';document.body.append(div);window.clockDemo=mountProfessorDemo(div);frame(0);frame(clockDemo.getState().duration+2001);
 });
 assert.equal(await page.evaluate(()=>clockDemo.getState().loops),1);assert.ok(await page.evaluate(()=>clockDemo.getState().time<10));
 await page.evaluate(()=>clockDemo.pause());assert.equal(await page.evaluate(()=>frames.size),0);
 await page.evaluate(()=>{clockDemo.play();clockDemo.destroy();});assert.equal(await page.evaluate(()=>frames.size),0);assert.ok(await page.evaluate(()=>observers.every(o=>o.disconnected)));
 await page.evaluate(async()=>{const {mountProfessorDemo}=await import('/professor-stick-figure/src/compact-demo.js');const host=document.createElement('div');host.style.cssText='width:300px;height:300px';host.innerHTML='<span>Keep me</span>';document.body.append(host);const before=host.getAttribute('style');window.onceDemo=mountProfessorDemo(host,{loop:false});frame(0);frame(onceDemo.getState().duration+100);if(onceDemo.getState().playing)throw Error('non-looping animation did not stop');onceDemo.reset();if(onceDemo.getState().time!==0)throw Error('reset did not rewind');onceDemo.destroy();if(host.textContent!=='Keep me'||host.getAttribute('style')!==before)throw Error('host content/styles modified');});
 assert.equal(await page.evaluate(()=>window.spoken),0,'silent embeds never start speech');
 await page.evaluate(async()=>{const {mountProfessorDemo}=await import('/professor-stick-figure/src/compact-demo.js');const host=document.createElement('div');host.className='width-only';host.style.width='300px';document.body.append(host);window.widthDemo=mountProfessorDemo(host,{autoplay:false});});
 await page.waitForTimeout(100);const initialHeight=await page.locator('.width-only').evaluate(el=>el.clientHeight);await page.locator('.width-only').evaluate(el=>el.style.width='450px');await page.waitForTimeout(100);const nextHeight=await page.locator('.width-only').evaluate(el=>el.clientHeight);assert.ok(Math.abs(nextHeight/initialHeight-1.5)<.03,`width-only resizing: ${initialHeight} -> ${nextHeight}`);
 await page.evaluate(()=>widthDemo.destroy());
 // Full app coexists with an embed and retains every existing control and timeline value.
 await page.goto(base+'standalone.html');await page.waitForSelector('#seek');
 const fullBefore=await page.locator('#seek').inputValue();const count=await page.locator('button,input,select').count();
 await page.evaluate(async()=>{const {mountProfessorDemo}=await import('./src/compact-demo.js');const host=document.createElement('div');host.style.cssText='width:320px;height:300px';document.body.append(host);const d=mountProfessorDemo(host,{autoplay:false});d.seek(d.getState().duration);d.destroy();host.remove();});
 assert.equal(await page.locator('#seek').inputValue(),fullBefore);assert.equal(await page.locator('button,input,select').count(),count);
 await page.screenshot({path:'/tmp/professor-b2-full.png',fullPage:true});assert.deepEqual(errors,[]);
 console.log('Compact browser checks passed: standalone, responsive bounds, multiple instances, deterministic seek, autoplay, looping, cleanup, reduced motion and full app isolation.');
}finally{await browser?.close();await new Promise(done=>server.close(done));}
