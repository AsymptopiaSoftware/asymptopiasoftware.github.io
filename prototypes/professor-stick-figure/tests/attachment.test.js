import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { configureBody, bodyToWorld, bodyLandmarks, attachedArm } from '../src/body.js';
import { ProfessorFigure } from '../src/figure.js';
import { compileTimeline, textTimeline, sampleArm } from '../../drawing-arm/src/timeline.js';
import { SVGNode, installDOM } from '../../drawing-arm/tests/dom-fixture.js';
installDOM();
const json = () => textTimeline('2 × (3 + 4)\n= 14', {x:0,y:0,size:24,speed:135,lift:100,board:{origin:[355,140],scale:1,rotation:0}});
const part = (figure, name) => figure.bodyGroup.children.find(el => el.getAttribute('data-part') === name);
test('original Drawing Arm sources match pinned GitHub blob hashes exactly', async () => {
  const lock = JSON.parse(await readFile(new URL('../engine-lock.json', import.meta.url), 'utf8'));
  for (const file of lock.files) {
    const data = await readFile(new URL('../../drawing-arm/'+file.path, import.meta.url));
    assert.equal(createHash('sha1').update(`blob ${data.length}\0`).update(data).digest('hex'),file.sha,file.path);
  }
});
test('body origin and shoulder have a stable, explicit local-to-world mapping', () => {
  assert.deepEqual(bodyLandmarks().rightShoulder,[24,-240]);
  assert.deepEqual(bodyToWorld([24,-240]),[254,265]);
  assert.deepEqual(attachedArm().shoulder,[254,265]);
  assert.deepEqual(attachedArm({}, {shoulder:[999,999]}).shoulder,[254,265]);
  const b={origin:[100,400],scale:1.25,lean:12}, arm=attachedArm(b,{upper:100,forearm:80,tip:8});
  assert.deepEqual(arm.shoulder,[145,100]);assert.equal(arm.upper,125);assert.equal(arm.forearm,100);assert.equal(arm.tip,10);
});
test('upper-body editing leaves hips, knees and both floor contacts fixed', () => {
  for (const lean of [-25,0,25]) {
    const a=bodyLandmarks({lean}),b=bodyLandmarks();
    for(const key of ['hips','leftKnee','rightKnee','leftFoot','rightFoot'])assert.deepEqual(a[key],b[key]);
    assert.equal(a.leftFoot[1],0);assert.equal(a.rightFoot[1],0);
    assert.equal(a.rightShoulder[0]-b.rightShoulder[0],lean);
  }
});
test('the figure uses rear-facing landmarks, a right-pointing head profile and far left arm', () => {
  const f=new ProfessorFigure(new SVGNode('g'),json());
  assert.equal(f.bodyGroup.getAttribute('data-view'),'rear-three-quarter-facing-right');
  assert.match(part(f,'head').getAttribute('d'),/L44,-281/);
  assert.ok(bodyLandmarks().rightShoulder[0]>bodyLandmarks().leftShoulder[0]);
  assert.equal(f.bodyGroup.children[0].getAttribute('data-part'),'left-arm');
  assert.ok(part(f,'torso'));assert.ok(part(f,'shoulders'));assert.ok(part(f,'legs'));
});
test('writing moves the arm while body SVG, feet and shoulder remain planted at every sampled time', () => {
  const f=new ProfessorFigure(new SVGNode('g'),json()),original=f.bodyGroup.serialize(),anchors=f.getAnchors();
  let previous=null,changed=false;
  for(let ms=0;ms<=f.timeline.duration;ms+=17){
    const s=f.render(ms);assert.deepEqual(s.pose.shoulder,anchors.rightShoulder);assert.ok(s.pose.reachable);
    assert.equal(f.bodyGroup.serialize(),original);assert.deepEqual(f.getAnchors(),anchors);
    if(previous&&JSON.stringify(s.pose.elbow)!==JSON.stringify(previous))changed=true;previous=s.pose.elbow;
  }
  assert.ok(changed);
});
test('composition sampling is identical to calling the original engine directly', () => {
  const input=json(),copy=structuredClone(input),f=new ProfessorFigure(new SVGNode('g'),input),t=compileTimeline(input);
  for(const ms of [-1,0,120,2500,t.duration,t.duration+20])assert.deepEqual(f.render(ms),sampleArm(t,ms,attachedArm()));
  assert.deepEqual(input,copy);
});
test('reconfiguration keeps visible shoulder and engine anchor attached, without accumulating transforms', () => {
  const f=new ProfessorFigure(new SVGNode('g'),json());f.render(200);
  for(const lean of [20,-10,0]){
    f.setConfiguration({origin:[230,505],scale:1,lean},{upper:195,forearm:180,tip:10});
    assert.deepEqual(f.render(200).pose.shoulder,f.getAnchors().rightShoulder);
    assert.deepEqual([Number(f.renderer.joints[0].getAttribute('cx')),Number(f.renderer.joints[0].getAttribute('cy'))],f.getAnchors().rightShoulder);
    assert.equal(f.bodyGroup.getAttribute('transform'),'translate(230,505) scale(1)');
  }
});
test('short arms keep the planted figure and suppress unreachable chalk through the original engine', () => {
  const f=new ProfessorFigure(new SVGNode('g'),json(),{rig:{upper:10,forearm:10,tip:0}}),body=f.bodyGroup.serialize();
  const s=f.render(100);assert.equal(s.chalkDown,false);assert.equal(s.pose.reachable,false);assert.equal(f.renderer.chalk.getAttribute('d'),'');assert.equal(f.bodyGroup.serialize(),body);
});
test('invalid input is atomic; empty timelines, debug anchors and cleanup work', () => {
  const group=new SVGNode('g'),f=new ProfessorFigure(group,json());f.render(100);const before=group.serialize();
  assert.throws(()=>f.setTimeline({version:2,strokes:[]}));assert.equal(group.serialize(),before);
  assert.throws(()=>f.setConfiguration({scale:0}));assert.equal(group.serialize(),before);
  f.setDebug(true);assert.equal(f.debugGroup.getAttribute('visibility'),'visible');f.setDebug(false);
  f.setTimeline({version:1,strokes:[]});assert.equal(f.render(0).pose,null);assert.ok(part(f,'head'));
  f.destroy();assert.equal(group.children.length,0);
});
test('body coordinates reject malformed and nonfinite geometry', () => {
  for(const body of [{origin:[0,NaN]},{origin:[0]},{scale:0},{scale:Infinity},{lean:36},{lean:NaN}])assert.throws(()=>configureBody(body));
  assert.throws(()=>bodyToWorld([Infinity,0]));
});
