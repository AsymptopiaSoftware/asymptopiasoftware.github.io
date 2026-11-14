import {createProfessorDriver} from '../vendor/drawing-arm/examples/professor-driver.js';
import {characterAt,armConfig} from './character.js';
export function createLesson(scene,json,onFrame=()=>{}) {
  const driver=createProfessorDriver(json,armConfig(scene),()=>{});
  const writingStart=scene.timing.walk+scene.timing.turn;
  const writingEnd=writingStart+driver.duration;
  const duration=writingEnd+scene.timing.react+scene.timing.returnWalk;
  return {duration,writingStart,writingEnd,driver,frame(time){
    if(!Number.isFinite(time)) throw new TypeError('Finite clock required');
    time=Math.max(0,Math.min(duration,time));
    const arm=driver.update(time-writingStart);
    const motion=characterAt(time,scene,writingEnd);
    const frame={time,motion,arm,writingTime:time-writingStart,writingStart,writingEnd,duration};
    onFrame(frame);return frame;
  }};
}
