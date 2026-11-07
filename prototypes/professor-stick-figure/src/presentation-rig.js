import {characterFacing,projectAnatomical,liftProjected,projectSkeleton,turnBone,armDepthOrder} from './orientation.js';
import { bodyLandmarks, configureBody, bodyToWorld, attachedArm } from './body.js';
import { solveIK, forward, distance } from '../../drawing-arm/src/kinematics.js';
const mixPresentation=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
const smoothPresentation=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
/** Targets are in the character's anatomical x/y plane, never screen left/right.
 * A small single conversational phrase, with independent targets and gentle emphasis.
 * Poses enter and leave idle, so holding a Step gate never creates endless waving.
 */
export function gestureAngles(action,elapsed,side,arm) {
  const reach=arm.upper+arm.forearm+arm.tip,sign=side==='right'?1:-1;
  const idle=[.16,.97],targets={explain:side==='right'?[.64,.38]:[.52,.48],
    emphasize:side==='right'?[.34,-.20]:[.36,.68],count:side==='right'?[.30,-.10]:[.26,.70],
    present:side==='left'?[.80,.05]:[.38,.62],idle};
  const duration=action.duration,t=Math.max(0,Math.min(duration,elapsed));
  const envelope=smoothPresentation(t/500)*smoothPresentation((duration-t)/500);
  const target=targets[action.gesture],sway=action.gesture==='idle'?0:Math.sin(2*Math.PI*t/duration)*(side==='right'?.035:-.022);
  const x=idle[0]+(target[0]-idle[0])*envelope,y=idle[1]+(target[1]-idle[1])*envelope+sway*envelope;
  const pose=solveIK({...arm,elbow:side==='right'?'negative':'positive'},[arm.shoulder[0]+sign*x*reach,arm.shoulder[1]+y*reach]);
  return [pose.angles.shoulder,pose.angles.elbow];
}
/** Calibrate the existing rear projection without changing its coordinates.
 * The right writing arm lifts in a camera-parallel plane; the left rest pose
 * recovers its foreshortened depth while preserving the original board silhouette.
 */
function anatomicalReference(config,base){
  const b=configureBody(config),p=base??bodyLandmarks(b),pivot=[(p.leftShoulder[0]+p.rightShoulder[0])/2,0];
  const board=characterFacing(0,{pivot}),joints={};
  for(const side of ['left','right']){
    const shoulder=p[side+'Shoulder'],depth=-(shoulder[0]-pivot[0])*Math.tan(board.yaw);
    joints[side+'Shoulder']=liftProjected(shoulder,depth,board);
  }
  for(const key of ['head','neck','torsoTop','shoulderCenter'])joints[key]=[0,p[key][1],(p[key][0]-pivot[0])/board.sin];
  return {body:b,base:p,board,joints};
}
export function orientedLandmarks(config,audience=0,base){
  const r=anatomicalReference(config,base),facing=characterFacing(audience,{pivot:r.board.pivot}),projected=projectSkeleton(r.joints,facing),p=structuredClone(r.base);
  if(audience!==0)for(const [key,joint]of Object.entries(projected))p[key]=joint.point;
  return p;
}
/** Permanent anatomical arm identities, then projection. Bones keep their actual
 * 3D lengths; their 2D projections can naturally foreshorten in a three-quarter view.
 */
