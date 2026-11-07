import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('homepage mounts the authoritative compact engine below unchanged WELCOME with shared icon actions',()=>{
 const page=read('src/pages/index.astro'),component=read('src/components/ProfessorDemo.astro'),content=JSON.parse(read('src/content/professor.json'));
 assert.ok(page.indexOf('class="professor-embed"')>page.indexOf('class="slotmachine-embed"'));
 assert.match(component,/import \{mountProfessorDemo\} from '..\/..\/prototypes\/professor-stick-figure\/src\/compact-demo.js'/);
 assert.match(component,/muted:true/);assert.match(component,/disconnectedCallback\(\).*destroy/);
 assert.doesNotMatch(component,/iframe|innerHTML|src\/demo\.js/);assert.equal(content.liveUrl,'/professor/standalone.html');
 assert.match(read('src/pages/professor/standalone.html.ts'),/prototypes\/professor-stick-figure\/standalone.html\?raw/);
 assert.match(content.sourceUrl,/\/tree\/main\/prototypes\/professor-stick-figure$/);
 assert.ok(page.includes('<ProjectDemoActions title={professor.title}'));
});
