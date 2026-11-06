import test from 'node:test';
import assert from 'node:assert/strict';
import { textTimeline, compileTimeline } from '../../drawing-arm/src/timeline.js';
import { distance } from '../../drawing-arm/src/kinematics.js';
import { attachedArm } from '../src/body.js';
import { planWriting, samplePlan } from '../src/locomotion.js';
import { ProfessorFigure } from '../src/figure.js';
import { SVGNode, installDOM } from '../../drawing-arm/tests/dom-fixture.js';
installDOM();
const json=()=>textTimeline('2 × (3 + 4)\n= 14',{x:0,y:0,size:24,speed:135,lift:100,board:{origin:[355,140],scale:1,rotation:0}});
const close=(a,b,eps=1e-5)=>assert.ok(distance(a,b)<eps,`${a} ≉ ${b}`);
test('default equation uses anatomical arms, reaches every write point, and moves both directions',()=>{
 const source=compileTimeline(json()),plan=planWriting(source);
 assert.equal(plan.blocked.length,0);assert.ok(plan.duration>source.duration);
 assert.ok(plan.phases.some(p=>p.kind==='move'&&p.to>p.from));assert.ok(plan.phases.some(p=>p.kind==='move'&&p.to<p.from));
 for(let time=0;time<=plan.duration;time+=11){const s=samplePlan(plan,time);if(s.kind==='write'){assert.ok(s.pose.reachable);close(s.pose.tip,s.point);}else assert.equal(s.chalkDown,false);}
});
test('body and shoulder move together continuously, feet stay grounded, chalk lifts during every move',()=>{
 const f=new ProfessorFigure(new SVGNode('g'),json());let previous=f.render(0),anchors=f.getAnchors();
 const localDiff=[previous.pose.shoulder[0]-anchors.origin[0],previous.pose.shoulder[1]-anchors.origin[1]];
 for(let t=16;t<=f.duration;t+=16){const s=f.render(t),a=f.getAnchors();
  assert.ok(Math.abs(s.offset-previous.offset)<=90*.016+1e-5);assert.equal(a.leftFoot[1],505);assert.equal(a.rightFoot[1],505);
  close([s.pose.shoulder[0]-a.origin[0],s.pose.shoulder[1]-a.origin[1]],localDiff);
  assert.ok(Math.abs((a.leftFoot[0]-anchors.leftFoot[0])-(a.rightFoot[0]-anchors.rightFoot[0]))<1e-7);
  if(s.kind==='move'){assert.equal(s.chalkDown,false);assert.equal(s.penDown,false);}
  previous=s;anchors=a;
 }
});
test('writing phases keep the body stationary and use original renderer contact gates',()=>{
 const f=new ProfessorFigure(new SVGNode('g'),json());
 for(const p of f.plan.writes){
  const a=f.render(p.at+p.duration*.1),anchors=f.getAnchors(),b=f.render(p.at+p.duration*.9);
  assert.equal(a.offset,b.offset);assert.deepEqual(f.getAnchors().leftFoot,anchors.leftFoot);assert.deepEqual(f.getAnchors().rightFoot,anchors.rightFoot);
  assert.equal(a.chalkDown,a.penDown&&a.pose.reachable);assert.equal(b.chalkDown,b.penDown&&b.pose.reachable);
 }
});
test('all phase boundaries are continuous in shoulder and hand; no teleports between lift, move and write',()=>{
 const plan=planWriting(compileTimeline(json()));
 for(const p of plan.phases.slice(1)){
  const a=samplePlan(plan,p.at-1e-6),b=samplePlan(plan,p.at+1e-6);
  close(a.pose.shoulder,b.pose.shoulder,1e-3);close(a.pose.tip,b.pose.tip,1e-3);
 }
});
test('long polylines split without rescaling, missing reachable portions or stretching links',()=>{
 const raw={version:1,strokes:[{at:0,duration:2000,points:[[350,170],[800,170],[350,190]]}]},original=structuredClone(raw),plan=planWriting(compileTimeline(raw));
 assert.equal(plan.blocked.length,0);assert.ok(plan.writes.length>2);
 close(plan.writes[0].stroke.points[0],[350,170]);close(plan.writes.at(-1).stroke.points.at(-1),[350,190]);
 for(let i=1;i<plan.writes.length;i++)close(plan.writes[i-1].stroke.points.at(-1),plan.writes[i].stroke.points[0]);
 assert.ok(Math.abs(plan.writes.reduce((sum,p)=>sum+p.duration,0)-2000)<1e-6);
 for(const p of plan.writes){const s=samplePlan(plan,p.at+p.duration/2),a=attachedArm();assert.ok(s.pose.reachable);assert.ok(Math.abs(distance(s.pose.shoulder,s.pose.elbow)-a.upper)<1e-6);}
 assert.deepEqual(raw,original);
});
test('unfixable vertical reach is blocked, never drawn, and does not trigger endless movement',()=>{
 const raw={version:1,strokes:[{at:0,duration:300,points:[[500,-500],[520,-500]]}]},f=new ProfessorFigure(new SVGNode('g'),raw);
 assert.ok(f.plan.blocked.length>0);assert.equal(f.plan.writes.length,0);assert.equal(f.plan.phases.filter(p=>p.kind==='move').length,0);
 assert.ok(f.duration<1000);for(let t=0;t<=f.duration;t+=13)assert.equal(f.render(t).chalkDown,false);
});
test('chalk history persists across body movement and seeks reproduce exactly',()=>{
 const f=new ProfessorFigure(new SVGNode('g'),json()),move=f.plan.phases.find(p=>p.kind==='move'&&f.plan.writes.some(w=>w.at+w.duration<=p.at));
 f.render(move.at);const before=f.writers.map(w=>w.renderer.chalk.getAttribute('d'));
 f.render(move.at+move.duration*.5);assert.deepEqual(f.writers.map(w=>w.renderer.chalk.getAttribute('d')),before);
 const end=f.render(f.duration),paths=f.writers.map(w=>w.renderer.chalk.getAttribute('d'));
 f.render(0);assert.ok(f.writers.every(w=>w.renderer.chalk.getAttribute('d')===''));assert.deepEqual(f.render(f.duration),end);assert.deepEqual(f.writers.map(w=>w.renderer.chalk.getAttribute('d')),paths);
});
test('original JSON/source timing stays untouched; explicit pen-up instructions never draw',()=>{
 const raw={version:1,board:{origin:[355,140],scale:1,rotation:0},strokes:[{at:0,duration:300,pen:false,points:[[0,0],[20,0]]}]},copy=structuredClone(raw),f=new ProfessorFigure(new SVGNode('g'),raw);
 f.render(f.duration);assert.deepEqual(f.raw,copy);assert.deepEqual(raw,copy);assert.ok(f.writers.every(w=>w.renderer.chalk.getAttribute('d')===''));
});

test('excessive spatial planning is rejected atomically instead of blocking the tool',()=>{
 const f=new ProfessorFigure(new SVGNode('g'),json()),before=f.group.serialize();
 assert.throws(()=>f.setTimeline({version:1,strokes:[{at:0,duration:100,points:[[0,0],[1e12,0]]}]}),/spatial planning budget/);
 assert.equal(f.group.serialize(),before);
});
