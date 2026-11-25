// Music Buddy Web 0.1 — browser-only MIDI, voice prompts, and chord journeys.
// This deliberately does not depend on d3SRT, a Python server, or an AI service.
const PC = {C:0,"C#":1,Db:1,D:2,"D#":3,Eb:3,E:4,F:5,"F#":6,Gb:6,G:7,"G#":8,Ab:8,A:9,"A#":10,Bb:10,B:11,Cb:11};
const FLATS = ["C","Db","D","Eb","E","F","Gb","G","Ab","A","Bb","B"];
const SHARPS = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
const KEYS = ["C","Db","D","Eb","E","F","Gb","G","Ab","A","Bb","B"];
const PRIORITY = new Set(["C","F","Bb","Eb","G","A","E"]);
const SHARP_KEYS = new Set(["D","E","G","A","B"]);
const QUALITY = {"": [0,4,7],m:[0,3,7],"7":[0,4,7,10],maj7:[0,4,7,11],m7:[0,3,7,10],m7b5:[0,3,6,10],dim7:[0,3,6,9]};
const SHOWN = {m:"-",maj7:"M7",m7:"-7",m7b5:"-7♭5",dim7:"°7"};
const JOURNEYS = {
  home:{base:"Db",title:"Home · Extended turnaround",
    chords:"Dbmaj7 Bbm7 Eb7 Ab7 Dbmaj7 F7 Bbm7 Eb7 Ab7 Dbmaj7 Gbmaj7 Gbm7 Dbmaj7 Bb7 Eb7 Ab7 Dbmaj7",
    phrases:[[4,"Opening turnaround","I–vi–II7–V7. The secondary dominant leads to V."],[4,"Secondary dominants","F7 points toward B♭ minor; another dominant chain follows."],[2,"Return home","V7 resolves to the home tonic."],[3,"Borrowed minor iv","IV major changes to minor iv before returning home."],[4,"Dominant chain","B♭7–E♭7–A♭7–D♭M7: descending-fifths motion."]]},
  standards:{base:"Bb",title:"Standards · Circle changes",
    chords:"Bbmaj7 Gm7 Cm7 F7 Bbmaj7 D7 Gm7 C7 Fm7 Bb7 Ebmaj7 Ebm7 Dm7 G7 Cm7 F7 Bbmaj7",
    phrases:[[4,"Standard turnaround","I–vi–ii–V in the selected key."],[4,"Secondary dominants","D7 points toward G minor; C7 continues the dominant motion."],[3,"Temporary IV tonic","ii–V–I in E♭, the IV key of B♭."],[3,"Borrowed minor iv","E♭ major becomes minor; then Dm7–G7."],[3,"Back home","ii–V–I resolves to the tonic."]]},
  minor:{base:"F",title:"Minor · Jazz minor cadence",
    chords:"Fm7 Bbm7 Eb7 Abmaj7 Dbmaj7 Gm7b5 C7 Fm7 F7 Bbm7 Eb7 Abmaj7 Dbmaj7 Gm7b5 C7 Fm7",
    phrases:[[4,"Relative major","Move from F minor toward its relative major, A♭."],[4,"Minor cadence","Half-diminished iiø7–V7–i in F minor."],[4,"Secondary dominant","F7 points to B♭ minor, then returns toward A♭."],[4,"Minor cadence repeated","Listen for the leading tone resolving into F minor."]]},
  blues:{base:"C",title:"Blues · Dominant seventh",
    chords:"C7 F7 C7 C7 F7 F7 C7 A7 Dm7 G7 C7 G7 C7 F7 C7 A7 Dm7 G7 C7",
    phrases:[[4,"Opening blues","I7–IV7–I7–I7."],[4,"IV and VI7","VI7 is the secondary dominant of ii."],[4,"Turnaround","ii–V–I7–V7 in a blues setting."],[4,"Condensed return","Revisit I7 and IV7; lead to ii."],[3,"Finish","ii–V–I7 closes the blues."]]},
  chromatic:{base:"C",title:"Chromatic · Changing tonal centers",
    chords:"Dm7 G7 Cmaj7 Cm7 F7 Bbmaj7 Bbm7 Eb7 Abmaj7 Abm7 Db7 Gbmaj7 Gm7b5 C7 Fm7 Bb7 Ebmaj7",
    phrases:[[3,"C major","ii–V–I in C."],[3,"B♭ major","The previous major tonic becomes a minor ii."],[3,"A♭ major","Repeat the major-to-minor pivot."],[3,"G♭ major","Another descending ii–V–I."],[3,"F minor","Minor iiø–V–i."],[2,"E♭ major","Final V–I resolution."]]},
  tritone:{base:"C",title:"Tritone · Original and substitute",
    chords:"Dm7 G7 Cmaj7 Dm7 Db7 Cmaj7 Gm7 C7 Fmaj7 Gm7 Gb7 Fmaj7 Cm7 F7 Bbmaj7 Cm7 B7 Bbmaj7",
    phrases:[[3,"C · ordinary ii–V–I","Hear G7 resolve to C major."],[3,"C · tritone substitute","D♭7 replaces G7, sharing the same tritone."],[3,"F · ordinary ii–V–I","Hear C7 resolve to F major."],[3,"F · tritone substitute","G♭7 replaces C7; root falls a semitone."],[3,"B♭ · ordinary ii–V–I","Hear F7 resolve to B♭ major."],[3,"B♭ · tritone substitute","B7 replaces F7; root falls a semitone."]]}
};
const $ = id => document.getElementById(id);
const state = {journey:"standards",key:"Bb",index:0,pass:1,running:false,loop:true,notation:"both",octaves:false,
 midi:null,input:null,held:new Set(),lastVoicing:null,lastAttack:0,pending:null,audio:null,voices:[]};
