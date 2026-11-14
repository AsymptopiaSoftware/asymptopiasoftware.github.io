import { boardToWorld, distance, solveIK } from './kinematics.js';
import { sampleArm } from './timeline.js';
const NS = 'http://www.w3.org/2000/svg';
function element(tag, attrs, parent) {
  const el = document.createElementNS(NS, tag);
  for (const [k,v] of Object.entries(attrs)) el.setAttribute(k,v);
  parent.append(el); return el;
}
/** Owns only the supplied group. No global DOM, character assets or clock. */
export class SVGArmRenderer {
  constructor(group, timeline, arm, { color = '#f4c976' } = {}) {
    this.group = group; this.timeline = timeline; this.arm = arm; this.color = color;
    this.chalk = element('path', { fill:'none', stroke:'#eef6e8', 'stroke-width':2.5, 'stroke-linecap':'round', 'stroke-linejoin':'round' },group);
    this.fallback = element('g', { fill:'#eef6e8', 'font-family':'Chalkboard, Chalkboard SE, cursive' }, group);
    for (const f of timeline.fallbacks ?? []) {
      const transform = timeline.board ?? {};
      const p = boardToWorld(f.position, transform);
      const el = element('text',{ x:p[0], y:p[1], 'font-size':f.size * (transform.scale ?? 1),
        transform:`rotate(${(transform.rotation ?? 0)*180/Math.PI} ${p[0]} ${p[1]})`, 'dominant-baseline':'hanging' },this.fallback);
      el.textContent = f.text;
    }
    this.links = element('path', { fill:'none', stroke:color, 'stroke-width':9, 'stroke-linecap':'round', 'stroke-linejoin':'round' }, group);
    this.joints = Array.from({length:3},()=>element('circle',{r:6, fill:'#172e2a',stroke:color,'stroke-width':2},group));
    this.pen = element('line', { stroke:'#fff9ce', 'stroke-width':4, 'stroke-linecap':'round' }, group);
    this.target = element('circle',{r:5,fill:'none',stroke:'#ff8878','stroke-width':1.5},group);
    this.setArm(arm);
  }
  setArm(arm) {
    this.arm = arm; this.segments = [];
    for (const s of this.timeline.strokes) {
      if (s.pen === false) continue;
      for (let i=1;i<s.points.length;i++) {
        const p = s.points[i-1], q = s.points[i], length = distance(p,q), count = Math.max(1, Math.ceil(length/2));
        for (let j=0;j<count;j++) {
          const from = p.map((v,k)=>v+(q[k]-v)*j/count), to = p.map((v,k)=>v+(q[k]-v)*(j+1)/count);
          const t0=s.at+s.duration*(s.length ? (s.lengths[i-1]+length*j/count)/s.length : 0);
          const t1=s.at+s.duration*(s.length ? (s.lengths[i-1]+length*(j+1)/count)/s.length : 1);
          const valid=[from,to,from.map((v,k)=>(v+to[k])/2)].every(pt=>solveIK(arm,pt).reachable);
          this.segments.push({from,to,t0,t1,valid});
        }
      }
    }
  }
  render(time) {
    const sample = sampleArm(this.timeline,time,this.arm); let d='';
    for (const s of this.segments) {
      if (s.t0 >= time) break;
      if (!s.valid) continue;
      const f=Math.min(1,(time-s.t0)/(s.t1-s.t0 || 1)), p=s.from.map((v,k)=>v+f*(s.to[k]-v));
      d+=`M${s.from}L${p}`;
    }
    this.chalk.setAttribute('d',d);
    [...this.fallback.children].forEach((el,i)=>el.setAttribute('visibility',time >= this.timeline.fallbacks[i].at ? 'visible':'hidden'));
    const pose=sample.pose;
    for (const el of [this.links,this.pen,this.target,...this.joints]) el.setAttribute('visibility',pose?'visible':'hidden');
    if (!pose) return sample;
    this.links.setAttribute('d',`M${pose.shoulder}L${pose.elbow}L${pose.wrist}`);
    [pose.shoulder,pose.elbow,pose.wrist].forEach((p,i)=>{this.joints[i].setAttribute('cx',p[0]);this.joints[i].setAttribute('cy',p[1]);});
    for (const [key,value] of Object.entries({x1:pose.wrist[0],y1:pose.wrist[1],x2:pose.tip[0],y2:pose.tip[1]})) this.pen.setAttribute(key,value);
    this.pen.setAttribute('opacity',sample.chalkDown ? 1 : .45);
    this.target.setAttribute('cx',sample.point[0]);this.target.setAttribute('cy',sample.point[1]);
    this.target.setAttribute('visibility',pose.reachable?'hidden':'visible');
    return sample;
  }
  destroy() { this.group.replaceChildren(); }
}
