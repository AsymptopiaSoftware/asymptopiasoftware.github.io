import test from 'node:test';
import assert from 'node:assert/strict';
import {solveEquation} from '../../math-problems/src/solver.js';
import {compileTimeline} from '../../drawing-arm/src/timeline.js';
import {distance,solveIK} from '../../drawing-arm/src/kinematics.js';
import {bodyLandmarks,bodyToWorld,configureBody,attachedArm} from '../src/body.js';
import {planWriting} from '../src/locomotion.js';
import {teachingPlan,advanceTeaching} from '../src/teaching.js';
import {solutionToTimeline} from '../src/math-timeline.js';
import {presentationAction,compilePresentationAction,samplePresentationAction,GESTURES} from '../src/presentation-action.js';
import {presentationPlan,samplePresentation,presentationAdvance} from '../src/presentation-plan.js';
import {presentationRig} from '../src/presentation-rig.js';
import {ProfessorFigure} from '../src/figure.js';
import {SVGNode,installDOM} from '../../drawing-arm/tests/dom-fixture.js';
installDOM();
const raw=solutionToTimeline(solveEquation('x/5-4/4=2/5'));
const base=teachingPlan(planWriting(compileTimeline(raw)),raw.mathSteps),plan=presentationPlan(base);
test('general presentation action compiles and samples arbitrary story/chart text without a math lesson',()=>{
 const clip=compilePresentationAction({type:'talk-and-gesture',text:'This chart shows how the garden grows.',gesture:'present'},{at:100});
 assert.equal(samplePresentationAction(clip,0).orientation,'board');assert.equal(samplePresentationAction(clip,450).orientation,'transitioning');
 assert.equal(samplePresentationAction(clip,clip.talkAt).orientation,'audience');assert.equal(samplePresentationAction(clip,clip.end).orientation,'board');
 assert.throws(()=>presentationAction({type:'write',text:'Hello'}));assert.throws(()=>presentationAction({type:'talk-and-gesture',text:'Hello',gesture:'wave'}));
 assert.throws(()=>compilePresentationAction({type:'talk-and-gesture',text:'Hello'},{turn:0}));
});
test('presentation wraps unchanged B1.8 phases, narrates the next operation and keeps Step gates after speaking',()=>{
 assert.equal(plan.presentations.length,base.teachingSteps.length);assert.equal(plan.writes.length,base.writes.length);
 for(let i=0;i<base.writes.length;i++){assert.deepEqual(plan.writes[i].stroke,base.writes[i].stroke);assert.equal(plan.writes[i].offset,base.writes[i].offset);}
 assert.equal(plan.presentations[0].action.text,raw.mathSteps[1].operation.explanation);
 assert.equal(plan.presentations.at(-1).action.text,raw.mathSteps.at(-1).operation.explanation);
 for(const [i,s]of plan.teachingSteps.entries()){
  const p=plan.presentations[i];assert.equal(p.at,s.complete+450);assert.equal(s.gate,p.talkEnd);assert.equal(s.resume-s.gate,1500);
  if(!s.final){assert.equal(advanceTeaching(plan,p.at,plan.duration,'step').time,s.gate);assert.equal(samplePresentation(plan,s.gate).orientation,'audience');}
 }
 for(let i=1;i<plan.phases.length;i++)assert.ok(Math.abs(plan.phases[i].at-plan.phases[i-1].at-plan.phases[i-1].duration)<1e-6);
 const custom=base.teachingSteps.map(()=>({type:'talk-and-gesture',text:'Let us tell a story.',gesture:'count',count:3}));assert.equal(presentationPlan(base,custom).presentations[0].action.gesture,'count');
 assert.throws(()=>presentationPlan(base,custom.slice(1)));
});
test('all gestures articulate both arms independently with invariant lengths and planted feet across body proportions',()=>{
 for(const body of [{},{torsoLength:90,legHeight:100,shoulderWidth:70},{torsoLength:150,scale:1.3,rightShoulderOffset:[12,-8]}]){
  const b=configureBody(body),arm=attachedArm(b),original=bodyLandmarks(b);
  const pose=solveIK(arm,[arm.shoulder[0]+.1*(arm.upper+arm.forearm+arm.tip),arm.shoulder[1]+.92*(arm.upper+arm.forearm+arm.tip)]);
  for(const gesture of GESTURES){
   const clip=compilePresentationAction({type:'talk-and-gesture',text:'Consider the story.',gesture,count:2});
   const samples=[clip.at,clip.at+350,clip.talkAt,clip.talkAt+900,clip.gate,clip.resume+350];
   const rigs=samples.map(t=>presentationRig(b,{...samplePresentationAction(clip,t),pose}));
   for(const r of rigs){
    assert.deepEqual(r.landmarks.leftFoot,original.leftFoot);assert.deepEqual(r.landmarks.rightFoot,original.rightFoot);
    for(const side of ['left','right']){
     const a=r.arms[side];assert.ok(a.wrist.every(Number.isFinite));
     assert.ok(Math.abs(distance(a.shoulder,a.elbow)-(side==='right'?arm.upper:distance(original.leftShoulder,original.leftElbow)*b.scale))<1e-6);
     assert.ok(Math.abs(distance(a.elbow,a.wrist)-(side==='right'?arm.forearm:distance(original.leftElbow,original.leftHand)*b.scale))<1e-6);
    }
   }
   if(gesture!=='idle'){assert.notDeepEqual(rigs[2].arms.left.wrist,rigs[3].arms.left.wrist);assert.notDeepEqual(rigs[2].arms.right.wrist,rigs[3].arms.right.wrist);}
   assert.deepEqual(rigs[2].arms,rigs[4].arms);
  }
 }
});
test('turns, gestures and return attachment are continuous with chalk untouched and deterministic seeking',()=>{
 const f=new ProfessorFigure(new SVGNode('g'),raw),p=f.plan.presentations[0];
 const snapshot=t=>{const s=f.render(t);return {s,body:f.bodyGroup.serialize(),arm:f.armGroup.serialize(),chalk:f.writers.map(w=>w.renderer.chalk.getAttribute('d'))};};
 const before=snapshot(p.at),middle=snapshot(p.talkAt+900),after=snapshot(p.end);
 assert.deepEqual(before.chalk,middle.chalk);assert.deepEqual(before.chalk,after.chalk);assert.equal(middle.s.chalkDown,false);
 assert.equal(middle.s.orientation,'audience');assert.notEqual(before.body,middle.body);assert.match(middle.body,/data-view="front-facing"/);assert.match(middle.body,/opacity="1"/);assert.equal(f.bodyGroup.getAttribute('data-orientation'),'board');
 const moving=snapshot(p.at+350);assert.equal(moving.s.orientation,'transitioning');assert.ok(moving.s.audience>0&&moving.s.audience<1);
 for(const t of [p.at,p.talkAt,p.gate,p.resume,p.end]){
  const a=snapshot(t-.001).s.pose,b=snapshot(t+.001).s.pose;assert.ok(distance(a.wrist,b.wrist)<.05);assert.ok(distance(a.shoulder,b.shoulder)<.05);
 }
 f.render(f.duration);assert.deepEqual(snapshot(p.talkAt+900),middle);assert.deepEqual(snapshot(p.at),before);assert.deepEqual(snapshot(p.end),after);
 const writing=f.plan.writes.find(w=>w.at>p.end);const s=f.render(writing.at+writing.duration/2);
 assert.equal(s.orientation,'board');assert.equal(s.chalkDown,true);assert.deepEqual(s.pose.shoulder,bodyToWorld(bodyLandmarks(f.currentBody).rightShoulder,f.currentBody));
 assert.ok(distance(s.pose.tip,s.point)<1e-6);
});
test('audio transport observes talk entry and holds at its end without skipping Step gates',()=>{
 const p=plan.presentations[0];assert.equal(presentationAdvance(plan,p.at,plan.duration),p.talkAt);
 assert.equal(presentationAdvance(plan,p.talkAt,plan.duration,true),p.talkEnd-.001);
 assert.equal(presentationAdvance(plan,p.talkEnd-.0001,plan.duration,true),p.talkEnd-.0001);
 assert.equal(presentationAdvance(plan,p.talkAt,p.gate,false),p.gate);
});