const split = chord => {
  const match=/^([A-G](?:#|b)?)(maj7|m7b5|dim7|m7|m|7)?$/.exec(chord);
  if(!match) throw new Error("Unsupported chord: "+chord);
  return {root:match[1],quality:match[2]||""};
};
const transpose = chord => {
  const {root,quality}=split(chord), j=JOURNEYS[state.journey];
  const scale=SHARP_KEYS.has(state.key)?SHARPS:FLATS;
  return scale[(PC[root]+PC[state.key]-PC[j.base]+24)%12]+quality;
};
const sequence = () => JOURNEYS[state.journey].chords.split(" ").map(transpose);
const displayChord = chord => {const {root,quality}=split(chord);return root.replace("b","♭").replace("#","♯")+(SHOWN[quality]??quality);};
const pitches = chord => {const {root,quality}=split(chord);return QUALITY[quality].map(x=>(PC[root]+x)%12).sort((a,b)=>a-b);};
const sameSet = (a,b) => a.length===b.length && a.every((n,i)=>n===b[i]);
const heldPitches = () => [...new Set([...state.held].map(n=>n%12))].sort((a,b)=>a-b);
const noteName = n => (SHARP_KEYS.has(state.key)?SHARPS:FLATS)[n%12].replace("b","♭").replace("#","♯");
const names = values => "["+values.map(n=>noteName(n)+(state.octaves?String(Math.floor(n/12)-1):"")).join(" ")+"]";
function bestVoicing(chord, prev) {
  const pcs=pitches(chord), count=pcs.length;
  // Fit a close-position voicing in different inversions near the previous hand.
  const center=prev?.length ? prev.reduce((a,b)=>a+b,0)/prev.length : 60;
  let winner=[],score=Infinity;
  for (let bass=43;bass<=76;bass++) {
    if (!pcs.includes(bass%12)) continue;
    const candidate=[bass];let n=bass;
    for(let i=1;i<count;i++){
      do {n++} while(!pcs.includes(n%12)||candidate.some(x=>x%12===n%12));
      candidate.push(n);
    }
    const movement=prev?.length===count ? candidate.reduce((sum,n,i)=>sum+Math.abs(n-prev[i]),0) : Math.abs(candidate.reduce((a,b)=>a+b,0)/count-center)*count;
    const cost=movement+(candidate.at(-1)-candidate[0])*.15;
    if(cost<score){score=cost;winner=candidate;}
  }
  return winner;
}
function identify(notes) {
  const pcs=[...new Set(notes.map(n=>n%12))].sort((a,b)=>a-b);
  if(pcs.length<3)return "?";
  const choices=[];
  for(let root=0;root<12;root++) for(const [quality,intervals] of Object.entries(QUALITY)){
    const candidate=intervals.map(n=>(root+n)%12).sort((a,b)=>a-b);
    if(sameSet(pcs,candidate)) choices.push({root,quality});
  }
  if(!choices.length)return "?";
  const expected=sequence()[state.index], {root:targetRoot,quality:targetQuality}=split(expected);
  choices.sort((a,b)=>Number(b.root===PC[targetRoot]&&b.quality===targetQuality)-Number(a.root===PC[targetRoot]&&a.quality===targetQuality));
  const choice=choices[0],root=(SHARP_KEYS.has(state.key)?SHARPS:FLATS)[choice.root];
  return displayChord(root+choice.quality);
}
function displayNumeral(roman) {
  return roman.replace(/maj7/g,"M7").replace(/(?<![A-Za-z])([iv]+)7/g,"$1-7");
}
function numeralRows() {
  const j=state.journey;
  const originals={
    home:"IM7 vi-7 II7 V7 IM7 V7/vi vi-7 II7 V7 IM7 IVM7 iv-7 IM7 V7/ii II7 V7 IM7",
    standards:"IM7 vi-7 ii-7 V7 IM7 V7/vi vi-7 V7/ii ii-7/IV V7/IV IVM7 iv-7 iii-7 V7/ii ii-7 V7 IM7",
    minor:"i-7 iv-7 V7/III IIIM7 VIM7 iiø7 V7 i-7 V7/iv iv-7 V7/III IIIM7 VIM7 iiø7 V7 i-7",
    blues:"I7 IV7 I7 I7 IV7 IV7 I7 V7/ii ii-7 V7 I7 V7 I7 IV7 I7 V7/ii ii-7 V7 I7",
    chromatic:"ii-7 V7 IM7 ii-7/♭VII V7/♭VII ♭VIIM7 ii-7/♭VI V7/♭VI ♭VIM7 ii-7/♭V V7/♭V ♭VM7 iiø7/iv V7/iv iv-7 V7/♭III ♭IIIM7",
    tritone:"ii-7 V7 IM7 ii-7 ♭II7 IM7 ii-7/IV V7/IV IVM7 ii-7/IV subV7/IV IVM7 ii-7/♭VII V7/♭VII ♭VIIM7 ii-7/♭VII subV7/♭VII ♭VIIM7"
  };
  return originals[j].split(" ");
}
function render() {
  const j=JOURNEYS[state.journey], chords=sequence(),nums=numeralRows();
  $("journey-title").textContent=j.title+" · "+state.key+(state.journey==="minor"?" minor":"");
  $("position").textContent=(state.index+1)+" / "+chords.length;
  $("pass").textContent="Pass "+state.pass;
  const host=$("phrases");host.replaceChildren();
  let start=0;
  for(const [count,label,description] of j.phrases){
    const box=document.createElement("div");box.className="phrase"+(state.index>=start&&state.index<start+count?" current":"");
    const left=document.createElement("div"),heading=document.createElement("div");
    heading.className="phrase-label";heading.textContent=label;left.append(heading);
    const cells=document.createElement("div");cells.className="chords";
    for(let i=start;i<start+count;i++){
      const cell=document.createElement("div");cell.className="chord"+(i===state.index?" active":"");
      if(state.notation!=="numbers"){const c=document.createElement("span");c.textContent=displayChord(chords[i]);cell.append(c);}
      if(state.notation!=="names"){const n=document.createElement("span");n.className="roman";n.textContent=nums[i];cell.append(n);}
      cells.append(cell);
    }
    left.append(cells);const info=document.createElement("div");info.className="explanation";info.textContent=description;box.append(left,info);host.append(box);
    start+=count;
  }
  const expected=chords[state.index],guess=[...state.held].sort((a,b)=>a-b);
  $("expected-name").textContent=displayChord(expected);
  $("expected-notes").textContent=names(bestVoicing(expected,state.lastVoicing));
  $("played-name").textContent=guess.length?identify(guess):"—";
  $("played-notes").textContent=names(guess);
  $("start").textContent=state.running?"Pause":"Start / Hear chord";
}
function speak(chord) {
  if(!("speechSynthesis" in window)){setStatus("Speech synthesis unavailable; visual prompts still work.");return;}
  const {root,quality}=split(chord);
  const letter=root[0]==="A"?"ay":root[0];
  const accidental=root.slice(1)==="b"?" flat":root.slice(1)==="#"?" sharp":"";
  const qualitySpeech={"":" major",m:" minor","7":" seven",maj7:" major seven",m7:" minor seven",m7b5:" half diminished seven",dim7:" diminished seven"}[quality];
  const utterance=new SpeechSynthesisUtterance(letter+accidental+qualitySpeech);
  const selected=state.voices.find(v=>v.voiceURI===$("voice").value);
  if(selected)utterance.voice=selected;
  utterance.rate=.92;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}
function beep() {
  try {
    state.audio??=new (window.AudioContext||window.webkitAudioContext)();
    if(state.audio.state==="suspended")state.audio.resume();
    const t=state.audio.currentTime;
    for(const [freq,offset] of [[660,0],[880,.105]]) {
      const osc=state.audio.createOscillator(),gain=state.audio.createGain();
      osc.type="sine";osc.frequency.value=freq;gain.gain.setValueAtTime(.0001,t+offset);
      gain.gain.exponentialRampToValueAtTime(.055,t+offset+.012);
      gain.gain.exponentialRampToValueAtTime(.0001,t+offset+.095);
      osc.connect(gain).connect(state.audio.destination);osc.start(t+offset);osc.stop(t+offset+.1);
    }
  }catch { /* audible success feedback is optional */ }
}
function setStatus(message){$("feedback-status").textContent=message;}
function announce(){if(state.running)speak(sequence()[state.index]);}
function accepted() {
  state.lastVoicing=[...state.held].sort((a,b)=>a-b);
  clearTimeout(state.pending);state.pending=null;
  beep();
  state.index++;
  if(state.index>=sequence().length){
    if(!state.loop){state.index=sequence().length-1;state.running=false;setStatus("Journey complete.");render();return;}
    state.index=0;state.pass++;
  }
  setStatus("Correct. Next chord.");
  render();announce();
}
function evaluate() {
  if(!state.running)return;
  const expected=pitches(sequence()[state.index]),actual=heldPitches();
  if(sameSet(actual,expected))accepted();
  else {setStatus(actual.length?"Keep trying · your notes are shown below.":"Play the announced chord.");render();}
}
function midiMessage(e) {
  const [status,note,velocity=0]=e.data,cmd=status&0xf0;
  if(cmd===0x90&&velocity>0){state.held.add(note);clearTimeout(state.pending);state.pending=setTimeout(evaluate,115);}
  else if(cmd===0x80||(cmd===0x90&&velocity===0)){state.held.delete(note);clearTimeout(state.pending);state.pending=setTimeout(evaluate,115);}
  if(cmd===0x90||cmd===0x80)render();
}
async function scanMidi(){
  if(!navigator.requestMIDIAccess){$("midi-status").textContent="Web MIDI unavailable. Use current Chrome or Edge with HTTPS.";return;}
  try{
    state.midi??=await navigator.requestMIDIAccess();
    state.midi.onstatechange=()=>populateMidi();
    populateMidi();
  }catch(err){$("midi-status").textContent="MIDI access not granted: "+err.message;}
}
function populateMidi(){
  const old=state.input?.id,select=$("midi");
  select.replaceChildren(new Option("Choose keyboard…",""));
  for(const input of state.midi.inputs.values())select.add(new Option(input.name||input.id,input.id));
  const available=[...state.midi.inputs.values()];
  if(available.some(i=>i.id===old)){select.value=old;connectMidi(old);}
  else if(available.length===1){select.value=available[0].id;connectMidi(available[0].id);}
  else {$("midi-status").textContent=available.length?available.length+" MIDI devices available. Choose one.":"No MIDI inputs found. Connect a keyboard and rescan.";state.input=null;}
}
function connectMidi(id){
  if(state.input)state.input.onmidimessage=null;
  state.input=id?state.midi?.inputs.get(id):null;state.held.clear();render();
  if(state.input){state.input.onmidimessage=midiMessage;$("midi-status").textContent="Connected: "+state.input.name;}
  else $("midi-status").textContent="Select a MIDI input.";
}
function reset(){state.index=0;state.pass=1;state.lastVoicing=null;state.held.clear();clearTimeout(state.pending);render();announce();}
function changeJourney(){state.journey=$("journey").value;state.key=JOURNEYS[state.journey].base;$("key").value=state.key;reset();}
function voices(){
  if(!("speechSynthesis" in window))return;
  state.voices=window.speechSynthesis.getVoices();
  const chosen=$("voice").value;$("voice").replaceChildren(new Option("System default",""));
  state.voices.forEach(v=>$("voice").add(new Option(v.name+" ("+v.lang+")",v.voiceURI)));
  if(state.voices.some(v=>v.voiceURI===chosen))$("voice").value=chosen;
}
function init(){
  Object.entries(JOURNEYS).forEach(([id,j])=>$("journey").add(new Option(j.title,id)));
  KEYS.forEach(k=>$("key").add(new Option((PRIORITY.has(k)?"★ ":"   ")+k.replace("b","♭"),k)));
  $("journey").value=state.journey;$("key").value=state.key;
  $("journey").onchange=changeJourney;
  $("key").onchange=()=>{state.key=$("key").value;reset();};
  $("notation").onchange=()=>{state.notation=$("notation").value;render();};
  $("octaves").onchange=()=>{state.octaves=$("octaves").checked;render();};
  $("loop").onchange=()=>state.loop=$("loop").checked;
  $("scan").onclick=scanMidi;
  $("midi").onchange=()=>connectMidi($("midi").value);
  $("start").onclick=()=>{state.running=!state.running;if(state.running){state.audio??=window.AudioContext?new AudioContext():null;setStatus("Listening. Play the announced chord.");announce();}else{window.speechSynthesis?.cancel();setStatus("Paused.");}render();};
  $("repeat").onclick=()=>speak(sequence()[state.index]);
  $("restart").onclick=reset;
  document.addEventListener("keydown",e=>{if(e.code==="Space"&&!["SELECT","BUTTON","INPUT"].includes(document.activeElement?.tagName)){e.preventDefault();speak(sequence()[state.index]);}});
  voices();if("speechSynthesis" in window)window.speechSynthesis.onvoiceschanged=voices;
  render();
  // User gesture on Connect is required by Web MIDI permission policies.
}
init();
