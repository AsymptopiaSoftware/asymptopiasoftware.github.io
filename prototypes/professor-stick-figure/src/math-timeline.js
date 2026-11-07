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
      const duration=Math.max(stroke.symbol==='·'?80:1,length/speed*1000);strokes.push({...stroke,at,duration});end=at+duration;at=end+lift;
    }
    mathSteps.push({index,at:start,end,text:step.text,operation:structuredClone(step.operation)});at=end+Math.max(pause,lift);
  }
  return validateTimeline({version:1,board,strokes,fallbacks:[],mathSteps,layout:{notation:'stacked-fractions',size:layout.size,width:layout.width,height:layout.height,rows:layout.rows},math:{version:2,status:solution.status,problem:solution.steps[0].text,solutions:structuredClone(solution.solutions),solution:structuredClone(solution),options:{maxSize,minSize,width,height,pause,speed,lift,board:structuredClone(board),rowGap}}});
}

/** Fail closed at the lesson import/load boundary before any rendering or narration.
 * Legacy/free-writing timelines without lesson steps remain ordinary drawing data.
 */
export function validateMathTimeline(input) {
  if(!input?.math?.solution&&!(Array.isArray(input?.mathSteps)&&input.mathSteps.length))return input;
  if(!input.math?.solution||!verifySolution(input.math.solution).valid)throw new TypeError('Math lesson has missing or invalid exact step certificates; solve the equation again.');
  const expected=solutionToTimeline(input.math.solution,input.math.options);
  const canonical=value=>Array.isArray(value)?value.map(canonical):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(key=>[key,canonical(value[key])])):value;
  for(const key of ['board','strokes','fallbacks','mathSteps','layout','math'])
    if(JSON.stringify(canonical(input[key]))!==JSON.stringify(canonical(expected[key])))throw new TypeError(`Math lesson ${key} differs from its verified solution; solve the equation again.`);
  if(input.presentationActions){
    if(!Array.isArray(input.presentationActions)||input.presentationActions.length!==input.mathSteps.length)throw new TypeError('Math presentation actions must match the verified steps.');
    for(const [i,action]of input.presentationActions.entries())if(action.text!==input.mathSteps[Math.min(i+1,input.mathSteps.length-1)].operation.explanation)
      throw new TypeError('Math narration must match the verified operation.');
  }
  return input;
}
