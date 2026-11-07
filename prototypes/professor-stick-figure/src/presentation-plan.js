import { presentationAction, compilePresentationAction, samplePresentationAction } from './presentation-action.js';
import { sampleTeaching } from './teaching.js';
const PRESENTATION_TURN = 700;
/** Adapt an existing lesson pause to a generic action; the B1.8 sequencer stays intact. */
export function presentationPlan(base, actions) {
  if(!base.teachingSteps?.length)return {...base,presentations:[]};
  const selected=base.teachingSteps.map((step,i)=>{
    // Explain the NEXT transformation after its prerequisite line is on the board.
    const next=base.teachingSteps[i+1]??step;
    return {action:presentationAction(actions?.[i]??{type:'talk-and-gesture',text:next.operation.explanation,
      gesture:'thoughtful-explain',count:next.index+1}),explanationIndex:next.index};
  });
  if(actions&&actions.length!==base.teachingSteps.length)throw new RangeError('Expected one presentation action per teaching pause');
  const phases=[],presentations=[],shifts=[];let shift=0;
  for(const phase of base.phases){
    if(phase.reason!=='teaching-pause'){phases.push({...phase,at:phase.at+shift});continue;}
    const index=phase.teachingIndex,{action,explanationIndex}=selected[index],at=phase.at+shift;
    const clip=compilePresentationAction(action,{at,id:`presentation-${index}`,turn:PRESENTATION_TURN,wait:phase.duration});
    const p={...clip,index,explanationIndex};presentations.push(p);
    const {talkAt,gate,resume}=p;
    const add=(stage,start,duration)=>phases.push({...phase,at:start,duration,reason:stage==='talk'?'talk-and-gesture':`presentation-${stage}`,presentation:{id:p.id,stage}});
    add('turn-out',at,PRESENTATION_TURN);add('talk',talkAt,action.duration);add('wait',gate,phase.duration);add('turn-in',resume,PRESENTATION_TURN);
    const extra=2*PRESENTATION_TURN+action.duration;
    shifts.push({at:phase.at,extra});shift+=extra;
  }
  const shifted=t=>t+shifts.filter(s=>s.at<t-1e-6).reduce((n,s)=>n+s.extra,0);
  const teachingSteps=base.teachingSteps.map((s,i)=>({...s,start:shifted(s.start),complete:shifted(s.complete),gate:presentations[i].gate,resume:presentations[i].resume}));
  return {...base,phases,writes:phases.filter(p=>p.kind==='write'),teachingSteps,presentations,duration:base.duration+shift,
    sourceToWall:t=>shifted(base.sourceToWall(t))};
}
export function samplePresentation(plan,time) {
  const state=sampleTeaching(plan,time);
  const p=plan.presentations?.find(p=>time>=p.at&&time<p.end);
  if(!p)return {...state,presentation:null,orientation:'board',audience:0};
  const sampled=samplePresentationAction(p,time),stage=sampled.presentation.stage;
  return {...state,...sampled,kind:stage==='talk'?'talk-and-gesture':stage.startsWith('turn')?'turn':state.kind,
    chalkDown:false,penDown:false};
}
/** Ensure a talk slot is observed, then wait for live audio before turning away.
 * This transport guard never changes a sampled pose or permanently records progress.
 */
export function presentationAdvance(plan,time,next,busy=false) {
  const active=plan.presentations?.find(p=>time>=p.talkAt&&time<p.talkEnd);
  if(active&&busy&&next>=active.talkEnd)return Math.max(time,active.talkEnd-.001);
  const entering=plan.presentations?.find(p=>time<p.talkAt&&next>=p.talkAt);
  return entering?entering.talkAt:next;
}
