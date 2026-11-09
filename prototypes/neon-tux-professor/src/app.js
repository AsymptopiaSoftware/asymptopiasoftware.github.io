import {createLesson} from './lesson.js';
import {createView} from './view.js';
async function start(){
 const bundled=globalThis.PROFESSOR_DATA;
 const [scene,json,art]=bundled?[bundled.scene,bundled.timeline,bundled.art]:await Promise.all([fetch('./examples/scene.json').then(r=>r.json()),fetch('./examples/equation.json').then(r=>r.json()),fetch('./assets/blue-neon-tux.svg').then(r=>r.text())]);
 const profile=Object.hasOwn(scene.profiles,location.hash.slice(1))?location.hash.slice(1):'original';
 scene.character={...scene.character,...scene.profiles[profile]};
 document.querySelector('#profile').value=profile;
 const svg=document.querySelector('svg'),view=createView(svg,scene,json,art);
 let lesson=createLesson(scene,json),time=0,playing=false,last=null;
 const play=document.querySelector('#play'),seek=document.querySelector('#seek'),status=document.querySelector('#status');
 seek.max=lesson.duration;
 function render(){const frame=lesson.frame(time),unreachable=view.render(frame); seek.value=time;
 const labels={walk:'On my way to the board.',turn:'Let’s take a closer look.',write:'2 + 3 = 5 · Follow the chalk.',react:'There it is! Two plus three makes five.',return:'Your turn to try.',complete:'Lesson complete. Shall we do that again?'};
 status.textContent=unreachable?'Chalk lifted: point outside this character’s reach.':labels[frame.motion.phase];
 document.querySelector('#phase').textContent=frame.motion.phase;
 document.querySelector('#clock').textContent=(time/1000).toFixed(1)+' / '+(lesson.duration/1000).toFixed(1)+' s';
 play.textContent=playing?'Pause lesson':time>=lesson.duration?'Replay lesson':'Play lesson';}
 play.onclick=()=>{if(time>=lesson.duration)time=0;playing=!playing;last=null;render();};
 document.querySelector('#restart').onclick=()=>{time=0;playing=false;last=null;render();};
 seek.oninput=()=>{time=Number(seek.value);last=null;render();};
 document.querySelector('#profile').onchange=e=>{location.hash=e.target.value;location.reload();};
 function tick(now){if(playing){if(last!==null)time=Math.min(lesson.duration,time+(now-last)*Number(document.querySelector('#speed').value));last=now;if(time===lesson.duration)playing=false;render();}requestAnimationFrame(tick);}
 render();requestAnimationFrame(tick);
 globalThis.professor={lesson,seek(t){time=t;render();},scene};
}
start().catch(e=>{document.querySelector('#status').textContent='Unable to load the lesson: '+e.message;console.error(e);});
