import test from 'node:test';
import assert from 'node:assert/strict';
import { configureArm, forward, solveIK, distance, boardToWorld, textTimeline, compileTimeline, sampleTimeline, sampleArm, GLYPHS } from '../src/index.js';
const near=(a,b,e=1e-6)=>assert.ok(Math.abs(a-b)<e,`${a} ≉ ${b}`);
test('reachable FK → IK round trips preserve dimensions and target',()=>{
 for(const upper of [40,145,190])for(const forearm of [60,175,230])for(const elbow of ['positive','negative']){
  const a=configureArm({upper,forearm,elbow,shoulder:[30,-40],tip:12});
  for(let s=-2;s<=2;s+=.4)for(let e=.1;e<3;e+=.3){const p=forward(a,s,elbow==='positive'?e:-e),ik=solveIK(a,p.tip);assert.ok(ik.reachable);near(distance(ik.shoulder,ik.elbow),upper);near(distance(ik.elbow,ik.wrist),forearm);near(distance(ik.wrist,ik.tip),12);}
 }
});
test('preferred bend and handedness mirror elbow across target axis',()=>{
 const a={upper:10,forearm:10,shoulder:[0,0],tip:0};
 const p=solveIK(a,[10,0]),n=solveIK({...a,elbow:'negative'},[10,0]),l=solveIK({...a,side:'left'},[10,0]);
 near(p.elbow[0],n.elbow[0]);near(p.elbow[1],-n.elbow[1]);near(l.elbow[1],n.elbow[1]);
});
test('outer, inner, exact extension and folded singularities remain finite',()=>{
 for(const [a,p]of [[{upper:10,forearm:5,tip:0},[0,0]],[{upper:10,forearm:10,tip:0},[0,0]],[{upper:10,forearm:10,tip:0},[20,0]],[{upper:10,forearm:10,tip:0},[1000,0]]]){
  const ik=solveIK({...a,shoulder:[0,0]},p);assert.ok([...ik.tip,...ik.elbow,Object.values(ik.angles)[0]].every(Number.isFinite));near(distance(ik.shoulder,ik.elbow),a.upper);near(distance(ik.elbow,ik.wrist),a.forearm);
 }
 const r=solveIK({upper:10,forearm:5,tip:0,shoulder:[0,0]},[100,0]);assert.equal(r.reason,'out-of-reach');near(r.tip[0],15);
});
test('joint limits use alternate exact branch and find closest boundary pose',()=>{
 const a={upper:10,forearm:8,tip:0,shoulder:[0,0],limits:{shoulder:[-1,1],elbow:[-2,-.1]}};
 const target=forward(a,.4,-1).tip,p=solveIK(a,target);assert.ok(p.reachable);assert.ok(p.angles.elbow<0);
 for(const target of [[-8,8],[0,-20],[5,1],[100,20]]){
  const p=solveIK(a,target);assert.ok(p.angles.shoulder>=-1&&p.angles.shoulder<=1);assert.ok(p.angles.elbow>=-2&&p.angles.elbow<=-.1);
  for(let s=-1;s<=1;s+=.05)for(let e=-2;e<=-.1;e+=.05)assert.ok(p.error<=distance(forward(a,s,e).tip,target)+1e-6);
 }
 assert.equal(solveIK(a,[-8,8]).reason,'joint-limits');
});
test('angle ranges spanning another revolution work',()=>{
 const a={upper:10,forearm:10,tip:0,shoulder:[0,0],limits:{shoulder:[Math.PI,3*Math.PI],elbow:[0,Math.PI]}};
 assert.ok(solveIK(a,[10,0]).reachable);
});
test('invalid rig parameters and coordinates fail explicitly',()=>{
 for(const a of [{upper:0},{forearm:-1},{upper:NaN},{tip:-1},{shoulder:[Infinity,0]},{side:'up'},{elbow:'up'},{limits:{elbow:[1,0]}}])assert.throws(()=>configureArm(a));
 assert.throws(()=>solveIK({},[NaN,0]));assert.throws(()=>boardToWorld([0,0],{scale:0}));
});
test('board scale and rotation transform local coordinates',()=>{const p=boardToWorld([2,3],{origin:[10,20],scale:2,rotation:Math.PI/2});near(p[0],4);near(p[1],24);});
test('arc-length interpolation, lifts, pauses, seek and completion are deterministic',()=>{
 const t=compileTimeline({version:1,strokes:[{at:0,duration:100,points:[[0,0],[10,0],[10,30]]},{at:200,duration:100,points:[[20,30],[40,30]],pen:false}]});
 assert.deepEqual(sampleTimeline(t,50).point,[10,10]);assert.equal(sampleTimeline(t,50).penDown,true);
 assert.deepEqual(sampleTimeline(t,150).point,[15,30]);assert.equal(sampleTimeline(t,150).penDown,false);
 assert.equal(sampleTimeline(t,250).penDown,false);assert.equal(sampleTimeline(t,300).done,true);
 assert.deepEqual(sampleTimeline(t,50),sampleTimeline(t,50));assert.equal(sampleTimeline(compileTimeline({version:1,strokes:[]}),0).point,null);
});
test('timeline validation rejects malformed, overlapping, or nonfinite instructions',()=>{
 const stroke={at:0,duration:100,points:[[0,0],[1,1]]};
 for(const t of [{version:2,strokes:[]},{version:1,strokes:[{...stroke,duration:0}]},{version:1,strokes:[stroke,stroke]},{version:1,strokes:[{...stroke,points:[[NaN,0],[1,1]]}]},{version:1,strokes:[{...stroke,pen:'yes'}]}])assert.throws(()=>compileTimeline(t));
 assert.throws(()=>textTimeline('1',{speed:0}));
});
test('glyphs cover math vocabulary; unsupported text is explicit font fallback',()=>{
 for(const c of '0123456789+−×÷=()/')assert.ok(GLYPHS[c]);
 const t=textTimeline('2 × (3 + 4)\n= 14 α');assert.equal(t.fallbacks[0].text,'α');assert.ok(t.strokes.length>10);assert.doesNotThrow(()=>compileTimeline(JSON.parse(JSON.stringify(t))));
});
test('same instruction targets are independent of limb proportions; chalk lifts on failures',()=>{
 const t=compileTimeline(textTimeline('2 × (3 + 4)\n= 14',{x:150,y:106,size:30}));
 const a=configureArm({upper:215,forearm:200,shoulder:[95,285],tip:10}),b=configureArm({upper:170,forearm:255,shoulder:[95,285],tip:10});
 for(let time=0;time<t.duration;time+=17){const x=sampleArm(t,time,a),y=sampleArm(t,time,b);assert.deepEqual(x.point,y.point);assert.ok(x.pose.reachable);assert.ok(y.pose.reachable);}
 const failed=sampleArm(t,10,{upper:1,forearm:1,shoulder:[0,0]});assert.equal(failed.chalkDown,false);assert.equal(failed.pose.reachable,false);
});
