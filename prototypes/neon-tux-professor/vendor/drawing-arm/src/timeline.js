import { GLYPHS } from './glyphs.js';
import { boardToWorld, distance, solveIK } from './kinematics.js';
const finite = (v, name, min = -Infinity) => { if (!Number.isFinite(v) || v < min) throw new RangeError(`Invalid ${name}`); };
export function validateTimeline(input) {
  if (input?.version !== 1 || !Array.isArray(input.strokes)) throw new TypeError('Expected timeline version 1 and strokes array');
  const t = structuredClone(input); boardToWorld([0,0], t.board);
  let end = 0;
  for (const s of t.strokes) {
    finite(s.at, 'stroke start', end); finite(s.duration, 'stroke duration', Number.MIN_VALUE);
    if (!Array.isArray(s.points) || s.points.length < 2) throw new TypeError('Stroke needs at least two points');
    s.points.forEach(p => boardToWorld(p));
    if (s.pen !== undefined && typeof s.pen !== 'boolean') throw new TypeError('pen must be boolean');
    end = s.at + s.duration; finite(end, 'stroke end');
  }
  if (t.fallbacks !== undefined) {
    if (!Array.isArray(t.fallbacks)) throw new TypeError('fallbacks must be an array');
    for (const f of t.fallbacks) {
      finite(f.at, 'fallback start', 0); finite(f.size, 'fallback size', Number.MIN_VALUE); boardToWorld(f.position);
      if (typeof f.text !== 'string') throw new TypeError('fallback text must be a string');
    }
  }
  t.duration = Math.max(end, ...(t.fallbacks ?? []).map(f => f.at), 0);
  return t;
}
/** Compile once; points interpolate at constant arc-length speed within each stroke. */
export function compileTimeline(input) {
  const t = validateTimeline(input);
  t.strokes = t.strokes.map(s => {
    const points = s.points.map(p => boardToWorld(p, t.board)), lengths = [0];
    for (let i = 1; i < points.length; i++) lengths.push(lengths.at(-1) + distance(points[i-1], points[i]));
    return { ...s, points, lengths, length: lengths.at(-1) };
  });
  return t;
}
export function strokePoint(stroke, fraction) {
  const d = Math.max(0, Math.min(1, fraction)) * stroke.length;
  for (let i = 1; i < stroke.points.length; i++) {
    if (d <= stroke.lengths[i]) {
      const span = stroke.lengths[i] - stroke.lengths[i-1], f = span ? (d - stroke.lengths[i-1]) / span : 0;
      return stroke.points[i-1].map((v, j) => v + f * (stroke.points[i][j] - v));
    }
  }
  return [...stroke.points.at(-1)];
}
export function sampleTimeline(timeline, time) {
  finite(time, 'time');
  const strokes = timeline.strokes;
  if (!strokes.length) return { point: null, penDown: false, index: -1, progress: 0, done: time >= timeline.duration };
  let previous = strokes[0].points[0], previousEnd = 0;
  for (let i = 0; i < strokes.length; i++) {
    const s = strokes[i];
    if (time < s.at) {
      const f = Math.max(0, (time - previousEnd) / (s.at - previousEnd || 1));
      return { point: previous.map((v,j) => v + f * (s.points[0][j] - v)), penDown: false, index: i, progress: 0, done: false };
    }
    if (time < s.at + s.duration) {
      const progress = (time - s.at) / s.duration;
      return { point: strokePoint(s, progress), penDown: s.pen !== false, index: i, progress, done: false };
    }
    previous = s.points.at(-1); previousEnd = s.at + s.duration;
  }
  return { point: [...previous], penDown: false, index: strokes.length - 1, progress: 1, done: time >= timeline.duration };
}
export function sampleArm(timeline, time, arm) {
  const sample = sampleTimeline(timeline, time), pose = sample.point ? solveIK(arm, sample.point) : null;
  return { ...sample, pose, chalkDown: sample.penDown && !!pose?.reachable };
}
export function textTimeline(text, options = {}) {
  const { x = 150, y = 100, size = 36, speed = 120, lift = 100, lineHeight = 1.8, board } = options;
  [x,y].forEach(v => finite(v, 'text origin')); finite(size,'size',Number.MIN_VALUE); finite(speed,'speed',Number.MIN_VALUE); finite(lift,'lift',0); finite(lineHeight,'lineHeight',Number.MIN_VALUE);
  if (typeof text !== 'string') throw new TypeError('text must be a string');
  const strokes = [], fallbacks = []; let at = 0, col = 0, row = 0;
  for (const char of text) {
    if (char === '\n') { col = 0; row++; continue; }
    const origin = [x + col * size * .95, y + row * size * lineHeight];
    if (char !== ' ') {
      if (!GLYPHS[char]) fallbacks.push({ text: char, position: origin, size, at });
      else for (const path of GLYPHS[char]) {
        const points = path.map(p => [origin[0] + p[0] * size * .62, origin[1] + p[1] * size]);
        const length = points.slice(1).reduce((n,p,i) => n + distance(p,points[i]), 0);
        const duration = Math.max(1, length / speed * 1000);
        strokes.push({ at, duration, points, pen: true }); at += duration + lift;
      }
    }
    col++;
  }
  return validateTimeline({ version: 1, board: board ?? { origin: [0,0], scale: 1, rotation: 0 }, strokes, fallbacks });
}
