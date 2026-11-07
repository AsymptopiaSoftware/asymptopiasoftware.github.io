import test from 'node:test';
import assert from 'node:assert/strict';
import {solveEquation} from '../../math-problems/src/solver.js';
import {GLYPHS} from '../../drawing-arm/src/glyphs.js';
import {textTimeline,compileTimeline,sampleTimeline} from '../../drawing-arm/src/timeline.js';
import {solutionToTimeline} from '../src/math-timeline.js';
import {ProfessorFigure} from '../src/figure.js';
import {SVGNode,installDOM} from '../../drawing-arm/tests/dom-fixture.js';
installDOM();
test('handwritten 4 uses down-left plus rightward crossbar, a lift, and a separate downward vertical',()=>{
 const paths=GLYPHS['4'];assert.equal(paths.length,2);assert.deepEqual(paths[0],[[.25,0],[0,.6],[1,.6]]);assert.deepEqual(paths[1],[[.75,0],[.75,1]]);
 const raw=textTimeline('4',{x:0,y:0,size:24,lift:100}),t=compileTimeline(raw);assert.equal(t.strokes.length,2);assert.ok(t.strokes[1].at>t.strokes[0].at+t.strokes[0].duration);assert.equal(sampleTimeline(t,t.strokes[0].duration+50).penDown,false);
});
test('reviewed common glyphs use conventional directions and reusable separate strokes',()=>{
 assert.equal(GLYPHS['3'].length,1);assert.deepEqual(GLYPHS['9'][0][8],GLYPHS['9'][0][0]);assert.ok(GLYPHS['9'][0].at(-1)[1]>GLYPHS['9'][0][8][1]);assert.equal(GLYPHS['5'].length,2);assert.deepEqual(GLYPHS['5'][1],[[0,0],[1,0]]);
 for(const c of ['+','=','-','−']){const p=GLYPHS[c][0];assert.ok(p.at(-1)[0]>p[0][0]);}
 assert.deepEqual(GLYPHS['+'][1],[[.5,0],[.5,1]]);assert.ok(GLYPHS['÷'][0][0][1]<GLYPHS['÷'][1][0][1]);assert.ok(GLYPHS['÷'][1][0][1]<GLYPHS['÷'][2][0][1]);
 for(const paths of Object.values(GLYPHS))for(const path of paths)assert.ok(path.length>=2&&path.every(p=>p.every(Number.isFinite)));
});
test('stacked bars are drawn gradually by the existing arm renderer, not prepainted decoration',()=>{
 const solution=solveEquation('x/5-4/4=2/5'),copy=structuredClone(solution),raw=solutionToTimeline(solution),bar=raw.strokes.find(s=>s.kind==='fraction-bar');
 assert.equal(raw.layout.notation,'stacked-fractions');assert.equal(raw.strokes.filter(s=>s.kind==='fraction-bar').length,8);assert.ok(!raw.strokes.some(s=>s.symbol==='/'));assert.deepEqual(solution,copy);
 const f=new ProfessorFigure(new SVGNode('g'),raw),writer=f.writers.find(w=>Math.abs(w.phase.sourceAt-bar.at)<1e-6);assert.ok(writer);
 f.render(writer.phase.at);assert.equal(writer.renderer.chalk.getAttribute('d'),'');
 const state=f.render(writer.phase.at+writer.phase.duration*.5),half=writer.renderer.chalk.getAttribute('d');assert.ok(state.chalkDown&&state.pose.reachable);assert.ok(half.length>0);
 f.render(writer.phase.at+writer.phase.duration);assert.notEqual(writer.renderer.chalk.getAttribute('d'),half);
 for(let i=1;i<raw.strokes.length;i++)assert.ok(raw.strokes[i].at>raw.strokes[i-1].at+raw.strokes[i-1].duration);
});
test('spaced operators and fraction bars remain timed arm strokes with pen lifts and incremental ink',()=>{
 const raw=solutionToTimeline(solveEquation('x/5-4/4=2/5')),f=new ProfessorFigure(new SVGNode('g'),raw);
 assert.equal(f.plan.blocked.length,0);
 const selected=raw.strokes.filter(s=>s.kind==='fraction-bar'||['+','-','−','='].includes(s.symbol));
 assert.ok(selected.some(s=>s.symbol==='-'));assert.ok(selected.some(s=>s.symbol==='+'));assert.ok(selected.some(s=>s.symbol==='='));
 for(const stroke of selected){
  assert.ok(Number.isFinite(stroke.at)&&stroke.duration>0&&stroke.pen);
  const writer=f.writers.find(w=>Math.abs(w.phase.sourceAt-stroke.at)<1e-6);assert.ok(writer);
  f.render(writer.phase.at);assert.equal(writer.renderer.chalk.getAttribute('d'),'');
  const state=f.render(writer.phase.at+writer.phase.duration*.5),half=writer.renderer.chalk.getAttribute('d');assert.ok(state.chalkDown&&state.pose.reachable);assert.ok(half.length>0);
  f.render(writer.phase.at+writer.phase.duration);assert.notEqual(writer.renderer.chalk.getAttribute('d'),half);
 }
 for(let i=1;i<raw.strokes.length;i++)assert.ok(raw.strokes[i].at>raw.strokes[i-1].at+raw.strokes[i-1].duration);
});
