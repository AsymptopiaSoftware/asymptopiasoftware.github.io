import test from 'node:test';
import {analyzeEquation} from '../src/algebra.js';
import assert from 'node:assert/strict';
import {Rational,gcd,solveEquation,verifySolution,parseEquation,formatEquation,evaluateExpression,generateProblem,generateProblems,createProblemGenerator} from '../src/index.js';
test('exact rationals normalize signs, zeros and reducible fractions beyond floating-point precision',()=>{
 assert.deepEqual(new Rational(-6,-8).toJSON(),{numerator:'3',denominator:'4'});assert.equal(new Rational(0,-42).toString(),'0');
 assert.equal(new Rational('9007199254740993').add(1).toString(),'9007199254740994');assert.equal(new Rational(1,3).add(new Rational(1,6)).toString(),'1/2');
 for(const bad of [()=>new Rational(1,0),()=>new Rational(.1),()=>new Rational(Number.MAX_SAFE_INTEGER+1)])assert.throws(bad);
 assert.throws(()=>new Rational(1).div(0));
});
test('rational arithmetic agrees with independent integer cross-product identities',()=>{
 for(let a=-8;a<=8;a++)for(let b=1;b<=8;b++)for(let c=-4;c<=4;c++){
  const x=new Rational(a,b),y=new Rational(c,7),sum=x.add(y),product=x.mul(y);
  assert.equal(sum.n*BigInt(b*7),BigInt(a*7+c*b)*sum.d);assert.equal(product.n*BigInt(b*7),BigInt(a*c)*product.d);
  if(c){const q=x.div(y);assert.equal(q.n*BigInt(b*c),BigInt(a*7)*q.d);}
 }
});
test('initial example produces exactly the four requested algebraic steps and structured operations',()=>{
 const s=solveEquation('x/5-4/4=2/5');assert.equal(s.status,'unique');assert.deepEqual(s.steps.map(s=>s.text),['x/5-4/4=2/5','x/5=2/5+4/4','x/5=7/5','x=7']);assert.equal(Rational.from(s.solutions[0]).toString(),'7');
 assert.deepEqual(s.steps.map(s=>s.operation.kind),['given','add-both-sides','simplify-rational','multiply-both-sides']);assert.ok(s.verification.valid);assert.equal(s.verification.steps.length,4);assert.ok(s.steps.every(s=>s.equation.type==='equation'&&s.operation.explanation));
});
test('x is isolated in numerators/denominators and on either side, with negative and reducible inputs',()=>{
 const cases=[['3/x+2/5=7/5','3'],['3/x=2/5','15/2'],['1/x=-2','-1/2'],['x/3-1=-1','0'],['1/x=2/(x+1)','1'],['1/2+1/3=x/6','5'],['1/2+1/3=5/x','6'],['1/2-x/3=1/6','1'],['-x/(-5)+(-2)/4=-3/2','-5'],['4/(x+1)=2','1'],['1/(x-1)=-1','0'],['x/(-2)=3/4','-3/2'],['x/2+1=x/3+2','6']];
 for(const [text,answer]of cases){const s=solveEquation(text);assert.equal(s.status,'unique',text);assert.equal(Rational.from(s.solutions[0]).toString(),answer,text);assert.ok(s.verification.valid,text);assert.ok(verifySolution(JSON.parse(JSON.stringify(s))).valid,text);}
});
test('zero denominators and syntactically invalid input are explicit errors, never approximate answers',()=>{
 for(const text of ['x/0=1','x/(2-2)=1','1/(x-x)=0','x=1/0','x+ =1','x^2=1','x=1=2','2/3=2/3','1e3=x']){const s=solveEquation(text);assert.equal(s.status,'invalid',text);assert.equal(s.verification.valid,false);}
});
test('domain restrictions reject extraneous cross-multiplication roots and preserve identities',()=>{
 for(const text of ['0/x=1','1/x=0','x/x=0','x/(x-1)=1']){const s=solveEquation(text);assert.equal(s.status,'none',text);assert.deepEqual(s.solutions,[]);assert.ok(s.verification.valid);}
 for(const text of ['x/x=1','0/x=0']){const s=solveEquation(text);assert.equal(s.status,'infinite');assert.ok(s.domain.some(d=>d.text==='x!=0'));assert.ok(s.verification.valid);}
 const q=solveEquation('x*x/x=1');assert.equal(q.status,'unique');assert.equal(Rational.from(q.solutions[0]).toString(),'1');assert.ok(q.verification.valid);
});
test('ambiguous and unsupported nonlinear inputs are distinguished',()=>{
 const multi=solveEquation('x*x=1');assert.equal(multi.status,'multiple');assert.deepEqual(multi.solutions.map(q=>Rational.from(q).toString()),['-1','1']);assert.ok(multi.verification.valid);
 assert.equal(solveEquation('x*x=-1').status,'none');assert.equal(solveEquation('x*x=2').status,'unsupported');assert.equal(solveEquation('x*x*x=2').status,'unsupported');
});
test('verification rejects altered transformations, explanations metadata, domain and final answers',()=>{
 const source=solveEquation('x/5-4/4=2/5');
 for(const change of [s=>{s.steps[1].operation.operand={type:'integer',value:'99'};},s=>{s.steps[1].equation.right={type:'integer',value:'99'};s.steps[1].text=formatEquation(s.steps[1].equation);},s=>{s.domain=[];},s=>{s.solutions=[{numerator:'99',denominator:'1'}];},s=>{s.steps.at(-1).text='x=99';},s=>{s.steps.at(-1).operation.calculation={expression:{type:'integer',value:'99'},result:{type:'integer',value:'99'}};},s=>{s.steps[1].operation={kind:'quadratic-formula',explanation:'Wrong method',coefficients:analyzeEquation(s.equation).polynomial.map(q=>q.toJSON())};}]){const copy=structuredClone(source);change(copy);assert.equal(verifySolution(copy).valid,false);}
 const reciprocal=solveEquation('3/x=2');reciprocal.steps.at(-1).operation.operand={type:'integer',value:'99'};assert.equal(verifySolution(reciprocal).valid,false);
});
test('parser/formatter and JSON AST round trips preserve exact equations without eval',()=>{
 for(const text of ['x/5-4/4=2/5','(-2)/x+3/(-4)=1','1-(x-2)=3','2/(x/3)=1']){const ast=parseEquation(text);assert.deepEqual(parseEquation(formatEquation(ast)),parseEquation(formatEquation(parseEquation(formatEquation(ast)))));}
 const s=solveEquation('x=9007199254740993/7');assert.ok(s.verification.valid);assert.equal(Rational.from(s.solutions[0]).toString(),'9007199254740993/7');
});
test('seeded generator is reproducible and emits reduced results with a verified missing integer',()=>{
 const a=generateProblems({seed:'B1.6',count:3}),b=generateProblems({seed:'B1.6',count:3});assert.deepEqual(a,b);
 assert.deepEqual(a.map(p=>p.text),['3/1-8/4=x/1','4/x+7/7=5/3','x/4+7/4=9/4']);
 assert.notDeepEqual(a,generateProblems({seed:'other',count:3}));
 const next=createProblemGenerator({seed:123});assert.deepEqual([next(),next()],generateProblems({seed:123,count:2}));
});
test('every operator and all six missing slots generate uniquely solvable, equivalent exact problems',()=>{
 for(const operator of ['+','-','*'])for(const missingSlot of ['a','b','c','d','e','f'])for(let seed=0;seed<16;seed++){
  const p=generateProblem({seed,min:-9,max:9,operator,missingSlot}),s=solveEquation(p.equation),v=p.completed;
  assert.equal(p.operator,operator);assert.equal(p.missingSlot,missingSlot);assert.equal((p.text.match(/x/g)||[]).length,1);assert.equal(s.status,'unique');assert.ok(s.verification.valid);assert.ok(verifySolution(s).valid);
  assert.equal(gcd(BigInt(v.c),BigInt(v.f)),1n);assert.ok(BigInt(v.f)>0n);assert.ok(evaluateExpression(p.equation.left,p.answer).equals(evaluateExpression(p.equation.right,p.answer)));
  assert.ok(Rational.from(p.answer).equals(s.solutions[0]));
 }
});
test('generator rejects impossible/invalid settings with a bounded failure',()=>{
 for(const options of [{min:0,max:0},{min:4,max:1},{operator:'/'},{missingSlot:'g'},{maxAttempts:0},{seed:NaN}])assert.throws(()=>generateProblem(options));
 assert.throws(()=>generateProblem({min:1,max:1,operator:'-',missingSlot:'f',maxAttempts:3}),e=>e.code==='GENERATION_EXHAUSTED');
});
