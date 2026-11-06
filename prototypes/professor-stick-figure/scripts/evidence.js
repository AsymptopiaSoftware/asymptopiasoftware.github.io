import {readFile,writeFile} from 'node:fs/promises';
import {SVGNode,installDOM} from '../../drawing-arm/tests/dom-fixture.js';
import {ProfessorFigure} from '../src/figure.js';
import {textTimeline} from '../../drawing-arm/src/timeline.js';
installDOM();const root=new URL('../',import.meta.url);
const json=textTimeline('2 × (3 + 4)\n= 14',{x:0,y:0,size:24,speed:135,lift:100,board:{origin:[355,140],scale:1,rotation:0}});
await writeFile(new URL('examples/writing.json',root),JSON.stringify(json,null,2)+'\n');
const html=await readFile(new URL('index.html',root),'utf8'),template=html.match(/<svg id="scene"[\s\S]*?<\/svg>/)[0];
const sampleFigure=new ProfessorFigure(new SVGNode('g'),json),firstMove=sampleFigure.plan.phases.find(p=>p.kind==='move');
const writing=sampleFigure.plan.writes[Math.floor(sampleFigure.plan.writes.length/2)];
const frames=[['START / CHALK LIFTED',0],['REPOSITION / CHALK LIFTED',firstMove.at+firstMove.duration*.65],['WRITE / BODY STATIONARY',writing.at+writing.duration*.5],['COMPLETE / FIXED BOARD COORDINATES',sampleFigure.duration]];
function visibleOnly(node){node.children=node.children.filter(child=>child.getAttribute('visibility')!=='hidden');node.children.forEach(visibleOnly);}
function scene(time){const g=new SVGNode('g'),f=new ProfessorFigure(g,json);f.render(time);visibleOnly(g);return template.replace('<svg id="scene"','<svg xmlns="http://www.w3.org/2000/svg" id="scene"').replace('<defs>','<rect width="960" height="570" fill="#202c29"/><defs>').replace('<g id="professor"></g>',g.serialize()).replace(/<g id="board-anchor"[\s\S]*?<\/g>/,'');}
await writeFile(new URL('docs/evidence.svg',root),scene(sampleFigure.duration)+'\n');
let panels='';for(const [i,[label,time]]of frames.entries()){const content=scene(time).replaceAll('board-grid',`board-grid-${i}`).replace(/<svg[^>]*>/,'').replace(/<\/svg>$/,'');panels+=`<g transform="translate(${(i%2)*480} ${Math.floor(i/2)*310+38})"><text x="14" y="12" fill="#dbc080" font-family="monospace" font-size="10">${label} / ${(time/1000).toFixed(1)}s</text><g transform="translate(0 20) scale(.5)">${content}</g></g>`;}
await writeFile(new URL('docs/motion.svg',root),`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 690" role="img" aria-label="B1.3 short arm writing with grounded horizontal locomotion"><rect width="960" height="690" fill="#202c29"/><text x="14" y="23" fill="#e5eadf" font-family="monospace" font-size="15">B1.3 / Reach-driven movement. Same writing coordinates.</text>${panels}<text x="14" y="675" fill="#a5b2a6" font-family="monospace" font-size="10">Deterministic renderer evidence, not browser screenshots. Chalk is lifted during moves and pen-up approaches.</text></svg>\n`);
console.log(JSON.stringify({sourceDuration:sampleFigure.timeline.duration,playbackDuration:sampleFigure.duration,moves:sampleFigure.plan.phases.filter(p=>p.kind==='move').length,blocked:sampleFigure.plan.blocked.length}));
