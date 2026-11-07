import test from 'node:test';
import assert from 'node:assert/strict';
import {thoughtfulArms} from '../src/thoughtful-pose.js';
import {GESTURES,compilePresentationAction} from '../src/presentation-action.js';
import {ProfessorFigure} from '../src/figure.js';
import {samplePresentation} from '../src/presentation-plan.js';
import {solveEquation} from '../../math-problems/src/solver.js';
import {solutionToTimeline} from '../src/math-timeline.js';
import {SVGNode,installDOM} from '../../drawing-arm/tests/dom-fixture.js';
installDOM();
const dist=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
const raw=()=>solutionToTimeline(solveEquation('x/5-4/4=2/5'));
function assertSupport(f){
 const a=f.anatomicalPose,raised=a.arms.right,support=a.arms.left;
 assert.equal(raised.role,'indicating');assert.equal(support.role,'supporting');assert.equal(support.allowsCrossing,true);
 assert.equal(a.supportContact.reachable,true);assert.ok(a.supportContact.gap<1e-6);
 assert.ok(dist(support.wrist,raised.elbow)<raised.lengths.upper*.10);assert.ok(support.wrist[1]>raised.elbow[1]);
 assert.ok(support.wrist[0]>support.shoulder[0]);assert.ok(raised.wrist[1]<raised.elbow[1]-raised.lengths.forearm*.6);
 for(const arm of [raised,support]){assert.ok(Math.abs(dist(arm.shoulder,arm.elbow)-arm.lengths.upper)<1e-7);assert.ok(Math.abs(dist(arm.elbow,arm.wrist)-arm.lengths.forearm)<1e-7);}
}
test('thoughtful-explain is the preferred action and lesson default; legacy explain aliases it and explicit gestures survive',()=>{
 assert.deepEqual(GESTURES,['thoughtful-explain','present','emphasize','idle']);
 assert.equal(compilePresentationAction({type:'talk-and-gesture',text:'Consider this.'}).action.gesture,'thoughtful-explain');
 assert.equal(compilePresentationAction({type:'talk-and-gesture',text:'Consider this.',gesture:'explain'}).action.gesture,'thoughtful-explain');
 const f=new ProfessorFigure(new SVGNode('g'),raw());assert.ok(f.plan.presentations.every(p=>p.action.gesture==='thoughtful-explain'));
 const json=raw();json.presentationActions=json.mathSteps.map((s,i)=>({type:'talk-and-gesture',text:json.mathSteps[Math.min(i+1,json.mathSteps.length-1)].operation.explanation,gesture:'present'}));
 assert.ok(new ProfessorFigure(new SVGNode('g'),json).plan.presentations.every(p=>p.action.gesture==='present'));
});
test('one anatomical hand supports the opposite elbow with compact raised forearm across body proportions',()=>{
 for(const body of [{},{torsoLength:90,legHeight:100,shoulderWidth:45,scale:.8},{torsoLength:150,shoulderWidth:70,scale:1.3}]){
  const f=new ProfessorFigure(new SVGNode('g'),raw(),{body}),p=f.plan.presentations[0];
  for(const elapsed of [0,125,500,900,1400,p.action.duration-1]){
   f.render(p.talkAt+elapsed);assertSupport(f);const {left,right}=f.anatomicalPose.arms;
   assert.ok(right.elbow[0]-right.shoulder[0]>=0);assert.ok(right.elbow[1]-right.shoulder[1]>.7*right.lengths.upper);
   assert.ok(left.elbow[1]-left.shoulder[1]>.6*left.lengths.upper);
   const projected=f.getAnchors(),u=projected.rightShoulder.map((v,i)=>v-projected.rightElbow[i]),v=projected.rightWrist.map((v,i)=>v-projected.rightElbow[i]);
   assert.ok(u.reduce((s,q,i)=>s+q*v[i],0)/(Math.hypot(...u)*Math.hypot(...v))<.95,'raised forearm visually collapses against upper arm');
   assert.ok(right.elbow[0]-left.elbow[0]<(right.shoulder[0]-left.shoulder[0])+.4*right.lengths.upper,'symmetric arms-out pose');
  }
 }
});
test('small hand cue maintains support contact and a still, reproducible held pose',()=>{
 const f=new ProfessorFigure(new SVGNode('g'),raw()),p=f.plan.presentations[0],wrists=[];
 for(let i=0;i<=40;i++){f.render(p.talkAt+(p.action.duration-.01)*i/40);assertSupport(f);wrists.push([...f.anatomicalPose.arms.right.wrist]);}
 const motion=Math.max(...wrists.map(w=>dist(w,wrists[0])));assert.ok(motion>1&&motion<8);
 f.render(p.gate+100);const held=structuredClone(f.anatomicalPose);f.render(p.resume-10);assert.deepEqual(f.anatomicalPose,held);
 assert.equal(f.hands.getAttribute('data-anatomical-side'),'right');assert.ok(f.hands.getAttribute('d').includes(' M'));
});
test('coupled support is deterministic while turning/seeking and restores the original writing pose and arm identities',()=>{
 const f=new ProfessorFigure(new SVGNode('g'),raw()),p=f.plan.presentations[0],right=f.armGroup,left=f.leftArmGroup;
 const times=[0,p.at,p.at+250,p.talkAt,p.talkAt+900,p.gate,p.resume+300,p.end,f.duration];
 const snapshot=t=>{const s=f.render(t);return {s,svg:f.group.serialize(),anatomy:structuredClone(f.anatomicalPose)};};const expected=times.map(snapshot);
 for(const i of [8,4,1,7,3,0,6,2,5,...times.keys()])assert.deepEqual(snapshot(times[i]),expected[i]);
 assert.equal(f.armGroup,right);assert.equal(f.leftArmGroup,left);
 const w=f.plan.writes.find(w=>w.at>p.end),t=w.at+w.duration/2;assert.deepEqual(f.render(t).pose,samplePresentation(f.plan,t).pose);assert.equal(f.render(t).chalkDown,true);
});
test('unusual proportions retain finite, unstretched bones and report unreachable support honestly',()=>{
 const arms={right:{shoulder:[80,0,0],upper:40,forearm:35,tip:3},left:{shoulder:[-80,0,0],upper:40,forearm:35,tip:0}};
 const pose=thoughtfulArms(arms,900,2400);assert.equal(pose.supportContact.reachable,false);assert.ok(pose.supportContact.gap>0);
 for(const side of ['left','right']){assert.ok(pose[side].wrist.every(Number.isFinite));assert.ok(Math.abs(dist(pose[side].shoulder,pose[side].elbow)-arms[side].upper)<1e-7);assert.ok(Math.abs(dist(pose[side].elbow,pose[side].wrist)-arms[side].forearm)<1e-7);}
});
