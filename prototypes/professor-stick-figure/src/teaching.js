import { attachedArm } from './body.js';
import { solveIK } from '../../drawing-arm/src/kinematics.js';
import { samplePlan } from './locomotion.js';

const TEACHING_LOWER = 450, TEACHING_PAUSE = 1500;
/** Add cadence to a spatial plan using structured solver boundaries only.
 * Original spatial phases and writing coordinates are copied, never replanned.
 */
export function teachingPlan(base, steps) {
  // Old/free-writing imports without structured metadata keep their old behavior.
  if (!Array.isArray(steps) || !steps.length) return {...base, teachingSteps: []};
  let previousEnd = -1;
  for (const [i, step] of steps.entries()) {
    if (step?.index !== i || !Number.isFinite(step.at) || !Number.isFinite(step.end) ||
        step.at < 0 || step.at <= previousEnd || step.end <= step.at ||
        typeof step.operation?.explanation !== 'string') throw new TypeError('Invalid structured teaching step');
    previousEnd = step.end;
  }
  const phases = [], teachingSteps = [], cuts = [];
  const arm=attachedArm(base.body,base.rig), reach=arm.upper+arm.forearm+arm.tip;
  const relaxed=solveIK(arm,[arm.shoulder[0]+.10*reach,arm.shoulder[1]+.92*reach]);
  const rest = [relaxed.angles.shoulder,relaxed.angles.elbow];
  for (const step of steps) {
    const sourceStart = p => p.sourceAt ?? p.sourceTime;
    const members = base.phases.filter(p => (p.kind==='write'||p.reason==='blocked') && sourceStart(p) >= step.at - 1e-6 && sourceStart(p)+p.duration <= step.end+1e-6);
    if (!members.length) throw new TypeError('Teaching step has no planned writing strokes');
    const first = members[0], last = members.at(-1);
    if (Math.abs(sourceStart(first)-step.at)>1e-6 || Math.abs(sourceStart(last)+last.duration-step.end)>1e-6)
      throw new TypeError('Teaching boundaries must match complete solver lines');
    cuts.push({step, start:first.at, at:last.at+last.duration});
  }
  let shift = 0;
  for (const phase of base.phases) {
    // Replace the adapter's inter-line source gap with the explicit teaching rest.
    if(phase.kind==='hold'&&phase.reason==='gap'&&cuts.some(c=>Math.abs(c.step.end-phase.sourceTime)<1e-6)) {shift-=phase.duration;continue;}
    const copied = {...phase, at:phase.at+shift}; phases.push(copied);
    const cut = cuts.find(c => Math.abs(c.at-phase.at-phase.duration)<1e-6);
    if (!cut) continue;
    const end = samplePlan(base, cut.at-1e-7), angles = [end.pose.angles.shoulder,end.pose.angles.elbow];
    const final = cut.step.index === steps.length-1, complete = cut.at+shift, start=cut.start+shift;
    const add = (kind,duration,extra) => phases.push({kind,offset:end.offset,sourceTime:cut.step.end,
      teachingIndex:cut.step.index,at:cut.at+shift,duration,...extra});
    add('approach',TEACHING_LOWER,{fromAngles:angles,toAngles:rest,reason:'teaching-lower'}); shift += TEACHING_LOWER;
    const gate = cut.at+shift;
    add('hold',TEACHING_PAUSE,{angles:rest,reason:'teaching-pause'}); shift += TEACHING_PAUSE;
    const resume = cut.at+shift;
    if (!final) {add('approach',TEACHING_LOWER,{fromAngles:rest,toAngles:angles,reason:'teaching-raise'});shift+=TEACHING_LOWER;}
    teachingSteps.push({...structuredClone(cut.step),start,complete,gate,resume,final});
  }
  const writes = phases.filter(p => p.kind==='write');
  const sourceToWall = source => {
    const p = writes.find(p => source <= p.sourceAt+p.duration);
    return p ? p.at+Math.max(0,Math.min(p.duration,source-p.sourceAt)) : base.duration+shift;
  };
  return {...base,phases,writes,duration:base.duration+shift,sourceToWall,teachingSteps};
}

/** Pure reconstruction: neither prior frames nor previously visited steps matter. */
export function sampleTeaching(plan,time) {
  const state = samplePlan(plan,time);
  const current = plan.teachingSteps?.filter(s=>s.start<=time).at(-1) ?? plan.teachingSteps?.[0];
  const phase = plan.phases.find(p=>time>=p.at&&time<p.at+p.duration);
  if (phase?.teachingIndex !== undefined) state.sourceTime = plan.teachingSteps[phase.teachingIndex].end;
  return {...state,teaching:current?{...current,waiting:!current.final&&time>=current.gate&&time<current.resume}:null};
}

/** A large frame delta cannot skip a Step-mode gate. Speed scales timeline time. */
export function advanceTeaching(plan,time,delta,mode='auto') {
  if (!Number.isFinite(time)||!Number.isFinite(delta)||delta<0) throw new RangeError('Invalid playback time');
  const next = Math.min(plan.duration,time+delta);
  if(mode==='step') {
    const gate=plan.teachingSteps?.find(s=>!s.final&&s.resume>time&&s.gate<=next);
    if(gate) return {time:Math.max(time,gate.gate),waiting:true};
  }
  return {time:next,waiting:false};
}
