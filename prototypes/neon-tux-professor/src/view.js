import {configureArm,compileTimeline,SVGArmRenderer} from '../vendor/drawing-arm/src/index.js';
import {armConfig} from './character.js';
const VIEW_NS='http://www.w3.org/2000/svg';
export function createView(svg,scene,json,art) {
  svg.innerHTML=`<defs><filter id="glow"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter><clipPath id="bodyClip"><rect width="100" height="181"/></clipPath></defs>
  <rect width="1000" height="620" fill="#080f1e"/>
  <path d="M0 555H1000" stroke="#294158"/><ellipse cx="450" cy="570" rx="360" ry="20" fill="#050b14"/>
  <path d="M570 400L520 568M800 400L860 568" stroke="#52616a" stroke-width="9"/>
  <rect x="490" y="150" width="410" height="285" rx="8" fill="#182f30" stroke="#778580" stroke-width="6"/>
  <text x="520" y="195" fill="#9bb6aa" font-family="DejaVu Sans, sans-serif" font-size="14" letter-spacing="3">TODAY’S LITTLE DISCOVERY</text>
  <path d="M520 215H865" stroke="#3a5650"/>
  <text x="520" y="260" fill="#dce8d8" font-size="23" font-family="DejaVu Serif, serif">Two and three make…</text>
  <path d="M480 438H912" stroke="#9ba19a" stroke-width="9"/>
  <g id="ink"></g><g id="actor"><g id="art">${art}</g><path id="feet" fill="none" stroke="#85bcff" stroke-width="3" filter="url(#glow)"/></g><g id="writing"></g>`;
  const ink=svg.querySelector('#ink'), g=svg.querySelector('#writing');
  const renderer=new SVGArmRenderer(ink,compileTimeline(json),configureArm(armConfig(scene)),{color:'#69a5ff'});
  // Existing engine owns cumulative reachable chalk geometry; character view owns limb artwork.
  for(const el of [renderer.links,renderer.pen,renderer.target,...renderer.joints])g.append(el);
  renderer.links.setAttribute('stroke-width','12');renderer.links.setAttribute('filter','url(#glow)');
  renderer.joints.forEach(el=>el.setAttribute('visibility','hidden'));
  const highlight=document.createElementNS(VIEW_NS,'path');highlight.setAttribute('fill','none');highlight.setAttribute('stroke','#d6efff');highlight.setAttribute('stroke-width','3');highlight.setAttribute('stroke-linejoin','round');highlight.setAttribute('stroke-linecap','round');g.append(highlight);
  const actor=svg.querySelector('#actor'), artwork=svg.querySelector('#art');
  const imported=artwork.querySelector('svg'); imported.setAttribute('width','148');imported.setAttribute('height','181');
  return {renderer,render(frame){
    const {motion:m}=frame, c=scene.character, writing=m.phase==='write';
    actor.setAttribute('transform',`translate(${m.x} ${m.y}) scale(${c.scale})`);
    artwork.setAttribute('transform',`translate(74 0) scale(${m.facing*(1-.18*m.yaw)} 1) translate(-74 0)`);
    imported.setAttribute('clip-path',writing?'url(#bodyClip)':'none');
    svg.querySelector('#feet').setAttribute('d',`M30 141l-10 ${10+m.step/3}h30 M85 139l-5 ${10-m.step/3}h28`);
    renderer.render(Math.max(-1,frame.writingTime));
    highlight.setAttribute('d',renderer.links.getAttribute('d')||'');
    renderer.joints.forEach(el=>el.setAttribute('visibility','hidden'));
    g.setAttribute('display',writing?'inline':'none');
    const incomplete=frame.arm.pose&&!frame.arm.pose.reachable&&frame.arm.penDown;
    return incomplete;
  }};
}
