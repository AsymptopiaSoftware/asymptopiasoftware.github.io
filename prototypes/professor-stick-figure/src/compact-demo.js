import {solveEquation} from '../../math-problems/src/solver.js';
import {solutionToTimeline,validateMathTimeline} from './math-timeline.js';
import {ProfessorFigure} from './figure.js';
import {compactScene} from './compact-scene.js';
import {PresentationSpeech} from './speech.js';
import {presentationAdvance} from './presentation-plan.js';

// The browser speech queue is global. Only one opt-in audible embed owns it at a time.
const compactSpeechOwners=new WeakMap();
/** Mount a self-contained scene. All nodes, clocks and observers belong to this instance. */
export function mountProfessorDemo(container,{problem='x/5-4/4=2/5',autoplay=true,loop=true,muted=true,onCycle=null}={}) {
  if(!container?.ownerDocument||typeof container.append!=='function')throw new TypeError('Expected a DOM container');
  const doc=container.ownerDocument,host=doc.defaultView,ns='http://www.w3.org/2000/svg';
  if(!host)throw new TypeError('Container must belong to a browser document');
  const raw=solutionToTimeline(solveEquation(problem));
  raw.presentationActions=raw.mathSteps.map((step,index)=>({type:'talk-and-gesture',
    text:raw.mathSteps[Math.min(index+1,raw.mathSteps.length-1)].operation.explanation,
    gesture:'present',indicatingArm:'right'}));
  validateMathTimeline(raw);
  const wrapper=doc.createElement('div');wrapper.setAttribute('data-professor-demo','');
  Object.assign(wrapper.style,{width:'100%',height:'100%',overflow:'hidden',background:'#1c2c27',lineHeight:'0'});
  const svg=doc.createElementNS(ns,'svg');svg.setAttribute('role','img');svg.setAttribute('aria-label',`Professor demonstrates ${problem}`);svg.setAttribute('preserveAspectRatio','xMidYMid meet');
  Object.assign(svg.style,{display:'block',width:'100%',height:'100%'});wrapper.append(svg);
  const make=(tag,attrs,parent=svg)=>{const el=doc.createElementNS(ns,tag);for(const [k,v]of Object.entries(attrs))el.setAttribute(k,v);parent.append(el);return el;};
  const backdrop=make('g',{'data-layer':'board'}),group=make('g',{'data-layer':'professor'});
  const figure=new ProfessorFigure(group,raw),scene=compactScene(figure.plan,figure.timeline),b=scene.board,f=scene.frame;
  if(figure.plan.blocked.length){figure.destroy();throw new RangeError('Problem exceeds the Professor writing workspace');}
  svg.setAttribute('viewBox',`${f.x} ${f.y} ${f.width} ${f.height}`);
  wrapper.style.aspectRatio=`${f.width} / ${f.height}`;
  make('rect',{x:b.x,y:b.y,width:b.width,height:b.height,rx:5,fill:'#173e30',stroke:'#756447','stroke-width':7},backdrop);
  make('line',{x1:b.x-3,y1:b.y+b.height+5,x2:b.x+b.width+5,y2:b.y+b.height+5,stroke:'#8b7856','stroke-width':5,'stroke-linecap':'round'},backdrop);
  make('line',{x1:f.x+4,y1:scene.floor,x2:f.x+f.width-4,y2:scene.floor,stroke:'#66776c','stroke-width':1},backdrop);
  container.append(wrapper);
  const media=host.matchMedia?.('(prefers-reduced-motion: reduce)');
  let reduced=!!media?.matches,desired=!!autoplay,playing=false,destroyed=false,time=reduced?figure.duration:0,last=null,raf=null,loops=0,speech=null;
  const render=()=>figure.render(Math.min(time,figure.duration));
  const stopFrame=()=>{if(raf!==null)host.cancelAnimationFrame(raf);raf=null;last=null;};
  const releaseSpeech=()=>{speech?.destroy();speech=null;if(compactSpeechOwners.get(host)===api)compactSpeechOwners.delete(host);};
  const syncSpeech=state=>{
    if(!muted&&!reduced&&playing){
      const previous=compactSpeechOwners.get(host);if(previous&&previous!==api)return;
      compactSpeechOwners.set(host,api);speech??=new PresentationSpeech(host);
    }
    const p=state.presentation;
    speech?.sync(p?.stage==='talk'?{id:`${loops}:${p.id}`,text:p.action.text}:null,playing);
  };
  const tick=stamp=>{
    raf=null;if(!playing||destroyed)return;
    const delta=last===null?0:Math.max(0,stamp-last);last=stamp;
    let next=time+delta;
    if(speech)next=presentationAdvance(figure.plan,time,next,speech.busy);
    const cycle=figure.duration+2000;
    if(loop&&next>=cycle){
      loops+=Math.floor(next/cycle);next%=cycle;speech?.cancel();
      // The host can replace the completed lesson at the cycle boundary.
      // It may destroy this instance, so stop before touching its figure again.
      onCycle?.(loops);
      if(destroyed)return;
    }
    time=Math.min(next,loop?cycle:figure.duration);syncSpeech(render());
    if(!loop&&time>=figure.duration){playing=false;last=null;return;}
    raf=host.requestAnimationFrame(tick);
  };
  const start=()=>{if(destroyed||reduced||!desired)return;playing=true;last=null;if(raf===null)raf=host.requestAnimationFrame(tick);};
  const resize=()=>{
    const width=container.clientWidth||f.width,height=container.clientHeight||width*f.height/f.width;
    svg.setAttribute('width',width);svg.setAttribute('height',height);
    // Also works in a width-only div; do not change the host's styles or children.
    // The wrapper's aspect-ratio supplies height when its parent's height is auto.
  };
  const observer=host.ResizeObserver?new host.ResizeObserver(resize):null;
  const motionChanged=()=>{reduced=!!media.matches;stopFrame();playing=false;releaseSpeech();time=reduced?figure.duration:0;render();start();};
  const api={
    play(){if(destroyed)return;desired=true;start();},
    pause(){if(destroyed)return;desired=false;playing=false;stopFrame();syncSpeech(render());},
    reset(){if(destroyed)return;stopFrame();playing=false;desired=false;loops=0;time=reduced?figure.duration:0;releaseSpeech();render();},
    seek(milliseconds){if(destroyed)return;if(!Number.isFinite(milliseconds))throw new TypeError('Seek time must be finite');time=reduced?figure.duration:Math.max(0,Math.min(figure.duration,milliseconds));last=null;releaseSpeech();render();},
    getState(){return {time:Math.min(time,figure.duration),duration:figure.duration,playing,reducedMotion:reduced,loops,destroyed};},
    silence(){releaseSpeech();},
    destroy(){if(destroyed)return;destroyed=true;desired=false;playing=false;stopFrame();releaseSpeech();observer?.disconnect();if(!observer)host.removeEventListener('resize',resize);media?.removeEventListener?.('change',motionChanged);figure.destroy();wrapper.remove();}
  };
  media?.addEventListener?.('change',motionChanged);observer?.observe(container);if(!observer)host.addEventListener('resize',resize);
  resize();render();start();return api;
}
