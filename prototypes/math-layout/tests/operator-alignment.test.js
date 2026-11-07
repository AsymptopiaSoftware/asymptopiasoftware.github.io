import test from 'node:test';
import assert from 'node:assert/strict';
import {parseEquation} from '../../math-problems/src/syntax.js';
import {layoutExpression,layoutEquation,layoutEquations} from '../src/layout.js';
import {positionStrokes} from '../src/strokes.js';
import {GLYPHS} from '../../drawing-arm/src/glyphs.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} ≉ ${b}`);
const catalog=['x/5-4/4=2/5','1/2+3/4=5/4','-1/2-(-3/4)=x','-(1/2)+x=3/4',
 '1/(2/3)-(4/5)/6=x/7','(1/2)/(3/4)+x=5/(6/7)','2-x/5=3','x/5-2=3/4','2+3/4=x','-2/3+4=5'];
const inkBounds=strokes=>{const p=strokes.flatMap(s=>s.points);return {left:Math.min(...p.map(p=>p[0])),right:Math.max(...p.map(p=>p[0])),top:Math.min(...p.map(p=>p[1])),bottom:Math.max(...p.map(p=>p[1]))};};
test('layout explicitly distinguishes text baseline, math axis, bar position and fraction child baselines',()=>{
 for(const text of catalog){
  const eq=layoutEquation(text);near(eq.axis,eq.mathAxis);near(eq.baseline-eq.mathAxis,eq.size/2);assert.ok(eq.baseline>eq.mathAxis);
  for(const bar of eq.items.filter(i=>i.kind==='fraction-bar')){
   near(bar.y,bar.barY);near(bar.mathAxis,bar.barY);assert.ok(bar.numeratorBaseline<bar.barY);assert.ok(bar.denominatorBaseline>bar.barY);
   assert.ok(bar.baseline>bar.mathAxis);near(bar.fractionBounds.y+bar.fractionBounds.height/2,bar.barY);
  }
  for(const glyph of eq.items.filter(i=>i.kind==='glyph'&&i.role!=='parenthesis'))near(glyph.baseline,glyph.y+glyph.height);
 }
 // Numerator/denominator text baselines are independently positioned, not aliases of the bar.
 const box=layoutExpression(parseEquation('x/5=0').left),bar=box.items.find(i=>i.kind==='fraction-bar');
 near(bar.numeratorBaseline,box.items.find(i=>i.text==='x').baseline);near(bar.denominatorBaseline,box.items.find(i=>i.text==='5').baseline);
});
test('binary/relation operator ink is centered on the complete expression axis for nested and mixed operands',()=>{
 for(const text of catalog){
  const eq=layoutEquation(text),geometry=positionStrokes(eq,GLYPHS);
  near(eq.mathAxis,eq.height/2);
  for(const [index,item]of eq.items.entries())if(item.operator&&item.role==='operator'){
   const ink=inkBounds(geometry.strokes.filter(s=>s.item===index));
   near((ink.top+ink.bottom)/2,eq.mathAxis);near(item.mathAxis,eq.mathAxis);
  }
  for(const bar of eq.items.filter(i=>i.kind==='fraction-bar'&&i.role==='fraction-bar'))near(bar.barY,eq.mathAxis);
 }
});
test('adjacent fraction bars cannot connect to plus, minus or equals ink, including signed/nested expressions',()=>{
 for(const text of catalog)for(const size of [12,24,36]){
  const box=layoutEquation(text,{size}),geometry=positionStrokes(box,GLYPHS);
  for(const [index,item]of box.items.entries())if(item.operator){
   const ink=inkBounds(geometry.strokes.filter(s=>s.item===index));
   for(const bar of box.items.filter(i=>i.kind==='fraction-bar')){
    if(bar.barY<item.y-1e-8||bar.barY>item.y+item.height+1e-8)continue;
    const gap=bar.x>=ink.right?bar.x-ink.right:ink.left-(bar.x+bar.width);
    assert.ok(gap>=item.height*.5-1e-8,`${text}: ${item.text} has insufficient bar clearance (${gap})`);
    // 2.2-unit chalk has round caps: their combined radius must not close this gap.
    assert.ok(gap>2.2,`${text}: operator and bar stroke caps overlap`);
   }
  }
 }
 const box=layoutEquation('1/2-3/4=5/6',{size:24,operatorGap:.01}),minus=box.items.find(i=>i.text==='-');
 const bar=box.items.find(i=>i.kind==='fraction-bar');assert.ok(minus.x-bar.x-bar.width>=12-1e-8);
});
test('multiline equals columns and all explicit baseline metrics survive row translation and fitting',()=>{
 const eqs=['x/5-4/4=2/5','x/5=2/5+4/4','x/5=7/5','x=7','1/(x/2)=(-3)/4'];
 const box=layoutEquations(eqs,{maxSize:24,minSize:8,width:300,height:400});
 assert.ok(box.width<=300&&box.height<=400);
 for(const row of box.rows){
  near(row.equalsX,box.rows[0].equalsX);near(row.axis,row.mathAxis);near(row.mathAxis,row.y+row.height/2);near(row.baseline-row.mathAxis,box.size/2);
  const items=box.items.filter(i=>i.row===row.index),equals=items.find(i=>i.text==='=');near(equals.x,row.equalsX);near(equals.mathAxis,row.mathAxis);
  for(const bar of items.filter(i=>i.kind==='fraction-bar')){
   near(bar.y,bar.barY);assert.ok(bar.numeratorBaseline>=row.y);assert.ok(bar.denominatorBaseline<=row.y+row.height+1e-8);
   near(bar.fractionBounds.y+bar.fractionBounds.height/2,bar.barY);
  }
 }
});
