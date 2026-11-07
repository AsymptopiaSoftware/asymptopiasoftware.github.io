import {writeFile} from 'node:fs/promises';
import {textTimeline,compileTimeline} from '../../drawing-arm/src/timeline.js';
import {planWriting} from '../src/locomotion.js';
const source=compileTimeline(textTimeline('4/8+7/x=5/3',{x:0,y:0,size:24,speed:135,lift:100,board:{origin:[355,140],scale:1,rotation:0}}));
let rows='';
for(const [i,[label,body]]of [['DEFAULT / torso 115, legs 115',{}],['TALLER / torso 160, legs 160',{torsoLength:160,legHeight:160}]].entries()){
 const plan=planWriting(source,body),moves=plan.phases.filter(p=>p.kind==='move').length;
 const strokes=source.strokes.map(s=>`<path d="M${s.points.join('L')}"/>`).join('');
 const bands=plan.ranges.map((r,j)=>{const points=plan.groups.slice(r.start,r.end+1).flatMap(g=>g.points),xs=points.map(p=>p[0]),x=40+2*(Math.min(...xs)-355),width=2*(Math.max(...xs)-Math.min(...xs));return `<rect x="${x}" y="110" width="${width}" height="25" rx="3" fill="${j%2?'#6e9e8b':'#c4a362'}"/><text x="${x+width/2}" y="127" text-anchor="middle" fill="#15251d" font-family="monospace" font-size="10">${r.end-r.start+1} groups</text>`;}).join('');
 rows+=`<g transform="translate(0 ${40+i*180})"><text x="20" y="20" fill="#dbc080" font-family="monospace" font-size="13">${label} / ${moves} walk${moves===1?'':'s'}</text><g transform="translate(40 50) scale(2) translate(-355 -140)" fill="none" stroke="#e5eadf" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">${strokes}</g>${bands}</g>`;
}
await writeFile(new URL('../docs/writing-ranges.svg',import.meta.url),`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 440" role="img" aria-label="B1.5 inferred writing ranges for the same mathematical line with two existing body proportions"><rect width="900" height="440" fill="#202c29"/><text x="20" y="28" fill="#e5eadf" font-family="monospace" font-size="17">B1.5 / Multiple symbols per stance, no fixed walk count</text>${rows}<text x="20" y="410" fill="#a5b2a6" font-family="monospace" font-size="11">Bars mark inferred traced-glyph groups sharing one standing position. x now uses the B1.6 vector glyph.</text><text x="20" y="429" fill="#a5b2a6" font-family="monospace" font-size="11">Default high-row reach is physically limited. No body, glyph, writing-coordinate or UI changes.</text></svg>\n`);
