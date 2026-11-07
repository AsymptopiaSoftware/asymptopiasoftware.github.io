import test from 'node:test';
import assert from 'node:assert/strict';
import {solveEquation,verifySolution} from '../src/solver.js';
import {parseEquation,formatEquation,evaluateExpression,integerNode} from '../src/syntax.js';
import {analyzeEquation} from '../src/algebra.js';
import {certifyOperation,operationExplanation} from '../src/operations.js';
test('1/4-7/x=-5/8 applies -1 to both sides explicitly, simplifies both, and finishes at x=8',()=>{
 const s=solveEquation('1/4-7/x=-5/8');assert.equal(s.status,'unique');assert.deepEqual(s.solutions,[{numerator:'8',denominator:'1'}]);
 assert.deepEqual(s.steps.map(s=>s.text),['1/4-7/x=-5/8','-(7/x)=-5/8-1/4','-(7/x)=-7/8','-(7/x)*(-1)=-7/8*(-1)','7/x=7/8','x=8']);
 const multiplication=s.steps[3].operation;assert.equal(multiplication.effect,'both-sides');assert.deepEqual(multiplication.simplifiedSides,[]);
 for(const side of ['left','right']){assert.equal(s.steps[3].equation[side].op,'*');assert.deepEqual(s.steps[3].equation[side].right,integerNode(-1));}
 assert.equal(s.steps[4].operation.effect,'simplification');assert.deepEqual(s.steps[4].operation.sides,['left','right']);assert.match(s.steps[4].operation.explanation,/Simplify both sides/);
 assert.ok(verifySolution(s).valid);assert.ok(s.domain.some(d=>d.text==='x!=0'));
 // Independent exact cross-polynomial certificates, not just cached verification flags.
 const normalized=s.steps.map(step=>{const p=analyzeEquation(step.equation).polynomial;return p.map(q=>q.div(p.at(-1)).toString());});
 for(const p of normalized)assert.deepEqual(p,['-8','1']);
 for(const value of [-3,-1,1,2,4,7,8,9,16])for(const step of s.steps)
  assert.equal(evaluateExpression(step.equation.left,value).equals(evaluateExpression(step.equation.right,value)),value===8);
});
test('same-root equations, one-sided sign changes and forged certificates cannot pass as both-side operations',()=>{
 const source=solveEquation('1/4-7/x=-5/8');
 const changes=[s=>{s.steps[3].equation.left=structuredClone(s.steps[2].equation.left);},
  s=>{s.steps[3].equation=parseEquation('2*(x-8)=0');},
  s=>{s.steps[3].operation.transformedEquation.left=structuredClone(s.steps[2].equation.left);},
  s=>{s.steps[3].operation.operand=integerNode(1);},s=>{s.steps[4].operation.sides=['right'];},
  s=>{s.steps[3].operation.effect='simplification';}];
 for(const change of changes){const copy=structuredClone(source);change(copy);copy.steps[3].text=formatEquation(copy.steps[3].equation);copy.verification={valid:true};assert.equal(verifySolution(copy).valid,false);}
 assert.throws(()=>certifyOperation(parseEquation('x=1'),parseEquation('x=-1'),{kind:'multiply-both-sides',operand:integerNode(-1)}),/both sides/);
});
test('explanation text is regenerated from verified operation kind, operands and simplification sides',()=>{
 const source=solveEquation('1/4-7/x=-5/8');for(const step of source.steps)assert.equal(step.operation.explanation,operationExplanation(step.operation));
 const bad=structuredClone(source);bad.steps[3].operation.explanation='Multiply only the right side by -1.';assert.equal(verifySolution(bad).valid,false);
 const previous=parseEquation('x=2/4'),current=parseEquation('x=1/2'),op=certifyOperation(previous,current,{kind:'simplify-rational'});
 assert.equal(op.effect,'simplification');assert.deepEqual(op.sides,['right']);assert.match(op.explanation,/right side/);
 const denominator=source.steps.at(-1).operation;assert.equal(denominator.transformations.length,3);assert.deepEqual(denominator.transformations.map(t=>t.kind),['multiply-both-sides','divide-both-sides','swap-sides']);
 for(const transformation of denominator.transformations.slice(0,2))for(const side of ['left','right'])assert.equal(transformation.equation[side].op,transformation.kind==='multiply-both-sides'?'*':'/');
});
