import test from 'node:test';
import assert from 'node:assert/strict';
import {compileTimeline,textTimeline} from '../../drawing-arm/src/timeline.js';
import {solveIK} from '../../drawing-arm/src/kinematics.js';
import {attachedArm} from '../src/body.js';
import {planWriting,samplePlan,writingRange,placementFor} from '../src/locomotion.js';
const equation=()=>compileTimeline(textTimeline('2 × (3 + 4)\n= 14',{x:0,y:0,size:24,speed:135,lift:100,board:{origin:[355,140],scale:1,rotation:0}}));
test('B1.3 shoulder stays comfortably left of every chalk target across complete writing phases',()=>{
 for(const body of [{},{torsoLength:130,legHeight:140},{scale:1.15,torsoLength:140,rightShoulderOffset:[12,-8]}]){
  const source=equation(),copy=JSON.stringify(source),plan=planWriting(source,body),band=writingRange(body);
  assert.equal(plan.blocked.length,0);
  for(let time=0;time<plan.duration;time+=9){const s=samplePlan(plan,time);if(s.kind==='write'){
   const dx=s.point[0]-s.pose.shoulder[0];assert.ok(dx>=band.min-1e-6);assert.ok(dx<=band.max+1e-6);assert.ok(s.pose.reachable);
  }else assert.equal(s.chalkDown,false);}
  assert.equal(JSON.stringify(source),copy);
 }
});
test('a mathematically reachable backward target triggers a lifted leftward move before writing',()=>{
 const points=[[180,250],[195,250]],arm=attachedArm();assert.ok(points.every(p=>solveIK(arm,p).reachable));
 assert.ok(placementFor(points,{}, {},0)<0);
 const plan=planWriting(compileTimeline({version:1,strokes:[{at:0,duration:400,points}]}));
 const move=plan.phases.find(p=>p.kind==='move');assert.ok(move.to<move.from);assert.ok(move.at+move.duration<=plan.writes[0].at);
 for(let t=move.at;t<move.at+move.duration;t+=13)assert.equal(samplePlan(plan,t).chalkDown,false);
 assert.ok(plan.writes[0].arm.shoulder[0]<180-writingRange({}).min+1e-6);
});
test('nearby small strokes share one comfortable stance rather than repositioning within the cluster',()=>{
 const paths=[[[355,200],[365,210]],[[370,200],[380,210]],[[385,200],[395,210]],[[360,214],[390,214]]];
 const source=compileTimeline({version:1,strokes:paths.map((points,i)=>({at:i*400,duration:300,points}))});
 const plan=planWriting(source);assert.equal(plan.blocked.length,0);assert.equal(plan.writes.length,4);
 assert.equal(plan.phases.filter(p=>p.kind==='move').length,1);assert.equal(new Set(plan.writes.map(p=>p.offset)).size,1);
 const move=plan.phases.find(p=>p.kind==='move');assert.ok(move.at+move.duration<=plan.writes[0].at);
});
test('hysteresis retains an already comfortable placement and line/cluster changes can reposition',()=>{
 const source=compileTimeline({version:1,strokes:[{at:0,duration:200,points:[[310,200],[330,210]]},{at:300,duration:200,points:[[320,202],[340,212]]}]});
 const plan=planWriting(source);assert.equal(plan.phases.filter(p=>p.kind==='move').length,0);assert.ok(plan.writes.every(p=>p.offset===0));
 const full=planWriting(equation());assert.ok(full.phases.some(p=>p.kind==='move'&&p.to<p.from));
});
