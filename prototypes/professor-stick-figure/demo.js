import { textTimeline } from '../drawing-arm/src/timeline.js';
import { solveEquation } from '../math-problems/src/solver.js';
import { generateProblem } from '../math-problems/src/generator.js';
import { solutionToTimeline } from './src/math-timeline.js';
import { presentationAdvance } from './src/presentation-plan.js';
import { PresentationSpeech } from './src/speech.js';
import { advanceTeaching } from './src/teaching.js';
import { ProfessorFigure } from './src/figure.js';
import { configureBody } from './src/body.js';
const q = selector => document.querySelector(selector);
let raw, figure, time = 0, playing = false, previous = null;
let body = configureBody();
const rig = { elbow: 'negative' };
const speech=new PresentationSpeech(globalThis,text=>q('#speech-status').textContent=text);
const examples = [generateProblem({seed:'B1.6-add',operator:'+',missingSlot:'a'}),generateProblem({seed:'B1.6-subtract',operator:'-',missingSlot:'e'}),generateProblem({seed:'B1.6-multiply',operator:'*',missingSlot:'f'})];
for(const [i,p] of examples.entries())q(`#math-example option[value="generated-${i}"]`).textContent=p.text;
function refresh() {
  const state = figure.render(time);
  q('#view-label').textContent=state.orientation==='audience'?'AUDIENCE VIEW':state.orientation==='transitioning'?'TURNING':'REAR THREE-QUARTER VIEW';
  q('#facing-label').textContent=state.orientation==='audience'?'FACING VIEWER':state.orientation==='transitioning'?'FEET PLANTED':'FACING SCREEN-RIGHT →';
  q('#seek').max = figure.duration || 1; q('#seek').value = time;
  q('#clock').textContent = `${(time / 1000).toFixed(1)} / ${(figure.duration / 1000).toFixed(1)} s`;
  q('#play').textContent = playing ? 'Pause' : 'Play';
  q('#contact').textContent = `${state.chalkDown ? '● CHALK DOWN' : '○ CHALK LIFTED'} / ${state.reason === 'blocked' ? 'BLOCKED: NO FORWARD WRITING STANCE' : state.kind.toUpperCase()}`;
  q('#arm-lengths').textContent = `${figure.arm.upper.toFixed(1)} / ${figure.arm.forearm.toFixed(1)}`;
  q('#body-origin').textContent = figure.currentBody.origin.map(n => n.toFixed(1)).join(', ');
  q('#shoulder-value').textContent = figure.arm.shoulder.map(n => Number(n.toFixed(2))).join(', ');
  const step=state.teaching;
  const presentation=state.presentation;
  const explanation=presentation?`Step ${presentation.explanationIndex+1}/${figure.plan.teachingSteps.length}: ${presentation.action.text}`:step?`Step ${step.index+1}/${figure.plan.teachingSteps.length}: ${step.operation.explanation}`:'';
  if(q('#operation').textContent!==explanation)q('#operation').textContent=explanation;
  speech.sync(presentation?.stage==='talk'?{id:presentation.id,text:presentation.action.text}:null,playing,Number(q('#speed').value));
  q('#continue').disabled=!(step?.waiting&&q('#teaching-mode').value==='step');

}
function load(json) {
  // Validation in setTimeline happens before the previous rendering is replaced.
  const nextRaw=structuredClone(json);
  if (figure) figure.setTimeline(json);
  else figure = new ProfessorFigure(q('#professor'), json, { body, rig });
  speech.cancel();raw = nextRaw; time = 0; playing = false; previous = null; refresh();
}
function statusMessage() {
  return figure.plan.blocked.length ? `${figure.plan.blocked.length} portion(s) blocked: no reachable forward-writing stance at this height / joint limits. No chalk is drawn there.` : (raw.fallbacks?.length ? 'Unsupported characters use font fallback, not traced strokes.' : 'Ready. Writing coordinates fixed; moves and reaches add playback time.');
}
function loadWriting() {
  try {
    if (q('#writing').value.length > 200) throw new Error('Keep this writing study to 200 characters.');
    if(q('#math-example').value==='free')load(textTimeline(q('#writing').value, { x: 0, y: 0, size: 24, speed: 135, lift: 100, board: { origin: [355, 140], scale: 1, rotation: 0 } }));
    else {
      const solution=solveEquation(q('#writing').value);
      if(solution.status!=='unique')throw new Error(solution.error?.message??solution.explanation??`No unique solution (${solution.status})`);
      load(solutionToTimeline(solution));
    }
    q('#message').textContent = statusMessage();
  } catch (error) { speech.cancel();playing=false;previous=null;q('#play').textContent='Play';q('#message').textContent=error.message; }
}
q('#load').onclick = loadWriting;
q('#math-example').onchange=()=>{const selected=q('#math-example').value;q('#load').textContent=selected==='free'?'Load writing ↗':'Solve & write ↗';if(selected==='example')q('#writing').value='x/5-4/4=2/5';else if(selected.startsWith('generated-'))q('#writing').value=examples[Number(selected.split('-')[1])].text;if(selected!=='free')loadWriting();};
q('#play').onclick = () => { if (time >= figure.duration) {speech.cancel();time = 0;} playing = !playing; previous = null; refresh(); };
q('#teaching-mode').onchange = () => {
  const waiting=figure.render(time).teaching?.waiting;
  if(waiting) playing=q('#teaching-mode').value==='auto';
  previous=null;refresh();
};
q('#continue').onclick = () => {
  const step=figure.render(time).teaching;
  if(q('#teaching-mode').value!=='step'||!step?.waiting)return;
  time=step.resume;playing=true;previous=null;refresh();
};
q('#mute').onchange=()=>{speech.setMuted(q('#mute').checked);refresh();};
q('#speed').onchange=()=>{speech.cancel();previous=null;refresh();};
q('#reset').onclick = () => { speech.cancel();time = 0; playing = false; refresh(); };
q('#seek').oninput = () => { speech.cancel();const value=Number(q('#seek').value);const boundaries=[figure.duration,...figure.plan.teachingSteps.flatMap(s=>[s.start,s.complete,s.gate,s.resume]),...figure.plan.presentations.flatMap(p=>[p.at,p.talkAt,p.talkEnd,p.end])];time=boundaries.find(t=>Math.abs(value-t)<1e-6)??value;playing=false;refresh(); };
q('#anchors').onchange = () => { figure.setDebug(q('#anchors').checked); q('#board-anchor').setAttribute('visibility', q('#anchors').checked ? 'visible' : 'hidden'); };
// UI values are body-local. The adapter alone converts the shoulder to world units.
const bodyFields = [
  ['headSize', 'Head size', .7, 1.3, .05], ['neckLength', 'Neck length', 8, 40, 1],
  ['shoulderWidth', 'Shoulder width', 24, 90, 1], ['torsoLength', 'Torso length', 70, 160, 1],
  ['hipWidth', 'Hip width', 12, 60, 1], ['legHeight', 'Leg height', 80, 160, 1],
  ['footLength', 'Foot length', 10, 40, 1], ['lean', 'Upper-body offset', -25, 25, 1],
  ['shoulderY', 'Shoulder height offset', -30, 10, 1],
  ['rightShoulderX', 'Right shoulder X offset', -20, 30, 1],
  ['rightShoulderY', 'Right shoulder Y offset', -30, 30, 1]
];
function bodyValue(key) {
  if (key === 'shoulderY') return body.shoulderOffset[1];
  if (key === 'rightShoulderX') return body.rightShoulderOffset[0];
  if (key === 'rightShoulderY') return body.rightShoulderOffset[1];
  return body[key];
}
for (const [key, title, min, max, step] of bodyFields) {
  const div = document.createElement('div'); div.className = 'slider';
  div.innerHTML = `<label for="${key}">${title}<output id="${key}-value"></output></label><input id="${key}" type="range" min="${min}" max="${max}" step="${step}">`;
  q('#body-controls').append(div);
}
function syncControls() {
  for (const [key] of bodyFields) { q(`#${key}`).value = bodyValue(key); q(`#${key}-value`).textContent = bodyValue(key); }

}
function attachment() {
  speech.cancel();playing = false;
  const next = structuredClone(body);
  for (const [key] of bodyFields) {
    const value = Number(q(`#${key}`).value);
    if (key === 'shoulderY') next.shoulderOffset[1] = value;
    else if (key === 'rightShoulderX') next.rightShoulderOffset[0] = value;
    else if (key === 'rightShoulderY') next.rightShoulderOffset[1] = value;
    else next[key] = value;
  }
  body = configureBody(next);
  figure.setConfiguration(body, rig); time = Math.min(time, figure.duration); syncControls(); refresh(); q('#message').textContent = statusMessage();
}
for (const [key] of bodyFields) q(`#${key}`).oninput = attachment;
q('#restore').onclick = () => { body = configureBody(); syncControls(); attachment(); };
syncControls();
q('#export').onclick = () => {
  const url = URL.createObjectURL(new Blob([JSON.stringify(raw, null, 2)], { type: 'application/json' }));
  const a = document.createElement('a'); a.href = url; a.download = 'professor-timeline.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
};
q('#import').onchange = async event => {
  try {
    const file = event.target.files[0]; if (!file) return;
    if (file.size > 1024 * 1024) throw new Error('Timeline must be smaller than 1 MB.');
    load(JSON.parse(await file.text())); q('#message').textContent = statusMessage();
  } catch (error) { q('#message').textContent = `Import failed: ${error.message}`; }
  event.target.value = '';
};
function frame(now) {
  if (playing) {
    if (previous !== null) {
      const next=advanceTeaching(figure.plan,time,(now-previous)*Number(q('#speed').value),q('#teaching-mode').value);
      time=presentationAdvance(figure.plan,time,next.time,speech.busy);if(next.waiting&&time===next.time)playing=false;
    }
    previous = now; if (time >= figure.duration) playing = false; refresh();
  } else previous = null;
  requestAnimationFrame(frame);
}
addEventListener('pagehide',()=>speech.destroy(),{once:true});
loadWriting(); requestAnimationFrame(frame);
