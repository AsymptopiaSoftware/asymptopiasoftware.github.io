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
await writeFile(new URL('docs/motion.svg',root),`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 690" role="img" aria-label="B1.4 short arm writing with grounded horizontal locomotion"><rect width="960" height="690" fill="#202c29"/><text x="14" y="23" fill="#e5eadf" font-family="monospace" font-size="15">B1.4 / Reach-driven movement. Same writing coordinates.</text>${panels}<text x="14" y="675" fill="#a5b2a6" font-family="monospace" font-size="10">Deterministic renderer evidence, not browser screenshots. Chalk is lifted during moves and pen-up approaches.</text></svg>\n`);
let steps='';
const armBody=sampleFigure.body,moveDistance=Math.abs(firstMove.to-firstMove.from)/armBody.scale;
const stepCount=2*Math.max(1,Math.ceil(moveDistance/(.35*armBody.legHeight)));
for(let i=0;i<Math.min(4,stepCount);i++) {
  const progress=(i+.5)/stepCount;let lo=0,hi=1;
  for(let j=0;j<40;j++){const m=(lo+hi)/2;if(m*m*(3-2*m)<progress)lo=m;else hi=m;}
  const t=firstMove.at+firstMove.duration*(lo+hi)/2;
  const content=scene(t).replaceAll('board-grid',`gait-grid-${i}`).replace(/<svg[^>]*>/,'').replace(/<\/svg>$/,'');
  const firstX=sampleFigure.body.origin[0]+firstMove.from;
  steps+=`<g transform="translate(${i*280} 35)"><text x="12" y="12" fill="#dbc080" font-family="monospace" font-size="11">STEP ${i+1} / ${(t/1000).toFixed(2)}s</text><g clip-path="url(#gait-crop)"><g transform="translate(${-firstX+90} -330)">${content}</g></g></g>`;
}
await writeFile(new URL('docs/walk-cycle.svg',root),`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1120 290" role="img" aria-label="Four alternating footsteps, with planted stance feet and lifted swing feet"><defs><clipPath id="gait-crop"><rect x="0" y="25" width="280" height="180"/></clipPath></defs><rect width="1120" height="290" fill="#202c29"/><text x="12" y="23" fill="#e5eadf" font-family="monospace" font-size="15">B1.4 / Alternating footsteps in a fixed world-space view</text>${steps}<text x="12" y="280" fill="#a5b2a6" font-family="monospace" font-size="10">Deterministic SVG evidence; not browser screenshots. Original skeleton drives curved hips, knees, ankles and shoes.</text></svg>\n`);
console.log(JSON.stringify({sourceDuration:sampleFigure.timeline.duration,playbackDuration:sampleFigure.duration,moves:sampleFigure.plan.phases.filter(p=>p.kind==='move').length,blocked:sampleFigure.plan.blocked.length}));
await import('./range-evidence.js');
