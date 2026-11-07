import test from 'node:test';
import assert from 'node:assert/strict';
import {solveEquation,generateProblem} from '../../math-problems/src/index.js';
import {solutionToTimeline} from '../src/math-timeline.js';
import {compileTimeline} from '../../drawing-arm/src/timeline.js';
import {planWriting,samplePlan} from '../src/locomotion.js';
import {GLYPHS} from '../../drawing-arm/src/glyphs.js';
test('verified example becomes one original-format timeline in exact solution order',()=>{
 const solution=solveEquation('x/5-4/4=2/5'),before=structuredClone(solution),raw=solutionToTimeline(solution);
 assert.equal(raw.version,1);assert.deepEqual(raw.mathSteps.map(s=>s.text),['x/5-4/4=2/5','x/5=2/5+4/4','x/5=7/5','x=7']);assert.deepEqual(raw.fallbacks,[]);assert.ok(GLYPHS.x);
 assert.deepEqual(solution,before);assert.doesNotThrow(()=>compileTimeline(JSON.parse(JSON.stringify(raw))));
 for(let i=1;i<raw.mathSteps.length;i++)assert.ok(raw.mathSteps[i].at>raw.mathSteps[i-1].end);
 const t=compileTimeline(raw),plan=planWriting(t);assert.equal(plan.blocked.length,0);
 for(const step of raw.mathSteps){const phase=plan.writes.find(p=>p.sourceAt>=step.at);assert.ok(phase);const state=samplePlan(plan,phase.at+phase.duration*.5);assert.ok(state.pose.reachable);assert.ok(state.chalkDown);}
});
test('generated solutions fit the existing board and preserve walking/chalk-lift planning',()=>{
 for(const [operator,missingSlot]of [['+','a'],['-','e'],['*','f']]){
  const problem=generateProblem({seed:'B1.6-'+operator,operator,missingSlot}),solution=solveEquation(problem.equation),raw=solutionToTimeline(solution),t=compileTimeline(raw),plan=planWriting(t);
  assert.equal(raw.fallbacks.length,0);assert.equal(plan.blocked.length,0);
  for(const s of t.strokes)for(const p of s.points){assert.ok(p[0]>=355&&p[0]<=890);assert.ok(p[1]>=140&&p[1]<=365);}
  for(const phase of plan.phases.filter(p=>p.kind==='move'))assert.equal(samplePlan(plan,phase.at+phase.duration*.5).chalkDown,false);
 }
});
test('adapter rejects nonunique, unverified and oversized solutions',()=>{
 assert.throws(()=>solutionToTimeline(solveEquation('0/x=0')));const corrupt=solveEquation('x/5-4/4=2/5');corrupt.steps[1].text='x=99';assert.throws(()=>solutionToTimeline(corrupt));
 assert.throws(()=>solutionToTimeline(solveEquation('x/5-4/4=2/5'),{height:5}));
});
