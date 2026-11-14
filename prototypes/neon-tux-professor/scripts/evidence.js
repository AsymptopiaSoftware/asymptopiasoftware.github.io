import {readFileSync,writeFileSync} from 'node:fs';
import {DOMParser} from 'linkedom';
import {createLesson} from '../src/lesson.js';
import {createView} from '../src/view.js';
const root=new URL('../',import.meta.url),read=p=>readFileSync(new URL(p,root),'utf8');
const scene=JSON.parse(read('examples/scene.json')),json=JSON.parse(read('examples/equation.json'));
globalThis.document=new DOMParser().parseFromString('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 620" width="1000" height="620"></svg>','image/svg+xml');
const svg=document.querySelector('svg'),lesson=createLesson(scene,json),view=createView(svg,scene,json,read('assets/blue-neon-tux.svg'));
for(const [name,t] of [['writing',lesson.writingEnd-1],['reaction',lesson.writingEnd+800]]){view.render(lesson.frame(t));writeFileSync(new URL(`docs/${name}.svg`,root),svg.outerHTML);}
