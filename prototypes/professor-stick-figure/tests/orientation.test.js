import test from 'node:test';
import assert from 'node:assert/strict';
import {characterFacing,projectAnatomical,liftProjected,projectSkeleton,turnBone,armDepthOrder} from '../src/orientation.js';
import {presentationRig} from '../src/presentation-rig.js';
import {compilePresentationAction,samplePresentationAction} from '../src/presentation-action.js';
import {samplePresentation} from '../src/presentation-plan.js';
import {ProfessorFigure} from '../src/figure.js';
import {bodyLandmarks,configureBody,attachedArm,bodyToWorld} from '../src/body.js';
import {solveIK,distance} from '../../drawing-arm/src/kinematics.js';
import {solveEquation} from '../../math-problems/src/solver.js';
import {solutionToTimeline} from '../src/math-timeline.js';
import {SVGNode,installDOM} from '../../drawing-arm/tests/dom-fixture.js';
installDOM();
const raw=solutionToTimeline(solveEquation('x/5-4/4=2/5'));
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} ≉ ${b}`),bone=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
test('renderer-independent facing transform reverses projected shoulder ordering without changing anatomical IDs',()=>{
 const joints={leftShoulder:[-30,-100,0],rightShoulder:[30,-100,0],leftHand:[-75,-50,6],rightHand:[80,-55,8]};
 for(const progress of [0,.1,.25,.4,.65,.8,1]){
  const facing=characterFacing(progress,{pivot:[15,25]}),projected=projectSkeleton(joints,facing);
  assert.deepEqual(Object.keys(projected),Object.keys(joints));
  for(const [key,point]of Object.entries(joints)){const roundTrip=liftProjected(projected[key].point,projected[key].depth,facing);point.forEach((v,i)=>near(v,roundTrip[i]));}
 }
 const rear=projectSkeleton(joints,characterFacing(0)),side=projectSkeleton(joints,characterFacing(.4)),front=projectSkeleton(joints,characterFacing(1));
 assert.ok(rear.rightShoulder.point[0]>rear.leftShoulder.point[0]);near(side.leftShoulder.point[0],side.rightShoulder.point[0]);
 assert.ok(side.rightShoulder.depth<side.leftShoulder.depth);assert.ok(front.rightShoulder.point[0]<front.leftShoulder.point[0]);
 assert.throws(()=>characterFacing(NaN));
});
test('bone turning preserves true lengths including large and antipodal rotations',()=>{
 for(const from of [[1,0,0],[0,5,0],[2,3,4]])for(const to of [[-1,0,0],[-1,.01,0],[0,-8,0],[3,1,-4]])for(const t of [0,.1,.25,.5,.75,.9,1])near(Math.hypot(...turnBone(from,to,t)),Math.hypot(...from));
 const end=turnBone([1,0,0],[-1,.01,0],1-1e-7),target=turnBone([1,0,0],[-1,.01,0],1);assert.ok(bone(end,target)<1e-5);
});
test('every shoulder/elbow/wrist/hand keeps its anatomical identity through varied-proportion turns',()=>{
 for(const body of [{},{torsoLength:90,shoulderWidth:70,scale:.8},{torsoLength:150,shoulderWidth:24,rightShoulderOffset:[-18,8],leftShoulderOffset:[-10,-5],lean:15},{torsoLength:70,legHeight:80,lean:35,scale:1.4}]){
  const b=configureBody(body),arm=attachedArm(b),reach=arm.upper+arm.forearm+arm.tip,p=bodyLandmarks(b);
  const pose=solveIK(arm,[arm.shoulder[0]+.1*reach,arm.shoulder[1]+.92*reach]);
  const clip=compilePresentationAction({type:'talk-and-gesture',text:'Consider this.',gesture:'explain'});
  for(const audience of [0,.1,.25,.4,.65,.8,1,.65,.25,0]){
   const r=presentationRig(b,{...samplePresentationAction(clip,clip.at),audience,pose},p);
   assert.ok(r.anatomical.joints.rightShoulder[0]>0);assert.ok(r.anatomical.joints.leftShoulder[0]<0);
   for(const side of ['left','right']){
    const a=r.anatomical.arms[side];assert.equal(a.id,side);assert.equal(r.arms[side].id,side);
    for(const joint of ['Shoulder','Elbow','Wrist','Hand'])assert.ok(r.anatomical.joints[side+joint].every(Number.isFinite));
    near(bone(a.shoulder,a.elbow),a.lengths.upper);near(bone(a.elbow,a.wrist),a.lengths.forearm);
    assert.ok(distance(r.arms[side].shoulder,r.arms[side].elbow)<=a.lengths.upper*b.scale+1e-7);
    assert.ok(distance(r.arms[side].elbow,r.arms[side].wrist)<=a.lengths.forearm*b.scale+1e-7);
   }
   assert.deepEqual(r.landmarks.leftFoot,p.leftFoot);assert.deepEqual(r.landmarks.rightFoot,p.rightFoot);
   if(audience===0)assert.deepEqual(r.arms.right.shoulder,pose.shoulder);
   if(audience===1)assert.ok(r.arms.right.shoulder[0]<r.arms.left.shoulder[0]);
  }
 }
});
test('depth order follows camera depth, including either turn direction, and SVG groups retain identity',()=>{
 const joints={};for(const side of ['left','right'])for(const joint of ['Shoulder','Elbow','Wrist'])joints[side+joint]=[side==='right'?30:-30,-100,0];
 for(const sign of [1,-1]){
  const facing=characterFacing(.4,{boardYaw:sign*Math.PI/6,audienceYaw:sign*Math.PI}),order=armDepthOrder(projectSkeleton(joints,facing),facing);
  assert.equal(order.arms.right.layer,sign===1?'near':'far');assert.equal(order.arms.left.layer,sign===1?'far':'near');
 }
 const f=new ProfessorFigure(new SVGNode('g'),raw),right=f.armGroup,left=f.leftArmGroup,p=f.plan.presentations[0];
 f.render(p.at+300);assert.equal(f.armGroup,right);assert.equal(f.leftArmGroup,left);
 assert.ok(f.farArms.children.includes(left));assert.ok(f.nearArms.children.includes(right));
 const root=f.group.children;assert.ok(root.indexOf(f.farArms)<root.indexOf(f.bodyGroup));assert.ok(root.indexOf(f.bodyGroup)<root.indexOf(f.nearArms));
 f.render(p.talkAt+900);assert.equal(f.armGroup,right);assert.equal(f.leftArmGroup,left);assert.ok(f.nearArms.children.includes(right));assert.ok(f.nearArms.children.includes(left));
 assert.equal(right.getAttribute('data-anatomical-side'),'right');assert.equal(left.getAttribute('data-anatomical-side'),'left');
 f.render(p.at);assert.ok(f.farArms.children.includes(left));assert.ok(f.nearArms.children.includes(right));
});
test('turns keep the root and feet planted, cross side-on continuously, and restore exact writing IK',()=>{
 const f=new ProfessorFigure(new SVGNode('g'),raw),p=f.plan.presentations[0];f.render(p.at);const origin=[...f.currentBody.origin],feet=[f.getAnchors().leftFoot,f.getAnchors().rightFoot];let previous;
 for(let i=0;i<=100;i++){
  f.render(p.at+(p.talkAt-p.at)*i/100);assert.deepEqual(f.currentBody.origin,origin);assert.deepEqual([f.getAnchors().leftFoot,f.getAnchors().rightFoot],feet);
  const pose=f.getAnchors();if(previous)for(const key of ['leftShoulder','rightShoulder','leftElbow','rightElbow','leftWrist','rightWrist'])assert.ok(distance(pose[key],previous[key])<10);
  previous=pose;
 }
 assert.ok(f.getAnchors().rightShoulder[0]<f.getAnchors().leftShoulder[0]);
 const writing=f.plan.writes.find(w=>w.at>p.end),time=writing.at+writing.duration/2,expected=samplePresentation(f.plan,time);const actual=f.render(time);
 assert.deepEqual(actual.pose,expected.pose);assert.equal(actual.chalkDown,true);assert.deepEqual(actual.pose.shoulder,bodyToWorld(bodyLandmarks(f.currentBody).rightShoulder,f.currentBody));
});
test('front-facing gestures use correct shoulders, present toward the board, and seek without accumulated pose/depth state',()=>{
 const f=new ProfessorFigure(new SVGNode('g'),raw),p=f.plan.presentations[0];
 const snapshot=time=>{const state=f.render(time);return {state,svg:f.group.serialize(),anatomy:f.getAnatomicalJoints()};};
 const times=[0,p.at,p.at+200,p.at+400,p.talkAt,p.talkAt+900,p.gate,p.resume+350,p.end,f.duration],expected=times.map(snapshot);
 for(const i of [8,4,9,2,7,0,6,1,5,3,...times.keys()])assert.deepEqual(snapshot(times[i]),expected[i]);
 f.render(p.talkAt+900);const joints=f.getAnatomicalJoints();joints.rightShoulder[0]=999;assert.notEqual(f.getAnatomicalJoints().rightShoulder[0],999);
 const b=f.currentBody,arm=attachedArm(b),reach=arm.upper+arm.forearm+arm.tip,pose=solveIK(arm,[arm.shoulder[0]+.1*reach,arm.shoulder[1]+.92*reach]);
 const clip=compilePresentationAction({type:'talk-and-gesture',text:'Look at the board.',gesture:'present'}),rig=presentationRig(b,{...samplePresentationAction(clip,clip.talkAt+900),pose});
 assert.ok(rig.arms.left.wrist[0]>rig.arms.left.shoulder[0]);assert.ok(rig.arms.right.shoulder[0]<rig.arms.left.shoulder[0]);
});
