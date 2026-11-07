import test from 'node:test';
import assert from 'node:assert/strict';
import {solveEquation,verifySolution} from '../../math-problems/src/solver.js';
import {formatEquation} from '../../math-problems/src/syntax.js';
import {solutionToTimeline,validateMathTimeline} from '../src/math-timeline.js';
import {ProfessorFigure} from '../src/figure.js';
import {SVGNode,installDOM} from '../../drawing-arm/tests/dom-fixture.js';
installDOM();
test('the required negative denominator example writes timed multiplication dots and verified x=8 without blocked ink',()=>{
 const s=solveEquation('1/4-7/x=-5/8'),raw=solutionToTimeline(s);assert.ok(verifySolution(s).valid);assert.equal(validateMathTimeline(raw),raw);
 assert.equal(raw.mathSteps.at(-1).text,'x=8');assert.ok(!raw.strokes.some(s=>['×','*','X'].includes(s.symbol)));
 const dots=raw.strokes.filter(s=>s.symbol==='·');assert.equal(dots.length,2);const f=new ProfessorFigure(new SVGNode('g'),raw);assert.equal(f.plan.blocked.length,0);
 for(const dot of dots){assert.ok(dot.duration>=80&&dot.pen);const w=f.writers.find(w=>Math.abs(w.phase.sourceAt-dot.at)<1e-6);assert.ok(w);
  f.render(w.phase.at);assert.equal(w.renderer.chalk.getAttribute('d'),'');
  assert.equal(f.render(w.phase.at+w.phase.duration*.5).chalkDown,true);const half=w.renderer.chalk.getAttribute('d');assert.ok(half.length);
  f.render(w.phase.at+w.phase.duration);assert.notEqual(w.renderer.chalk.getAttribute('d'),half);
 }
 const spoken=f.plan.presentations.find(p=>p.explanationIndex===3);assert.equal(spoken.action.text,'Multiply both sides by -1.');
 assert.equal(f.plan.presentations.find(p=>p.explanationIndex===4).action.text,'Simplify both sides using exact arithmetic.');
});
test('invalid steps and altered narration/geometry are rejected before lesson rendering or speech',()=>{
 const source=solveEquation('1/4-7/x=-5/8'),bad=structuredClone(source);bad.steps[3].equation.left=structuredClone(bad.steps[2].equation.left);bad.steps[3].text=formatEquation(bad.steps[3].equation);
 assert.throws(()=>solutionToTimeline(bad),/verified/);
 const raw=solutionToTimeline(source);
 for(const mutate of [t=>{t.math.solution.steps[3].operation.explanation='Multiply only the right side.';},t=>{t.mathSteps[3].text='7/x=-7/8';},t=>{t.mathSteps[3].operation.explanation='Wrong narration';},t=>{t.strokes[0].points[0][0]+=2;},t=>{delete t.math.solution;},
  t=>{t.presentationActions=t.mathSteps.map(()=>({type:'talk-and-gesture',text:'Multiply only one side.'}));}]){
  const copy=structuredClone(raw);mutate(copy);assert.throws(()=>validateMathTimeline(copy),/Math|math/);
 }
 assert.deepEqual(validateMathTimeline({version:1,strokes:[]}),{version:1,strokes:[]});
 // Object-key order is not mathematical content.
 const reordered={...raw,mathSteps:raw.mathSteps.map(({index,...s})=>({...s,index}))};assert.equal(validateMathTimeline(reordered),reordered);
 const tree=reordered.math.solution.steps[3].operation.transformedEquation;reordered.math.solution.steps[3].operation.transformedEquation={right:tree.right,left:tree.left,type:tree.type};assert.equal(validateMathTimeline(reordered),reordered);
});
