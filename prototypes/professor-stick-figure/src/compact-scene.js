import {bodyToWorld} from './body.js';
import {translatedBody} from './locomotion.js';
import {walkingLandmarks} from './gait.js';
import {samplePresentation} from './presentation-plan.js';
import {presentationRig} from './presentation-rig.js';

/** Stable world-space camera; never changes the chalkboard or writing coordinates.
 * Sample phase boundaries and intermediate rig poses, with silhouette safety padding.
 */
export function compactScene(plan,timeline) {
  const ink=timeline.strokes.flatMap(s=>s.points);
  if(!ink.length)throw new RangeError('Compact demo requires writing strokes');
  const extent=points=>({left:Math.min(...points.map(p=>p[0])),right:Math.max(...points.map(p=>p[0])),top:Math.min(...points.map(p=>p[1])),bottom:Math.max(...points.map(p=>p[1]))});
  const box=extent(ink),board={x:box.left-14,y:box.top-14,width:box.right-box.left+28,height:box.bottom-box.top+28};
  let left=board.x,right=board.x+board.width,top=board.y,bottom=board.y+board.height+5;
  const include=(p,r=14)=>{left=Math.min(left,p[0]-r);right=Math.max(right,p[0]+r);top=Math.min(top,p[1]-r);bottom=Math.max(bottom,p[1]+r);};
  const times=new Set([0,plan.duration]);
  for(const phase of plan.phases)for(let i=0,n=Math.max(2,Math.ceil(phase.duration/80));i<=n;i++)times.add(phase.at+phase.duration*i/n);
  for(const t of times){
    const state=samplePresentation(plan,t),body=translatedBody(plan.body,state.offset);body.origin[1]+=state.bodyLift??0;
    const pose=presentationRig(body,state,walkingLandmarks(plan.body,state),plan.rig);
    for(const [name,p]of Object.entries(pose.landmarks))if(name!=='origin'&&name!=='head')include(bodyToWorld(p,body),(/Foot|Toe|Ankle/.test(name)?7:14)*body.scale);
    const head=bodyToWorld(pose.landmarks.head,body),s=body.headSize*body.scale;
    include([head[0]-33*s,head[1]-37*s],2);include([head[0]+37*s,head[1]+29*s],2);
    for(const arm of Object.values(pose.arms))for(const name of ['shoulder','elbow','wrist','tip'])if(arm[name])include(arm[name],14*body.scale);
  }
  return {board,frame:{x:left-4,y:top-4,width:right-left+8,height:bottom-top+8},floor:plan.body.origin[1]+5*plan.body.scale};
}
