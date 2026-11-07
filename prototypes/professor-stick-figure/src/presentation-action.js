/** General-purpose presentation data. No lesson, mathematics, SVG or audio dependency. */
export const GESTURES = Object.freeze(['explain','emphasize','count','present','idle']);
export function presentationAction(input) {
  if(input?.type!=='talk-and-gesture'||typeof input.text!=='string'||!input.text.trim()||input.text.length>4000)
    throw new TypeError('A talk-and-gesture action needs nonempty text (up to 4000 characters)');
  const {gesture='explain',orientation='audience',count=1}=input;
  if(!GESTURES.includes(gesture)||orientation!=='audience'||!Number.isInteger(count)||count<1||count>20)
    throw new TypeError('Invalid presentation gesture, orientation or count');
  // A deterministic visual slot. Actual browser audio may hold its final instant.
  const duration=input.duration??Math.max(2400,input.text.trim().split(/\s+/u).length*440+1000);
  if(!Number.isFinite(duration)||duration<1000||duration>120000)throw new RangeError('Invalid presentation duration');
  return {type:'talk-and-gesture',text:input.text,gesture,orientation,count,duration};
}
/** Generic standalone action clip; no lesson plan is required by other consumers. */
export function compilePresentationAction(input,{at=0,id='presentation',turn=700,wait=1500}={}) {
  const action=presentationAction(input);
  if(![at,turn,wait].every(Number.isFinite)||at<0||turn<=0||wait<0)throw new RangeError('Invalid presentation clip timing');
  const talkAt=at+turn,talkEnd=talkAt+action.duration,gate=talkEnd,resume=gate+wait,end=resume+turn;
  return {id,action,at,talkAt,talkEnd,gate,resume,end};
}
export function samplePresentationAction(p,time) {
  if(!Number.isFinite(time))throw new RangeError('Presentation time must be finite');
  if(time<p.at||time>=p.end)return {presentation:null,orientation:'board',audience:0};
  const stage=time<p.talkAt?'turn-out':time<p.talkEnd?'talk':time<p.resume?'wait':'turn-in';
  const progress=stage==='turn-out'?(time-p.at)/(p.talkAt-p.at):stage==='turn-in'?1-(time-p.resume)/(p.end-p.resume):1;
  const audience=progress*progress*(3-2*progress);
  return {orientation:stage.startsWith('turn')?'transitioning':'audience',audience,
    presentation:{...p,stage,elapsed:Math.max(0,Math.min(p.action.duration,time-p.talkAt))}};
}
