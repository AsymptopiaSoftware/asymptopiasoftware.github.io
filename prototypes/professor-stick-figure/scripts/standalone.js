/** Bundle the original engine and the attachment adapter; no engine source edits. */
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const root = new URL('../', import.meta.url);
const lock = JSON.parse(await readFile(new URL('engine-lock.json', root), 'utf8'));
const engineRoot = new URL('../drawing-arm/', root);
for (const file of lock.files) {
  const data = await readFile(new URL(file.path, engineRoot));
  const sha = createHash('sha1').update(`blob ${data.length}\0`).update(data).digest('hex');
  if (sha !== file.sha) throw new Error(`Engine source drift: ${file.path}`);
}
let source = '';
for (const path of ['../math-problems/src/rational.js', '../math-problems/src/syntax.js', '../math-problems/src/algebra.js', '../math-problems/src/solver.js', '../math-problems/src/generator.js', '../math-layout/src/layout.js', '../math-layout/src/strokes.js', '../drawing-arm/src/kinematics.js', '../drawing-arm/src/glyphs.js', '../drawing-arm/src/timeline.js', '../drawing-arm/src/svg-renderer.js', 'src/body.js', 'src/curves.js', 'src/gait.js', 'src/range-planning.js', 'src/locomotion.js', 'src/teaching.js', 'src/figure.js', 'src/math-timeline.js', 'demo.js']) {
  const content = await readFile(new URL(path, root), 'utf8');
  source += `\n// SOURCE: ${path}\n` + content.replace(/^import .*;\n/gm, '').replace(/^export /gm, '') + '\n';
}
let html = await readFile(new URL('index.html', root), 'utf8');
html = html.replace('<link rel="stylesheet" href="style.css">', `<style>${await readFile(new URL('style.css', root), 'utf8')}</style>`)
  .replace('<script type="module" src="demo.js"></script>', `<script type="module">\n${source}</script>`);
for (const path of ['README.md', 'docs/coordinates.md']) html = html.replace(`href="${path}"`, `href="https://github.com/AsymptopiaSoftware/asymptopiasoftware.github.io/blob/feature/professor-b1.8-teaching-cadence/prototypes/professor-stick-figure/${path}"`);
await writeFile(new URL('standalone.html', root), html);
console.log('Standalone built; all 5 approved Drawing Arm module hashes verified (B1.7 approved handwriting paths).');