export function presentationRig(config,state,base,rig={}) {
  const r=anatomicalReference(config,base),b=r.body,original=bodyLandmarks(b),a=Math.max(0,Math.min(1,state.audience)),facing=characterFacing(a,{pivot:r.board.pivot});
  const action=state.presentation?.action??{gesture:'idle',duration:2400};
  const elapsed=state.presentation?.stage==='talk'?state.presentation.elapsed:0;
  const joints={...r.joints},anatomicalArms={};
  const local=p=>p.map((v,i)=>(v-b.origin[i])/b.scale),subtract=(p,q)=>p.map((v,i)=>v-q[i]),add=(p,q)=>p.map((v,i)=>v+q[i]);
  for(const side of ['left','right']){
    const right=side==='right',shoulder=joints[side+'Shoulder'];
    const lengths=right?{upper:.65*b.torsoLength,forearm:.55*b.torsoLength,tip:.04*b.torsoLength}:
      {upper:Math.max(.65*b.torsoLength,distance(original.leftShoulder,original.leftElbow)),forearm:Math.max(.55*b.torsoLength,distance(original.leftElbow,original.leftHand)),tip:0};
    const boardDepth=projectAnatomical(shoulder,r.board).depth;
    const start=right?{shoulder:local(state.pose.shoulder),elbow:local(state.pose.elbow),wrist:local(state.pose.wrist)}:
      {shoulder:original.leftShoulder,elbow:original.leftElbow,wrist:original.leftHand};
    // The old left rest pose was a foreshortened projection. Recover depth instead
    // of treating those short screen segments as a physically shorter arm.
    const upperDepth=right?0:Math.sqrt(Math.max(0,lengths.upper**2-distance(start.shoulder,start.elbow)**2));
    const foreDepth=right?0:Math.sqrt(Math.max(0,lengths.forearm**2-distance(start.elbow,start.wrist)**2));
    const lifted={shoulder:liftProjected(start.shoulder,boardDepth,r.board),elbow:liftProjected(start.elbow,boardDepth+upperDepth,r.board),wrist:liftProjected(start.wrist,boardDepth+upperDepth+foreDepth,r.board)};
    const arm={...rig,...lengths,shoulder:shoulder.slice(0,2),elbow:right?'negative':'positive'};
    const target=forward(arm,...gestureAngles(action,elapsed,side,arm));
    const targetUpper=[target.elbow[0]-target.shoulder[0],target.elbow[1]-target.shoulder[1],0],targetFore=[target.wrist[0]-target.elbow[0],target.wrist[1]-target.elbow[1],0];
    const upper=turnBone(subtract(lifted.elbow,lifted.shoulder),targetUpper,a),fore=turnBone(subtract(lifted.wrist,lifted.elbow),targetFore,a);
    const elbow=add(shoulder,upper),wrist=add(elbow,fore),tip=add(wrist,fore.map(v=>v*lengths.tip/lengths.forearm));
    anatomicalArms[side]={id:side,shoulder:[...shoulder],elbow,wrist,hand:[...wrist],tip,lengths};
    for(const [name,p]of Object.entries({Shoulder:shoulder,Elbow:elbow,Wrist:wrist,Hand:wrist,Tip:tip}))joints[side+name]=p;
  }
  const projected=projectSkeleton(joints,facing),p=structuredClone(r.base),arms={};
  for(const [key,joint]of Object.entries(projected))p[key]=joint.point;
  if(a===0){for(const key of ['head','neck','torsoTop','shoulderCenter','leftShoulder','rightShoulder','leftElbow','leftHand'])p[key]=[...r.base[key]];}
  for(const side of ['left','right']){
    const world=name=>bodyToWorld(projected[side+name].point,b),shoulder=world('Shoulder'),elbow=world('Elbow'),wrist=world('Wrist');
    const angle=Math.atan2(elbow[1]-shoulder[1],elbow[0]-shoulder[0]);
    arms[side]={id:side,shoulder,elbow,wrist,tip:world('Tip'),angles:{shoulder:angle,elbow:Math.atan2(wrist[1]-elbow[1],wrist[0]-elbow[0])-angle}};
  }
  if(a===0)arms.right={...state.pose,id:'right'};
  return {landmarks:p,arms,anatomical:{joints,arms:anatomicalArms},projected,facing,depthOrder:armDepthOrder(projected,facing,.06*b.torsoLength)};
}
/** Identical Bézier topology allows a continuous rear-profile → frontal head morph. */
export function presentationHead(p,headSize,audience=0) {
  const rear=[[-9,28],[-32,20],[-33,-18],[-10,-28],[8,-37],[25,-20],[25,-7],[37,1],[26,5],[25,20],[12,28],[-9,28]];
  const front=[[-10,28],[-31,20],[-31,-20],[-10,-29],[10,-35],[29,-20],[29,-7],[30,1],[29,6],[27,22],[12,29],[-10,28]];
  const c=rear.map((q,i)=>mixPresentation(q,front[i],audience).map((v,k)=>p.head[k]+v*headSize).join(','));
  return `M${c[0]} C${c[1]} ${c[2]} ${c[3]} C${c[4]} ${c[5]} ${c[6]} L${c[7]} L${c[8]} C${c[9]} ${c[10]} ${c[11]}Z`;
}
