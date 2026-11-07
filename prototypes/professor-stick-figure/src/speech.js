/** Browser-only side effects, deliberately separate from deterministic pose sampling.
 * Pass a host with speechSynthesis/SpeechSynthesisUtterance for testing or embedding.
 */
export class PresentationSpeech {
  constructor(host=globalThis,onStatus=()=>{}) {
    this.host=host;this.synth=host.speechSynthesis;this.Utterance=host.SpeechSynthesisUtterance;this.onStatus=onStatus;
    this.supported=!!(this.synth&&this.Utterance);this.muted=false;this.key=null;this.active=null;this.finished=false;this.paused=false;this.timer=null;
    this.voicesChanged=()=>this.report(this.muted?'Muted.':this.voices().length?'Speech ready.':'No speech voices available; explanations remain visible.');
    this.synth?.addEventListener?.('voiceschanged',this.voicesChanged);
    this.report(this.supported?'Speech ready.':'Speech synthesis unavailable; explanations remain visible.');
  }
  voices(){try{return this.synth?.getVoices?.()??[];}catch{return [];}}
  report(text){if(text===this.status)return;this.status=text;this.onStatus(text);}
  clearTimer(){if(this.timer!==null){this.host.clearTimeout(this.timer);this.timer=null;}}
  cancel() {
    this.clearTimer();const had=!!this.active;this.active=null;this.paused=false;this.key=null;this.finished=false;
    if(had)this.report('Speech stopped.');
    if(had)try{this.synth.cancel();}catch{/* A failed audio backend must not stop animation. */}
  }
  setMuted(value){if(this.muted===!!value)return;this.cancel();this.muted=!!value;this.report(this.muted?'Muted.':this.supported?'Speech ready.':'Speech synthesis unavailable; explanations remain visible.');}
  get busy(){return !!this.active;}
  watchdog(){
    this.clearTimer();if(!this.active||this.paused)return;
    const key=this.key,utterance=this.active;
    this.timer=this.host.setTimeout(()=>{
      if(this.key!==key||this.active!==utterance)return;
      this.cancel();this.key=key;this.finished=true;this.report('Speech did not complete; continuing with visible explanations.');
    },Math.min(60000,Math.max(10000,this.active.text.split(/\s+/u).length*1600+5000)));
  }
  /** A new key starts once. A seek/reset must call cancel() before sampling again. */
  sync(action,playing,rate=1) {
    const key=action?.id??null;
    if(key!==this.key){this.cancel();this.key=key;}
    if(!action||this.muted||!this.supported)return;
    if(this.active){
      try{
        if(!playing&&!this.paused){this.synth.pause();this.paused=true;this.clearTimer();this.report('Speech paused.');}
        else if(playing&&this.paused){this.synth.resume();this.paused=false;this.watchdog();this.report('Speaking.');}
      }catch{this.cancel();this.key=key;this.finished=true;this.report('Speech unavailable; explanations remain visible.');}
      return;
    }
    if(!playing||this.finished)return;
    const voices=this.voices();
    if(!voices.length){this.report('No speech voices available; explanations remain visible.');return;}
    try{
      const u=new this.Utterance(action.text);u.rate=Math.max(.5,Math.min(2,rate));
      u.voice=voices.find(v=>v.lang?.startsWith('en')&&v.localService)??voices.find(v=>v.lang?.startsWith('en'))??voices[0];
      u.onend=()=>{if(this.active!==u)return;this.clearTimer();this.active=null;this.finished=true;this.report('Speech complete.');};
      u.onerror=()=>{if(this.active!==u)return;this.clearTimer();this.active=null;this.finished=true;this.report('Speech unavailable; explanations remain visible.');};
      this.active=u;this.paused=false;this.report('Speaking.');this.synth.cancel();if(this.synth.paused)this.synth.resume();this.synth.speak(u);this.watchdog();
    }catch{this.cancel();this.key=key;this.finished=true;this.report('Speech unavailable; explanations remain visible.');}
  }
  destroy(){this.cancel();this.synth?.removeEventListener?.('voiceschanged',this.voicesChanged);}
}
