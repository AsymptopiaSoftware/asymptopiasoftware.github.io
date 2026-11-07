import test from 'node:test';
import assert from 'node:assert/strict';
import { configureBody, bodyLandmarks } from '../src/body.js';
import { ProfessorFigure } from '../src/figure.js';
import { SVGNode, installDOM } from '../../drawing-arm/tests/dom-fixture.js';
import { textTimeline } from '../../drawing-arm/src/timeline.js';
installDOM();
const raw=()=>textTimeline('14',{x:355,y:140,size:24});
test('proportions derive connected body landmarks with fixed local heels and variable toes',()=>{
 for(const options of [{},{headSize:1.3,neckLength:40},{shoulderWidth:90,hipWidth:60},{torsoLength:160,legHeight:160,footLength:40},{lean:25,rightShoulderOffset:[30,-20]}]){
  const b=configureBody(options),p=bodyLandmarks(b);assert.deepEqual(p.leftFoot,[-34,0]);assert.deepEqual(p.rightFoot,[31,0]);
  assert.equal(p.leftToe[0]-p.leftFoot[0],b.footLength);assert.equal(p.hips[1],-b.legHeight);
  assert.equal(p.hips[1]-p.torsoTop[1],b.torsoLength);assert.equal(p.torsoTop[1]-p.neck[1],b.neckLength);assert.equal(p.rightHip[0]-p.leftHip[0],b.hipWidth);
 }
});
test('body/shoulder edits replan at saved time without changing original board coordinates',()=>{
 const json=raw(),f=new ProfessorFigure(new SVGNode('g'),json),timeline=f.timeline,copy=JSON.stringify(timeline);f.render(500);
 for(const body of [{torsoLength:130,legHeight:140},{rightShoulderOffset:[20,-10],shoulderWidth:70},{headSize:1.2,neckLength:30}]){
  f.setConfiguration(body);assert.equal(f.time,500);assert.equal(f.timeline,timeline);assert.equal(JSON.stringify(f.timeline),copy);
  const s=f.render(500),a=f.getAnchors();assert.deepEqual(s.pose.shoulder,a.rightShoulder);assert.ok(Math.abs(Math.max(a.leftFoot[1],a.rightFoot[1])-505)<1e-6);
  assert.equal(Number(f.pen.getAttribute('x1')),s.pose.wrist[0]);assert.equal(Number(f.pen.getAttribute('x2')),s.pose.tip[0]);
 }
 assert.deepEqual(json,raw());
});
test('body arrays are detached and malformed/crossed proportion inputs are rejected',()=>{
 const options={rightShoulderOffset:[5,6]},b=configureBody(options);options.rightShoulderOffset[0]=999;assert.deepEqual(b.rightShoulderOffset,[5,6]);
 for(const bad of [{headSize:NaN},{legHeight:0},{footLength:-5},{shoulderOffset:[0]},{rightShoulderOffset:[0,Infinity]},{shoulderWidth:24,rightShoulderOffset:[-30,0]}])assert.throws(()=>configureBody(bad));
});
