// SPDX-License-Identifier: GPL-2.0-or-later
import {validateEquation} from '../../math-problems/src/syntax.js';
const metrics17={glyphWidth:.62,advance:.95,operatorGap:.25,fractionScale:.78,fractionGap:.15,fractionPadding:.16};
const shift17=(items,x,y,role)=>items.map(item=>({...item,x:item.x+x,y:item.y+y,...(item.points?{points:item.points.map(p=>[p[0]+x,p[1]+y])}:{}),role:role?`${role}/${item.role??'content'}`:item.role}));
function textBox17(text,size,m){
 const width=text.length?(text.length-1)*m.advance*size+m.glyphWidth*size:0;
 return {width,height:size,axis:size/2,items:[...text].map((text,i)=>({kind:'glyph',text,x:i*m.advance*size,y:0,width:m.glyphWidth*size,height:size,role:'glyph'}))};
}
function rowBox17(boxes,gap=0){
 const axis=Math.max(...boxes.map(b=>b.axis)),below=Math.max(...boxes.map(b=>b.height-b.axis));let x=0;const items=[];
 for(const [i,b]of boxes.entries()){if(i)x+=gap;items.push(...shift17(b.items,x,axis-b.axis));x+=b.width;}
 return {width:x,height:axis+below,axis,items};
}
function parentheses17(box,size,m){
 const width=.35*size,left={kind:'glyph',text:'(',x:0,y:0,width,height:box.height,role:'parenthesis'};
 return {width:box.width+2*width+.16*size,height:box.height,axis:box.axis,items:[left,...shift17(box.items,width+.08*size,0),{...left,text:')',x:box.width+width+.16*size}]};
}
const precedence17=node=>node.type==='binary'?(node.op==='+'||node.op==='-'?1:2):3;
function expressionBox17(node,size,m){
 if(node.type==='integer')return textBox17(node.value,size,m);
 if(node.type==='variable')return textBox17('x',size,m);
 if(node.type==='negate'){
  let child=expressionBox17(node.operand,size,m);
  if(node.operand.type==='binary'&&node.operand.op!=='/')child=parentheses17(child,size,m);
  return rowBox17([textBox17('-',size,m),child],.1*size);
 }
 if(node.op==='/'){
  const n=expressionBox17(node.left,size*m.fractionScale,m),d=expressionBox17(node.right,size*m.fractionScale,m);
  const padding=m.fractionPadding*size,gap=m.fractionGap*size,width=Math.max(n.width,d.width)+2*padding,axis=n.height+gap,denY=axis+gap;
  return {width,height:denY+d.height,axis,items:[...shift17(n.items,(width-n.width)/2,0,'numerator'),
   {kind:'fraction-bar',x:0,y:axis,width,height:0,points:[[0,axis],[width,axis]],role:'fraction-bar'},
   ...shift17(d.items,(width-d.width)/2,denY,'denominator')]};
 }
 let left=expressionBox17(node.left,size,m),right=expressionBox17(node.right,size,m);
 if(precedence17(node.left)<precedence17(node))left=parentheses17(left,size,m);
 if(node.right.type==='negate'||(node.right.type==='integer'&&node.right.value.startsWith('-'))||precedence17(node.right)<precedence17(node)||(node.op==='-'&&precedence17(node.right)===precedence17(node)))right=parentheses17(right,size,m);
 return rowBox17([left,textBox17(node.op==='*'?'×':node.op,size,m),right],m.operatorGap*size);
}
function options17(options){const {size=24,...custom}=options;const m={...metrics17,...custom};if(!Number.isFinite(size)||size<=0||Object.values(m).some(v=>!Number.isFinite(v)||v<=0)||m.fractionScale>=1)throw new RangeError('Invalid math layout metrics');return {size,m};}
/** Pure boxes/positioned symbols; no font paths, SVG or animation clocks. */
export function layoutExpression(expression,options={}){
 const node=validateEquation({type:'equation',left:expression,right:{type:'integer',value:'0'}}).left;
 const {size,m}=options17(options);return {version:1,...expressionBox17(node,size,m),size};
}
export function layoutEquation(input,options={}){
 const eq=validateEquation(input),{size,m}=options17(options),left=expressionBox17(eq.left,size,m),right=expressionBox17(eq.right,size,m),equals=textBox17('=',size,m);
 return {version:1,...rowBox17([left,equals,right],m.operatorGap*size),size,equalsX:left.width+m.operatorGap*size};
}
/** Size/line placement uses measured expression boxes, not slash-string lengths. */
export function layoutEquations(equations,options={}){
 const {maxSize=24,minSize=12,width=515,height=220,rowGap=.5,alignEquals=true}=options;
 if(!Array.isArray(equations)||!equations.length)throw new TypeError('At least one equation is required');
 if(![maxSize,minSize,width,height,rowGap].every(v=>Number.isFinite(v)&&v>0)||maxSize<minSize)throw new RangeError('Invalid equation layout bounds');
 const units=equations.map(eq=>layoutEquation(eq,{size:1})),eqX=Math.max(...units.map(b=>b.equalsX));
 const unitWidth=Math.max(...units.map(b=>b.width+(alignEquals?eqX-b.equalsX:0))),unitHeight=units.reduce((sum,b)=>sum+b.height,0)+(units.length-1)*rowGap;
 const size=Math.min(maxSize,width/unitWidth,height/unitHeight);if(size<minSize)throw new RangeError('Solution has too many/large expressions for this board; use a paged consumer');
 const rows=[],items=[];let y=0;
 for(const [row,eq]of equations.entries()){
  const box=layoutEquation(eq,{size}),x=alignEquals?eqX*size-box.equalsX:0;
  rows.push({index:row,x,y,width:box.width,height:box.height,axis:y+box.axis,equalsX:x+box.equalsX});
  items.push(...shift17(box.items,x,y).map(item=>({...item,row})));y+=box.height+rowGap*size;
 }
 return {version:1,width:unitWidth*size,height:unitHeight*size,size,rows,items};
}
