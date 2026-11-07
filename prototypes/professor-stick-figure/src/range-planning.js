/** Geometry-only line/symbol inference. Source timeline/glyphs are never modified. */
function boundsOf(points) {
  return points.reduce((b,p)=>({minX:Math.min(b.minX,p[0]),maxX:Math.max(b.maxX,p[0]),minY:Math.min(b.minY,p[1]),maxY:Math.max(b.maxY,p[1])}),{minX:Infinity,maxX:-Infinity,minY:Infinity,maxY:-Infinity});
}
function unionBounds(a,b){return {minX:Math.min(a.minX,b.minX),maxX:Math.max(a.maxX,b.maxX),minY:Math.min(a.minY,b.minY),maxY:Math.max(a.maxY,b.maxY)};}
export function groupWritingStrokes(timeline) {
  const boxes=timeline.strokes.map(s=>boundsOf(s.points));
  const heights=boxes.map(b=>b.maxY-b.minY).filter(h=>h>1e-6).sort((a,b)=>a-b);
  const widths=boxes.map(b=>b.maxX-b.minX).filter(w=>w>1e-6).sort((a,b)=>a-b);
  const nominal=heights[Math.floor(heights.length/2)]??(widths[Math.floor(widths.length/2)]??24)/.62;
  const groups=[],byStroke=[];let line=-1,lineBounds=null,previous=null;
  for(const [i,stroke]of timeline.strokes.entries()) {
    const box=boxes[i];
    const newLine=!lineBounds||stroke.pen===false||previous?.pen===false||box.minY>lineBounds.maxY+.45*nominal||box.maxY<lineBounds.minY-.45*nominal;
    if(newLine){line++;lineBounds=box;}else lineBounds=unionBounds(lineBounds,box);
    const last=groups.at(-1),margin=.08*nominal;
    const sameSymbol=last&&last.line===line&&box.minX<=last.bounds.maxX+margin&&box.maxX>=last.bounds.minX-margin;
    if(sameSymbol){last.end=i;last.points.push(...stroke.points);last.bounds=unionBounds(last.bounds,box);}
    else groups.push({line,start:i,end:i,points:[...stroke.points],bounds:{...box}});
    byStroke[i]=groups.length-1;previous=stroke;
  }
  return {groups,byStroke,nominalHeight:nominal};
}
/** Plan against the whole remaining line, preferring natural symbol boundaries.
 * Greedy longest feasible prefixes minimize new stances for ordered groups.
 * Retain a free current prefix if that saves a move; on a tie pre-position once
 * for a longer run rather than introduce an avoidable extra standing position.
 */
export function chooseWritingRange(groups,start,currentOffset,place) {
  const first=groups[start];if(!first)return null;
  const cache=new Map();
  const longest=from=>{
    if(cache.has(from))return cache.get(from);
    let points=[],range=null;
    for(let j=from;j<groups.length&&groups[j].line===first.line;j++){
      points.push(...groups[j].points);const offset=place(points,currentOffset);
      if(offset===null)break;
      range={start:from,end:j,offset,line:first.line};
    }
    cache.set(from,range);return range;
  };
  const movedCost=from=>{
    let count=0;
    while(from<groups.length&&groups[from].line===first.line){
      const r=longest(from);if(!r)return Infinity;
      count++;from=r.end+1;
    }
    return count;
  };
  const best=longest(start);
  if(!best)return {start,end:start,offset:null,line:first.line};
  let points=[],retained=null;
  for(let j=start;j<=best.end;j++){
    points.push(...groups[j].points);const offset=place(points,currentOffset);
    if(offset===null||Math.abs(offset-currentOffset)>1e-7)break;
    retained={start,end:j,offset:currentOffset,line:first.line};
  }
  if(!retained)return best;
  if(retained.end===best.end)return retained;
  return 1+movedCost(best.end+1)<=movedCost(retained.end+1)?best:retained;
}
