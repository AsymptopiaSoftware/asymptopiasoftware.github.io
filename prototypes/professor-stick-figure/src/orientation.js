/** Renderer-independent anatomical coordinates: x = the character's right,
 * y = down, z = forward. Orthographic camera depth increases away from viewer.
 * IDs describe anatomy, never the current screen-side ordering.
 */
export const ANATOMICAL_SIDES=Object.freeze(['left','right']);
export function characterFacing(audience,{boardYaw=Math.PI/6,audienceYaw=Math.PI,pivot=[0,0]}={}) {
  if(![audience,boardYaw,audienceYaw,...pivot].every(Number.isFinite)||pivot.length!==2)throw new RangeError('Invalid facing transform');
  const progress=Math.max(0,Math.min(1,audience)),yaw=boardYaw+(audienceYaw-boardYaw)*progress;
  return {progress,yaw,boardYaw,audienceYaw,pivot:[...pivot],cos:Math.cos(yaw),sin:Math.sin(yaw)};
}
export function projectAnatomical(point,facing) {
  const [x,y,z]=point;
  return {point:[facing.pivot[0]+x*facing.cos+z*facing.sin,facing.pivot[1]+y],depth:-x*facing.sin+z*facing.cos};
}
/** Lift a board-space joint with known camera depth into permanent anatomy. */
export function liftProjected(point,depth,facing) {
  const x=point[0]-facing.pivot[0];
  return [x*facing.cos-depth*facing.sin,point[1]-facing.pivot[1],x*facing.sin+depth*facing.cos];
}
export function projectSkeleton(joints,facing) {
  return Object.fromEntries(Object.entries(joints).map(([id,p])=>[id,projectAnatomical(p,facing)]));
}
/** Length-preserving interpolation of a bone, including antipodal directions. */
export function turnBone(from,to,t) {
  const length=Math.hypot(...from),targetLength=Math.hypot(...to);
  if(!length||!targetLength)throw new RangeError('Anatomical bones must have positive length');
  if(t<=0)return [...from];if(t>=1)return to.map(v=>v*length/targetLength);
  const a=from.map(v=>v/length),b=to.map(v=>v/targetLength),dot=Math.max(-1,Math.min(1,a.reduce((n,v,i)=>n+v*b[i],0)));
  let unit;
  if(dot>.9995){unit=a.map((v,i)=>v+(b[i]-v)*t);const n=Math.hypot(...unit);unit=unit.map(v=>v/n);}
  else if(dot<-.9995){
    let perpendicular=b.map((v,i)=>v-a[i]*dot),n=Math.hypot(...perpendicular);
    if(n<1e-10){const axis=Math.abs(a[0])<.9?[1,0,0]:[0,1,0];perpendicular=[a[1]*axis[2]-a[2]*axis[1],a[2]*axis[0]-a[0]*axis[2],a[0]*axis[1]-a[1]*axis[0]];n=Math.hypot(...perpendicular);}
    perpendicular=perpendicular.map(v=>v/n);const angle=Math.acos(dot);
    unit=a.map((v,i)=>v*Math.cos(angle*t)+perpendicular[i]*Math.sin(angle*t));
  }else {const angle=Math.acos(dot),den=Math.sin(angle);unit=a.map((v,i)=>(v*Math.sin((1-t)*angle)+b[i]*Math.sin(t*angle))/den);}
  return unit.map(v=>v*length);
}
/** Coarse whole-arm painter ordering. Stable ties; no geometry/identity swapping.
 * At the front, a small surface allowance places arms over the torso surface.
 */
export function armDepthOrder(projected,facing,surface=0) {
  const arms=ANATOMICAL_SIDES.map(side=>{
    const depth=['Shoulder','Elbow','Wrist'].reduce((n,joint)=>n+projected[side+joint].depth,0)/3;
    const allowance=surface*Math.max(0,-facing.cos);
    return {side,depth,layer:depth<=allowance+1e-9?'near':'far'};
  });
  const backToFront=(a,b)=>Math.abs(a.depth-b.depth)>1e-9?b.depth-a.depth:a.side.localeCompare(b.side);
  const far=arms.filter(a=>a.layer==='far').sort(backToFront),near=arms.filter(a=>a.layer==='near').sort(backToFront);
  return {arms:Object.fromEntries(arms.map(a=>[a.side,a])),order:[...far.map(a=>a.side),'torso',...near.map(a=>a.side)]};
}
