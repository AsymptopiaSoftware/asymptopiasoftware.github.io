import {verifySolution} from '../../math-problems/src/solver.js';
import {textTimeline,validateTimeline} from '../../drawing-arm/src/timeline.js';
/** Thin presentation adapter. The math module has no knowledge of this interface. */
export function solutionToTimeline(solution,options={}) {
  if(solution.status!=='unique'||!verifySolution(solution).valid)throw new TypeError('Only verified unique solutions can be written as solution timelines');
  const {maxSize=24,minSize=12,width=515,height=220,lineHeight=1.8,pause=650,speed=135,lift=100,board={origin:[355,140],scale:1,rotation:0}}=options;
  if(![maxSize,minSize,width,height,lineHeight,speed].every(v=>Number.isFinite(v)&&v>0)||maxSize<minSize||!Number.isFinite(pause)||pause<0)throw new RangeError('Invalid solution layout options');
  const lines=solution.steps.map(s=>s.text),longest=Math.max(1,...lines.map(t=>t.length));
  const size=Math.min(maxSize,width/(longest*.95),height/(1+(lines.length-1)*lineHeight));
  if(size<minSize)throw new RangeError('Solution has too many/long steps for this board; use a paged consumer');
  const strokes=[],fallbacks=[],mathSteps=[];let at=0;
  for(const [index,step]of solution.steps.entries()){
    const row=textTimeline(step.text,{x:0,y:index*size*lineHeight,size,speed,lift});
    strokes.push(...row.strokes.map(s=>({...s,at:s.at+at})));fallbacks.push(...row.fallbacks.map(f=>({...f,at:f.at+at})));
    mathSteps.push({index,at,end:at+row.duration,text:step.text,operation:structuredClone(step.operation)});at+=row.duration+pause;
  }
  return validateTimeline({version:1,board,strokes,fallbacks,mathSteps,layout:{size,lineHeight},math:{version:1,status:solution.status,problem:solution.steps[0].text,solutions:structuredClone(solution.solutions)}});
}
