import test from 'node:test';
import assert from 'node:assert/strict';
import {audienceGestureTargets} from '../src/thoughtful-pose.js';
import {presentationAction} from '../src/presentation-action.js';
const distance=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
test('compact presentation keeps anatomical left relaxed and right gently indicating with constant bone lengths',()=>{
 for(const scale of [.7,1,1.4]){
  const arms={left:{shoulder:[-25*scale,0,0],upper:75*scale,forearm:63*scale},right:{shoulder:[25*scale,0,0],upper:75*scale,forearm:63*scale,tip:4*scale}};
  const action=presentationAction({type:'talk-and-gesture',text:'Add to both sides.',gesture:'present',indicatingArm:'right'});
  const rest=audienceGestureTargets(arms,{gesture:'idle',duration:action.duration},0);
  for(const elapsed of [0,250,600,1200,action.duration]){
   const p=audienceGestureTargets(arms,action,elapsed);assert.deepEqual(p.left,rest.left);assert.equal(p.right.role,'indicating');
   for(const side of ['left','right']){assert.ok(Math.abs(distance(p[side].shoulder,p[side].elbow)-arms[side].upper)<1e-7);assert.ok(Math.abs(distance(p[side].elbow,p[side].wrist)-arms[side].forearm)<1e-7);}
   assert.ok(p.right.elbow[1]>.9*arms.right.upper,'upper arm remains low instead of horizontal');
  }
 }
});
test('full application retains thoughtful default and legacy left present gesture',()=>{
 assert.equal(presentationAction({type:'talk-and-gesture',text:'Explain.'}).gesture,'thoughtful-explain');
 assert.throws(()=>presentationAction({type:'talk-and-gesture',text:'Explain.',indicatingArm:'unknown'}));
});
