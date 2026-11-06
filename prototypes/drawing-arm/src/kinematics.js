/** Character-independent planar two-link IK. Angles are radians, SVG y points down. */
const TAU = 2 * Math.PI;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const distance = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const point = (p, name) => {
  if (!Array.isArray(p) || p.length !== 2 || !p.every(Number.isFinite)) throw new TypeError(`${name} must be [finite x, finite y]`);
  return [...p];
};
export function configureArm(options = {}) {
  const c = { upper: 190, forearm: 170, shoulder: [80, 280], side: 'right', elbow: 'positive', tip: 8,
    limits: { shoulder: [-Math.PI, Math.PI], elbow: [-Math.PI, Math.PI] }, ...options };
  for (const key of ['upper', 'forearm']) if (!Number.isFinite(c[key]) || c[key] <= 0) throw new RangeError(`${key} must be positive`);
  if (!Number.isFinite(c.tip) || c.tip < 0) throw new RangeError('tip must be nonnegative');
  c.shoulder = point(c.shoulder, 'shoulder');
  if (!['left', 'right'].includes(c.side) || !['positive', 'negative'].includes(c.elbow)) throw new RangeError('Invalid side or elbow orientation');
  c.limits = { shoulder: [-Math.PI, Math.PI], elbow: [-Math.PI, Math.PI], ...c.limits };
  for (const key of ['shoulder', 'elbow']) {
    const range = point(c.limits[key], `${key} limits`);
    if (range[0] > range[1] || range[1] - range[0] > TAU + 1e-10) throw new RangeError('Limits must be ordered and span at most 2π');
    c.limits[key] = range;
  }
  return c;
}
export function forward(arm, shoulderAngle, elbowAngle) {
  const c = configureArm(arm), s = c.shoulder;
  const elbow = [s[0] + c.upper * Math.cos(shoulderAngle), s[1] + c.upper * Math.sin(shoulderAngle)];
  const angle = shoulderAngle + elbowAngle;
  const wrist = [elbow[0] + c.forearm * Math.cos(angle), elbow[1] + c.forearm * Math.sin(angle)];
  const tip = [wrist[0] + c.tip * Math.cos(angle), wrist[1] + c.tip * Math.sin(angle)];
  return { shoulder: [...s], elbow, wrist, tip, angles: { shoulder: shoulderAngle, elbow: elbowAngle } };
}
// Pick the equivalent angle closest to the configured interval, including seam crossings.
function fit(angle, range) {
  const center = (range[0] + range[1]) / 2;
  const a = angle + TAU * Math.round((center - angle) / TAU);
  return clamp(a, ...range);
}
export function solveIK(arm, target) {
  const c = configureArm(arm); point(target, 'target');
  const dx = target[0] - c.shoulder[0], dy = target[1] - c.shoulder[1];
  const r = Math.hypot(dx, dy), a = c.upper, b = c.forearm + c.tip;
  const projectedRadius = clamp(r, Math.abs(a - b), a + b);
  const direction = r < 1e-12 ? 0 : Math.atan2(dy, dx);
  const bend = Math.acos(clamp((projectedRadius ** 2 - a * a - b * b) / (2 * a * b), -1, 1));
  const sign = (c.elbow === 'positive' ? 1 : -1) * (c.side === 'left' ? -1 : 1);
  const candidates = [sign, -sign].map(s => {
    const e = s * bend;
    const sh = direction - Math.atan2(b * Math.sin(e), a + b * Math.cos(e));
    return [sh, e];
  });
  // Exact preferred branch, or exact opposite branch when required by limits.
  let chosen = null;
  for (const [sh, e] of candidates) {
    const fitted = [fit(sh, c.limits.shoulder), fit(e, c.limits.elbow)];
    const pose = forward(c, ...fitted);
    if (distance(pose.tip, target) <= 1e-6) { chosen = pose; break; }
  }
  if (!chosen) {
    // Global closest point on the rectangular joint domain: an interior optimum
    // is analytic IK (above), otherwise at least one joint lies on a boundary.
    const poses = [];
    const add = (sh, e) => poses.push(forward(c, fit(sh, c.limits.shoulder), fit(e, c.limits.elbow)));
    for (const [sh, e] of candidates) add(sh, e);
    for (const e of c.limits.elbow) add(direction - Math.atan2(b * Math.sin(e), a + b * Math.cos(e)), e);
    for (const sh of c.limits.shoulder) {
      const ex = c.shoulder[0] + a * Math.cos(sh), ey = c.shoulder[1] + a * Math.sin(sh);
      add(sh, Math.atan2(target[1] - ey, target[0] - ex) - sh);
      for (const e of c.limits.elbow) add(sh, e);
    }
    chosen = poses.reduce((best, p) => distance(p.tip, target) < distance(best.tip, target) - 1e-9 ? p : best);
  }
  const error = distance(chosen.tip, target), radialReachable = r >= Math.abs(a - b) - 1e-7 && r <= a + b + 1e-7;
  return { ...chosen, target: [...target], error, reachable: error <= 1e-6,
    reason: error <= 1e-6 ? 'reachable' : radialReachable ? 'joint-limits' : 'out-of-reach' };
}
export function boardToWorld(p, board = {}) {
  point(p, 'board point');
  const { origin = [0, 0], scale = 1, rotation = 0 } = board; point(origin, 'board origin');
  if (!Number.isFinite(scale) || scale <= 0 || !Number.isFinite(rotation)) throw new RangeError('Invalid board transform');
  return [origin[0] + scale * (p[0] * Math.cos(rotation) - p[1] * Math.sin(rotation)),
    origin[1] + scale * (p[0] * Math.sin(rotation) + p[1] * Math.cos(rotation))];
}
