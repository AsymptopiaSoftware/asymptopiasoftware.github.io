import test from 'node:test';
import assert from 'node:assert/strict';
import { configureBody, bodyLandmarks, bodyToWorld, attachedArm } from '../src/body.js';
import { ProfessorFigure } from '../src/figure.js';
import { textTimeline, compileTimeline, sampleArm } from '../../drawing-arm/src/timeline.js';
import { distance } from '../../drawing-arm/src/kinematics.js';
import { SVGNode, installDOM } from '../../drawing-arm/tests/dom-fixture.js';
installDOM();
const writing = textTimeline('2 × (3 + 4)\n= 14', {x:0,y:0,size:24,speed:135,lift:100,board:{origin:[355,140],scale:1,rotation:0}});
const variants = [
  {}, {headSize:1.3}, {neckLength:40}, {shoulderWidth:90}, {torsoLength:160},
  {hipWidth:60}, {legHeight:160}, {footLength:40}, {lean:25},
  {shoulderOffset:[20,-30]}, {rightShoulderOffset:[30,30]}, {leftShoulderOffset:[-20,10]},
  {headSize:.7,neckLength:8,shoulderWidth:24,torsoLength:70,hipWidth:12,legHeight:80,footLength:10,rightShoulderOffset:[-20,30]},
  {headSize:1.3,neckLength:40,shoulderWidth:90,torsoLength:160,hipWidth:60,legHeight:160,footLength:40,rightShoulderOffset:[30,-30]}
];
const near = (a,b) => assert.ok(distance(a,b)<1e-6,`${a} ≉ ${b}`);
test('B1.1 proportions derive a connected skeleton and preserve planted heel anchors',()=>{
  const fixed=bodyLandmarks();
  for(const config of variants){
    const b=configureBody(config),p=bodyLandmarks(b);
    assert.deepEqual(p.leftFoot,fixed.leftFoot);assert.deepEqual(p.rightFoot,fixed.rightFoot);
    assert.equal(p.leftToe[1],0);assert.equal(p.rightToe[1],0);
    assert.equal(p.leftToe[0]-p.leftFoot[0],b.footLength);
    assert.equal(p.hips[1],-b.legHeight);assert.equal(p.hips[1]-p.torsoTop[1],b.torsoLength);
    assert.equal(p.torsoTop[1]-p.neck[1],b.neckLength);
    assert.equal(p.rightHip[0]-p.leftHip[0],b.hipWidth);
    assert.ok(p.rightShoulder[0]>p.leftShoulder[0]);
    for(const point of Object.values(p))assert.ok(point.every(Number.isFinite));
  }
});
test('head size and neck length move head geometry without moving the writing shoulder',()=>{
  const f=new ProfessorFigure(new SVGNode('g'),writing),anchor=f.arm.shoulder;
  const head=()=>f.bodyGroup.children.find(n=>n.getAttribute('data-part')==='head').getAttribute('d');
  const before=head();f.setConfiguration({headSize:1.3,neckLength:36});
  assert.notEqual(head(),before);assert.deepEqual(f.arm.shoulder,anchor);
  assert.ok(f.bodyGroup.children.find(n=>n.getAttribute('data-part')==='hips'));
});
test('each proportion/shoulder edit preserves board targets, arm lengths and exact visible attachment',()=>{
  const f=new ProfessorFigure(new SVGNode('g'),writing), timeline=f.timeline, original=JSON.stringify(timeline);
  let reached=0,lifted=0;
  for(const config of variants){
    f.setConfiguration(config);const body=f.bodyGroup.serialize(),anchors=f.getAnchors();
    for(let time=0;time<=timeline.duration;time+=139){
      const state=f.render(time),pose=state.pose;
      assert.deepEqual(state.point,sampleArm(timeline,time,attachedArm()).point);
      assert.deepEqual(pose.shoulder,anchors.rightShoulder);
      near(pose.shoulder,bodyToWorld(bodyLandmarks(config).rightShoulder,config));
      near([Number(f.renderer.joints[0].getAttribute('cx')),Number(f.renderer.joints[0].getAttribute('cy'))],pose.shoulder);
      near([Number(f.renderer.pen.getAttribute('x1')),Number(f.renderer.pen.getAttribute('y1'))],pose.wrist);
      near([Number(f.renderer.pen.getAttribute('x2')),Number(f.renderer.pen.getAttribute('y2'))],pose.tip);
      assert.ok(Math.abs(distance(pose.shoulder,pose.elbow)-f.arm.upper)<1e-6);
      assert.ok(Math.abs(distance(pose.elbow,pose.wrist)-f.arm.forearm)<1e-6);
      if(pose.reachable){near(pose.tip,state.point);reached++;}else{assert.equal(state.chalkDown,false);lifted++;}
      assert.equal(f.bodyGroup.serialize(),body);assert.deepEqual(f.getAnchors().leftFoot,anchors.leftFoot);assert.deepEqual(f.getAnchors().rightFoot,anchors.rightFoot);
    }
    assert.equal(f.timeline,timeline);assert.equal(JSON.stringify(f.timeline),original);
  }
  assert.ok(reached>0);assert.ok(lifted>0);
});
test('shoulder edits reattach at the current writing time without resetting or accumulating transforms',()=>{
  const f=new ProfessorFigure(new SVGNode('g'),writing);f.render(1200);
  const target=f.render(1200).point;
  for(let i=0;i<3;i++){
    const body={origin:[230,505],scale:1.1,torsoLength:125,shoulderWidth:60,rightShoulderOffset:[12,-8]};
    f.setConfiguration(body);assert.equal(f.time,1200);assert.deepEqual(f.render(1200).point,target);
    near(f.arm.shoulder,f.getAnchors().rightShoulder);assert.equal(f.arm.upper,195*1.1);
    assert.equal(f.bodyGroup.getAttribute('transform'),'translate(230,505) scale(1.1)');
  }
});
test('configuration detaches mutable offsets; invalid proportion edits leave the visible rig intact',()=>{
  const options={shoulderOffset:[2,-8],rightShoulderOffset:[5,6]},b=configureBody(options);
  options.shoulderOffset[0]=999;options.rightShoulderOffset[1]=999;
  assert.deepEqual(b.shoulderOffset,[2,-8]);assert.deepEqual(b.rightShoulderOffset,[5,6]);
  const f=new ProfessorFigure(new SVGNode('g'),writing);f.render(800);const before=f.group.serialize();
  for(const bad of [{headSize:NaN},{neckLength:-2},{shoulderWidth:0},{torsoLength:500},{hipWidth:Infinity},{legHeight:0},{footLength:-5},{shoulderOffset:[0]},{rightShoulderOffset:[0,Infinity]},{leftShoulderOffset:[61,0]},{shoulderWidth:24,rightShoulderOffset:[-30,0]}]){
    assert.throws(()=>f.setConfiguration(bad));assert.equal(f.group.serialize(),before);assert.equal(f.time,800);
  }
});
test('original JSON round trips without remapping through the B1.1 body adapter',()=>{
  const raw=JSON.parse(JSON.stringify(writing)),f=new ProfessorFigure(new SVGNode('g'),raw,{body:{legHeight:140,torsoLength:140,rightShoulderOffset:[10,5]}});
  assert.deepEqual(f.timeline,compileTimeline(raw));assert.deepEqual(raw,writing);
  assert.deepEqual(raw.board,{origin:[355,140],scale:1,rotation:0});
});
