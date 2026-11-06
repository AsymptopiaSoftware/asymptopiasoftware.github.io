// Minimal SVG DOM fixture for adapter tests and deterministic evidence generation.
export class SVGNode {
  constructor(tag){this.tag=tag;this.attrs={};this.children=[];this.textContent='';}
  setAttribute(k,v){this.attrs[k]=String(v);}
  getAttribute(k){return this.attrs[k] ?? null;}
  append(el){this.children.push(el);}
  replaceChildren(...children){this.children=children;}
  serialize(){const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');return `<${this.tag}${Object.entries(this.attrs).map(([k,v])=>` ${k}="${esc(v)}"`).join('')}>${esc(this.textContent)}${this.children.map(c=>c.serialize()).join('')}</${this.tag}>`;}
}
export function installDOM(){globalThis.document={createElementNS:(_ns,tag)=>new SVGNode(tag)};}
