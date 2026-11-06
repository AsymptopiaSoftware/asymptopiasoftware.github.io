import { textTimeline } from '../drawing-arm/src/timeline.js';
import { ProfessorFigure } from './src/figure.js';
import { configureBody } from './src/body.js';
const q = selector => document.querySelector(selector);
let raw, figure, time = 0, playing = false, previous = null;
let body = configureBody();
const rig = { elbow: 'negative' };
function refresh() {
  const state = figure.render(time);
  q('#seek').max = figure.duration || 1; q('#seek').value = time;
  q('#clock').textContent = `${(time / 1000).toFixed(1)} / ${(figure.duration / 1000).toFixed(1)} s`;
  q('#play').textContent = playing ? 'Pause' : 'Play';
  q('#contact').textContent = `${state.chalkDown ? '● CHALK DOWN' : '○ CHALK LIFTED'} / ${state.reason === 'blocked' ? 'BLOCKED: NO FORWARD WRITING STANCE' : state.kind.toUpperCase()}`;
  q('#arm-lengths').textContent = `${figure.arm.upper.toFixed(1)} / ${figure.arm.forearm.toFixed(1)}`;
  q('#body-origin').textContent = figure.currentBody.origin.map(n => n.toFixed(1)).join(', ');
  q('#shoulder-value').textContent = figure.arm.shoulder.map(n => Number(n.toFixed(2))).join(', ');
}
function load(json) {
  // Validation in setTimeline happens before the previous rendering is replaced.
  if (figure) figure.setTimeline(json);
  else figure = new ProfessorFigure(q('#professor'), json, { body, rig });
  raw = structuredClone(json); time = 0; playing = false; previous = null; refresh();
}
function statusMessage() {
  return figure.plan.blocked.length ? `${figure.plan.blocked.length} portion(s) blocked: no reachable forward-writing stance at this height / joint limits. No chalk is drawn there.` : (raw.fallbacks?.length ? 'Unsupported characters use font fallback, not traced strokes.' : 'Ready. Writing coordinates fixed; moves and reaches add playback time.');
}
function loadWriting() {
  try {
    if (q('#writing').value.length > 200) throw new Error('Keep this writing study to 200 characters.');
    load(textTimeline(q('#writing').value, { x: 0, y: 0, size: 24, speed: 135, lift: 100, board: { origin: [355, 140], scale: 1, rotation: 0 } }));
    q('#message').textContent = statusMessage();
  } catch (error) { q('#message').textContent = error.message; }
}
q('#load').onclick = loadWriting;
q('#play').onclick = () => { if (time >= figure.duration) time = 0; playing = !playing; previous = null; refresh(); };
q('#reset').onclick = () => { time = 0; playing = false; refresh(); };
q('#seek').oninput = () => { time = Number(q('#seek').value); playing = false; refresh(); };
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
  playing = false;
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
    if (previous !== null) time = Math.min(figure.duration, time + (now - previous) * Number(q('#speed').value));
    previous = now; if (time >= figure.duration) playing = false; refresh();
  } else previous = null;
  requestAnimationFrame(frame);
}
loadWriting(); requestAnimationFrame(frame);
