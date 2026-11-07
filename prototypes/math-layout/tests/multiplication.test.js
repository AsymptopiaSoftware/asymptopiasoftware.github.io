import test from 'node:test';
import assert from 'node:assert/strict';
import {layoutEquation,layoutEquations} from '../src/layout.js';
import {positionStrokes} from '../src/strokes.js';
import {GLYPHS} from '../../drawing-arm/src/glyphs.js';
test('scalar multiplication uses a small centered dot for *, multiplication sign and middle-dot input',()=>{
 for(const text of ['2*x=6','2×x=6','2·x=6','(x/5)*(-1)=7/8']){
  const layout=layoutEquation(text),i=layout.items.findIndex(i=>i.text==='·'),item=layout.items[i];assert.ok(item);assert.equal(item.operator,'binary');
  assert.ok(!layout.items.some(i=>['×','*','X'].includes(i.text)));assert.ok(layout.items.some(i=>i.text==='x'));
  const dot=positionStrokes(layout,GLYPHS).strokes.filter(s=>s.item===i);assert.equal(dot.length,1);const points=dot[0].points;
  const ys=points.map(p=>p[1]),xs=points.map(p=>p[0]);assert.ok(Math.abs((Math.min(...ys)+Math.max(...ys))/2-layout.mathAxis)<1e-8);
  assert.ok(Math.max(...ys)-Math.min(...ys)<layout.size*.15);assert.ok(Math.max(...xs)-Math.min(...xs)<layout.size*.15);assert.deepEqual(points[0],points.at(-1));
  assert.ok(item.x>=layout.size*.3);assert.ok(layout.width-item.x-item.width>=layout.size*.3);
 }
 assert.deepEqual(GLYPHS['*'],GLYPHS['·']);assert.deepEqual(GLYPHS['×'],GLYPHS['·']);assert.notDeepEqual(GLYPHS.x,GLYPHS['·']);
 assert.ok(Math.max(...GLYPHS['·'][0].map(p=>p[1]))<Math.min(...GLYPHS['.'][0].map(p=>p[1])));
});
test('fraction rows with multiplication dots retain aligned equals columns and bar clearance',()=>{
 const layout=layoutEquations(['-(7/x)*(-1)=-7/8*(-1)','7/x=7/8','x=8']);
 for(const row of layout.rows)assert.ok(Math.abs(row.equalsX-layout.rows[0].equalsX)<1e-8);
 assert.equal(layout.items.filter(i=>i.text==='·').length,2);assert.ok(layout.items.some(i=>i.kind==='fraction-bar'));
});
