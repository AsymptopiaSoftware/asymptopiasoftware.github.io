// SPDX-License-Identifier: GPL-2.0-or-later
import {Rational,MathProblemError} from './rational.js';
import {validateEquation,countUnknowns,formatExpression} from './syntax.js';
const Q0=new Rational(0),Q1=new Rational(1);
export function trimPolynomial(p){while(p.length>1&&p.at(-1).isZero)p.pop();return p;}
export function addPolynomial(a,b,subtract=false){return trimPolynomial(Array.from({length:Math.max(a.length,b.length)},(_,i)=>(a[i]??Q0).add(subtract?(b[i]??Q0).neg():(b[i]??Q0))));}
export function multiplyPolynomial(a,b){if(a.length+b.length-2>8)throw new MathProblemError('UNSUPPORTED_DEGREE','Polynomial degree exceeds 8');const p=Array(a.length+b.length-1).fill(Q0);for(let i=0;i<a.length;i++)for(let j=0;j<b.length;j++)p[i+j]=p[i+j].add(a[i].mul(b[j]));return trimPolynomial(p);}
export function evaluatePolynomial(p,x){let value=Q0;for(let i=p.length-1;i>=0;i--)value=value.mul(x).add(p[i]);return value;}
const zeroPolynomial=p=>p.length===1&&p[0].isZero;
function symbolic(node,restrictions){
 if(node.type==='integer')return {n:[new Rational(node.value)],d:[Q1]};
 if(node.type==='variable')return {n:[Q0,Q1],d:[Q1]};
 if(node.type==='negate'){const r=symbolic(node.operand,restrictions);return {...r,n:r.n.map(q=>q.neg())};}
 const a=symbolic(node.left,restrictions),b=symbolic(node.right,restrictions);
 if(node.op==='/'){
  if(zeroPolynomial(b.n))throw new MathProblemError('ZERO_DENOMINATOR',`Denominator ${formatExpression(node.right)} is identically zero`);
  restrictions.push({expression:node.right,polynomial:b.n});return {n:multiplyPolynomial(a.n,b.d),d:multiplyPolynomial(a.d,b.n)};
 }
 if(node.op==='*')return {n:multiplyPolynomial(a.n,b.n),d:multiplyPolynomial(a.d,b.d)};
 return {n:addPolynomial(multiplyPolynomial(a.n,b.d),multiplyPolynomial(b.n,a.d),node.op==='-'),d:multiplyPolynomial(a.d,b.d)};
}
function integerSqrt(n){if(n<0n)return null;if(n<2n)return n;let x=n,y=(x+1n)/2n;while(y<x){x=y;y=(x+n/x)/2n;}return x*x===n?x:null;}
function rationalSqrt(q){if(q.n<0n)return null;const n=integerSqrt(q.n),d=integerSqrt(q.d);return n===null||d===null?null:new Rational(n,d);}
export function polynomialRoots(p){
 if(p.length===1)return {status:p[0].isZero?'infinite':'none',roots:[]};
 if(p.length===2)return {status:'unique',roots:[p[0].neg().div(p[1])]};
 if(p.length===3){const [c,b,a]=p,discriminant=b.mul(b).sub(a.mul(c).mul(4));if(discriminant.n<0n)return {status:'none',roots:[]};const root=rationalSqrt(discriminant);if(!root)return {status:'unsupported',roots:[],reason:'Irrational roots require an algebraic-number extension'};const roots=[b.neg().sub(root).div(a.mul(2)),b.neg().add(root).div(a.mul(2))];return {status:roots[0].equals(roots[1])?'unique':'multiple',roots:roots[0].equals(roots[1])?[roots[0]]:roots};}
 return {status:'unsupported',roots:[],reason:'Only affine and rational-root quadratic equations are classified'};
}
export function analyzeEquation(input,extraRestrictions=[]) {
 const equation=validateEquation(input);if(!countUnknowns(equation))throw new MathProblemError('MISSING_UNKNOWN','An equation problem must contain x');
 const restrictions=[],left=symbolic(equation.left,restrictions),right=symbolic(equation.right,restrictions);
 const polynomial=addPolynomial(multiplyPolynomial(left.n,right.d),multiplyPolynomial(right.n,left.d),true);
 const domain=[...extraRestrictions,...restrictions],classification=polynomialRoots(polynomial);
 const roots=classification.roots.filter(x=>domain.every(r=>!evaluatePolynomial(r.polynomial,x).isZero));
 let status=classification.status;if(status==='unique'||status==='multiple')status=roots.length===0?'none':roots.length===1?'unique':'multiple';
 return {equation,polynomial,restrictions:domain,status,roots,reason:classification.reason};
}
export function serializeRestrictions(restrictions){return restrictions.map(r=>({expression:structuredClone(r.expression),text:`${formatExpression(r.expression)}!=0`,polynomial:r.polynomial.map(q=>q.toJSON())}));}
export function sameSolutionSet(a,b){
 if(a.status!==b.status)return false;
 if(a.status==='unsupported')return false;
 if(a.status==='unique'||a.status==='multiple')return a.roots.length===b.roots.length&&a.roots.every(x=>b.roots.some(y=>x.equals(y)));
 if(a.status==='none')return true;
 // Infinite equations are equivalent only if they exclude the same rational values.
 const exclusions=analysis=>{
  const roots=[];for(const r of analysis.restrictions){const result=polynomialRoots(r.polynomial);if(result.status==='unsupported'||result.status==='infinite')return null;roots.push(...result.roots);}return roots;
 };
 const x=exclusions(a),y=exclusions(b);return !!x&&!!y&&x.every(q=>y.some(r=>r.equals(q)))&&y.every(q=>x.some(r=>r.equals(q)));
}
export function equivalentExpressions(a,b){
 const restrictions=[],x=symbolic(a,restrictions),y=symbolic(b,restrictions);
 return zeroPolynomial(addPolynomial(multiplyPolynomial(x.n,y.d),multiplyPolynomial(y.n,x.d),true));
}
