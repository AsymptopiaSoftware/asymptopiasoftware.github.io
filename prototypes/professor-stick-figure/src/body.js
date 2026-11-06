import { configureArm } from '../../drawing-arm/src/kinematics.js';

/** SVG axes: +x screen-right, +y down. Origin sits on the floor between feet. */
export function configureBody(options = {}) {
  const body = { origin: [230, 505], scale: 1, lean: 0, ...options };
  if (!Array.isArray(body.origin) || body.origin.length !== 2 || !body.origin.every(Number.isFinite)) throw new TypeError('Body origin must be [finite x, finite y]');
  if (!Number.isFinite(body.scale) || body.scale <= 0) throw new RangeError('Body scale must be positive');
  if (!Number.isFinite(body.lean) || Math.abs(body.lean) > 35) throw new RangeError('Body lean must be between −35 and 35 local units');
  return { origin: [...body.origin], scale: body.scale, lean: body.lean };
}
export function bodyToWorld(point, config = {}) {
  const body = configureBody(config);
  if (!Array.isArray(point) || point.length !== 2 || !point.every(Number.isFinite)) throw new TypeError('Local point must be [finite x, finite y]');
  return point.map((v, i) => body.origin[i] + v * body.scale);
}
export function bodyLandmarks(config = {}) {
  const { lean } = configureBody(config);
  return {
    origin: [0, 0], head: [7 + lean, -282], neck: [lean, -251],
    rightShoulder: [24 + lean, -240], leftShoulder: [-22 + lean, -244],
    torsoTop: [lean, -230], hips: [-3, -115],
    leftElbow: [-34 + lean / 2, -185], leftHand: [-24, -143],
    leftKnee: [-21, -58], rightKnee: [16, -60],
    leftFoot: [-34, 0], rightFoot: [31, 0]
  };
}
/** Rig values are body-local lengths. The shoulder is always derived, never supplied. */
export function attachedArm(bodyConfig = {}, rig = {}) {
  const body = configureBody(bodyConfig), local = configureArm({ upper: 195, forearm: 180, tip: 10, elbow: 'negative', ...rig });
  return configureArm({ ...local, shoulder: bodyToWorld(bodyLandmarks(body).rightShoulder, body),
    upper: local.upper * body.scale, forearm: local.forearm * body.scale, tip: local.tip * body.scale });
}
