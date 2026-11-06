import { readFile, writeFile } from 'node:fs/promises';
import { SVGNode, installDOM } from '../../drawing-arm/tests/dom-fixture.js';
import { ProfessorFigure } from '../src/figure.js';
import { textTimeline } from '../../drawing-arm/src/timeline.js';
installDOM();
const root = new URL('../', import.meta.url);
const json = textTimeline('2 × (3 + 4)\n= 14', {x:0,y:0,size:24,speed:135,lift:100,board:{origin:[355,140],scale:1,rotation:0}});
await writeFile(new URL('examples/writing.json', root), JSON.stringify(json,null,2)+'\n');
const html = await readFile(new URL('index.html', root), 'utf8');
const template = html.match(/<svg id="scene"[\s\S]*?<\/svg>/)[0];
function visibleOnly(node) {
  node.children = node.children.filter(child => child.getAttribute('visibility') !== 'hidden');
  node.children.forEach(visibleOnly);
}
function scene(body) {
  const group = new SVGNode('g'), figure = new ProfessorFigure(group,json,{body});
  figure.render(figure.timeline.duration-50); figure.setDebug(true); visibleOnly(group);
  return template.replace('<svg id="scene"', '<svg xmlns="http://www.w3.org/2000/svg" id="scene"')
    .replace('<defs>', '<rect width="960" height="570" fill="#202c29"/><defs>')
    .replace('<g id="professor"></g>', group.serialize())
    .replace('id="board-anchor" visibility="hidden"', 'id="board-anchor" visibility="visible"');
}
await writeFile(new URL('docs/evidence.svg',root),scene({})+'\n');
const profiles = [
  ['01 / DEFAULT', {}],
  ['02 / TALL + BROAD', {headSize:1.25,neckLength:32,shoulderWidth:72,torsoLength:130,hipWidth:42,legHeight:135,footLength:28,rightShoulderOffset:[12,-8]}],
  ['03 / COMPACT + OFFSET SHOULDER', {headSize:.8,neckLength:14,shoulderWidth:34,torsoLength:95,hipWidth:18,legHeight:105,footLength:14,rightShoulderOffset:[18,0]}]
];
let panels = '';
for (const [i,[title,body]] of profiles.entries()) {
  // IDs must be unique because these are three SVG scenes in one document.
  const content = scene(body).replaceAll('board-grid',`board-grid-${i}`).replace(/<svg[^>]*>/,'').replace(/<\/svg>$/,'');
  panels += `<g transform="translate(${i*480} 55)"><text x="20" y="10" fill="#e6c16e" font-family="monospace" font-size="11">${title}</text><g transform="translate(0 20) scale(.5)">${content}</g></g>`;
}
await writeFile(new URL('docs/body-profiles.svg',root),`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 390" role="img" aria-label="B1.1 three configurable body proportions using identical board coordinates and original Drawing Arm"><rect width="1440" height="390" fill="#202c29"/><text x="20" y="30" fill="#eeeadd" font-family="sans-serif" font-size="20">B1.1 / Different skeletons. Same writing. Fixed heel anchors.</text>${panels}<text x="20" y="375" fill="#9bada2" font-family="monospace" font-size="11">Deterministic SVG evidence, not a browser screenshot. Right shoulder anchors derive from each body; original IK solves the same board targets.</text></svg>\n`);
console.log('Generated default and three-profile SVG evidence (not browser screenshots).');
