import {verifySolution} from '../../math-problems/src/solver.js';
import {layoutEquations} from '../../math-layout/src/layout.js';
import {positionStrokes} from '../../math-layout/src/strokes.js';
import {GLYPHS} from '../../drawing-arm/src/glyphs.js';
import {validateTimeline} from '../../drawing-arm/src/timeline.js';
/** Verified algebra → pure math boxes → font strokes → existing timeline v1. */
export function solutionToTimeline(solution,options={}) {
  if(solution.status!=='unique'||!verifySolution(solution).valid)throw new TypeError('Only verified unique solutions can be written as solution timelines');
  const {maxSize=24,minSize=12,width=515,height=220,pause=650,speed=135,lift=100,board={origin:[355,140],scale:1,rotation:0}}=options;
  if(options.lineHeight!==undefined&&(!Number.isFinite(options.lineHeight)||options.lineHeight<=0))throw new RangeError('Invalid legacy line-height option');
  const rowGap=options.rowGap??(options.lineHeight === undefined ? .5 : Math.max(.1,options.lineHeight-1));
  if(!Number.isFinite(speed)||speed<=0||!Number.isFinite(lift)||lift<=0||!Number.isFinite(pause)||pause<0)throw new RangeError('Invalid solution timing options');
  const layout=layoutEquations(solution.steps.map(s=>s.equation),{maxSize,minSize,width,height,rowGap});
  const geometry=positionStrokes(layout,GLYPHS),strokes=[],mathSteps=[];let at=0;
  for(const [index,step]of solution.steps.entries()){
    const start=at;let end=at;
    for(const stroke of geometry.strokes.filter(s=>s.row===index)){
      const length=stroke.points.slice(1).reduce((sum,p,i)=>sum+Math.hypot(p[0]-stroke.points[i][0],p[1]-stroke.points[i][1]),0);
      const duration=Math.max(1,length/speed*1000);strokes.push({...stroke,at,duration});end=at+duration;at=end+lift;
    }
    mathSteps.push({index,at:start,end,text:step.text,operation:structuredClone(step.operation)});at=end+Math.max(pause,lift);
  }
  return validateTimeline({version:1,board,strokes,fallbacks:[],mathSteps,layout:{notation:'stacked-fractions',size:layout.size,width:layout.width,height:layout.height,rows:layout.rows},math:{version:1,status:solution.status,problem:solution.steps[0].text,solutions:structuredClone(solution.solutions)}});
}
