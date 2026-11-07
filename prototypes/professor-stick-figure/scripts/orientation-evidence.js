import {writeFile} from 'node:fs/promises';
import {solveEquation} from '../../math-problems/src/solver.js';
import {solutionToTimeline} from '../src/math-timeline.js';
import {ProfessorFigure} from '../src/figure.js';
import {SVGNode,installDOM} from '../../drawing-arm/tests/dom-fixture.js';
installDOM();
const raw=solutionToTimeline(solveEquation('x/5-4/4=2/5')),g=new SVGNode('g'),f=new ProfessorFigure(g,raw),p=f.plan.presentations[0];
function visibleClone(node){
 if(node.getAttribute('visibility')==='hidden'||node.getAttribute('opacity')==='0'||(node.tag==='path'&&node.getAttribute('d')===''))return null;
 const copy=new SVGNode(node.tag);copy.attrs={...node.attrs};copy.textContent=node.textContent;copy.children=node.children.map(visibleClone).filter(Boolean);
 return copy.tag==='g'&&!copy.children.length&&!copy.textContent?null:copy;
}
let panels='';const frames=[['REAR / RIGHT AT SCREEN-RIGHT',p.at],['THREE-QUARTER / FAR LEFT ARM',p.at+300],['FRONT / RIGHT AT SCREEN-LEFT',p.talkAt+900],['RETURN / SAME RIGHT SHOULDER',p.end]];
for(const [i,[label,time]]of frames.entries()){
 f.render(time);const [x]=f.currentBody.origin;
 panels+=`<g transform="translate(${i*320},0)"><text x="10" y="60" fill="#dbc080" font-family="monospace" font-size="10">${label}</text><clipPath id="turn-${i}"><rect x="0" y="78" width="320" height="380"/></clipPath><g clip-path="url(#turn-${i})"><g transform="translate(${160-.9*x},${440-.9*f.body.origin[1]}) scale(.9)">${visibleClone(g).serialize()}</g></g><path d="M15 440H305" stroke="#66746a"/><text x="10" y="475" fill="#a5b2a6" font-family="monospace" font-size="10">yaw ${(f.facing.yaw*180/Math.PI).toFixed(1)}° · ${(time/1000).toFixed(2)} s</text></g>`;
}
await writeFile(new URL('../docs/orientation-evidence.svg',import.meta.url),`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 530" role="img" aria-label="Four skeletal turn poses showing the same gold anatomical right arm through rear, three-quarter, front and return views"><rect width="1280" height="530" fill="#202c29"/><text x="12" y="28" fill="#e5eadf" font-family="monospace" font-size="17">B1.9.3 / Anatomical identity stays fixed; projection and depth order change</text>${panels}<text x="12" y="515" fill="#a5b2a6" font-family="monospace" font-size="11">Gold = anatomical RIGHT · gray = anatomical LEFT · fixed floor anchors · deterministic renderer evidence, not screenshots</text></svg>\n`);
