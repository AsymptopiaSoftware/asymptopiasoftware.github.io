import { configureArm } from '../../drawing-arm/src/kinematics.js';

/** SVG axes: +x screen-right, +y down. Origin is the fixed floor point between feet. */
export const BODY_DEFAULTS = Object.freeze({
  origin: Object.freeze([230, 505]), scale: 1, lean: 0,
  headSize: 1, neckLength: 21, shoulderWidth: 46,
  shoulderOffset: Object.freeze([1, -10]),
  rightShoulderOffset: Object.freeze([0, 0]), leftShoulderOffset: Object.freeze([0, -4]),
  torsoLength: 115, hipWidth: 24, legHeight: 115, footLength: 19
});
const ranges = {
  headSize: [.6, 1.5], neckLength: [8, 40], shoulderWidth: [24, 90],
  torsoLength: [70, 160], hipWidth: [12, 60], legHeight: [80, 160], footLength: [10, 40],
  lean: [-35, 35]
};
function pair(value, name) {
  if (!Array.isArray(value) || value.length !== 2 || !value.every(Number.isFinite)) throw new TypeError(`${name} must be [finite x, finite y]`);
  return [...value];
}
export function configureBody(options = {}) {
  const body = { ...BODY_DEFAULTS, ...options };
  body.origin = pair(body.origin, 'Body origin');
  for (const key of ['shoulderOffset', 'rightShoulderOffset', 'leftShoulderOffset']) {
    body[key] = pair(body[key], key);
    if (body[key].some(n => Math.abs(n) > 60)) throw new RangeError(`${key} must be within ±60 local units`);
  }
  if (!Number.isFinite(body.scale) || body.scale <= 0) throw new RangeError('Body scale must be positive');
  for (const [key, [min, max]] of Object.entries(ranges)) {
    if (!Number.isFinite(body[key]) || body[key] < min || body[key] > max) throw new RangeError(`${key} must be between ${min} and ${max}`);
  }
  if (body.shoulderWidth + body.rightShoulderOffset[0] - body.leftShoulderOffset[0] <= 0) throw new RangeError('Right shoulder must remain screen-right of the left shoulder');
  // Ignore unknown fields, and detach every mutable coordinate from caller input.
  return Object.fromEntries(Object.keys(BODY_DEFAULTS).map(key => [key, body[key]]));
}
export function bodyToWorld(point, config = {}) {
  const body = configureBody(config), p = pair(point, 'Local point');
  return p.map((v, i) => body.origin[i] + v * body.scale);
}
export function bodyLandmarks(config = {}) {
  const b = configureBody(config), hips = [-3, -b.legHeight];
  const torsoTop = [b.lean, hips[1] - b.torsoLength];
  const neck = [b.lean, torsoTop[1] - b.neckLength];
  const center = [torsoTop[0] + b.shoulderOffset[0], torsoTop[1] + b.shoulderOffset[1]];
  const shoulder = (side, offset) => [center[0] + side * b.shoulderWidth / 2 + offset[0], center[1] + offset[1]];
  const rightShoulder = shoulder(1, b.rightShoulderOffset), leftShoulder = shoulder(-1, b.leftShoulderOffset);
  const leftHip = [hips[0] - b.hipWidth / 2, hips[1]], rightHip = [hips[0] + b.hipWidth / 2, hips[1]];
  const leftFoot = [-34, 0], rightFoot = [31, 0];
  return {
    origin: [0, 0], head: [7 + b.lean, neck[1] - 31 * b.headSize], neck,
    rightShoulder, leftShoulder, shoulderCenter: center, torsoTop, hips, leftHip, rightHip,
    leftElbow: [leftShoulder[0] - 12 - b.lean / 2, leftShoulder[1] + b.torsoLength * 59 / 115],
    leftHand: [leftShoulder[0] - 2 - b.lean, leftShoulder[1] + b.torsoLength * 101 / 115],
    leftKnee: [(leftHip[0] + leftFoot[0]) / 2, -b.legHeight / 2],
    rightKnee: [(rightHip[0] + rightFoot[0]) / 2, -b.legHeight / 2],
    leftFoot, rightFoot, leftAnkle: [...leftFoot], rightAnkle: [...rightFoot], leftToe: [leftFoot[0] + b.footLength, 0], rightToe: [rightFoot[0] + b.footLength, 0]
  };
}
/** Anatomical defaults: upper = .65 torso, forearm = .55 torso, tool = .04 torso.
 * The adapter owns lengths and anchor; rig options supply bend/limits only. */
export function attachedArm(bodyConfig = {}, rig = {}) {
  const body = configureBody(bodyConfig), local = configureArm({ elbow: 'negative', ...rig,
    upper: .65 * body.torsoLength, forearm: .55 * body.torsoLength, tip: .04 * body.torsoLength });
  return configureArm({ ...local, shoulder: bodyToWorld(bodyLandmarks(body).rightShoulder, body),
    upper: local.upper * body.scale, forearm: local.forearm * body.scale, tip: local.tip * body.scale });
}
