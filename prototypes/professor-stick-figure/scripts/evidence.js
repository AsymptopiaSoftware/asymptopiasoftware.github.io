import { readFile, writeFile } from 'node:fs/promises';
import { SVGNode, installDOM } from '../../drawing-arm/tests/dom-fixture.js';
import { ProfessorFigure } from '../src/figure.js';
import { textTimeline } from '../../drawing-arm/src/timeline.js';
installDOM();
const root=new URL('../',import.meta.url),json=textTimeline('2 × (3 + 4)\n= 14',{x:0,y:0,size:24,speed:135,lift:100,board:{origin:[355,140],scale:1,rotation:0}});
await writeFile(new URL('examples/writing.json',root),JSON.stringify(json,null,2)+'\n');
const group=new SVGNode('g'),figure=new ProfessorFigure(group,json);figure.render(figure.timeline.duration-50);figure.setDebug(true);
// Omit explicitly hidden nodes in this static evidence snapshot.
function visibleOnly(node){node.children=node.children.filter(child=>child.getAttribute('visibility')!=='hidden');node.children.forEach(visibleOnly);}
visibleOnly(group);
const html=await readFile(new URL('index.html',root),'utf8');
let svg=html.match(/<svg id="scene"[\s\S]*?<\/svg>/)[0];
svg=svg.replace('<svg id="scene"','<svg xmlns="http://www.w3.org/2000/svg" id="scene"').replace('<defs>','<rect width="960" height="570" fill="#202c29"/><defs>').replace('<g id="professor"></g>',group.serialize()).replace('id="board-anchor" visibility="hidden"','id="board-anchor" visibility="visible"');
await writeFile(new URL('docs/evidence.svg',root),svg+'\n');
console.log('Generated deterministic SVG composition evidence (not a browser screenshot).');
