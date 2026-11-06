// Build a dependency-free, file:// compatible preview from the same ES modules.
import { readFile, writeFile } from 'node:fs/promises';
const root=new URL('../',import.meta.url);
let source='';
for(const path of ['src/kinematics.js','src/glyphs.js','src/timeline.js','src/svg-renderer.js','demo.js']){
 const s=await readFile(new URL(path,root),'utf8');
 source+=s.replace(/^import .*;\n/gm,'').replace(/^export /gm,'')+'\n';
}
let html=await readFile(new URL('index.html',root),'utf8');
html=html.replace('<link rel="stylesheet" href="style.css">',`<style>${await readFile(new URL('style.css',root),'utf8')}</style>`)
 .replace('<script type="module" src="demo.js"></script>',`<script type="module">\n${source}</script>`);
await writeFile(new URL('standalone.html',root),html);
