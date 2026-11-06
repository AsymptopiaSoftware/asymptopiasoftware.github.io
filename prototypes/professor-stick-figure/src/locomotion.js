import { configureBody, attachedArm } from './body.js';
import { distance, solveIK, forward } from '../../drawing-arm/src/kinematics.js';
import { strokePoint } from '../../drawing-arm/src/timeline.js';
const clamp12 = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
const ease12 = t => t * t * (3 - 2 * t);
export function translatedBody(body, offset) {
  return { ...body, origin: [body.origin[0] + offset, body.origin[1]] };
}
function segmentDistance12(p, a, b) {
  const dx=b[0]-a[0],dy=b[1]-a[1],den=dx*dx+dy*dy;
  const t=den ? clamp12(((p[0]-a[0])*dx+(p[1]-a[1])*dy)/den,0,1) : 0;
  return distance(p,[a[0]+t*dx,a[1]+t*dy]);
}
function validPlacement12(points, arm) {
  const outer=arm.upper+arm.forearm+arm.tip, inner=Math.abs(arm.upper-arm.forearm-arm.tip);
  for (const p of points) if (!solveIK(arm,p).reachable) return false;
  for(let i=1;i<points.length;i++) {
    // Exact annular test for every point on each straight vector segment.
    if(segmentDistance12(arm.shoulder,points[i-1],points[i])<inner-1e-7) return false;
    // Original solver checks preferred/limited IK throughout each segment.
    const n=Math.max(1,Math.ceil(distance(points[i-1],points[i])/2));
    for(let j=1;j<n;j++)if(!solveIK(arm,points[i-1].map((v,k)=>v+(points[i][k]-v)*j/n)).reachable)return false;
  }
  return points.every(p=>distance(p,arm.shoulder)<=outer+1e-7);
}
/** Internal posture band, in world units. No new UI or joint constraints. */
export function writingRange(body, rig={}) {
  const arm=attachedArm(body,rig),reach=arm.upper+arm.forearm+arm.tip;
  return {min:.18*reach,max:.82*reach,preferred:.5*reach};
}
/** Keep a valid placement; otherwise center the forward-writing band. */
export function placementFor(points, body={}, rig={}, currentOffset=0) {
  body=configureBody(body);
  const base=attachedArm(body,rig), R=base.upper+base.forearm+base.tip;
  const current=attachedArm(translatedBody(body,currentOffset),rig),band=writingRange(body,rig);
  const comfortable=arm=>points.every(p=>p[0]-arm.shoulder[0]>=band.min-1e-7&&p[0]-arm.shoulder[0]<=band.max+1e-7);
  if(comfortable(current)&&validPlacement12(points,current))return currentOffset;
  for(const radius of [R*.94,R]) {
    let lo=-Infinity,hi=Infinity;
    for(const p of points) {
      const dy=p[1]-base.shoulder[1];
      if(Math.abs(dy)>radius+1e-8){lo=1;hi=0;break;}
      const dx=Math.sqrt(Math.max(0,radius*radius-dy*dy));
      lo=Math.max(lo,p[0]-dx-base.shoulder[0],p[0]-band.max-base.shoulder[0]);
      hi=Math.min(hi,p[0]+dx-base.shoulder[0],p[0]-band.min-base.shoulder[0]);
    }
    if(lo>hi+1e-8)continue;
    const targetCenter=(Math.min(...points.map(p=>p[0]))+Math.max(...points.map(p=>p[0])))/2;
    const preferred=clamp12(targetCenter-band.preferred-base.shoulder[0],lo,hi),candidates=[preferred,lo,hi,(lo+hi)/2];
    // Bounded search also handles inner dead zones and explicit joint limits.
    const n=Math.max(1,Math.ceil((hi-lo)/2));
    for(let i=0;i<=n;i++)candidates.push(lo+(hi-lo)*i/n);
    candidates.sort((a,b)=>Math.abs(a-preferred)-Math.abs(b-preferred));
    for(const x of candidates)if(comfortable(attachedArm(translatedBody(body,x),rig))&&validPlacement12(points,attachedArm(translatedBody(body,x),rig)))return x;
  }
  return null;
}
function angles12(pose) { return [pose.angles.shoulder,pose.angles.elbow]; }
/** Inserts grounded moves and pen-up approaches; source coordinates/timing are untouched. */
export function planWriting(timeline, bodyOptions={}, rig={}) {
  const body=configureBody(bodyOptions), phases=[],writes=[],blocked=[];
  if(timeline.strokes.some(s=>s.points.some(p=>!p.every(Number.isFinite))))throw new RangeError('Transformed writing points must be finite');
  const probes=timeline.strokes.reduce((sum,s)=>sum+s.points.slice(1).reduce((n,p,i)=>n+Math.max(1,Math.ceil(distance(s.points[i],p)/2)),0),0);
  if(!Number.isFinite(probes)||probes>100000)throw new RangeError('Timeline exceeds the spatial planning budget');
  let cursor=0,offset=0,sourceEnd=0,operations=0;
  const initial=attachedArm(body,rig);
  let pose=solveIK(initial,[initial.shoulder[0]+40*body.scale,initial.shoulder[1]+70*body.scale]);
  const restPose=pose;
  const add=(phase,duration)=>{const p={...phase,at:cursor,duration};phases.push(p);cursor+=duration;if(!Number.isFinite(cursor))throw new RangeError('Planned playback duration overflow');return p;};
  const hold=(duration,sourceTime,reason='gap')=>{if(duration>0)add({kind:'hold',offset,angles:angles12(pose),sourceTime,reason},duration);};
  function writePiece(points,duration,sourceAt,pen=true,clusterOffset=null) {
    if(++operations>5000)throw new RangeError('Timeline exceeds the 5000-piece planning budget');
    const next=placementFor(points,body,rig,clusterOffset??offset);
    if(next===null){blocked.push({sourceAt,points});hold(duration,sourceAt,'blocked');return;}
    if(Math.abs(next-offset)>1e-7) {
      const from=offset,angles=angles12(pose);
      // smoothstep peak speed <= 90 world units/second; every foot stays on floor.
      add({kind:'move',from,to:next,angles,sourceTime:sourceAt},Math.max(120,Math.abs(next-from)/90*1500));
      offset=next;pose=forward(attachedArm(translatedBody(body,offset),rig),...angles);
    }
    const arm=attachedArm(translatedBody(body,offset),rig),start=solveIK(arm,points[0]);
    if(distance(pose.tip,start.tip)>1e-6) {
      const a=angles12(pose),b=angles12(start),duration=Math.max(120,Math.max(Math.abs(a[0]-b[0]),Math.abs(a[1]-b[1]))/2*1000);
      add({kind:'approach',offset,fromAngles:a,toAngles:b,sourceTime:sourceAt},duration);
    }
    const lengths=[0];for(let i=1;i<points.length;i++)lengths.push(lengths.at(-1)+distance(points[i-1],points[i]));
    const stroke={at:0,duration,points,pen,lengths,length:lengths.at(-1)};
    const p=add({kind:'write',offset,arm,stroke,sourceAt,sourceTime:sourceAt},duration);writes.push(p);
    pose=solveIK(arm,points.at(-1));
  }
  let clusterUntil=-1,clusterOffset=null;
  for(const [index,s] of timeline.strokes.entries()) {
    hold(s.at-sourceEnd,sourceEnd);
    if(index>clusterUntil) {
      clusterUntil=index;clusterOffset=placementFor(s.points,body,rig,offset);
      if(clusterOffset!==null) {
        let points=[...s.points];
        // Reserve one stance for a small spatial/temporal cluster. Commit its end
        // so repeated lookahead cannot cause creeping moves at every stroke.
        for(let j=index+1;j<Math.min(timeline.strokes.length,index+24);j++) {
          const next=timeline.strokes[j],previous=timeline.strokes[j-1];
          if(next.at-previous.at-previous.duration>250||next.pen===false||s.pen===false)break;
          const candidate=[...points,...next.points],ys=candidate.map(p=>p[1]);
          if(Math.max(...ys)-Math.min(...ys)>.3*(initial.upper+initial.forearm+initial.tip))break;
          const stance=placementFor(candidate,body,rig,offset);
          if(stance===null)break;
          points=candidate;clusterUntil=j;clusterOffset=stance;
        }
      }
    }
    if(placementFor(s.points,body,rig,offset)!==null)writePiece(s.points,s.duration,s.at,s.pen!==false,clusterOffset);
    else {
      // A path wider than one workspace is split on its original straight edges.
      // No points are rescaled or shifted; reposition at lifted-chalk boundaries.
      for(let i=1;i<s.points.length;i++) {
        const p=s.points[i-1],q=s.points[i],length=distance(p,q),n=Math.max(1,Math.ceil(length/12));
        for(let j=0;j<n;j++) {
          const a=p.map((v,k)=>v+(q[k]-v)*j/n),b=p.map((v,k)=>v+(q[k]-v)*(j+1)/n);
          const fraction=s.length?length/n/s.length:1/(s.points.length-1)/n;
          writePiece([a,b],Math.max(.0001,s.duration*fraction),s.at+s.duration*(s.length?(s.lengths[i-1]+length*j/n)/s.length:0),s.pen!==false);
        }
      }
    }
    sourceEnd=s.at+s.duration;
  }
  hold(timeline.duration-sourceEnd,sourceEnd);
  const sourceToWall=sourceTime=>{
    const p=phases.find(p=>p.kind==='write'&&sourceTime<=p.sourceAt+p.duration);
    return p?p.at+clamp12(sourceTime-p.sourceAt,0,p.duration):cursor;
  };
  return {body,rig:structuredClone(rig),phases,writes,blocked,duration:cursor,restPose,sourceToWall};
}
export function samplePlan(plan,time) {
  if(!Number.isFinite(time))throw new RangeError('Time must be finite');
  const t=Math.max(0,time),phases=plan.phases;
  let p=phases.find(p=>t<p.at+p.duration);
  if(!p) {
    const last=phases.at(-1),offset=last?(last.offset??last.to):0;
    const end=last?samplePlan(plan,Math.max(0,plan.duration-1e-7)):null;
    return {kind:'done',offset,pose:end?.pose??plan.restPose,point:end?.point??null,penDown:false,chalkDown:false,done:true,sourceTime:Infinity};
  }
  const u=clamp12((t-p.at)/p.duration,0,1),f=ease12(u);
  if(p.kind==='write') {
    const point=strokePoint(p.stroke,u),pose=solveIK(p.arm,point),penDown=p.stroke.pen!==false;
    return {kind:'write',offset:p.offset,pose,point,penDown,chalkDown:penDown&&pose.reachable,done:false,sourceTime:p.sourceAt+u*p.duration};
  }
  const offset=p.kind==='move'?p.from+(p.to-p.from)*f:p.offset;
  const angles=p.kind==='approach'?p.fromAngles.map((v,i)=>v+(p.toAngles[i]-v)*f):p.angles;
  return {kind:p.kind,reason:p.reason,offset,pose:forward(attachedArm(translatedBody(plan.body,offset),plan.rig),...angles),point:null,penDown:false,chalkDown:false,done:false,sourceTime:p.kind==='hold'?p.sourceTime+u*p.duration:p.sourceTime};
}
