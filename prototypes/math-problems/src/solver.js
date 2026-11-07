// SPDX-License-Identifier: GPL-2.0-or-later
import {Rational,MathProblemError} from './rational.js';
import {validateEquation,countUnknowns,formatEquation,formatExpression,evaluateExpression,integerNode,variableNode,binaryNode,rationalNode} from './syntax.js';
import {analyzeEquation,serializeRestrictions,sameSolutionSet,equivalentExpressions} from './algebra.js';
const equationNode=(left,right)=>({type:'equation',left,right});
function proofFor(analysis){const lead=analysis.polynomial.at(-1);return {classification:analysis.status,normalizedPolynomial:analysis.polynomial.map(q=>(lead.isZero?q:q.div(lead)).toJSON()),solutions:analysis.roots.map(q=>q.toJSON())};}
function verifyOperation(previous,current,operation,index) {
 if(!operation||typeof operation.explanation!=='string'||!operation.explanation)return false;
 const same=equivalentExpressions,op=operation.kind,a=previous.equation,b=current.equation;
 if(operation.calculation&&(!evaluateExpression(operation.calculation.expression).equals(evaluateExpression(operation.calculation.result))||!evaluateExpression(operation.calculation.result).equals(evaluateExpression(b.right))))return false;
 if(op==='given')return index===0;
 if(op==='swap-sides')return same(a.left,b.right)&&same(a.right,b.left);
 if(op==='simplify-rational')return same(a.left,b.left)&&same(a.right,b.right);
 const operations={'add-both-sides':'+','subtract-both-sides':'-','multiply-both-sides':'*','divide-both-sides':'/'};
 if(operations[op]){
  const operand=operation.operand;
  if(!operand||countUnknowns(operand))return false;
  const q=evaluateExpression(operand);if(['*','/'].includes(operations[op])&&q.isZero)return false;
  if(!same(binaryNode(operations[op],a.left,operand),b.left)||!same(binaryNode(operations[op],a.right,operand),b.right))return false;
 }else if(op==='isolate-denominator'){
  if(a.left.type!=='binary'||a.left.op!=='/'||!operation.operand||!same(operation.operand,a.left.left)||!same(a.left.right,b.left)||!same(binaryNode('/',a.left.left,a.right),b.right))return false;
 }else if(op==='collect-terms'||op==='quadratic-formula'){
  if(JSON.stringify(operation.coefficients)!==JSON.stringify(previous.polynomial.map(q=>q.toJSON())))return false;
  if(op==='quadratic-formula'&&previous.polynomial.length!==3)return false;
  if(op==='collect-terms'&&(previous.polynomial.length!==2||!same(b.left,binaryNode('*',rationalNode(previous.polynomial[1]),variableNode()))||!same(b.right,rationalNode(previous.polynomial[0].neg()))))return false;
 }else return false;
 return true;
}
export function verifySolution(solution) {
 try {
  const original=analyzeEquation(solution.equation),steps=solution.steps;
  if(solution.status!==original.status||!Array.isArray(steps)||!steps.length)return {valid:false,reason:'Classification or steps mismatch'};
  const expected=original.roots,reported=(solution.solutions??[]).map(q=>Rational.from(q));
  if(reported.length!==expected.length||!expected.every(q=>reported.some(r=>q.equals(r))))return {valid:false,reason:'Reported solution mismatch'};
  if(JSON.stringify(solution.domain)!==JSON.stringify(serializeRestrictions(original.restrictions)))return {valid:false,reason:'Original domain restrictions were changed'};
  if(formatEquation(validateEquation(steps[0].equation))!==formatEquation(original.equation))return {valid:false,reason:'First step is not the original problem'};
  let previous=original;const checks=[];
  for(const step of steps){
   const current=analyzeEquation(step.equation,original.restrictions);
   if(step.text!==formatEquation(current.equation)||!sameSolutionSet(previous,current)||!verifyOperation(previous,current,step.operation,checks.length))return {valid:false,reason:'Step changes the equation solution set'};
   checks.push({equivalent:true,...proofFor(current)});previous=current;
  }
  for(const x of expected){const l=evaluateExpression(original.equation.left,x),r=evaluateExpression(original.equation.right,x);if(!l.equals(r))return {valid:false,reason:'Substitution failed'};}
  if(original.status==='unique'){
   const last=steps.at(-1).equation;
   if(last.left.type!=='variable'||countUnknowns(last.right)!==0||!evaluateExpression(last.right).equals(expected[0]))return {valid:false,reason:'Final step does not isolate x'};
  }
  return {valid:true,method:'exact solution-set equivalence under original denominator restrictions',steps:checks,substitution:expected.map(q=>({value:q.toJSON(),valid:true}))};
 }catch(error){return {valid:false,reason:error.message};}
}
export function solveEquation(input) {
 try {
  const equation=validateEquation(input),analysis=analyzeEquation(equation);
  const result={version:1,status:analysis.status,equation,domain:serializeRestrictions(analysis.restrictions),solutions:analysis.roots.map(q=>q.toJSON()),steps:[]};
  const append=(eq,operation)=>result.steps.push({index:result.steps.length,equation:structuredClone(eq),text:formatEquation(eq),operation});
  append(equation,{kind:'given',explanation:'Start with the given equation and keep every original denominator nonzero.'});
  if(analysis.status!=='unique'){
   result.explanation=analysis.status==='none'?'No value satisfies the equation in its original domain.':analysis.status==='infinite'?'Every rational value in the original domain satisfies this identity.':analysis.status==='multiple'?'More than one rational value satisfies this equation.':analysis.reason;
   result.verification=analysis.status==='unsupported'?{valid:false,reason:analysis.reason}:verifySolution(result);return result;
  }
  let left=equation.left,right=equation.right;
  if(countUnknowns(equation)!==1){
   // Normalize repeated-x affine expressions without inventing a second unknown.
   if(analysis.polynomial.length===2){left=binaryNode('*',rationalNode(analysis.polynomial[1]),variableNode());right=rationalNode(analysis.polynomial[0].neg());append(equationNode(left,right),{kind:'collect-terms',explanation:'Clear defined denominators and collect the x terms, preserving the original domain.',coefficients:analysis.polynomial.map(q=>q.toJSON())});}
   else {append(equationNode(variableNode(),rationalNode(analysis.roots[0])),{kind:'quadratic-formula',explanation:'Apply the exact quadratic formula and discard values outside the original domain.',coefficients:analysis.polynomial.map(q=>q.toJSON())});result.verification=verifySolution(result);return result;}
  }
  if(countUnknowns(left)===0){[left,right]=[right,left];append(equationNode(left,right),{kind:'swap-sides',explanation:'Swap the two sides of the equality.'});}
  let guard=0;
  while(left.type!=='variable'){
   if(++guard>64)throw new MathProblemError('TOO_COMPLEX','Isolation exceeds 64 operations');
   let next,operand,kind,explanation,conditions=[];
   if(left.type==='negate'){next=left.operand;operand=integerNode(-1);right=binaryNode('*',right,operand);kind='multiply-both-sides';explanation='Multiply both sides by -1.';}
   else if(left.type==='binary'){
    const unknownLeft=countUnknowns(left.left)>0,unknown=unknownLeft?left.left:left.right,constant=unknownLeft?left.right:left.left;
    operand=constant;next=unknown;
    if(left.op==='+'){right=binaryNode('-',right,constant);kind='subtract-both-sides';explanation=`Subtract ${formatExpression(constant)} from both sides.`;}
    else if(left.op==='-'&&unknownLeft){right=binaryNode('+',right,constant);kind='add-both-sides';explanation=`Add ${formatExpression(constant)} to both sides.`;}
    else if(left.op==='-'){next={type:'negate',operand:unknown};right=binaryNode('-',right,constant);kind='subtract-both-sides';explanation=`Subtract ${formatExpression(constant)} from both sides.`;}
    else if(left.op==='*'){const q=evaluateExpression(constant);if(q.isZero)throw new MathProblemError('INTERNAL_VERIFICATION','Cannot divide by zero');right=binaryNode('/',right,constant);kind='divide-both-sides';explanation=`Divide both sides by ${q}.`;conditions=[`${formatExpression(constant)}!=0`];}
    else if(unknownLeft){right=binaryNode('*',right,constant);kind='multiply-both-sides';explanation=`Multiply both sides by ${formatExpression(constant)}.`;conditions=[`${formatExpression(constant)}!=0`];}
    else {const q=evaluateExpression(right);if(q.isZero)throw new MathProblemError('INTERNAL_VERIFICATION','Cannot invert a zero right side');right=binaryNode('/',constant,right);kind='isolate-denominator';explanation='Multiply by the nonzero unknown denominator, then divide by the nonzero right side.';conditions=[`${formatExpression(unknown)}!=0`,`${q}!=0`];}
   }else throw new MathProblemError('UNSUPPORTED_EXPRESSION','Cannot isolate this expression');
   left=next;const unevaluated=structuredClone(right),simple=rationalNode(evaluateExpression(right));
   if(left.type==='variable')right=simple;
   append(equationNode(left,right),{kind,operand:structuredClone(operand),conditions,explanation,...(left.type==='variable'?{calculation:{expression:unevaluated,result:structuredClone(simple)}}:{})});
   if(left.type!=='variable'&&formatExpression(right)!==formatExpression(simple)){right=simple;append(equationNode(left,right),{kind:'simplify-rational',explanation:'Evaluate and reduce the rational arithmetic exactly.',calculation:{expression:unevaluated,result:structuredClone(simple)}});}
  }
  // Input may already be x = an unsimplified rational expression.
  const simple=rationalNode(evaluateExpression(right));if(formatExpression(simple)!==formatExpression(right)){right=simple;append(equationNode(left,right),{kind:'simplify-rational',explanation:'Reduce the rational answer exactly.'});}
  result.verification=verifySolution(result);
  if(!result.verification.valid)throw new MathProblemError('INTERNAL_VERIFICATION',result.verification.reason);
  return result;
 }catch(error){if(!(error instanceof MathProblemError))throw error;return {version:1,status:(error.code.startsWith('UNSUPPORTED')||error.code==='TOO_COMPLEX')?'unsupported':'invalid',error:{code:error.code,message:error.message},solutions:[],steps:[],verification:{valid:false,reason:error.message}};}
}
