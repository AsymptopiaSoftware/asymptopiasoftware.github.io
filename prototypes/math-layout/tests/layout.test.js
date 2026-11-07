import test from 'node:test';
import assert from 'node:assert/strict';
import {parseEquation} from '../../math-problems/src/syntax.js';
import {layoutExpression,layoutEquation,layoutEquations} from '../src/layout.js';
import {positionStrokes} from '../src/strokes.js';
import {GLYPHS} from '../../drawing-arm/src/glyphs.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} ≉ ${b}`);
const bounds=items=>({left:Math.min(...items.map(i=>i.x)),right:Math.max(...items.map(i=>i.x+i.width)),top:Math.min(...items.map(i=>i.y)),bottom:Math.max(...items.map(i=>i.y+i.height))});
test('B1.7 fractions center complete numerator/denominator expressions above and below a drawn bar',()=>{
 for(const text of ['x/5=1','(-4)/12=1','(x+1)/(2-3)=1','12/(x-2)=1']){
  const input=parseEquation(text).left,copy=structuredClone(input),box=layoutExpression(input),bar=box.items.find(i=>i.kind==='fraction-bar');
  const n=bounds(box.items.filter(i=>i.role.startsWith('numerator/'))),d=bounds(box.items.filter(i=>i.role.startsWith('denominator/')));
  assert.ok(n.bottom<bar.y);assert.ok(d.top>bar.y);near((n.left+n.right)/2,bar.x+bar.width/2);near((d.left+d.right)/2,bar.x+bar.width/2);
  assert.ok(bar.width>n.right-n.left&&bar.width>d.right-d.left);assert.deepEqual(input,copy);assert.ok(!box.items.some(i=>i.text==='/'));
 }
});
test('nested fractions and negative values retain hierarchy without slash glyphs',()=>{
 const eq=layoutEquation('1/(x/2)=-3/4');assert.equal(eq.items.filter(i=>i.kind==='fraction-bar').length,3);assert.ok(eq.items.some(i=>i.role.includes('denominator/numerator')));assert.ok(eq.items.some(i=>i.text==='-'));assert.ok(!eq.items.some(i=>i.text==='/'));
 const geometry=positionStrokes(eq,GLYPHS);assert.equal(geometry.strokes.filter(s=>s.kind==='fraction-bar').length,3);assert.ok(geometry.strokes.every(s=>s.points.every(p=>p.every(Number.isFinite))));
});
test('operators align on the fraction axis and parentheses preserve expression grouping',()=>{
 const eq=layoutEquation('(x+1)*2=3/5'),bar=eq.items.find(i=>i.kind==='fraction-bar');
 const equals=eq.items.find(i=>i.text==='='),times=eq.items.find(i=>i.text==='·');near(equals.y+equals.height/2,bar.y);near(times.y+times.height/2,bar.y);assert.ok(eq.items.some(i=>i.text==='('));assert.ok(eq.items.some(i=>i.text===')'));
});
test('measured multiline layout fits bounds, aligns equal signs and prevents row overlaps',()=>{
 const eqs=['x/5-4/4=2/5','x/5=2/5+4/4','x/5=7/5','x=7'],box=layoutEquations(eqs,{width:515,height:220});
 assert.equal(box.size,24);assert.ok(box.width<=515&&box.height<=220);for(const row of box.rows)near(row.equalsX,box.rows[0].equalsX);
 for(let i=1;i<box.rows.length;i++)assert.ok(box.rows[i].y>box.rows[i-1].y+box.rows[i-1].height);
 const small=layoutEquations(eqs,{width:200,height:150});assert.ok(small.size<24);assert.ok(small.width<=200&&small.height<=150);
});
test('stroke placement accepts consumer fonts and emits fraction bars as normal left-to-right pen strokes',()=>{
 const box=layoutEquation('x/5=1'),font=Object.fromEntries(['x','5','=','1'].map(c=>[c,[[[0,0],[1,1]]]]));
 const geometry=positionStrokes(box,font),bar=geometry.strokes.find(s=>s.kind==='fraction-bar');assert.equal(bar.pen,true);assert.equal(bar.points[0][1],bar.points[1][1]);assert.ok(bar.points[0][0]<bar.points[1][0]);assert.deepEqual(positionStrokes(box,font),geometry);
 assert.throws(()=>positionStrokes(box,{}),/Missing vector glyph/);assert.throws(()=>positionStrokes(box,{...font,x:[[[0,0],[NaN,1]]]}),/Invalid vector glyph/);
});
test('layout rejects malformed AST and invalid/resource-inadequate dimensions',()=>{
 assert.throws(()=>layoutEquation({type:'equation',left:{type:'bad'},right:{type:'integer',value:'1'}}));assert.throws(()=>layoutEquation('x=1',{size:0}));assert.throws(()=>layoutEquation('x=1',{fractionScale:1}));assert.throws(()=>layoutEquations([]));assert.throws(()=>layoutEquations(['x/5=7/5'],{height:1}));
});
