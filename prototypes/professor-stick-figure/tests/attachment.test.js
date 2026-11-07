import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { configureBody, bodyToWorld, bodyLandmarks, attachedArm } from '../src/body.js';
import { ProfessorFigure } from '../src/figure.js';
import { SVGNode, installDOM } from '../../drawing-arm/tests/dom-fixture.js';
import { textTimeline } from '../../drawing-arm/src/timeline.js';
installDOM();
export const writing12=()=>textTimeline('2 × (3 + 4)\n= 14',{x:0,y:0,size:24,speed:135,lift:100,board:{origin:[355,140],scale:1,rotation:0}});
test('Drawing Arm algorithms and approved x-glyph extension match pinned hashes',async()=>{
 const lock=JSON.parse(await readFile(new URL('../engine-lock.json',import.meta.url),'utf8'));
 for(const f of lock.files){const data=await readFile(new URL('../../drawing-arm/'+f.path,import.meta.url));assert.equal(createHash('sha1').update(`blob ${data.length}\0`).update(data).digest('hex'),f.sha);}
});
test('anatomical arm lengths derive from torso and scale; shoulder is always a body landmark',()=>{
 for(const torsoLength of [70,115,160])for(const scale of [.8,1,1.2]){
  const b={torsoLength,scale,rightShoulderOffset:[12,-5]},a=attachedArm(b);
  assert.equal(a.upper,.65*torsoLength*scale);assert.equal(a.forearm,.55*torsoLength*scale);assert.equal(a.tip,.04*torsoLength*scale);
  assert.deepEqual(a.shoulder,bodyToWorld(bodyLandmarks(b).rightShoulder,b));
  assert.ok((a.upper+a.forearm)/scale < 1.3*torsoLength);
 }
 assert.deepEqual(attachedArm({}, {shoulder:[999,999]}).shoulder,[254,265]);
 assert.equal(attachedArm({}, {upper:999,forearm:999}).upper,.65*115);
});
test('rear-facing curved body includes all skeleton-derived anatomy and remains ground anchored',()=>{
 const f=new ProfessorFigure(new SVGNode('g'),writing12());
 assert.equal(f.bodyGroup.getAttribute('data-view'),'rear-three-quarter-facing-right');
 for(const part of ['head','left-arm','left-leg','right-leg','hips','torso','shoulders','left-foot','right-foot','body-skeleton'])assert.ok(f.bodyGroup.children.find(n=>n.getAttribute('data-part')===part),part);
 assert.match(f.armSkin.getAttribute('d'),/C/);assert.match(f.armSkin.getAttribute('d'),/Z$/);
 for(const t of [0,f.duration/2,f.duration]){f.render(t);assert.ok(Math.abs(Math.max(f.getAnchors().leftFoot[1],f.getAnchors().rightFoot[1])-505)<1e-6);}
});
test('invalid imports and invalid rig edits are atomic; cleanup works',()=>{
 const group=new SVGNode('g'),f=new ProfessorFigure(group,writing12());f.render(700);const before=group.serialize();
 assert.throws(()=>f.setTimeline({version:2,strokes:[]}));assert.equal(group.serialize(),before);
 assert.throws(()=>f.setConfiguration({scale:0}));assert.equal(group.serialize(),before);
 f.setDebug(true);assert.equal(f.armSkeleton.getAttribute('visibility'),'visible');f.setDebug(false);
 assert.equal(f.armSkeleton.getAttribute('visibility'),'hidden');f.destroy();assert.equal(group.children.length,0);
});
test('empty and fallback-only timelines stay finite without phantom chalk or locomotion',()=>{
 for(const raw of [{version:1,strokes:[]},textTimeline('α')]){
  const f=new ProfessorFigure(new SVGNode('g'),raw);const s=f.render(0);assert.equal(s.chalkDown,false);assert.equal(s.offset,0);assert.ok(s.pose.tip.every(Number.isFinite));assert.equal(f.writers.length,0);
 }
});
