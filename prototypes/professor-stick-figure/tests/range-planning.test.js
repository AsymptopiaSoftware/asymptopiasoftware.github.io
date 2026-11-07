import test from 'node:test';
import assert from 'node:assert/strict';
import {textTimeline,compileTimeline} from '../../drawing-arm/src/timeline.js';
import {attachedArm} from '../src/body.js';
import {planWriting,samplePlan,writingRange} from '../src/locomotion.js';
import {groupWritingStrokes} from '../src/range-planning.js';
const source=text=>compileTimeline(textTimeline(text,{x:0,y:0,size:24,speed:135,lift:100,board:{origin:[355,140],scale:1,rotation:0}}));
const moves=plan=>plan.phases.filter(p=>p.kind==='move');
// Independent exact interval-cover oracle for ordinary unrestricted arm rigs.
// Boundary candidates suffice because every common interval contains a boundary.
function minimumMoves(groups,body) {
 const arm=attachedArm(body),R=arm.upper+arm.forearm+arm.tip,band=writingRange(body);
 const intervals=groups.map(g=>g.points.reduce(([lo,hi],p)=>{
  const dy=p[1]-arm.shoulder[1],dx=Math.sqrt(Math.max(0,R*R-dy*dy));
  if(Math.abs(dy)>R)return [Infinity,-Infinity];
  return [Math.max(lo,p[0]-arm.shoulder[0]-Math.min(dx,band.max)),Math.min(hi,p[0]-arm.shoulder[0]-band.min)];
 },[-Infinity,Infinity]));
 const candidates=[0,...intervals.flat()],cost=new Map([[0,0]]);
 for(const [lo,hi]of intervals){const best=Math.min(...cost.values()),next=new Map();for(const x of candidates)if(x>=lo-1e-6&&x<=hi+1e-6)next.set(x,Math.min(cost.get(x)??Infinity,best+1));cost.clear();for(const entry of next)cost.set(...entry);}
 return Math.min(...cost.values());
}
test('B1.5 groups multi-stroke glyphs and lines without changing source geometry',()=>{
 const t=source('1+3=10\n(4+5)=9'),copy=JSON.stringify(t),{groups}=groupWritingStrokes(t);
 assert.equal(new Set(groups.map(g=>g.line)).size,2);assert.equal(groups.filter(g=>g.line===0).length,6);assert.equal(groups.filter(g=>g.line===1).length,7);
 assert.ok(groups.some(g=>g.end>g.start));assert.equal(JSON.stringify(t),copy);
});
test('short acceptance line uses a shared stance for multiple symbols and one walk with taller proportions',()=>{
 const t=source('4/8+7/x=5/3'),plan=planWriting(t,{torsoLength:160,legHeight:160});
 assert.equal(plan.blocked.length,0);assert.equal(moves(plan).length,1);
 assert.ok(plan.ranges.some(r=>r.end-r.start>=3));
 for(const r of plan.ranges){
  const selected=plan.writes.filter(w=>w.sourceAt>=t.strokes[r.firstStroke].at&&w.sourceAt<=t.strokes[r.lastStroke].at);
  assert.equal(new Set(selected.map(w=>w.offset)).size,1);
 }
});
test('movement count follows feasible line intervals, not a fixed number of steps or walks',()=>{
 for(const body of [{},{legHeight:145},{torsoLength:160,legHeight:160}])for(const text of ['4/8+7/x=5/3','1234567890','11+33=10']){
  const plan=planWriting(source(text),body);assert.equal(plan.blocked.length,0);
  assert.equal(moves(plan).length,minimumMoves(plan.groups,body),JSON.stringify({body,text}));
 }
 const tight=planWriting(source('4/8+7/x=5/3'));
 assert.equal(moves(tight).length,minimumMoves(tight.groups,{}),'handwritten glyph extents still use the minimum feasible stances');
});
test('repositioning occurs between complete glyph groups whenever each glyph can fit',()=>{
 const t=source('11+33=10'),plan=planWriting(t);
 for(const group of plan.groups){
  const writes=plan.writes.filter(w=>w.sourceAt>=t.strokes[group.start].at&&w.sourceAt<=t.strokes[group.end].at);
  assert.equal(new Set(writes.map(w=>w.offset)).size,1);
 }
 for(const r of plan.ranges)assert.equal(plan.groups[r.start].line,plan.groups[r.end].line);
});
test('range planning still preserves forward reach, planted stance gait and lifted chalk while walking',()=>{
 const t=source('4/8+7/x=5/3\n= 1'),copy=JSON.stringify(t),body={torsoLength:145,legHeight:145},plan=planWriting(t,body),band=writingRange(body);
 for(let time=0;time<plan.duration;time+=13){const s=samplePlan(plan,time);if(s.kind==='write'){
  assert.ok(s.pose.reachable);assert.ok(s.point[0]-s.pose.shoulder[0]>=band.min-1e-6);assert.ok(s.point[0]-s.pose.shoulder[0]<=band.max+1e-6);
 }else assert.equal(s.chalkDown,false);}
 assert.equal(JSON.stringify(t),copy);
});
