import test from 'node:test';
import assert from 'node:assert/strict';
import {solveEquation} from '../../math-problems/src/solver.js';
import {compileTimeline} from '../../drawing-arm/src/timeline.js';
import {solutionToTimeline} from '../src/math-timeline.js';
import {planWriting} from '../src/locomotion.js';
import {teachingPlan} from '../src/teaching.js';
import {presentationPlan} from '../src/presentation-plan.js';
import {compactScene} from '../src/compact-scene.js';
const raw=solutionToTimeline(solveEquation('x/5-4/4=2/5')),timeline=compileTimeline(raw),plan=presentationPlan(teachingPlan(planWriting(timeline),raw.mathSteps));
test('compact camera deterministically contains every timed fraction stroke without changing the lesson',()=>{
 const before=JSON.stringify(raw),a=compactScene(plan,timeline),b=compactScene(plan,timeline);assert.deepEqual(a,b);
 for(const s of timeline.strokes)for(const [x,y]of s.points){assert.ok(x>a.board.x&&x<a.board.x+a.board.width);assert.ok(y>a.board.y&&y<a.board.y+a.board.height);}
 assert.equal(JSON.stringify(raw),before);assert.equal(plan.blocked.length,0);
 assert.ok(a.frame.height<410,'tile framing keeps the roughly 320-unit Professor large');
 assert.ok(a.frame.width<500);assert.equal(raw.mathSteps.at(-1).text,'x=7');
});
