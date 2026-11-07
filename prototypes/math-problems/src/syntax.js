// SPDX-License-Identifier: GPL-2.0-or-later
import {Rational,MathProblemError} from './rational.js';
export const integerNode=value=>({type:'integer',value:String(value)});
export const variableNode=()=>({type:'variable',name:'x'});
export const binaryNode=(op,left,right)=>({type:'binary',op,left,right});
export function rationalNode(value){const q=Rational.from(value);return q.d===1n?integerNode(q.n):binaryNode('/',integerNode(q.n),integerNode(q.d));}
export function parseEquation(text) {
  if(typeof text!=='string'||text.length>2048)throw new MathProblemError('INVALID_SYNTAX','Equation must be a string of at most 2048 characters');
  const source=text.replace(/−/g,'-').replace(/[×·]/g,'*').replace(/÷/g,'/'),tokens=[];
  let pos=0;
  while(pos<source.length){if(/\s/.test(source[pos])){pos++;continue;}const number=source.slice(pos).match(/^\d+/);if(number){if(number[0].length>128)throw new MathProblemError('INVALID_INTEGER','Integer literal is too long');tokens.push(number[0]);pos+=number[0].length;}else if('x+-*/()='.includes(source[pos]))tokens.push(source[pos++]);else throw new MathProblemError('INVALID_SYNTAX',`Unsupported character at position ${pos}`);}
  if(tokens.length>256)throw new MathProblemError('TOO_COMPLEX','Equation exceeds 256 tokens');let index=0,depth=0;
  const atom=()=>{if(++depth>48)throw new MathProblemError('TOO_COMPLEX','Equation nesting exceeds 48');let node;const token=tokens[index++];if(token==='x')node=variableNode();else if(token&&/^\d+$/.test(token))node=integerNode(token);else if(token==='+'||token==='-'){const operand=atom();node=token==='+'?operand:{type:'negate',operand};}else if(token==='('){node=expression();if(tokens[index++]!==')')throw new MathProblemError('INVALID_SYNTAX','Missing closing parenthesis');}else throw new MathProblemError('INVALID_SYNTAX','Expected an integer, x or parenthesized expression');depth--;return node;};
  const product=()=>{let node=atom();while(tokens[index]==='*'||tokens[index]==='/'){const op=tokens[index++];node=binaryNode(op,node,atom());}return node;};
  const expression=()=>{let node=product();while(tokens[index]==='+'||tokens[index]==='-'){const op=tokens[index++];node=binaryNode(op,node,product());}return node;};
  const left=expression();if(tokens[index++]!=='=')throw new MathProblemError('INVALID_SYNTAX','Expected exactly one equality');const right=expression();if(index!==tokens.length)throw new MathProblemError('INVALID_SYNTAX','Unexpected trailing input');return {type:'equation',left,right};
}
export function validateEquation(input) {
  if(typeof input==='string')return parseEquation(input);
  let nodes=0;
  const check=(node,depth=0)=>{if(++nodes>256||depth>48)throw new MathProblemError('TOO_COMPLEX','AST size/depth exceeds limits');if(!node||typeof node!=='object')throw new MathProblemError('INVALID_AST','Expected an expression node');
    if(node.type==='integer'){new Rational(node.value);return integerNode(node.value);}
    if(node.type==='variable'&&node.name==='x')return variableNode();
    if(node.type==='negate')return {type:'negate',operand:check(node.operand,depth+1)};
    if(node.type==='binary'&&['+','-','*','/'].includes(node.op))return binaryNode(node.op,check(node.left,depth+1),check(node.right,depth+1));
    throw new MathProblemError('INVALID_AST','Unsupported expression node');};
  if(input?.type!=='equation')throw new MathProblemError('INVALID_AST','Expected an equation AST');return {type:'equation',left:check(input.left),right:check(input.right)};
}
export function countUnknowns(node){return node.type==='variable'?1:node.type==='binary'?countUnknowns(node.left)+countUnknowns(node.right):node.type==='negate'?countUnknowns(node.operand):node.type==='equation'?countUnknowns(node.left)+countUnknowns(node.right):0;}
function precedence(node){return node.type==='binary'?(['+','-'].includes(node.op)?1:2):node.type==='negate'?3:4;}
export function formatExpression(node){
 if(node.type==='integer')return node.value;
 if(node.type==='variable')return 'x';
 if(node.type==='negate'){const value=formatExpression(node.operand);return '-'+(precedence(node.operand)<3?`(${value})`:value);}
 const p=precedence(node),l=formatExpression(node.left),r=formatExpression(node.right);
 const left=precedence(node.left)<p?`(${l})`:l;
 const right=r.startsWith('-')||precedence(node.right)<p||(precedence(node.right)===p&&['-','/'].includes(node.op))||(node.op==='*'&&node.right.type==='binary'&&node.right.op==='/')?`(${r})`:r;
 return left+node.op+right;
}
export const formatEquation=e=>`${formatExpression(e.left)}=${formatExpression(e.right)}`;
export function evaluateExpression(node,value){
 if(node.type==='integer')return new Rational(node.value);
 if(node.type==='variable'){if(value===undefined)throw new MathProblemError('MISSING_VALUE','x needs a value');return Rational.from(value);}
 if(node.type==='negate')return evaluateExpression(node.operand,value).neg();
 const a=evaluateExpression(node.left,value),b=evaluateExpression(node.right,value);return node.op==='+'?a.add(b):node.op==='-'?a.sub(b):node.op==='*'?a.mul(b):a.div(b);
}
