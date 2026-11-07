/** Smooth tapered silhouette through joint-derived offsets; no skeleton changes. */
export function limbOutline(points, radii) {
  if(points.length<2||radii.length!==points.length)throw new TypeError('Limb needs matching joints and radii');
  if(points.some(p=>p.length!==2||!p.every(Number.isFinite))||radii.some(r=>!Number.isFinite(r)||r<0))throw new TypeError('Invalid limb geometry');
  const tangents=points.map((p,i)=>{const a=points[Math.max(0,i-1)],b=points[Math.min(points.length-1,i+1)],l=Math.hypot(b[0]-a[0],b[1]-a[1])||1;return [(b[0]-a[0])/l,(b[1]-a[1])/l];});
  const side=sign=>points.map((p,i)=>[p[0]-sign*tangents[i][1]*radii[i],p[1]+sign*tangents[i][0]*radii[i]]);
  const curve=ps=>ps.slice(1).map((p,j)=>{const i=j+1,a=ps[i-1],before=ps[Math.max(0,i-2)],after=ps[Math.min(ps.length-1,i+1)];return `C${a[0]+(p[0]-before[0])/6},${a[1]+(p[1]-before[1])/6} ${p[0]-(after[0]-a[0])/6},${p[1]-(after[1]-a[1])/6} ${p}`;}).join('');
  const left=side(1),right=side(-1).reverse(),last=points.at(-1),first=points[0];
  const end=last.map((v,i)=>v+tangents.at(-1)[i]*radii.at(-1)),start=first.map((v,i)=>v-tangents[0][i]*radii[0]);
  return `M${left[0]}${curve(left)}Q${end} ${right[0]}${curve(right)}Q${start} ${left[0]}Z`;
}
