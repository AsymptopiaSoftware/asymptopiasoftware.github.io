import { configureBody, bodyLandmarks, legKnee } from './body.js';
const easeGait=t=>t*t*(3-2*t);
/** Step cadence derives from actual root displacement, not an independent timer. */
export function stepCycle(bodyOptions,state) {
  const body=configureBody(bodyOptions);
  if(state?.kind!=='move'||!state.move||Math.abs(state.move.to-state.move.from)<1e-8)return null;
  const {from,to}=state.move,delta=(to-from)/body.scale;
  const progress=Math.max(0,Math.min(1,(state.offset-from)/(to-from)));
  const pairs=Math.max(1,Math.ceil(Math.abs(delta)/(.35*body.legHeight))),steps=2*pairs;
  const phase=Math.min(steps-1,Math.floor(progress*steps)),u=Math.min(1,progress*steps-phase);
  return {from,to,delta,progress,pairs,steps,phase,u,first:delta>=0?'right':'left',stride:delta/pairs};
}
/** Small upright rise at mid-step, zero value and velocity at contact/stop. */
export function walkingBob(body,state) {
  const cycle=stepCycle(body,state);
  return cycle?-.015*body.legHeight*body.scale*Math.sin(Math.PI*cycle.u)**2:0;
}
/** Alternating steps: stance shoe is fixed in world space, swing shoe lifts. */
export function walkingLandmarks(bodyOptions,state) {
  const body=configureBody(bodyOptions),p=bodyLandmarks(body),cycle=stepCycle(body,state);
  if(cycle) {
    const {from,phase,u,first,stride}=cycle,lift=Math.min(.105*body.legHeight,.6*body.footLength);
    const bob=walkingBob(body,state)/body.scale;
    for(const side of ['left','right']) {
      const parity=side===first?0:1,completed=Math.floor((phase+1-parity)/2),swing=phase%2===parity;
      const shift=(completed+(swing?easeGait(u):0))*stride;
      const foot=[p[side+'Foot'][0]+(from-state.offset)/body.scale+shift,(swing?-lift*Math.sin(Math.PI*u)**2:0)-bob];
      const pitch=swing?-.18*Math.sin(Math.PI*u)**2:0;
      p[side+'Foot']=foot;p[side+'Ankle']=[...foot];p[side+'Toe']=[foot[0]+body.footLength*Math.cos(pitch),foot[1]+body.footLength*Math.sin(pitch)];
    }
  }
  p.leftKnee=legKnee(p.leftHip,p.leftAnkle,body.legHeight);
  p.rightKnee=legKnee(p.rightHip,p.rightAnkle,body.legHeight);
  return p;
}
