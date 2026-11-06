import { textTimeline } from '../drawing-arm/src/timeline.js';
import { ProfessorFigure } from './src/figure.js';
const q = selector => document.querySelector(selector);
let raw, figure, time = 0, playing = false, previous = null;
const body = { origin: [230, 505], scale: 1, lean: 0 };
const rig = { upper: 195, forearm: 180, tip: 10, elbow: 'negative' };
function refresh() {
  const state = figure.render(time);
  q('#seek').max = figure.timeline.duration || 1; q('#seek').value = time;
  q('#clock').textContent = `${(time / 1000).toFixed(1)} / ${(figure.timeline.duration / 1000).toFixed(1)} s`;
  q('#play').textContent = playing ? 'Pause' : 'Play';
  q('#contact').textContent = state.pose ? `${state.chalkDown ? '● CHALK DOWN' : '○ CHALK LIFTED'} / ${state.pose.reason.toUpperCase()}` : '○ IDLE / NO VECTOR STROKES';
  q('#shoulder-value').textContent = figure.arm.shoulder.map(n => n.toFixed(0)).join(', ');
}
function load(json) {
  // Validation in setTimeline happens before the previous rendering is replaced.
  if (figure) figure.setTimeline(json);
  else figure = new ProfessorFigure(q('#professor'), json, { body, rig });
  raw = structuredClone(json); time = 0; playing = false; previous = null; refresh();
}
function loadWriting() {
  try {
    if (q('#writing').value.length > 200) throw new Error('Keep this writing study to 200 characters.');
    load(textTimeline(q('#writing').value, { x: 0, y: 0, size: 24, speed: 135, lift: 100, board: { origin: [355, 140], scale: 1, rotation: 0 } }));
    q('#message').textContent = raw.fallbacks.length ? 'Unsupported glyphs use the engine’s font fallback; the arm does not trace them.' : 'Original timeline format. Original drawing engine.';
  } catch (error) { q('#message').textContent = error.message; }
}
q('#load').onclick = loadWriting;
q('#play').onclick = () => { if (time >= figure.timeline.duration) time = 0; playing = !playing; previous = null; refresh(); };
q('#reset').onclick = () => { time = 0; playing = false; refresh(); };
q('#seek').oninput = () => { time = Number(q('#seek').value); playing = false; refresh(); };
q('#anchors').onchange = () => { figure.setDebug(q('#anchors').checked); q('#board-anchor').setAttribute('visibility', q('#anchors').checked ? 'visible' : 'hidden'); };
function attachment() {
  // Explicit configuration editing pauses the lesson. Playback never changes the body.
  playing = false; body.lean = Number(q('#lean').value); rig.upper = Number(q('#upper').value); rig.forearm = Number(q('#forearm').value);
  figure.setConfiguration(body, rig);
  for (const key of ['lean', 'upper', 'forearm']) q(`#${key}-value`).textContent = q(`#${key}`).value;
  refresh();
}
for (const key of ['lean', 'upper', 'forearm']) q(`#${key}`).oninput = attachment;
q('#restore').onclick = () => { q('#lean').value = 0; q('#upper').value = 195; q('#forearm').value = 180; attachment(); };
q('#export').onclick = () => {
  const url = URL.createObjectURL(new Blob([JSON.stringify(raw, null, 2)], { type: 'application/json' }));
  const a = document.createElement('a'); a.href = url; a.download = 'professor-timeline.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
};
q('#import').onchange = async event => {
  try {
    const file = event.target.files[0]; if (!file) return;
    if (file.size > 1024 * 1024) throw new Error('Timeline must be smaller than 1 MB.');
    load(JSON.parse(await file.text())); q('#message').textContent = 'Drawing Arm timeline imported without conversion.';
  } catch (error) { q('#message').textContent = `Import failed: ${error.message}`; }
  event.target.value = '';
};
function frame(now) {
  if (playing) {
    if (previous !== null) time = Math.min(figure.timeline.duration, time + (now - previous) * Number(q('#speed').value));
    previous = now; if (time >= figure.timeline.duration) playing = false; refresh();
  } else previous = null;
  requestAnimationFrame(frame);
}
loadWriting(); requestAnimationFrame(frame);
