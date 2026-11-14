// Character motion owns no drawing geometry or symbolic mathematics.
export function characterAt(time, scene, writingEnd) {
  const {walk, turn, react, returnWalk} = scene.timing;
  const target = scene.character.position;
  const lerp = (a,b,f) => a+(b-a)*Math.max(0,Math.min(1,f));
  let phase = 'walk', x = lerp(scene.startX,target[0],time/walk), facing=1, yaw=0;
  if(time>=walk){phase='turn'; x=target[0]; yaw=Math.min(1,(time-walk)/turn);}
  if(time>=walk+turn) phase='write';
  if(time>=writingEnd){phase='react'; yaw=1-Math.min(1,(time-writingEnd)/react);}
  if(time>=writingEnd+react){phase='return'; facing=-1; yaw=0; x=lerp(target[0],scene.startX,(time-writingEnd-react)/returnWalk);}
  if(time>=writingEnd+react+returnWalk){phase='complete';facing=1;}
  const moving=phase==='walk'||phase==='return';
  return {phase,x,y:target[1]+(moving?Math.sin(time/90)*3:phase==='react'?-Math.sin(Math.min(1,(time-writingEnd)/react)*Math.PI)*12:0),facing,yaw,step:moving?Math.sin(time/90)*10:0};
}
export function armConfig(scene) {
  const c=scene.character, s=c.scale;
  return {...c.arm, shoulder:c.shoulder.map((v,i)=>c.position[i]+v*s), upper:c.arm.upper*s, forearm:c.arm.forearm*s, tip:c.arm.tip*s};
}
