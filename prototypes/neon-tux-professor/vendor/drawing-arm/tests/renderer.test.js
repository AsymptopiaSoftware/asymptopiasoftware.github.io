import test from 'node:test';
import assert from 'node:assert/strict';
import {SVGNode,installDOM} from './dom-fixture.js';
import {SVGArmRenderer,compileTimeline,textTimeline} from '../src/index.js';
installDOM();
const timeline=compileTimeline({version:1,strokes:[{at:0,duration:100,points:[[10,0],[20,0]]},{at:200,duration:100,points:[[20,10],[10,10]]}]});
const arm={upper:20,forearm:20,shoulder:[0,0],tip:0};
test('SVG chalk follows time, lifts between strokes and rewinds without stale marks',()=>{
 const r=new SVGArmRenderer(new SVGNode('g'),timeline,arm);
 r.render(50);assert.match(r.chalk.getAttribute('d'),/L15,0$/);
 r.render(150);assert.equal(r.pen.getAttribute('opacity'),'0.45');assert.doesNotMatch(r.chalk.getAttribute('d'),/20,10/);
 r.render(300);assert.match(r.chalk.getAttribute('d'),/L10,10$/);
 r.render(0);assert.equal(r.chalk.getAttribute('d'),'');
});
test('unreachable targets lift chalk, preserve links and show requested target',()=>{
 const r=new SVGArmRenderer(new SVGNode('g'),timeline,{...arm,upper:1,forearm:1});
 const s=r.render(50);assert.equal(s.chalkDown,false);assert.equal(r.chalk.getAttribute('d'),'');assert.equal(r.target.getAttribute('visibility'),'visible');
 r.setArm(arm);assert.equal(r.render(50).chalkDown,true);assert.notEqual(r.chalk.getAttribute('d'),'');
});
test('renderer owns its group, handles font fallback as text, and destroys cleanly',()=>{
 const g=new SVGNode('g'),other=new SVGNode('g');other.append(new SVGNode('path'));
 const t=compileTimeline(textTimeline('<',{x:10,y:20}));const r=new SVGArmRenderer(g,t,arm);
 r.render(0);assert.equal(r.fallback.children[0].textContent,'<');assert.match(g.serialize(),/&lt;/);
 r.destroy();assert.equal(g.children.length,0);assert.equal(other.children.length,1);
});
test('compiled transform applies identically to font fallback and vector strokes',()=>{
 const t=compileTimeline({version:1,board:{origin:[10,20],scale:2,rotation:Math.PI/2},strokes:[{at:0,duration:100,points:[[0,0],[1,0]]}],fallbacks:[{text:'α',position:[0,0],size:10,at:50}]});
 const r=new SVGArmRenderer(new SVGNode('g'),t,arm);r.render(0);assert.equal(r.fallback.children[0].getAttribute('visibility'),'hidden');r.render(60);assert.equal(r.fallback.children[0].getAttribute('visibility'),'visible');assert.equal(r.fallback.children[0].getAttribute('font-size'),'20');assert.equal(r.fallback.children[0].getAttribute('x'),'10');
});
