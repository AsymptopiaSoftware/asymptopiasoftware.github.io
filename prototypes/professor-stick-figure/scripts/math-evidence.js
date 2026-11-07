import {readFile,writeFile} from 'node:fs/promises';
import {solveEquation} from '../../math-problems/src/solver.js';
import {solutionToTimeline,validateMathTimeline} from '../src/math-timeline.js';
import {ProfessorFigure} from '../src/figure.js';
import {SVGNode,installDOM} from '../../drawing-arm/tests/dom-fixture.js';
installDOM();const root=new URL('../',import.meta.url),html=await readFile(new URL('index.html',root),'utf8');
function visibleOnly(node){node.children=node.children.filter(c=>c.getAttribute('visibility')!=='hidden');node.children.forEach(visibleOnly);}
for(const [problem,jsonName,svgName]of [['x/5-4/4=2/5','solution-timeline.json','solution-evidence.svg'],['1/4-7/x=-5/8','negative-denominator.json','correctness-evidence.svg']]){
 const solution=solveEquation(problem),timeline=solutionToTimeline(solution);validateMathTimeline(timeline);
 await writeFile(new URL('examples/'+jsonName,root),JSON.stringify(timeline,null,2)+'\n');
 const group=new SVGNode('g'),figure=new ProfessorFigure(group,timeline);figure.render(figure.duration);visibleOnly(group);
 let svg=html.match(/<svg id="scene"[\s\S]*?<\/svg>/)[0];
 svg=svg.replace('<svg id="scene"','<svg xmlns="http://www.w3.org/2000/svg" id="scene"').replace('<defs>','<rect width="960" height="570" fill="#202c29"/><defs>').replace('<g id="professor"></g>',group.serialize()).replace(/<g id="board-anchor"[\s\S]*?<\/g>/,'');
 await writeFile(new URL('docs/'+svgName,root),svg+'\n');
 console.log(JSON.stringify({problem,solution:solution.steps.map(s=>s.text),verified:solution.verification.valid,sourceDuration:figure.timeline.duration,playbackDuration:figure.duration,blocked:figure.plan.blocked.length}));
}
