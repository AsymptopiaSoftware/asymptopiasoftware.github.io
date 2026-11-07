import test from 'node:test';
import assert from 'node:assert/strict';
import {ProfessorFigure} from '../src/figure.js';
import {stepCycle,walkingLandmarks} from '../src/gait.js';
import {configureBody} from '../src/body.js';
import {planWriting,samplePlan} from '../src/locomotion.js';
import {compileTimeline,textTimeline} from '../../drawing-arm/src/timeline.js';
import {distance} from '../../drawing-arm/src/kinematics.js';
import {SVGNode,installDOM} from '../../drawing-arm/tests/dom-fixture.js';
installDOM();
const raw=()=>textTimeline('2 × (3 + 4)\n= 14',{x:0,y:0,size:24,speed:135,lift:100,board:{origin:[355,140],scale:1,rotation:0}});
const near=(a,b,eps=1e-6)=>assert.ok(Math.abs(a-b)<eps,`${a} ≉ ${b}`);
test('B1.4 alternating footsteps plant the stance shoe in world space while the root advances',()=>{
 const f=new ProfessorFigure(new SVGNode('g'),raw());let leftSwings=0,rightSwings=0,locked=0,bobbed=false;
 for(const move of f.plan.phases.filter(p=>p.kind==='move')){
  let previous=null;
  for(let i=0;i<=160;i++){
   const s=f.render(move.at+move.duration*i/160),a=f.getAnchors(),ground=f.body.origin[1];
   if(a.leftFoot[1]<ground-.1){leftSwings++;near(a.rightFoot[1],ground);}
   if(a.rightFoot[1]<ground-.1){rightSwings++;near(a.leftFoot[1],ground);}
   near(Math.max(a.leftFoot[1],a.rightFoot[1]),ground);
   for(const side of ['left','right'])if(previous&&Math.abs(a[side+'Foot'][1]-ground)<1e-7&&Math.abs(previous[side+'Foot'][1]-ground)<1e-7){near(a[side+'Foot'][0],previous[side+'Foot'][0]);near(a[side+'Toe'][0],previous[side+'Toe'][0]);near(a[side+'Toe'][1],previous[side+'Toe'][1]);locked++;}
   if((s.bodyLift??0)<-.1)bobbed=true;
   if(s.kind==='move'){assert.equal(s.chalkDown,false);assert.equal(s.penDown,false);}
   assert.deepEqual(s.pose.shoulder,a.rightShoulder);previous=a;
  }
 }
 assert.ok(leftSwings>0&&rightSwings>0&&locked>100&&bobbed);
});
test('walking legs keep fixed bone lengths across short/tall bodies, scaling and both travel directions',()=>{
 for(const config of [{},{legHeight:80,hipWidth:12,footLength:10},{legHeight:160,hipWidth:60,footLength:40},{scale:1.3,legHeight:100,hipWidth:20}]){
  const b=configureBody(config);
  for(const delta of [-120,-20,20,120])for(let i=0;i<=100;i++){
   const state={kind:'move',move:{from:0,to:delta},offset:delta*i/100},p=walkingLandmarks(b,state);
   for(const side of ['left','right']){
    near(distance(p[side+'Hip'],p[side+'Knee']),.58*b.legHeight);
    near(distance(p[side+'Knee'],p[side+'Ankle']),.58*b.legHeight);
   }
  }
 }
});
test('foot and knee geometry is continuous at move boundaries and stops with both feet planted',()=>{
 const f=new ProfessorFigure(new SVGNode('g'),raw());
 for(const move of f.plan.phases.filter(p=>p.kind==='move'))for(const t of [move.at,move.at+move.duration]){
  f.render(Math.max(0,t-1e-6));const before=f.getAnchors();f.render(t+1e-6);const after=f.getAnchors();
  for(const name of ['leftFoot','rightFoot','leftToe','rightToe','leftKnee','rightKnee'])assert.ok(distance(before[name],after[name])<1e-3,name);
 }
 for(const write of f.plan.writes){
  f.render(write.at+write.duration*.1);const a=f.getAnchors();f.render(write.at+write.duration*.9);const b=f.getAnchors();
  for(const side of ['left','right']){near(a[side+'Foot'][1],505);near(b[side+'Foot'][1],505);assert.deepEqual(a[side+'Foot'],b[side+'Foot']);}
 }
 f.render(f.duration);near(f.getAnchors().leftFoot[1],505);near(f.getAnchors().rightFoot[1],505);
});
test('step count scales with distance and proportions, never with an independent clock',()=>{
 const b=configureBody();
 const cycle=d=>stepCycle(b,{kind:'move',move:{from:0,to:d},offset:d*.4});
 assert.ok(cycle(120).steps>cycle(20).steps);assert.equal(cycle(120).steps,cycle(-120).steps);
 assert.equal(stepCycle(b,{kind:'hold',offset:40}),null);
 assert.equal(stepCycle(b,{kind:'move',move:{from:5,to:5},offset:5}),null);
 const source=compileTimeline(raw()),plan=planWriting(source);
 for(const move of plan.phases.filter(p=>p.kind==='move')){
  const c=stepCycle(b,samplePlan(plan,move.at+move.duration*.5));assert.ok(move.duration>=c.steps*220-1e-6);
 }
});
test('walking is deterministic under seeks, leaves upright torso shape unchanged and preserves original writing',()=>{
 const json=raw(),copy=structuredClone(json),f=new ProfessorFigure(new SVGNode('g'),json),move=f.plan.phases.find(p=>p.kind==='move');
 const part=name=>f.bodyGroup.children.find(n=>n.getAttribute('data-part')===name).getAttribute('d');
 const torso=part('torso'),head=part('head');f.render(move.at+move.duration*.37);const pose=f.getAnchors(),leg=part('right-leg');
 assert.equal(part('torso'),torso);assert.equal(part('head'),head);
 assert.doesNotMatch(f.bodyGroup.getAttribute('transform'),/rotate/);
 f.render(f.duration);f.render(move.at+move.duration*.37);assert.deepEqual(f.getAnchors(),pose);assert.equal(part('right-leg'),leg);assert.deepEqual(json,copy);
});
