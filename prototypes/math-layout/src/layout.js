// SPDX-License-Identifier: GPL-2.0-or-later
import {validateEquation} from '../../math-problems/src/syntax.js';
const metrics17={glyphWidth:.62,advance:.95,operatorGap:.55,fractionScale:.78,fractionGap:.15,fractionPadding:.16};
// All vertical metrics are explicit y coordinates in the box/item's coordinate system.
// The text baseline is half an em below the mathematical axis; it is not the bar.
const verticalMetrics17=(mathAxis,size)=>({axis:mathAxis,mathAxis,baseline:mathAxis+size/2});
const verticalKeys17=['mathAxis','baseline','barY','numeratorBaseline','denominatorBaseline'];
const shift17=(items,x,y,role)=>items.map(item=>({...item,x:item.x+x,y:item.y+y,
 ...Object.fromEntries(verticalKeys17.filter(key=>item[key]!==undefined).map(key=>[key,item[key]+y])),
 ...(item.fractionBounds?{fractionBounds:{...item.fractionBounds,x:item.fractionBounds.x+x,y:item.fractionBounds.y+y}}:{}),
 ...(item.points?{points:item.points.map(p=>[p[0]+x,p[1]+y])}:{}),role:role?`${role}/${item.role??'content'}`:item.role}));
function textBox17(text,size,m,operator){
 const width=text.length?(text.length-1)*m.advance*size+m.glyphWidth*size:0;
 return {width,height:size,...verticalMetrics17(size/2,size),items:[...text].map((text,i)=>({kind:'glyph',text,x:i*m.advance*size,y:0,width:m.glyphWidth*size,height:size,
  mathAxis:size/2,baseline:size,role:operator?'operator':'glyph',...(operator?{operator}:text==='-'?{operator:'unary'}:{})}))};
}
function rowBox17(boxes,size,gap=0){
 const mathAxis=Math.max(...boxes.map(b=>b.mathAxis)),below=Math.max(...boxes.map(b=>b.height-b.mathAxis));let x=0;const items=[];
 for(const [i,b]of boxes.entries()){if(i)x+=gap;items.push(...shift17(b.items,x,mathAxis-b.mathAxis));x+=b.width;}
 return {width:x,height:mathAxis+below,...verticalMetrics17(mathAxis,size),items};
}
function parentheses17(box,size,m){
 const width=.35*size,left={kind:'glyph',text:'(',x:0,y:0,width,height:box.height,mathAxis:box.mathAxis,baseline:box.baseline,role:'parenthesis'};
 return {width:box.width+2*width+.16*size,height:box.height,...verticalMetrics17(box.mathAxis,size),items:[left,...shift17(box.items,width+.08*size,0),{...left,text:')',x:box.width+width+.16*size}]};
}
const precedence17=node=>node.type==='binary'?(node.op==='+'||node.op==='-'?1:2):3;
// A consumer can increase spacing, but cannot collapse operator/fraction clearance.
const operatorGap17=(m,size)=>Math.max(.5,m.operatorGap)*size;
function expressionBox17(node,size,m){
 if(node.type==='integer')return textBox17(node.value,size,m);
 if(node.type==='variable')return textBox17('x',size,m);
 if(node.type==='negate'){
  let child=expressionBox17(node.operand,size,m);
  if(node.operand.type==='binary'&&node.operand.op!=='/')child=parentheses17(child,size,m);
  return rowBox17([textBox17('-',size,m,'unary'),child],size,operatorGap17(m,size));
 }
 if(node.op==='/'){
  const n=expressionBox17(node.left,size*m.fractionScale,m),d=expressionBox17(node.right,size*m.fractionScale,m);
  const padding=m.fractionPadding*size,gap=m.fractionGap*size,width=Math.max(n.width,d.width)+2*padding;
  // Balance full child extents, including nested fractions, on the math axis.
  const extent=Math.max(n.height,d.height),barY=extent+gap,numY=extent-n.height,denY=barY+gap,height=2*(extent+gap);
  const vm=verticalMetrics17(barY,size);
  return {width,height,...vm,items:[...shift17(n.items,(width-n.width)/2,numY,'numerator'),
   {kind:'fraction-bar',x:0,y:barY,width,height:0,...{mathAxis:vm.mathAxis,baseline:vm.baseline},barY,
    numeratorBaseline:numY+n.baseline,denominatorBaseline:denY+d.baseline,
    fractionBounds:{x:0,y:0,width,height},points:[[0,barY],[width,barY]],role:'fraction-bar'},
   ...shift17(d.items,(width-d.width)/2,denY,'denominator')]};
 }
 let left=expressionBox17(node.left,size,m),right=expressionBox17(node.right,size,m);
 if(precedence17(node.left)<precedence17(node))left=parentheses17(left,size,m);
 if(node.right.type==='negate'||(node.right.type==='integer'&&node.right.value.startsWith('-'))||precedence17(node.right)<precedence17(node)||(node.op==='-'&&precedence17(node.right)===precedence17(node)))right=parentheses17(right,size,m);
 return rowBox17([left,textBox17(node.op==='*'?'×':node.op,size,m,'binary'),right],size,operatorGap17(m,size));
}
function options17(options){const {size=24,...custom}=options;const m={...metrics17,...custom};if(!Number.isFinite(size)||size<=0||Object.values(m).some(v=>!Number.isFinite(v)||v<=0)||m.fractionScale>=1)throw new RangeError('Invalid math layout metrics');return {size,m};}
/** Pure boxes/positioned symbols; no font paths, SVG or animation clocks. */
export function layoutExpression(expression,options={}){
 const node=validateEquation({type:'equation',left:expression,right:{type:'integer',value:'0'}}).left;
 const {size,m}=options17(options);return {version:1,...expressionBox17(node,size,m),size};
}
export function layoutEquation(input,options={}){
 const eq=validateEquation(input),{size,m}=options17(options),left=expressionBox17(eq.left,size,m),right=expressionBox17(eq.right,size,m),equals=textBox17('=',size,m,'relation');
 return {version:1,...rowBox17([left,equals,right],size,operatorGap17(m,size)),size,equalsX:left.width+operatorGap17(m,size)};
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
  rows.push({index:row,x,y,width:box.width,height:box.height,axis:y+box.mathAxis,mathAxis:y+box.mathAxis,baseline:y+box.baseline,equalsX:x+box.equalsX});
  items.push(...shift17(box.items,x,y).map(item=>({...item,row})));y+=box.height+rowGap*size;
 }
 return {version:1,width:unitWidth*size,height:unitHeight*size,size,rows,items};
}
