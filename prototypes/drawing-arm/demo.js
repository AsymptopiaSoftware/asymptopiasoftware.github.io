import { configureArm, textTimeline, compileTimeline, SVGArmRenderer } from './src/index.js';
const $ = s => document.querySelector(s);
const defaults = () => [configureArm({upper:215,forearm:200,shoulder:[95,285],tip:10}), configureArm({upper:170,forearm:255,shoulder:[95,285],tip:10})];
let arms=defaults(), raw, timeline, renderers=[], time=0, playing=false, last=null;
const boards=[...document.querySelectorAll('.boards article')];
function render() {
  renderers.forEach((r,i)=>{
    const s=r.render(time), p=s.pose;
    boards[i].querySelector('.readout').textContent=p ? `${s.chalkDown?'● CHALK DOWN':'○ PEN UP'}  /  ${p.reason.toUpperCase()}${p.reachable?'':` · error ${p.error.toFixed(1)}`}`:'○ IDLE';
    boards[i].querySelector('.rig-info').textContent=`${arms[i].upper} / ${arms[i].forearm} units`;
  });
  $('#seek').max=timeline.duration || 1; $('#seek').value=time;
  $('#clock').textContent=`${(time/1000).toFixed(1)} / ${(timeline.duration/1000).toFixed(1)} s`;
  $('#play').textContent=playing?'Pause':'Play';
}
function load(input) {
  const next=compileTimeline(input); // Validate before destroying current view.
  raw=structuredClone(input); timeline=next; playing=false; time=0;
  renderers.forEach(r=>r.destroy());
  renderers=boards.map((b,i)=>new SVGArmRenderer(b.querySelector('.drawing'),timeline,arms[i],{color:i?'#a8c7a0':'#e5c37a'}));
  render();
}
function write() {
  try { load(textTimeline($('#equation').value,{x:150,y:106,size:30,speed:150,lift:100})); $('#message').textContent=raw.fallbacks.length?`${raw.fallbacks.length} unsupported glyph(s) shown as font fallback; no arm trace for those glyphs.`:'Both rigs receive identical board coordinates.'; }
  catch(e){$('#message').textContent=e.message;}
}
const fields=[['upper','Upper arm',40,300],['forearm','Forearm',40,300],['shoulderX','Shoulder X',0,520],['shoulderY','Shoulder Y',0,360],['tip','Chalk tip',0,40]];
for(const [key,title,min,max] of fields){const div=document.createElement('div');div.className='dimension';div.innerHTML=`<label for="${key}">${title}<output></output></label><input type="range" id="${key}" min="${min}" max="${max}" step="1">`;$('#dimensions').append(div);}
function controls(){const a=arms[Number($('#rig').value)];for(const [key]of fields){const v=key==='shoulderX'?a.shoulder[0]:key==='shoulderY'?a.shoulder[1]:a[key];$('#'+key).value=v;$('#'+key).previousElementSibling.querySelector('output').value=v;}$('#bend').value=a.elbow;$('#limits').checked=a.limits.shoulder[0]===-Math.PI/2;}
function change(){const i=Number($('#rig').value),a=structuredClone(arms[i]);for(const [key]of fields){const v=Number($('#'+key).value);if(key==='shoulderX')a.shoulder[0]=v;else if(key==='shoulderY')a.shoulder[1]=v;else a[key]=v;}a.elbow=$('#bend').value;a.limits.shoulder=$('#limits').checked?[-Math.PI/2,0]:[-Math.PI,Math.PI];arms[i]=configureArm(a);renderers[i].setArm(arms[i]);controls();render();}
$('#dimensions').addEventListener('input',change);$('#bend').onchange=change;$('#limits').onchange=change;$('#rig').onchange=controls;
$('#write').onclick=write;document.querySelectorAll('[data-text]').forEach(b=>b.onclick=()=>{$('#equation').value=b.dataset.text;write();});
$('#play').onclick=()=>{if(time>=timeline.duration)time=0;playing=!playing;last=null;render();};
$('#reset').onclick=()=>{playing=false;time=0;render();};
$('#restore').onclick=()=>{arms=defaults();renderers.forEach((r,i)=>r.setArm(arms[i]));controls();render();};
$('#seek').oninput=()=>{playing=false;time=Number($('#seek').value);render();};
$('#export').onclick=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(raw,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='drawing-arm-timeline.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
$('#import').onchange=async e=>{try{const file=e.target.files[0];if(!file)return;if(file.size>1024*1024)throw Error('Timeline must be smaller than 1 MB');load(JSON.parse(await file.text()));$('#message').textContent='Imported timeline loaded for both rigs.';}catch(err){$('#message').textContent=`Import failed: ${err.message}`;}e.target.value='';};
function frame(now){if(playing){if(last!==null)time=Math.min(timeline.duration,time+(now-last)*Number($('#speed').value));last=now;if(time>=timeline.duration)playing=false;render();}else last=null;requestAnimationFrame(frame);}
write();controls();requestAnimationFrame(frame);
