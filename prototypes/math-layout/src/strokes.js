// SPDX-License-Identifier: GPL-2.0-or-later
/** Geometry placement is separate from layout and separate from timing/rendering.
 * The consumer supplies its own normalized [0..1] reusable vector glyph set. */
export function positionStrokes(layout,glyphs){
 if(!layout||!Array.isArray(layout.items)||!glyphs)throw new TypeError('Layout items and a vector glyph set are required');
 const strokes=[];
 for(const [itemIndex,item]of layout.items.entries()){
  if(![item.x,item.y,item.width,item.height].every(Number.isFinite)||item.width<0||item.height<0)throw new RangeError('Invalid positioned math bounds');
  if(item.kind==='fraction-bar')strokes.push({points:item.points.map(p=>[...p]),pen:true,kind:'fraction-bar',role:item.role,row:item.row,item:itemIndex});
  else if(item.kind==='glyph'){
   const paths=glyphs[item.text];if(!paths)throw new RangeError(`Missing vector glyph: ${item.text}`);
   for(const path of paths)if(!Array.isArray(path)||path.length<2||path.some(p=>!Array.isArray(p)||p.length!==2||!p.every(Number.isFinite)))throw new RangeError(`Invalid vector glyph: ${item.text}`);
   for(const [stroke,path]of paths.entries())strokes.push({points:path.map(p=>[item.x+p[0]*item.width,item.y+p[1]*item.height]),pen:true,kind:'glyph',symbol:item.text,role:item.role,row:item.row,item:itemIndex,stroke});
  }else throw new TypeError('Unsupported positioned math item');
 }
 return {version:1,width:layout.width,height:layout.height,strokes};
}
