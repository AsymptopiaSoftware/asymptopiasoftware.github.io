// SPDX-License-Identifier: GPL-2.0-or-later
/** Modernized from Charles B. Cossé's crosswordbuilder fraction-toggle-OFF algorithm.
 * Original copyright (C) 2001-2010 Asymptopia Software, GPL. See NOTICE.md. */
import {Rational,MathProblemError} from './rational.js';
import {integerNode,variableNode,binaryNode,formatEquation} from './syntax.js';
import {solveEquation,verifySolution} from './solver.js';
export function seededRandom(seed=0){
 if(!['number','string'].includes(typeof seed)||(typeof seed==='number'&&!Number.isFinite(seed))||String(seed).length>200)throw new MathProblemError('INVALID_SEED','Seed must be a finite number or string of at most 200 characters');
 let state=2166136261;for(const c of String(seed)){state^=c.charCodeAt(0);state=Math.imul(state,16777619)>>>0;}
 return ()=>{state=(state+0x6D2B79F5)>>>0;let t=state;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};
}
export function createProblemGenerator(options={}) {
 const {seed=0,min=1,max=9,operator,missingSlot,maxAttempts=500}=options;
 if(!Number.isSafeInteger(min)||!Number.isSafeInteger(max)||min>max||Math.abs(min)>1000000||Math.abs(max)>1000000||(min===0&&max===0))throw new MathProblemError('INVALID_RANGE','Use an inclusive integer range within ±1000000 containing a nonzero integer');
 if(operator!==undefined&&!['+','-','*'].includes(operator))throw new MathProblemError('INVALID_OPERATOR','Operator must be +, - or *');
 const slots=['a','b','c','d','e','f'];if(missingSlot!==undefined&&!slots.includes(missingSlot))throw new MathProblemError('INVALID_SLOT','Unknown slot must be a, b, c, d, e or f');
 if(!Number.isInteger(maxAttempts)||maxAttempts<1||maxAttempts>10000)throw new MathProblemError('INVALID_BUDGET','maxAttempts must be 1…10000');
 const random=seededRandom(seed),nonzeroCount=max-min+1-(min<=0&&max>=0?1:0);
 const sample=()=>{let value=min+Math.floor(random()*nonzeroCount);if(min<=0&&value>=0)value++;return BigInt(value);};
 return ()=>{
  for(let attempt=0;attempt<maxAttempts;attempt++){
   const a=sample(),b=sample(),d=sample(),e=sample(),op=operator??['+','-','*'][Math.floor(random()*3)];
   const first=new Rational(a,d),second=new Rational(b,e),value=op==='+'?first.add(second):op==='-'?first.sub(second):first.mul(second);
   const values={a,b,c:value.n,d,e,f:value.d},slot=missingSlot??slots[Math.floor(random()*6)];
   const n=key=>key===slot?variableNode():integerNode(values[key]);
   const equation={type:'equation',left:binaryNode(op,binaryNode('/',n('a'),n('d')),binaryNode('/',n('b'),n('e'))),right:binaryNode('/',n('c'),n('f'))};
   const solution=solveEquation(equation),answer=new Rational(values[slot]);
   if(solution.status!=='unique'||!solution.verification.valid||!verifySolution(solution).valid||!Rational.from(solution.solutions[0]).equals(answer))continue;
   return {version:1,text:formatEquation(equation),equation,operator:op,missingSlot:slot,answer:answer.toJSON(),completed:Object.fromEntries(Object.entries(values).map(([k,v])=>[k,String(v)])),validation:{unique:true,transformationsVerified:true,originalArithmeticValid:value.equals(new Rational(values.c,values.f))}};
  }
  throw new MathProblemError('GENERATION_EXHAUSTED','No unique valid problem was found within the attempt budget');
 };
}
export function generateProblem(options={}){return createProblemGenerator(options)();}
export function generateProblems(options={}){const {count=3,...rest}=options;if(!Number.isInteger(count)||count<1||count>1000)throw new MathProblemError('INVALID_COUNT','count must be 1…1000');const next=createProblemGenerator(rest);return Array.from({length:count},()=>next());}
