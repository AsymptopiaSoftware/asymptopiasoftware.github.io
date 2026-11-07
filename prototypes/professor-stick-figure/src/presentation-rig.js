import { bodyLandmarks, configureBody, bodyToWorld, attachedArm } from './body.js';
import { solveIK, forward, distance } from '../../drawing-arm/src/kinematics.js';
const mixPresentation=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
const smoothPresentation=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
/** Rotate the upper skeleton in projection; the planted foot anchors never change. */
export function orientedLandmarks(config,audience=0,base) {
  const b=configureBody(config),p=structuredClone(base??bodyLandmarks(b)),t=Math.max(0,Math.min(1,audience));
  const center=[p.hips[0]+b.lean*.35,p.shoulderCenter[1]+(b.leftShoulderOffset[1]+b.rightShoulderOffset[1])/2];
  const front={torsoTop:[center[0],p.torsoTop[1]],neck:[center[0],p.neck[1]],head:[center[0],p.head[1]],
    leftShoulder:[center[0]-.65*b.shoulderWidth-b.leftShoulderOffset[0],center[1]],
    rightShoulder:[center[0]+.65*b.shoulderWidth+b.rightShoulderOffset[0],center[1]],
    shoulderCenter:center};
  for(const [key,value]of Object.entries(front))p[key]=mixPresentation(p[key],value,t);
  return p;
}
/** A small single conversational phrase, with independent targets and gentle emphasis.
 * Poses enter and leave idle, so holding a Step gate never creates endless waving.
 */
export function gestureAngles(action,elapsed,side,arm) {
  const reach=arm.upper+arm.forearm+arm.tip,sign=side==='right'?1:-1;
  const idle=[.10,.92],targets={explain:side==='right'?[.64,.38]:[.52,.48],
    emphasize:side==='right'?[.34,-.20]:[.36,.68],count:side==='right'?[.30,-.10]:[.26,.70],
    present:side==='right'?[.80,.05]:[.38,.62],idle};
  const duration=action.duration,t=Math.max(0,Math.min(duration,elapsed));
  const envelope=smoothPresentation(t/500)*smoothPresentation((duration-t)/500);
  const target=targets[action.gesture],sway=action.gesture==='idle'?0:Math.sin(2*Math.PI*t/duration)*(side==='right'?.035:-.022);
  const x=idle[0]+(target[0]-idle[0])*envelope,y=idle[1]+(target[1]-idle[1])*envelope+sway*envelope;
  const pose=solveIK({...arm,elbow:side==='right'?'negative':'positive'},[arm.shoulder[0]+sign*x*reach,arm.shoulder[1]+y*reach]);
  return [pose.angles.shoulder,pose.angles.elbow];
}
/** Both arms preserve their own skeletal segment lengths throughout the turn. */
export function presentationRig(config,state,base,rig={}) {
  const b=configureBody(config),original=bodyLandmarks(b),p=orientedLandmarks(b,state.audience,base),a=state.audience;
  const action=state.presentation?.action??{gesture:'idle',duration:2400};
  const elapsed=state.presentation?.stage==='talk'?state.presentation.elapsed:0;
  const arms={};
  for(const side of ['left','right']){
    const right=side==='right',shoulder=p[side+'Shoulder'];
    const arm=right?{...attachedArm(b,rig),shoulder:bodyToWorld(shoulder,b)}:
      {shoulder:bodyToWorld(shoulder,b),upper:distance(original.leftShoulder,original.leftElbow)*b.scale,
       forearm:distance(original.leftElbow,original.leftHand)*b.scale,tip:0,elbow:'positive'};
    const initial=right?[state.pose.angles.shoulder,state.pose.angles.elbow]:[
      Math.atan2(original.leftElbow[1]-original.leftShoulder[1],original.leftElbow[0]-original.leftShoulder[0]),
      Math.atan2(original.leftHand[1]-original.leftElbow[1],original.leftHand[0]-original.leftElbow[0])-Math.atan2(original.leftElbow[1]-original.leftShoulder[1],original.leftElbow[0]-original.leftShoulder[0])];
    const target=gestureAngles(action,elapsed,side,arm);
    // Use the nearest equivalent angles to avoid an unnecessary full revolution.
    const angles=initial.map((v,i)=>v+Math.atan2(Math.sin(target[i]-v),Math.cos(target[i]-v))*a);
    const pose=forward(arm,...angles);arms[side]=pose;
    for(const [joint,point]of [['Elbow',pose.elbow],['Hand',pose.wrist]])p[side+joint]=point.map((v,i)=>(v-b.origin[i])/b.scale);
  }
  return {landmarks:p,arms};
}
/** Identical Bézier topology allows a continuous rear-profile → frontal head morph. */
export function presentationHead(p,headSize,audience=0) {
  const rear=[[-9,28],[-32,20],[-33,-18],[-10,-28],[8,-37],[25,-20],[25,-7],[37,1],[26,5],[25,20],[12,28],[-9,28]];
  const front=[[-10,28],[-31,20],[-31,-20],[-10,-29],[10,-35],[29,-20],[29,-7],[30,1],[29,6],[27,22],[12,29],[-10,28]];
  const c=rear.map((q,i)=>mixPresentation(q,front[i],audience).map((v,k)=>p.head[k]+v*headSize).join(','));
  return `M${c[0]} C${c[1]} ${c[2]} ${c[3]} C${c[4]} ${c[5]} ${c[6]} L${c[7]} L${c[8]} C${c[9]} ${c[10]} ${c[11]}Z`;
}
