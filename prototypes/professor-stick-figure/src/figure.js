import { configureBody, bodyLandmarks, bodyToWorld, attachedArm } from './body.js';
import { compileTimeline } from '../../drawing-arm/src/timeline.js';
import { SVGArmRenderer } from '../../drawing-arm/src/svg-renderer.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
function node(tag, attrs, parent) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, value);
  parent.append(el); return el;
}
/** Rear three-quarter silhouette. The small profile projection points screen-right. */
export function drawBody(group, config = {}) {
  const body = configureBody(config), p = bodyLandmarks(body), [hx, hy] = p.head;
  group.replaceChildren();
  group.setAttribute('transform', `translate(${body.origin}) scale(${body.scale})`);
  group.setAttribute('data-view', 'rear-three-quarter-facing-right');
  const line = (name, points, attrs = {}) => node('path', { 'data-part': name, d: 'M' + points.join('L'),
    fill: 'none', stroke: '#e7e4d5', 'stroke-width': 6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', ...attrs }, group);
  // The far arm is behind the spine; feet and hips do not depend on lean.
  line('left-arm', [p.leftShoulder, p.leftElbow, p.leftHand], { stroke: '#9fafa6', 'stroke-width': 5 });
  line('legs', [p.leftFoot, p.leftKnee, p.leftHip, p.rightHip, p.rightKnee, p.rightFoot]);
  line('hips', [p.leftHip, p.hips, p.rightHip]);
  line('left-foot', [p.leftFoot, p.leftToe], { 'stroke-width': 7 });
  line('right-foot', [p.rightFoot, p.rightToe], { 'stroke-width': 7 });
  line('torso', [p.hips, p.torsoTop, p.neck]);
  line('shoulders', [p.leftShoulder, p.torsoTop, p.rightShoulder]);
  // Head profile is normalized geometry scaled around a derived head landmark.
  const h = body.headSize;
  const H = (x, y) => `${hx + x * h},${hy + y * h}`;
  node('path', { 'data-part': 'head', d: `M${H(-9,28)} C${H(-32,20)} ${H(-33,-18)} ${H(-10,-28)} C${H(8,-37)} ${H(25,-20)} ${H(25,-7)} L${H(37,1)} L${H(26,5)} C${H(25,20)} ${H(12,28)} ${H(-9,28)}Z`,
    fill: '#202c29', stroke: '#e7e4d5', 'stroke-width': 4, 'stroke-linejoin': 'round' }, group);
  // Nape mark, no face or eyes: the viewer sees the back of the head.
  line('nape', [[hx-13*h, hy+21*h], [hx-8*h, hy+27*h]], { stroke: '#8da497', 'stroke-width': 2 });
  return p;
}

/** Composition adapter. Writing logic and chalk rendering belong to Drawing Arm. */
export class ProfessorFigure {
  constructor(group, json, { body = {}, rig = {} } = {}) {
    this.group = group;
    this.bodyGroup = node('g', { 'data-layer': 'body' }, group);
    this.armGroup = node('g', { 'data-layer': 'drawing-arm' }, group);
    this.debugGroup = node('g', { 'data-layer': 'anchors', 'pointer-events': 'none' }, group);
    this.debug = false; this.time = 0;
    this.setConfiguration(body, rig);
    this.setTimeline(json);
  }
  setConfiguration(body = this.body, rig = this.rig) {
    // Validate atomically before changing visible state.
    const nextBody = configureBody(body), nextRig = structuredClone(rig), arm = attachedArm(nextBody, nextRig);
    this.body = nextBody; this.rig = nextRig; this.arm = arm;
    drawBody(this.bodyGroup, this.body);
    this.renderer?.setArm(this.arm);
    this.drawAnchors();
    if (this.renderer) this.render(this.time);
  }
  setTimeline(json) {
    const timeline = compileTimeline(json);
    this.renderer?.destroy();
    this.timeline = timeline;
    this.renderer = new SVGArmRenderer(this.armGroup, timeline, this.arm, { color: '#e6c16e' });
    this.render(0);
  }
  drawAnchors() {
    this.debugGroup.replaceChildren();
    for (const [label, point] of [['body origin', this.body.origin], ['right shoulder', this.arm.shoulder]]) {
      node('circle', { cx: point[0], cy: point[1], r: 10, fill: 'none', stroke: '#e6c16e', 'stroke-dasharray': '3 3' }, this.debugGroup);
      node('path', { d: `M${point[0]-15},${point[1]}h30M${point[0]},${point[1]-15}v30`, stroke: '#e6c16e', 'stroke-width': 1 }, this.debugGroup);
      const text = node('text', { x: point[0]+18, y: point[1]+5, fill: '#e6c16e', 'font-size': 11, 'font-family': 'monospace' }, this.debugGroup); text.textContent = label;
    }
    this.debugGroup.setAttribute('visibility', this.debug ? 'visible' : 'hidden');
  }
  setDebug(visible) { this.debug = !!visible; this.drawAnchors(); }
  render(time) {
    // The body is never redrawn or transformed by the playback clock.
    const state = this.renderer.render(time); this.time = time; return state;
  }
  getAnchors() {
    const local = bodyLandmarks(this.body);
    return Object.fromEntries(Object.entries(local).map(([key, p]) => [key, bodyToWorld(p, this.body)]));
  }
  destroy() { this.renderer.destroy(); this.group.replaceChildren(); }
}
