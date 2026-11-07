import {audienceArmPose} from './audience-arm.js';
import {turnBone} from './orientation.js';
const unitThoughtful=v=>{const n=Math.hypot(...v);return v.map(x=>x/n);};
const addThoughtful=(a,b)=>a.map((v,i)=>v+b[i]);
const subtractThoughtful=(a,b)=>a.map((v,i)=>v-b[i]);
const smoothThoughtful=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
function fromBonesThoughtful(arm,upper,forearm,extra={}){
 const elbow=addThoughtful(arm.shoulder,upper),wrist=addThoughtful(elbow,forearm),tip=addThoughtful(wrist,forearm.map(v=>v*(arm.tip??0)/arm.forearm));
 return {shoulder:[...arm.shoulder],elbow,wrist,tip,elbowPreference:'outward',...extra};
}
export function relaxedAudienceArm(arm,side){
 const sign=side==='right'?1:-1;
 return fromBonesThoughtful(arm,unitThoughtful([sign*.14,.98,.12]).map(v=>v*arm.upper),unitThoughtful([-sign*.36,.90,.25]).map(v=>v*arm.forearm),{role:'relaxed'});
}
function blendThoughtful(arm,from,to,t){
 return fromBonesThoughtful(arm,turnBone(subtractThoughtful(from.elbow,from.shoulder),subtractThoughtful(to.elbow,to.shoulder),t),
  turnBone(subtractThoughtful(from.wrist,from.elbow),subtractThoughtful(to.wrist,to.elbow),t),{role:to.role??'indicating'});
}
/** Coupled, length-preserving pose: anatomical left supports anatomical right.
 * The contact follows the small elbow motion, rather than two unrelated targets.
 */
export function thoughtfulArms(arms,elapsed,duration,{emphasis=false}={}){
 const t=Math.max(0,Math.min(duration,elapsed)),envelope=smoothThoughtful(t/500)*smoothThoughtful((duration-t)/500),wave=Math.sin(2*Math.PI*t/duration)*envelope;
 const raised=arms.right,support=arms.left,reach=support.upper+support.forearm;
 let choice;
 // Prefer a small outward flare; adapt inward only for broad/short-arm proportions.
 for(const lateral of [.28,.22,.14,.08,.02,-.08,-.2,-.35,-.5,-.7,-.85,-.95]){
  const yz=Math.sqrt(1-lateral*lateral),upper=unitThoughtful([lateral+.008*wave,.94*yz,.34*yz]).map(v=>v*raised.upper);
  const fore=unitThoughtful([-.64+(emphasis?.09:.05)*wave,-.72,.26+.015*wave]).map(v=>v*raised.forearm);
  const right=fromBonesThoughtful(raised,upper,fore,{role:'indicating'}),contact=addThoughtful(right.elbow,[0,.045*support.forearm,.06*support.forearm]);
  const baseUpper=unitThoughtful([lateral,.94*yz,.34*yz]).map(v=>v*raised.upper),baseContact=addThoughtful(addThoughtful(raised.shoulder,baseUpper),[0,.045*support.forearm,.06*support.forearm]);
  const score=Math.hypot(...subtractThoughtful(baseContact,support.shoulder));
  if(!choice||score<choice.score)choice={right,contact,score};
  if(score+raised.upper*.015<=reach*.96&&score>Math.abs(support.upper-support.forearm)+1e-7)break;
 }
 const left=audienceArmPose(support,choice.contact,'left',{maxExtension:.96});left.role='supporting';left.allowsCrossing=true;
 const gap=Math.hypot(...subtractThoughtful(left.wrist,choice.contact));
 return {right:choice.right,left,supportContact:{supporting:'left',supported:'right',target:choice.contact,gap,reachable:gap<1e-6}};
}
/** Reusable vocabulary; no lesson, SVG or speech dependency. */
export function audienceGestureTargets(arms,action,elapsed){
 const duration=action.duration,t=Math.max(0,Math.min(duration,elapsed));
 if(action.gesture==='thoughtful-explain'||action.gesture==='explain')return thoughtfulArms(arms,t,duration);
 const targets={left:relaxedAudienceArm(arms.left,'left'),right:relaxedAudienceArm(arms.right,'right')};
 const envelope=smoothThoughtful(t/500)*smoothThoughtful((duration-t)/500);
 if(action.gesture==='emphasize'||action.gesture==='count'){
  const indicating=thoughtfulArms(arms,t,duration,{emphasis:true}).right;
  targets.right=blendThoughtful(arms.right,targets.right,indicating,envelope);
 }else if(action.gesture==='present'){
  const arm=arms.left,reach=arm.upper+arm.forearm+(arm.tip??0),wave=Math.sin(2*Math.PI*t/duration)*envelope;
  const pointing=audienceArmPose(arm,addThoughtful(arm.shoulder,[-.80*reach,(.06+.012*wave)*reach,0]),'left',{elbowPreference:action.elbowPreference??'outward'});pointing.role='presenting';
  targets.left=blendThoughtful(arm,targets.left,pointing,envelope);
 }
 return targets;
}
