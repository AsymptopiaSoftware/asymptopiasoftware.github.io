/** Two-link audience pose in anatomical 3D coordinates. x is anatomical right.
 * A smooth lateral pole selects the elbow independently of screen-space IK branches.
 */
export function audienceArmPose(arm,target,side,{elbowPreference='outward',maxExtension=.95}={}) {
  if(!['left','right'].includes(side)||!['outward','inward'].includes(elbowPreference)||!Number.isFinite(maxExtension)||maxExtension<=0||maxExtension>1)
    throw new RangeError('Invalid audience arm preference');
  const shoulder=[...arm.shoulder],upper=arm.upper,forearm=arm.forearm,tip=arm.tip??0,lower=forearm+tip;
  if(shoulder.length!==3||target.length!==3||![...shoulder,...target,upper,forearm,tip].every(Number.isFinite)||upper<=0||forearm<=0||tip<0)
    throw new RangeError('Invalid anatomical arm/target');
  const delta=target.map((v,i)=>v-shoulder[i]),desired=Math.hypot(...delta),reach=upper+lower,sign=side==='right'?1:-1;
  const direction=desired>1e-10?delta.map(v=>v/desired):[sign,0,0];
  if(reach*maxExtension<=Math.abs(upper-lower))throw new RangeError('Extension preference cannot fit these arm proportions');
  const distance=Math.max(Math.abs(upper-lower)+reach*1e-8,Math.min(reach*maxExtension,desired));
  const along=(upper*upper-lower*lower+distance*distance)/(2*distance),radius=Math.sqrt(Math.max(0,upper*upper-along*along));
  // A forward component prevents a branch flip as a hand passes shoulder height;
  // the downward component keeps near-horizontal gestures visibly bent and relaxed.
  const lateral=sign*(elbowPreference==='outward'?1:-1),pole=[lateral,.35,.30];
  const dot=pole.reduce((sum,v,i)=>sum+v*direction[i],0);
  let perpendicular=pole.map((v,i)=>v-dot*direction[i]),n=Math.hypot(...perpendicular);
  if(n<1e-8){const fallback=Math.abs(direction[1])<.9?[0,1,0]:[0,0,1],d=fallback.reduce((sum,v,i)=>sum+v*direction[i],0);perpendicular=fallback.map((v,i)=>v-d*direction[i]);n=Math.hypot(...perpendicular);}
  const elbow=shoulder.map((v,i)=>v+along*direction[i]+radius*perpendicular[i]/n);
  const end=shoulder.map((v,i)=>v+distance*direction[i]),wrist=elbow.map((v,i)=>v+(end[i]-v)*forearm/lower);
  return {shoulder,elbow,wrist,tip:end,elbowPreference,pole};
}
