// SPDX-License-Identifier: GPL-2.0-or-later
import {evaluateExpression,formatExpression,binaryNode,countUnknowns} from './syntax.js';
import {equivalentExpressions} from './algebra.js';
const eq192=(left,right)=>({type:'equation',left,right});
const canonicalOperation192=value=>Array.isArray(value)?value.map(canonicalOperation192):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(key=>[key,canonicalOperation192(value[key])])):value;
const sameAST192=(a,b)=>JSON.stringify(canonicalOperation192(a))===JSON.stringify(canonicalOperation192(b));
const inverse192={'add-both-sides':'+','subtract-both-sides':'-','multiply-both-sides':'*','divide-both-sides':'/'};
const changedSides192=(a,b)=>['left','right'].filter(side=>!sameAST192(a[side],b[side]));
export function operationExplanation(op) {
 const names={'add-both-sides':['Add','to'],'subtract-both-sides':['Subtract','from'],'multiply-both-sides':['Multiply','by'],'divide-both-sides':['Divide','by']};
 if(names[op.kind]){
  const [verb,preposition]=names[op.kind],operand=formatExpression(op.operand);
  const text=['multiply-both-sides','divide-both-sides'].includes(op.kind)?`${verb} both sides ${preposition} ${operand}.`:`${verb} ${operand} ${preposition} both sides.`;
  const sides=op.simplifiedSides??[];return text+(sides.length?` Simplify ${sides.length===2?'both sides':`the ${sides[0]} side`}.`:'');
 }
 if(op.kind==='simplify-rational')return `Simplify ${op.sides.length===2?'both sides':`the ${op.sides[0]} side`} using exact arithmetic.`;
 if(op.kind==='given')return 'Start with the given equation and keep every original denominator nonzero.';
 if(op.kind==='swap-sides')return 'Swap the two sides of the equality.';
 if(op.kind==='isolate-denominator')return `Multiply both sides by ${formatExpression(op.denominator)} (nonzero), divide both sides by ${formatExpression(op.divisor)} (nonzero), simplify, then swap sides to put x first.`;
 if(op.kind==='collect-terms')return 'Clear defined denominators on both sides and collect the x terms, preserving the original domain.';
 if(op.kind==='quadratic-formula')return 'Apply the exact quadratic formula and discard values outside the original domain.';
 throw new TypeError('Unknown mathematical operation');
}
/** Derive the operation certificate and its explanation from actual equations.
 * Nothing in this module knows about layout, a character, a clock or speech.
 */
export function certifyOperation(previous,current,seed) {
 const op={...structuredClone(seed)};
 for(const key of ['explanation','effect','sides','simplifiedSides','transformedEquation','transformations','denominator','divisor','conditions'])delete op[key];
 const symbol=inverse192[op.kind];
 if(symbol){
  if(!op.operand||countUnknowns(op.operand))throw new TypeError('An inverse operation requires a constant operand');
  const q=evaluateExpression(op.operand);if(['*','/'].includes(symbol)&&q.isZero)throw new TypeError('Cannot multiply or divide by zero');
  op.conditions=['*','/'].includes(symbol)?[`${formatExpression(op.operand)}!=0`]:[];
  op.effect='both-sides';op.transformedEquation=eq192(binaryNode(symbol,previous.left,op.operand),binaryNode(symbol,previous.right,op.operand));
  for(const side of ['left','right'])if(!equivalentExpressions(op.transformedEquation[side],current[side]))throw new TypeError('Operation was not applied to both sides');
  op.simplifiedSides=changedSides192(op.transformedEquation,current);
 }else if(op.kind==='simplify-rational'){
  op.effect='simplification';op.sides=changedSides192(previous,current);
  if(!op.sides.length||!['left','right'].every(side=>equivalentExpressions(previous[side],current[side])))throw new TypeError('Simplification changes an expression');
 }else if(op.kind==='isolate-denominator'){
  if(previous.left.type!=='binary'||previous.left.op!=='/'||!equivalentExpressions(op.operand,previous.left.left))throw new TypeError('Invalid denominator isolation');
  op.effect='both-sides';op.denominator=structuredClone(previous.left.right);op.divisor=structuredClone(previous.right);
  if(countUnknowns(op.divisor)||evaluateExpression(op.divisor).isZero)throw new TypeError('Cannot divide by a zero or unknown right side');
  op.conditions=[`${formatExpression(op.denominator)}!=0`,`${formatExpression(op.divisor)}!=0`];
  const numerator=previous.left.left,denominator=op.denominator,divisor=op.divisor;
  const multiplied=eq192(binaryNode('*',previous.left,denominator),binaryNode('*',previous.right,denominator));
  const divided=eq192(binaryNode('/',multiplied.left,divisor),binaryNode('/',multiplied.right,divisor));
  op.transformations=[{kind:'multiply-both-sides',operand:denominator,equation:multiplied},
   {kind:'divide-both-sides',operand:divisor,equation:divided},{kind:'swap-sides',equation:eq192(divided.right,divided.left)}];
  if(!equivalentExpressions(current.left,denominator)||!equivalentExpressions(current.right,binaryNode('/',numerator,divisor)))throw new TypeError('Invalid denominator isolation result');
  for(const side of ['left','right'])if(!equivalentExpressions(op.transformations[2].equation[side],current[side]))throw new TypeError('Invalid isolation certificate');
  op.simplifiedSides=changedSides192(op.transformations[2].equation,current);
 }else op.effect=op.kind==='given'?'given':op.kind==='swap-sides'?'swap':'equivalent-equation';
 op.explanation=operationExplanation(op);return op;
}
/** Re-derive instead of trusting supplied explanations/certificates. */
export function operationMatches(previous,current,op) {
 try{
  const expected=certifyOperation(previous,current,op);
  for(const key of ['effect','explanation','sides','simplifiedSides','transformedEquation','transformations','denominator','divisor','conditions'])
   if(!sameAST192(expected[key],op[key]))return false;
  return true;
 }catch{return false;}
}
