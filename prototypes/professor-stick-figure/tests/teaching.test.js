import test from 'node:test';
import assert from 'node:assert/strict';
import {solveEquation} from '../../math-problems/src/solver.js';
import {compileTimeline,textTimeline} from '../../drawing-arm/src/timeline.js';
import {solutionToTimeline} from '../src/math-timeline.js';
import {planWriting} from '../src/locomotion.js';
import {teachingPlan,sampleTeaching,advanceTeaching} from '../src/teaching.js';
import {ProfessorFigure} from '../src/figure.js';
import {SVGNode,installDOM} from '../../drawing-arm/tests/dom-fixture.js';
installDOM();
const raw=solutionToTimeline(solveEquation('x/5-4/4=2/5'));
const base=planWriting(compileTimeline(raw)), plan=teachingPlan(base,raw.mathSteps);
test('structured boundaries produce one lower/rest per line and preserve every spatial writing/movement phase',()=>{
 assert.equal(plan.teachingSteps.length,raw.mathSteps.length);
 assert.equal(plan.writes.length,base.writes.length);
 for(let i=0;i<base.writes.length;i++){assert.deepEqual(plan.writes[i].stroke,base.writes[i].stroke);assert.equal(plan.writes[i].offset,base.writes[i].offset);}
 assert.deepEqual(plan.phases.filter(p=>p.kind==='move').map(({at,...p})=>p),base.phases.filter(p=>p.kind==='move').map(({at,...p})=>p));
 for(const [i,s] of plan.teachingSteps.entries()){
  assert.ok(Math.abs(s.resume-s.gate-1500)<1e-8);assert.ok(Math.abs(s.gate-s.complete-450)<1e-8);
  assert.deepEqual(s.operation,raw.mathSteps[i].operation);
  const finalWrite=plan.writes.filter(p=>p.sourceAt>=s.at-1e-6&&p.sourceAt<s.end).at(-1);
  assert.equal(s.complete,finalWrite.at+finalWrite.duration);
 }
 for(let i=1;i<plan.phases.length;i++)assert.ok(Math.abs(plan.phases[i].at-plan.phases[i-1].at-plan.phases[i-1].duration)<1e-6);
 assert.ok(Math.abs(plan.duration-plan.phases.at(-1).at-plan.phases.at(-1).duration)<1e-6);
});
test('chalk lifts before gradual lowering; relaxed hand, planted body and arm remain still throughout rest',()=>{
 for(const s of plan.teachingSteps){
  const written=sampleTeaching(plan,s.complete-.01),lift=sampleTeaching(plan,s.complete),mid=sampleTeaching(plan,s.complete+225),rest=sampleTeaching(plan,s.gate),later=sampleTeaching(plan,s.resume-.01);
  assert.equal(written.chalkDown,true);assert.equal(lift.chalkDown,false);assert.equal(mid.chalkDown,false);
  assert.ok(rest.pose.wrist[1]>written.pose.wrist[1]+15);assert.notDeepEqual(mid.pose.wrist,rest.pose.wrist);
  assert.deepEqual(rest.pose,later.pose);assert.equal(rest.offset,later.offset);assert.equal(rest.bodyLift,0);assert.equal(rest.teaching.index,s.index);
 }
 assert.deepEqual(sampleTeaching(plan,plan.duration).pose,sampleTeaching(plan,plan.duration-1).pose);
});
test('Step mode clamps oversized frames at each gate, Continue resumes exactly once, Auto passes gates',()=>{
 let t=0;
 for(const s of plan.teachingSteps.filter(s=>!s.final)){
  const stop=advanceTeaching(plan,t,plan.duration,'step');assert.equal(stop.waiting,true);assert.equal(stop.time,s.gate);
  assert.equal(advanceTeaching(plan,stop.time,5000,'step').time,s.gate);
  t=s.resume;
 }
 assert.equal(advanceTeaching(plan,t,plan.duration,'step').time,plan.duration);
 assert.equal(advanceTeaching(plan,0,plan.duration,'auto').time,plan.duration);
 assert.throws(()=>advanceTeaching(plan,0,-1),/Invalid/);
});
test('arbitrary forward/backward seeking reconstructs identical chalk, arm, teaching step and explanation',()=>{
 const f=new ProfessorFigure(new SVGNode('g'),raw);
 const snapshot=t=>{const s=f.render(t);return {s,arm:f.armSkin.getAttribute('d'),chalk:f.writers.map(w=>w.renderer.chalk.getAttribute('d'))};};
 const times=[0,...f.plan.teachingSteps.flatMap(s=>[s.complete-1,s.complete+225,s.gate+500,s.resume]),f.duration];
 const expected=times.map(snapshot);
 for(const i of [times.length-1,2,0,5,1,4,3,...times.keys()])assert.deepEqual(snapshot(times[i]),expected[i]);
});
test('free-writing stays unchanged and malformed teaching imports fail atomically',()=>{
 const free=textTimeline('4+5');assert.deepEqual(teachingPlan(planWriting(compileTimeline(free))).teachingSteps,[]);
 const f=new ProfessorFigure(new SVGNode('g'),raw),saved=f.plan;const bad=structuredClone(raw);bad.mathSteps[1].at=0;
 assert.throws(()=>f.setTimeline(bad),/teaching/);assert.equal(f.plan,saved);assert.deepEqual(f.raw,raw);
 const altered=structuredClone(raw);altered.mathSteps[0].text='Text is not a boundary';assert.equal(teachingPlan(base,altered.mathSteps).teachingSteps[0].complete,plan.teachingSteps[0].complete);
});
test('cadence remains grounded across changed body proportions and preserves blocked placements',()=>{
 for(const body of [{torsoLength:135,legHeight:135},{torsoLength:90,legHeight:100},{torsoLength:70,legHeight:80,shoulderOffset:[1,-30]}]){
  const f=new ProfessorFigure(new SVGNode('g'),raw,{body});
  assert.equal(f.plan.blocked.length,planWriting(compileTimeline(raw),body).blocked.length);
  for(const step of f.plan.teachingSteps){
   const state=f.render(step.gate+500),anchors=f.getAnchors();assert.equal(state.chalkDown,false);assert.equal(state.bodyLift,0);
   assert.equal(anchors.leftFoot[1],f.body.origin[1]);assert.equal(anchors.rightFoot[1],f.body.origin[1]);
   const arm=f.anatomicalPose.arms.right;assert.ok(Math.abs(Math.hypot(...arm.elbow.map((v,i)=>v-arm.shoulder[i]))*f.body.scale-f.arm.upper)<1e-6);
  }
 }
});
