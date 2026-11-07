import assert from 'node:assert/strict';
/** The real browser exercises Web Speech calls against a controllable backend.
 * Native voice availability is checked separately by the main browser test.
 */
export async function checkPresentationBrowser(browser,url,plan,screenshot) {
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{
  const calls=[];let active=null;
  const synth={getVoices:()=>[{name:'Test local voice',lang:'en-US',localService:true}],addEventListener(){},removeEventListener(){},
   cancel(){calls.push({type:'cancel'});active=null;},
   speak(u){if(active)throw Error('Overlapping speech');active=u;calls.push({type:'speak',text:u.text,rate:u.rate});},
   pause(){calls.push({type:'pause'});},resume(){calls.push({type:'resume'});}};
  Object.defineProperty(window,'speechSynthesis',{value:synth,configurable:true});
  Object.defineProperty(window,'SpeechSynthesisUtterance',{value:class{constructor(text){this.text=text;}},configurable:true});
  window.__speechTest={calls,end(){const u=active;active=null;u?.onend?.();},get active(){return !!active;}};
 });
 try{
  await page.goto(url);await page.waitForFunction(()=>document.querySelector('[data-part="right-arm"]')?.getAttribute('d'));
  const p=plan.presentations[0];
  await page.evaluate(()=>{window.__anatomicalNodes={right:document.querySelector('[data-layer="drawing-arm"]'),left:document.querySelector('[data-layer="left-arm"]')};});
  const shoulders=()=>page.evaluate(()=>({right:Number(window.__anatomicalNodes.right.getAttribute('data-shoulder-x')),left:Number(window.__anatomicalNodes.left.getAttribute('data-shoulder-x'))}));
  const rear=await shoulders();assert.ok(rear.right>rear.left);
  const seek=async t=>page.locator('#seek').evaluate((el,t)=>{el.value=t;el.dispatchEvent(new Event('input',{bubbles:true}));},t);
  const calls=()=>page.evaluate(()=>window.__speechTest.calls);
  const assertThoughtful=async()=>{
    const arms=await page.evaluate(()=>Object.fromEntries(['left','right'].map(side=>{const g=window.__anatomicalNodes[side];return [side,{role:g.getAttribute('data-hand-role'),shoulder:[Number(g.getAttribute('data-shoulder-x')),Number(g.getAttribute('data-shoulder-y'))],elbow:[Number(g.getAttribute('data-elbow-x')),Number(g.getAttribute('data-elbow-y'))],wrist:[Number(g.getAttribute('data-wrist-x')),Number(g.getAttribute('data-wrist-y'))]}];})));
    assert.equal(arms.left.role,'supporting');assert.equal(arms.right.role,'indicating');
    assert.ok(Math.hypot(arms.left.wrist[0]-arms.right.elbow[0],arms.left.wrist[1]-arms.right.elbow[1])<8);
    assert.ok(arms.right.wrist[1]<arms.right.elbow[1]-30);
    assert.ok(arms.right.elbow[1]>arms.right.shoulder[1]+40);
    assert.ok(arms.left.wrist[0]<arms.left.shoulder[0]);
  };
  assert.equal(await page.getByRole('checkbox',{name:'Mute',exact:true}).isChecked(),false);
  await page.locator('#teaching-mode').selectOption('step');
  await seek(p.at+300);assert.equal(await page.locator('[data-layer="body"]').getAttribute('data-orientation'),'transitioning');
  assert.equal(await page.locator('[data-layer="left-arm"]').getAttribute('data-depth-layer'),'far');assert.equal(await page.locator('[data-layer="drawing-arm"]').getAttribute('data-depth-layer'),'near');
  await seek(p.talkAt+900);assert.equal(await page.locator('[data-layer="body"]').getAttribute('data-orientation'),'audience');
  const front=await shoulders();assert.ok(front.right<front.left);await assertThoughtful();
  assert.equal(await page.evaluate(()=>window.__anatomicalNodes.right===document.querySelector('[data-layer="drawing-arm"]')&&window.__anatomicalNodes.left===document.querySelector('[data-layer="left-arm"]')),true);
  assert.equal(await page.locator('[data-layer="drawing-arm"]').getAttribute('data-anatomical-side'),'right');
  assert.equal(await page.locator('[data-layer="left-arm"]').getAttribute('data-anatomical-side'),'left');
  assert.equal(await page.evaluate(()=>window.__anatomicalNodes.right.parentElement.getAttribute('data-layer')==='near-arms'&&window.__anatomicalNodes.left.parentElement.getAttribute('data-layer')==='near-arms'),true);
  const chalk=await page.locator('[data-layer="chalk"]').innerHTML(),arm=await page.locator('[data-part="right-arm"]').getAttribute('d'),left=await page.locator('[data-part="left-arm"]').getAttribute('d');
  await page.getByRole('button',{name:'Play',exact:true}).click();await page.waitForFunction(()=>window.__speechTest.active);
  assert.equal((await calls()).find(c=>c.type==='speak').text,p.action.text);assert.match(await page.locator('#operation').textContent(),/Add 4\/4 to both sides/);
  await page.waitForFunction(start=>Number(document.querySelector('#seek').value)>start+180,p.talkAt+900);
  assert.notEqual(await page.locator('[data-part="left-arm"]').getAttribute('d'),left);assert.notEqual(await page.locator('[data-part="right-arm"]').getAttribute('d'),arm);
  await page.getByRole('button',{name:'Pause',exact:true}).click();assert.equal((await calls()).at(-1).type,'pause');
  await page.getByRole('button',{name:'Play',exact:true}).click();assert.equal((await calls()).at(-1).type,'resume');
  await page.getByRole('checkbox',{name:'Mute',exact:true}).check();assert.equal(await page.evaluate(()=>window.__speechTest.active),false);
  await page.getByRole('checkbox',{name:'Mute',exact:true}).uncheck();await page.waitForFunction(()=>window.__speechTest.active);
  await seek(p.talkAt+900);assert.equal(await page.evaluate(()=>window.__speechTest.active),false);
  assert.equal(await page.locator('[data-part="right-arm"]').getAttribute('d'),arm);assert.equal(await page.locator('[data-part="left-arm"]').getAttribute('d'),left);assert.equal(await page.locator('[data-layer="chalk"]').innerHTML(),chalk);
  await seek(p.talkEnd-.1);await page.getByRole('button',{name:'Play',exact:true}).click();await page.waitForFunction(()=>window.__speechTest.active);
  await page.waitForTimeout(100);assert.ok(Number(await page.locator('#seek').inputValue())<p.talkEnd);assert.equal(await page.locator('#continue').isDisabled(),true);
  await page.evaluate(()=>window.__speechTest.end());await page.waitForFunction(()=>!document.querySelector('#continue').disabled);
  assert.equal(await page.locator('[data-layer="body"]').getAttribute('data-orientation'),'audience');assert.equal(await page.locator('[data-layer="chalk"]').innerHTML(),chalk);
  await assertThoughtful();
  await page.getByRole('button',{name:'Continue',exact:true}).click();await page.waitForFunction(end=>Number(document.querySelector('#seek').value)>end+25&&document.querySelector('[data-layer="body"]').getAttribute('data-orientation')==='board',p.end);
  assert.equal(await page.locator('[data-layer="body"]').getAttribute('data-orientation'),'board');
  const returned=await shoulders();assert.ok(returned.right>returned.left);assert.equal(await page.evaluate(()=>window.__anatomicalNodes.right===document.querySelector('[data-layer="drawing-arm"]')),true);
  const next=plan.writes.find(w=>w.at>p.end);await seek(next.at+next.duration*.5);assert.match(await page.locator('#contact').textContent(),/CHALK DOWN/);
  await seek(p.talkAt+900);await page.getByRole('button',{name:'Play',exact:true}).click();await page.waitForFunction(()=>window.__speechTest.active);
  await page.getByRole('button',{name:'Reset',exact:true}).click();assert.equal(await page.evaluate(()=>window.__speechTest.active),false);assert.equal(await page.locator('#seek').inputValue(),'0');
  await seek(p.talkAt+900);await page.getByRole('button',{name:'Play',exact:true}).click();await page.waitForFunction(()=>window.__speechTest.active);
  if(screenshot){await page.getByRole('button',{name:'Pause',exact:true}).click();await page.screenshot({path:screenshot,fullPage:true});}
  assert.deepEqual(errors,[]);
 }finally{await page.close();}
}
