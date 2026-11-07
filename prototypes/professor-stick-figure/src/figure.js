import { configureBody, bodyLandmarks, bodyToWorld, attachedArm } from './body.js';
import { compileTimeline } from '../../drawing-arm/src/timeline.js';
import { SVGArmRenderer } from '../../drawing-arm/src/svg-renderer.js';
import { planWriting, translatedBody } from './locomotion.js';
import { limbOutline } from './curves.js';
import { teachingPlan, sampleTeaching } from './teaching.js';
import { walkingLandmarks } from './gait.js';
const SVG_NS='http://www.w3.org/2000/svg';
function node(tag,attrs,parent){const el=document.createElementNS(SVG_NS,tag);for(const [k,v]of Object.entries(attrs))el.setAttribute(k,v);parent.append(el);return el;}
export function drawBody(group,config={}) {
  const body=configureBody(config),p=bodyLandmarks(body),[hx,hy]=p.head,h=body.headSize;
  group.replaceChildren();group.setAttribute('transform',`translate(${body.origin}) scale(${body.scale})`);group.setAttribute('data-view','rear-three-quarter-facing-right');
  const limb=(name,joints,radii,fill='#b9c4b7')=>node('path',{'data-part':name,d:limbOutline(joints,radii),fill},group);
  limb('left-arm',[p.leftShoulder,p.leftElbow,p.leftHand],[7,5.5,3.5],'#7e9585');
  limb('left-leg',[p.leftHip,p.leftKnee,p.leftAnkle],[9,6.5,4.5]);
  limb('right-leg',[p.rightHip,p.rightKnee,p.rightAnkle],[9,6.5,4.5]);
  limb('hips',[p.leftHip,p.hips,p.rightHip],[8,9,8]);
  limb('left-foot',[p.leftFoot,p.leftToe],[5,3]);limb('right-foot',[p.rightFoot,p.rightToe],[5,3]);
  limb('torso',[p.neck,p.torsoTop,p.hips],[5,13,9]);
  limb('shoulders',[p.leftShoulder,p.torsoTop,p.rightShoulder],[6,10,6]);
  const H=(x,y)=>`${hx+x*h},${hy+y*h}`;
  node('path',{'data-part':'head',d:`M${H(-9,28)} C${H(-32,20)} ${H(-33,-18)} ${H(-10,-28)} C${H(8,-37)} ${H(25,-20)} ${H(25,-7)} L${H(37,1)} L${H(26,5)} C${H(25,20)} ${H(12,28)} ${H(-9,28)}Z`,fill:'#b9c4b7',stroke:'#d5ddcf','stroke-width':2},group);
  const skeleton=node('g',{'data-part':'body-skeleton',visibility:'hidden'},group);
  for(const points of [[p.leftShoulder,p.leftElbow,p.leftHand],[p.leftFoot,p.leftKnee,p.leftHip,p.rightHip,p.rightKnee,p.rightFoot],[p.hips,p.torsoTop,p.neck],[p.leftShoulder,p.torsoTop,p.rightShoulder]])node('path',{d:'M'+points.join('L'),fill:'none',stroke:'#20362a','stroke-width':1.2},skeleton);
  return p;
}
export class ProfessorFigure {
  constructor(group,json,{body={},rig={}}={}) {
    this.group=group;this.debug=false;this.time=0;
    // Chalk stays in world space behind the translating body and joint-driven arm.
    this.chalkGroup=node('g',{'data-layer':'chalk'},group);
    this.bodyGroup=node('g',{'data-layer':'body'},group);
    this.armGroup=node('g',{'data-layer':'drawing-arm'},group);
    this.armSkin=node('path',{'data-part':'right-arm',fill:'#d6ba76'},this.armGroup);
    this.pen=node('line',{stroke:'#fff2bf','stroke-width':3,'stroke-linecap':'round'},this.armGroup);
    this.armSkeleton=node('path',{fill:'none',stroke:'#304e38','stroke-width':1.2},this.armGroup);
    this.debugGroup=node('g',{'data-layer':'anchors','pointer-events':'none'},group);
    this.body=configureBody(body);this.rig=structuredClone(rig);this.arm=attachedArm(this.body,this.rig);
    this.setTimeline(json);
  }
  installPlan(plan) {
    this.chalkGroup.replaceChildren();this.plan=plan;this.duration=plan.duration;
    this.writers=plan.writes.map(p=>{
      const group=node('g',{},this.chalkGroup);
      const json={version:1,strokes:[{at:0,duration:p.duration,points:p.stroke.points,pen:p.stroke.pen}]};
      return {phase:p,renderer:new SVGArmRenderer(group,compileTimeline(json),p.arm)};
    });
    const fallbackJSON={version:1,board:this.raw.board,strokes:[],fallbacks:(this.raw.fallbacks??[]).map(f=>({...f,at:plan.sourceToWall(f.at)}))};
    this.fallback=new SVGArmRenderer(node('g',{},this.chalkGroup),compileTimeline(fallbackJSON),attachedArm(plan.body,plan.rig));
  }
  setConfiguration(body=this.body,rig=this.rig) {
    const nextBody=configureBody(body),nextRig=structuredClone(rig),plan=teachingPlan(planWriting(this.timeline,nextBody,nextRig),this.raw.mathSteps);
    this.body=nextBody;this.rig=nextRig;drawBody(this.bodyGroup,this.body);this.installPlan(plan);this.render(Math.min(this.time,this.duration));
  }
  setTimeline(json) {
    const timeline=compileTimeline(json),plan=teachingPlan(planWriting(timeline,this.body,this.rig),json.mathSteps);
    this.raw=structuredClone(json);this.timeline=timeline;drawBody(this.bodyGroup,this.body);this.installPlan(plan);this.render(0);
  }
  setDebug(visible){this.debug=!!visible;this.render(this.time);}
  render(time) {
    const state=sampleTeaching(this.plan,time);this.time=time;this.currentBody=translatedBody(this.body,state.offset);this.currentBody.origin[1]+=state.bodyLift??0;this.arm=attachedArm(this.currentBody,this.rig);
    this.bodyGroup.setAttribute('transform',`translate(${this.currentBody.origin}) scale(${this.body.scale})`);
    this.localPose=walkingLandmarks(this.body,state);
    const part=name=>[...this.bodyGroup.children].find(n=>n.getAttribute('data-part')===name),p=this.localPose;
    for(const side of ['left','right']) {
      part(side+'-leg').setAttribute('d',limbOutline([p[side+'Hip'],p[side+'Knee'],p[side+'Ankle']],[9,6.5,4.5]));
      part(side+'-foot').setAttribute('d',limbOutline([p[side+'Foot'],p[side+'Toe']],[5,3]));
    }

    const skeleton=[...this.bodyGroup.children].find(n=>n.getAttribute('data-part')==='body-skeleton');
    skeleton.children[1].setAttribute('d','M'+[p.leftFoot,p.leftKnee,p.leftHip,p.rightHip,p.rightKnee,p.rightFoot].join('L'));
    skeleton.setAttribute('visibility',this.debug?'visible':'hidden');
    for(const {phase,renderer}of this.writers){renderer.render(Math.max(0,Math.min(phase.duration,time-phase.at)));for(const el of [renderer.links,renderer.pen,renderer.target,...renderer.joints])el.setAttribute('visibility','hidden');}
    this.fallback.render(time);
    const pose=state.pose;
    this.armSkin.setAttribute('d',limbOutline([pose.shoulder,pose.elbow,pose.wrist],[8*this.body.scale,6*this.body.scale,3.5*this.body.scale]));
    for(const [k,v]of Object.entries({x1:pose.wrist[0],y1:pose.wrist[1],x2:pose.tip[0],y2:pose.tip[1]}))this.pen.setAttribute(k,v);
    this.pen.setAttribute('opacity',state.chalkDown?'1':'.4');
    this.armSkeleton.setAttribute('d',`M${pose.shoulder}L${pose.elbow}L${pose.wrist}`);this.armSkeleton.setAttribute('visibility',this.debug?'visible':'hidden');
    this.debugGroup.replaceChildren();this.debugGroup.setAttribute('visibility',this.debug?'visible':'hidden');
    for(const [label,p]of [['origin',this.currentBody.origin],['right shoulder',pose.shoulder]]){
      node('circle',{cx:p[0],cy:p[1],r:7,fill:'none',stroke:'#e6c16e'},this.debugGroup);
      const text=node('text',{x:p[0]+12,y:p[1]+4,fill:'#e6c16e','font-family':'monospace','font-size':10},this.debugGroup);text.textContent=label;
    }
    return state;
  }
  getAnchors(){return Object.fromEntries(Object.entries(this.localPose??bodyLandmarks(this.currentBody??this.body)).map(([k,p])=>[k,bodyToWorld(p,this.currentBody??this.body)]));}
  destroy(){this.group.replaceChildren();}
}
