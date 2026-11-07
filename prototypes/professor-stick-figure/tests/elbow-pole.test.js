import test from 'node:test';
import assert from 'node:assert/strict';
import {audienceArmPose} from '../src/audience-arm.js';
import {presentationRig} from '../src/presentation-rig.js';
import {compilePresentationAction,samplePresentationAction,GESTURES} from '../src/presentation-action.js';
import {configureBody,attachedArm} from '../src/body.js';
import {solveIK} from '../../drawing-arm/src/kinematics.js';
import {solveEquation} from '../../math-problems/src/solver.js';
import {solutionToTimeline} from '../src/math-timeline.js';
import {ProfessorFigure} from '../src/figure.js';
import {SVGNode,installDOM} from '../../drawing-arm/tests/dom-fixture.js';
installDOM();
const length=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
function rigFor(body,gesture,time=900,extra={}){
 const b=configureBody(body),a=attachedArm(b),reach=a.upper+a.forearm+a.tip;
 const pose=solveIK(a,[a.shoulder[0]+.1*reach,a.shoulder[1]+.92*reach]);
 const clip=compilePresentationAction({type:'talk-and-gesture',text:'Explain this clearly.',gesture,duration:2400,...extra});
 return presentationRig(b,{...samplePresentationAction(clip,clip.talkAt+time),pose});
}
function assertOutward(rig){
 for(const side of ['left','right']){
  const a=rig.anatomical.arms[side],sign=side==='right'?1:-1;
  assert.equal(a.elbowPreference,'outward');assert.ok(sign*(a.elbow[0]-a.shoulder[0])>a.lengths.upper*.2,`${side} elbow collapses toward torso`);
  assert.ok(Math.abs(length(a.elbow,a.shoulder)-a.lengths.upper)<1e-7);assert.ok(Math.abs(length(a.wrist,a.elbow)-a.lengths.forearm)<1e-7);
  const u=a.elbow.map((v,i)=>v-a.shoulder[i]),v=a.wrist.map((v,i)=>v-a.elbow[i]);
  const cosine=u.reduce((n,q,i)=>n+q*v[i],0)/(a.lengths.upper*a.lengths.forearm);assert.ok(cosine<.9,'arm is rigidly straight');
 }
}
test('front idle and held teaching postures have relaxed outward elbows on both anatomical arms',()=>{
 for(const b of [{},{torsoLength:80,shoulderWidth:30,scale:.8},{torsoLength:155,shoulderWidth:75,scale:1.3}])for(const elapsed of [0,900,2400,3000])assertOutward(rigFor(b,'idle',elapsed));
 const raw=solutionToTimeline(solveEquation('x/5-4/4=2/5')),f=new ProfessorFigure(new SVGNode('g'),raw),p=f.plan.presentations[0];
 const a=f.render(p.gate+200),first=structuredClone(f.anatomicalPose);assertOutward({anatomical:first});f.render(p.resume-100);assert.deepEqual(f.anatomicalPose,first);assert.equal(a.chalkDown,false);
});
test('all conversation gestures keep outward poles throughout varied poses without fixing a static elbow angle',()=>{
 const angles=[];
 for(const body of [{},{torsoLength:90,legHeight:100,scale:.8},{torsoLength:150,shoulderWidth:70,scale:1.2}])for(const gesture of GESTURES)for(const time of [0,125,350,500,750,1200,1900,2399]){
  const rig=rigFor(body,gesture,time);assertOutward(rig);const a=rig.anatomical.arms.right;angles.push(Math.atan2(a.elbow[1]-a.shoulder[1],a.elbow[0]-a.shoulder[0]));
 }
 assert.ok(Math.max(...angles)-Math.min(...angles)>.3);
});
test('outward pole follows moving wrist targets smoothly above and below shoulder height; inward is explicit opt-in',()=>{
 for(const side of ['left','right']){
  const sign=side==='right'?1:-1,arm={shoulder:[sign*26,0,0],upper:75,forearm:63,tip:0};let last;
  for(let i=0;i<=100;i++){
   const pose=audienceArmPose(arm,[sign*80,-50+i,0],side);assert.ok(sign*(pose.elbow[0]-pose.shoulder[0])>15);
   if(last)assert.ok(length(pose.elbow,last.elbow)<3,'IK pole branch flips');last=pose;
  }
  const neutral=audienceArmPose(arm,[sign*40,110,0],side),inward=audienceArmPose(arm,[sign*40,110,0],side,{elbowPreference:'inward'});
  assert.ok(sign*(neutral.elbow[0]-inward.elbow[0])>30);
 }
 const clip=compilePresentationAction({type:'talk-and-gesture',text:'A deliberate crossing gesture.',gesture:'explain',elbowPreference:'inward'});assert.equal(clip.action.elbowPreference,'inward');
 assert.throws(()=>compilePresentationAction({...clip.action,elbowPreference:'random'}));
});
test('automatic outward audience pose preserves turn identity, draw layers, deterministic seeking and exact rear writing',()=>{
 const f=new ProfessorFigure(new SVGNode('g'),solutionToTimeline(solveEquation('x/5-4/4=2/5'))),p=f.plan.presentations[0],right=f.armGroup,left=f.leftArmGroup;
 const before=f.render(p.at),board=structuredClone(before.pose);f.render(p.at+(p.talkAt-p.at)*.95);assertOutward({anatomical:f.anatomicalPose});
 f.render(p.talkAt+900);const snapshot=f.group.serialize(),anatomy=structuredClone(f.anatomicalPose);assertOutward({anatomical:anatomy});
 assert.equal(f.armGroup,right);assert.equal(f.leftArmGroup,left);assert.ok(f.nearArms.children.includes(right)&&f.nearArms.children.includes(left));
 f.render(f.duration);f.render(p.talkAt+900);assert.equal(f.group.serialize(),snapshot);assert.deepEqual(f.anatomicalPose,anatomy);
 f.render(p.at);assert.deepEqual(f.render(p.at).pose,board);
 const w=f.plan.writes.find(w=>w.at>p.end),state=f.render(w.at+w.duration*.5);assert.equal(state.chalkDown,true);assert.equal(state.orientation,'board');assert.deepEqual(state.pose.shoulder,w.arm.shoulder);
});
