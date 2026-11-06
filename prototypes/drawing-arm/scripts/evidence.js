import {writeFile,readFile} from 'node:fs/promises';
import {SVGNode,installDOM} from '../tests/dom-fixture.js';
import {compileTimeline,SVGArmRenderer} from '../src/index.js';
installDOM();const root=new URL('../',import.meta.url);
const t=compileTimeline(JSON.parse(await readFile(new URL('examples/equation.json',root),'utf8')));
let groups='';
for(const [i,arm] of [{upper:215,forearm:200,shoulder:[95,285],tip:10},{upper:170,forearm:255,shoulder:[95,285],tip:10}].entries()){
 const g=new SVGNode('g');const r=new SVGArmRenderer(g,t,arm,{color:i?'#a8c7a0':'#e5c37a'});r.render(t.duration-80);
 groups+=`<g transform="translate(${30+i*550} 120)"><rect width="520" height="360" rx="8" fill="#16352d"/><text x="18" y="28" fill="#e5c37a" font-family="monospace" font-size="13">0${i+1} · UPPER ${arm.upper} / FOREARM ${arm.forearm}</text>${g.serialize()}</g>`;
}
await writeFile(new URL('docs/evidence.svg',root),`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1130 530" role="img" aria-label="Engine-generated evidence: two arm proportions writing identical equations"><rect width="1130" height="530" fill="#101b1a"/><text x="30" y="48" fill="#eeeede" font-family="sans-serif" font-size="28">Drawing Arm · One timeline, two rigs</text><text x="30" y="80" fill="#a2b2a8" font-family="monospace" font-size="12">Deterministic engine-rendered SVG evidence · not a browser screenshot</text>${groups}<text x="30" y="510" fill="#a2b2a8" font-family="monospace" font-size="12">Same board-space instructions · independent character-free kinematics · chalk contact gated by reachability</text></svg>`);
