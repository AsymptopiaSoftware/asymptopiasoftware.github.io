import test from 'node:test';
import assert from 'node:assert/strict';
import {PROFESSOR_PROBLEMS,chooseProfessorProblem} from '../src/homepage-problems.js';
import {solveEquation,verifySolution} from '../../math-problems/src/solver.js';
import {solutionToTimeline,validateMathTimeline} from '../src/math-timeline.js';
import {compileTimeline} from '../../drawing-arm/src/timeline.js';
import {planWriting} from '../src/locomotion.js';
import {teachingPlan} from '../src/teaching.js';
import {presentationPlan} from '../src/presentation-plan.js';
import {compactScene} from '../src/compact-scene.js';

test('30 distinct curated lessons have verified solutions and fit the writing scene', () => {
  assert.equal(PROFESSOR_PROBLEMS.length,30);
  assert.equal(new Set(PROFESSOR_PROBLEMS).size,30);
  for(const problem of PROFESSOR_PROBLEMS){
    const solution=solveEquation(problem);
    assert.equal(solution.status,'unique',problem);
    assert.equal(verifySolution(solution).valid,true,problem);
    const raw=solutionToTimeline(solution);
    assert.doesNotThrow(()=>validateMathTimeline(raw),problem);
    const timeline=compileTimeline(raw);
    const plan=presentationPlan(teachingPlan(planWriting(timeline),raw.mathSteps));
    assert.equal(plan.blocked.length,0,problem);
    assert.doesNotThrow(()=>compactScene(plan,timeline),problem);
  }
});
test('selection never immediately repeats the prior problem',()=>{
  for(const current of PROFESSOR_PROBLEMS){
    assert.notEqual(chooseProfessorProblem(current,()=>0),current);
    assert.notEqual(chooseProfessorProblem(current,()=>0.999999),current);
  }
});
