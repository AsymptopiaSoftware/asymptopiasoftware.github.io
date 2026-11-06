import test from 'node:test';
import assert from 'node:assert/strict';
import { limbOutline } from '../src/curves.js';
test('curved tapered silhouettes are closed, finite, derived without mutating joints',()=>{
 for(const points of [[[0,0],[30,30],[60,0]],[[0,0],[0,0],[0,0]],[[100,200],[120,260],[140,300]]]){
  const copy=structuredClone(points),d=limbOutline(points,[8,6,3]);assert.match(d,/^M/);assert.match(d,/C/);assert.match(d,/Q/);assert.match(d,/Z$/);assert.doesNotMatch(d,/NaN|Infinity/);assert.deepEqual(points,copy);
 }
 assert.throws(()=>limbOutline([[0,0]],[3]));assert.throws(()=>limbOutline([[0,0],[1,1]],[2,-1]));
});
