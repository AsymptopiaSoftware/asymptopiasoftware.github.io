import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DOMParser} from 'linkedom';
import {createLesson} from '../src/lesson.js';
import {createView} from '../src/view.js';
const load=p=>JSON.parse(readFileSync(new URL('../examples/'+p,import.meta.url)));
const scene=load('scene.json'),json=load('equation.json');
test('lesson boundaries, complete reaction, and return use a single clock',()=>{
 const lesson=createLesson(scene,json);
 assert.equal(lesson.frame(0).motion.phase,'walk');
 assert.equal(lesson.frame(2600).motion.phase,'turn');
 assert.equal(lesson.frame(lesson.writingStart).motion.phase,'write');
 assert.equal(lesson.frame(lesson.writingEnd-1).arm.done,false);
 assert.equal(lesson.frame(lesson.writingEnd).arm.done,true);
 assert.equal(lesson.frame(lesson.writingEnd).motion.phase,'react');
 assert.equal(lesson.frame(lesson.writingEnd+2200).motion.facing,-1);
 assert.equal(lesson.frame(lesson.duration).motion.x,scene.startX);
 assert.equal(lesson.frame(lesson.duration).motion.phase,'complete');
 assert.throws(()=>lesson.frame(NaN));
});
for(const [name,profile] of Object.entries(scene.profiles))test(name+' rig reaches every pen sample without a second engine',()=>{
 const l=createLesson({...scene,character:{...scene.character,...profile}},json);
 for(let t=0;t<l.driver.duration;t+=8){const f=l.frame(l.writingStart+t); if(f.arm.penDown)assert.equal(f.arm.chalkDown,true,`unreachable at ${t}`);}
 const f=l.frame(l.writingStart+1000);l.frame(l.duration);assert.deepEqual(l.frame(l.writingStart+1000),f);
});
test('view suppresses unreachable ink, rewinds cleanly, and preserves exact source artwork',()=>{
 const previousDocument=globalThis.document;
 globalThis.document=new DOMParser().parseFromString('<svg xmlns="http://www.w3.org/2000/svg"></svg>','image/svg+xml');
 const svg=document.querySelector('svg'), art=readFileSync(new URL('../assets/blue-neon-tux.svg',import.meta.url),'utf8');
 const lesson=createLesson(scene,json),view=createView(svg,scene,json,art);
 view.render(lesson.frame(lesson.writingEnd));assert.ok(view.renderer.chalk.getAttribute('d').length>100);assert.equal(svg.querySelector('#writing').getAttribute('display'),'none');
 view.render(lesson.frame(0));assert.equal(view.renderer.chalk.getAttribute('d'),'');
 assert.equal(svg.querySelectorAll('#art path').length,6);
 const bad={...scene,character:{...scene.character,arm:{upper:1,forearm:1,tip:0}}};
 const badLesson=createLesson(bad,json),badView=createView(svg,bad,json,art);
 const f=badLesson.frame(badLesson.writingStart+100);assert.equal(f.arm.chalkDown,false);
 assert.equal(badView.render(f),true);assert.equal(badView.renderer.chalk.getAttribute('d'),'');
 globalThis.document=previousDocument;
});
