import test from 'node:test';
import assert from 'node:assert/strict';
import {PresentationSpeech} from '../src/speech.js';
function speechHost(voices=[{lang:'en-US',localService:true}]){
 const calls=[],timers=new Map();let id=0;
 const host={setTimeout:fn=>{timers.set(++id,fn);return id;},clearTimeout:id=>timers.delete(id),
  SpeechSynthesisUtterance:class{constructor(text){this.text=text;}},
  speechSynthesis:{paused:false,getVoices:()=>voices,addEventListener:(name,fn)=>host.voicesChanged=fn,removeEventListener:()=>{},
   speak:u=>calls.push(['speak',u]),cancel:()=>calls.push(['cancel']),pause(){this.paused=true;calls.push(['pause']);},resume(){this.paused=false;calls.push(['resume']);}}};
 return {host,calls,timers};
}
const action={id:'one',text:'Let us explain this chart.'};
test('speech starts once, pauses/resumes, cancels on seek and replays without overlapping utterances',()=>{
 const {host,calls}=speechHost(),s=new PresentationSpeech(host);s.sync(action,true);const first=s.active;
 s.sync(action,true);assert.equal(calls.filter(c=>c[0]==='speak').length,1);
 s.sync(action,false);s.sync(action,false);assert.equal(calls.filter(c=>c[0]==='pause').length,1);assert.equal(s.paused,true);
 s.sync(action,true);assert.equal(calls.filter(c=>c[0]==='resume').length,1);
 s.sync(action,false);s.cancel();assert.equal(s.busy,false);s.sync(action,false);assert.equal(s.busy,false);s.sync(action,true);assert.notEqual(s.active,first);assert.equal(host.speechSynthesis.paused,false);
 const next=s.active;first.onend();assert.equal(s.active,next);next.onend();assert.equal(s.busy,false);s.sync(action,true);assert.equal(s.busy,false);
 s.sync({...action,id:'two'},true);assert.equal(s.busy,true);s.sync(null,false);assert.equal(s.busy,false);s.destroy();
});
test('mute defaults off, stops speech and unmute can restart only the current action',()=>{
 const {host,calls}=speechHost(),s=new PresentationSpeech(host);assert.equal(s.muted,false);s.sync(action,true);s.setMuted(true);assert.equal(s.busy,false);
 s.sync(action,true);assert.equal(calls.filter(c=>c[0]==='speak').length,1);s.setMuted(false);s.sync(action,true);assert.equal(calls.filter(c=>c[0]==='speak').length,2);s.destroy();
});
test('unsupported synthesis, missing and delayed voices, speech errors and a stalled backend degrade gracefully',()=>{
 const unsupported=new PresentationSpeech({});unsupported.sync(action,true);assert.equal(unsupported.busy,false);assert.match(unsupported.status,/unavailable/);
 const voices=[],{host,timers}=speechHost(voices),s=new PresentationSpeech(host);s.sync(action,true);assert.equal(s.busy,false);assert.match(s.status,/No speech voices/);
 voices.push({lang:'en-US'});host.voicesChanged();s.sync(action,true);const first=s.active;first.onerror();assert.equal(s.busy,false);assert.match(s.status,/unavailable/);
 s.cancel();s.sync(action,true);assert.equal(timers.size,1);[...timers.values()][0]();assert.equal(s.busy,false);assert.match(s.status,/did not complete/);
 s.cancel();host.speechSynthesis.speak=()=>{throw Error('backend');};s.sync(action,true);assert.equal(s.busy,false);s.destroy();
});
