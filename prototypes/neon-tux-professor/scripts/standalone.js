import {readFile,writeFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url),read=p=>readFile(new URL(p,root),'utf8');
let source='';
for(const path of ['vendor/drawing-arm/src/kinematics.js','vendor/drawing-arm/src/glyphs.js','vendor/drawing-arm/src/timeline.js','vendor/drawing-arm/src/svg-renderer.js','vendor/drawing-arm/examples/professor-driver.js','src/character.js','src/lesson.js','src/view.js','src/app.js'])source+=(await read(path)).replace(/^import .*;\n/gm,'').replace(/^export /gm,'')+'\n';
const data={scene:JSON.parse(await read('examples/scene.json')),timeline:JSON.parse(await read('examples/equation.json')),art:await read('assets/blue-neon-tux.svg')};
let html=await read('index.html');
html=html.replace('<link rel="stylesheet" href="style.css">',`<style>${await read('style.css')}</style>`).replace('<script type="module" src="src/app.js"></script>',()=>`<script type="module">globalThis.PROFESSOR_DATA=${JSON.stringify(data).replaceAll('<','\\u003c')};\n${source}</script>`);
await writeFile(new URL('standalone.html',root),html);
