import { configureArm, compileTimeline, sampleArm } from '../src/index.js';
/** onFrame receives world geometry; the consumer owns artwork and time. */
export function createProfessorDriver(json, config, onFrame) {
  const timeline = compileTimeline(json);
  let arm = configureArm(config);
  if (typeof onFrame !== 'function') throw new TypeError('onFrame callback required');
  return {
    duration: timeline.duration,
    setArm(config) { arm = configureArm(config); },
    update(elapsedMs) { const state = sampleArm(timeline, elapsedMs, arm); onFrame(state); return state; }
  };
}
