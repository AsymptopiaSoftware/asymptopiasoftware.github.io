// Music Buddy Cosmic Harmony graph adapter, first linked journey: Standards (major).
// Musical node definitions, parent/child relationships, and coordinates are adapted from
// cc o s s e / d3SightReadingTrainer: public/cosmic-harmony.html (Cosmic Harmony M25).
// This uses Music Buddy's state, NOT a second MIDI listener or duplicated key selector.
const NS="http://www.w3.org/2000/svg";
const CHROMATIC=["C","D♭","D","E♭","E","F","G♭","G","A♭","A","B♭","B"];
const SHARP=["C","C♯","D","D♯","E","F","F♯","G","G♯","A","A♯","B"];
const PC={C:0,"C#":1,Db:1,D:2,"D#":3,Eb:3,E:4,F:5,"F#":6,Gb:6,G:7,"G#":8,Ab:8,A:9,"A#":10,Bb:10,B:11};
// These three harmonic grammars mirror Cosmic Harmony M25, not a generalized
// chord graph. Minor's sun is deliberately m (triad), blues' sun is I7.
const MAJOR=[["ii",2,"m7"],["iii",4,"m7"],["IV",5,"maj7"],["V",7,"7"],["vi",9,"m7"]];
const MINOR=[["ii",2,"m7b5"],["III",3,"maj7"],["iv",5,"m7"],["V",7,"7"],["VI",8,"maj7"]];
const BLUES=[["ii",2,"m7"],["IV",5,"7"],["V",7,"7"],["VI",9,"7"],["sharpIV",6,"dim7"]];
const MODES={major:{quality:"maj7",planets:MAJOR},minor:{quality:"m",planets:MINOR},blues:{quality:"7",planets:BLUES}};
const BLUES_SLOTS={ii:[300,210],IV:[760,205],V:[820,570],VI:[500,710],sharpIV:[225,600]};
const BLUES_MOONS=[
  ["ii:ii","ii","ii","outer",4,"m7b5",115,100,"iiø of ii"],
  ["ii:V","ii","V","inner",9,"7",288,67,"V7 of ii"],
  ["ii:vii","ii","vii","inner",1,"dim7",455,92,"vii° of ii"],
  ["IV:ii","IV","ii","outer",7,"m7",730,65,"ii of IV"],
  ["IV:vii","IV","vii","inner",4,"dim7",952,91,"vii° of IV"],
  ["IV:bII","IV","bII","crossed",6,"7",988,248,"♭II7 of IV"],
  ["V:ii","V","ii","outer",9,"m7",1001,420,"ii of V"],
  ["V:V","V","V","inner",2,"7",1012,608,"V7 of V"],
  ["V:bII","V","bII","crossed",8,"7",960,778,"♭II7 of V"],
  ["VI:ii","VI","ii","outer",11,"m7b5",364,852,"iiø of VI"],
  ["VI:V","VI","V","inner",4,"7",560,843,"V7 of VI"],
  ["VI:vii","VI","vii","inner",8,"dim7",690,809,"vii° of VI"],
  ["sun:vii","sun","vii","inner",11,"dim7",352,443,"vii° of I"],
  ["sun:bII","sun","bII","crossed",1,"7",602,277,"♭II7 of I"]
];
const COORDS=[[425,153],[685,248],[697,524],[425,650],[164,532]];
const QUALITY_TEXT={maj7:"M7",m7:"-7",m7b5:"-7♭5",dim7:"°7",7:"7",m:"-"};
const clean=n=>(n+120)%12;
const note=(pc,key)=>["D","E","G","A","B"].includes(key)?SHARP[clean(pc)]:CHROMATIC[clean(pc)];
const chordLabel=(n,key)=>note(n.root,key)+QUALITY_TEXT[n.quality];
function makeNodes(key,mode="major"){
  const root=PC[key],config=MODES[mode];
  if(root===undefined||!config)throw Error("Unknown CH context: "+key+" / "+mode);
  const isBlues=mode==="blues";
  const nodes=[{id:"sun",degree:"I",kind:"sun",root,quality:config.quality,
    x:isBlues?530:425,y:isBlues?450:380,r:76,label:"SUN · I"}];
  config.planets.forEach(([degree,offset,quality],i)=>{
    let [x,y]=isBlues?BLUES_SLOTS[degree]:COORDS[i];
    if(!isBlues){const scale=1+[-.080,-.045,0,.040,.080][i];
      x=425+(x-425)*scale;y=380+(y-380)*scale;}
    nodes.push({id:degree,degree,kind:"planet",root:clean(root+offset),quality,x,y,r:49,label:degree});
  });
  if(isBlues){
    for(const [id,target,sub,kind,offset,quality,x,y,label] of BLUES_MOONS)
      nodes.push({id,target,sub,kind,root:clean(root+offset),quality,x,y,r:30,label});
    return nodes;
  }
  // Major and minor follow the original Halberstadt-derived M25 moon grammar.
  // In minor, iiø has only V and bII; the minor sun retains its separate bII.
  for(const target of [...nodes]){
    const minorTarget=target.quality==="m7",sun=target.id==="sun";
    let moons;
    if(sun)moons=[["bII","crossed",1,"7"]];
    else if(mode==="minor"&&target.quality==="m7b5")
      moons=[["V","inner",7,"7"],["bII","crossed",1,"7"]];
    else{
      moons=[["ii","outer",2,minorTarget?"m7b5":(mode==="minor"&&target.id==="V"?"m7b5":"m7")],
        ["V","inner",7,"7"]];
      if(minorTarget)moons.push(["vii","inner",11,"dim7"]);
      moons.push(["bII","crossed",1,"7"]);
    }
    let ux=target.x-425,uy=target.y-380,len=Math.hypot(ux,uy)||1;
    ux/=len;uy/=len;if(sun){ux=1;uy=0}
    const tx=-uy,ty=ux;
    for(const [sub,kind,step,quality] of moons){
      let distance=kind==="outer"?165:96,offset=0;
      if(moons.length===4){
        if(sub==="ii"){offset=-118;distance=178}
        else if(sub==="V"){offset=-38;distance=98}
        else if(sub==="vii"){offset=26;distance=98}
        else {offset=98;distance=102}
      }else if(moons.length===3){
        if(sub==="ii"){offset=-104;distance=174}
        else if(sub==="V"){offset=-18;distance=98}
        else {offset=72;distance=102}
      }else if(moons.length===2){
        if(sub==="V"){offset=-34;distance=98}
        else {offset=44;distance=102}
      }
      if(sun){distance=174;offset=28}
      const x=Math.min(816,Math.max(39,target.x+ux*distance+tx*offset));
      const y=Math.min(735,Math.max(38,target.y+uy*distance+ty*offset));
      nodes.push({id:target.id+":"+sub,target:target.id,sub,kind,
        root:clean(target.root+step),quality,x,y,r:kind==="outer"?30:27,
        label:(sub==="bII"?"♭II":sub==="vii"?"vii°":sub)+" of "+target.degree});
    }
  }
  return nodes;
}
function svg(tag,attributes,parent){
  const e=document.createElementNS(NS,tag);
  for(const [k,v] of Object.entries(attributes))e.setAttribute(k,String(v));
  parent.append(e);return e;
}
function matchNodes(nodes,chord){
  if(!chord)return [];
  const m=/^([A-G](?:#|b)?)(maj7|m7b5|dim7|m7|m|7)?$/.exec(chord);
  if(!m)return [];
  return nodes.filter(n=>n.root===PC[m[1]]&&n.quality===(m[2]||""));
}
// An ordered journey path is a harmonic fingerprint, not a claim that every
// progression is one of the original graph's allowed exploration moves.
// Keep unmappable chords as gaps rather than drawing invented connections.
function journeyPath(nodes, sequence){
  const order={sun:0,planet:1,outer:2,inner:3,crossed:4};
  const positions=sequence.map(chord=>{
    const candidates=matchNodes(nodes,chord);
    return [...candidates].sort((a,b)=>
      (order[a.kind]??5)-(order[b.kind]??5) || a.id.localeCompare(b.id))[0]||null;
  });
  return positions.slice(1).map((to,i)=>({
    index:i+1,from:positions[i],to
  })).filter(edge=>edge.from&&edge.to);
}
function drawJourneyArrows(chart,nodes,sequence,index){
  const edges=journeyPath(nodes,sequence);
  if(!edges.length)return edges;
  const defs=svg("defs",{},chart);
  const marker=svg("marker",{id:"ch-journey-arrowhead",viewBox:"0 0 10 10",
    refX:8,refY:5,markerWidth:6,markerHeight:6,orient:"auto-start-reverse"},defs);
  svg("path",{d:"M 0 0 L 10 5 L 0 10 z",class:"ch-arrowhead"},marker);
  const layer=svg("g",{class:"ch-journey-arrows",role:"group",
    "aria-label":"Ordered journey chord transitions"},chart);
  const repeats=new Map();
  for(const edge of edges){
    const a=edge.from,b=edge.to;
    const pair=[a.id,b.id].sort().join("|");
    const repeat=repeats.get(pair)||0;repeats.set(pair,repeat+1);
    const isActive=edge.index===index;
    const isPassed=edge.index<index;
    let d;
    if(a.id===b.id){
      // A repeated chord is a true self-transition and must not disappear.
      const radius=a.r+22+repeat*14;
      d=`M ${a.x+a.r*.5} ${a.y-a.r*.88} C ${a.x+radius*1.45} ${a.y-radius*1.35}, ${a.x-radius*1.45} ${a.y-radius*1.35}, ${a.x-a.r*.5} ${a.y-a.r*.88}`;
    }else{
      const dx=b.x-a.x,dy=b.y-a.y,dist=Math.hypot(dx,dy);
      if(dist<1)continue;
      const ux=dx/dist,uy=dy/dist,nx=-uy,ny=ux;
      const orientation=a.id.localeCompare(b.id)<=0?1:-1;
      const bend=orientation*(repeat%2===0?1:-1)*(24+Math.floor(repeat/2)*16);
      const mx=(a.x+b.x)/2+nx*bend,my=(a.y+b.y)/2+ny*bend;
      d=`M ${a.x+ux*(a.r+6)} ${a.y+uy*(a.r+6)} Q ${mx} ${my} ${b.x-ux*(b.r+12)} ${b.y-uy*(b.r+12)}`;
    }
    const path=svg("path",{d,class:"ch-journey-arrow"+(isActive?" active":isPassed?" passed":" future"),
      "data-step":edge.index,"marker-end":"url(#ch-journey-arrowhead)"},layer);
    const title=svg("title",{},path);
    title.textContent=`Step ${edge.index} → ${edge.index+1}: ${sequence[edge.index-1]} → ${sequence[edge.index]}`;
  }
  return edges;
}
let lastKey=null,lastMode=null,nodes=[];
// Update preview in place, rather than rebuilding the SVG on every hover.
export function previewCosmicChord(container,key,chord,mode="major"){
  const matches=(lastKey===key&&lastMode===mode?matchNodes(nodes,chord):[]);
  const ids=new Set(matches.map(n=>n.id));
  for(const element of container.querySelectorAll(".ch-node")){
    element.classList.toggle("preview",ids.has(element.dataset.nodeId));
  }
}
export function renderCosmic({container,status,key,mode="major",target,played,
  sequence=[],index=0,showArrows=true,preview=null}){
  if(lastKey!==key||lastMode!==mode){
    nodes=makeNodes(key,mode);lastKey=key;lastMode=mode;
  }
  const expected=matchNodes(nodes,target);
  const actual=matchNodes(nodes,played);
  status.textContent="Target: "+(expected.length?"mapped":"no exact node")+" · You: "+(!played?"—":actual.length?"mapped":"no exact node");
  const chart=svg("svg",{viewBox:mode==="blues"?"0 0 1080 930":"0 0 860 775",role:"img","aria-label":"Cosmic Harmony "+mode+" graph with separately highlighted target and played chords"},document.createDocumentFragment());
  // Replace only the diagram, not practice controls or heading.
  const back=svg("g",{},chart);
  if(mode!=="blues")for(const n of nodes.filter(n=>n.kind==="planet")){
    svg("circle",{cx:425,cy:380,r:Math.hypot(n.x-425,n.y-380),class:"orbit"},back);
  }
  const map=new Map(nodes.map(n=>[n.id,n]));
  const linkLayer=svg("g",{class:"graph-relations"},chart);
  for(const n of nodes.filter(n=>n.target)){
    const t=map.get(n.target);
    if(!t)continue;
    const dx=t.x-n.x,dy=t.y-n.y,length=Math.hypot(dx,dy)||1;
    const x1=n.x+dx/length*n.r,y1=n.y+dy/length*n.r;
    const x2=t.x-dx/length*t.r,y2=t.y-dy/length*t.r;
    svg("line",{x1,y1,x2,y2,class:"relation "+n.kind},linkLayer);
  }
  // Arrows go behind the chord labels and independent target/MIDI rings.
  if(showArrows)drawJourneyArrows(chart,nodes,sequence,index);
  const layer=svg("g",{},chart);
  for(const n of nodes){
    const isExpected=expected.includes(n),isPlayed=actual.includes(n);
    const g=svg("g",{class:"ch-node "+n.kind+(isExpected?" expected":"")+(isPlayed?" played":""),
      "data-node-id":n.id,transform:"translate("+n.x+" "+n.y+")"},layer);
    const title=svg("title",{},g);
    title.textContent=n.label+" · "+chordLabel(n,key)+
      (isExpected?" · current journey chord":"")+(isPlayed?" · played on MIDI":"");
    svg("circle",{r:n.r,class:"node-disc"},g);
    if(isExpected)svg("circle",{r:n.r+5,class:"expected-ring"},g);
    if(isPlayed)svg("circle",{r:n.r+12,class:"played-ring"},g);
    svg("circle",{r:n.r+20,class:"preview-ring"},g);
    const role=svg("text",{y:n.kind==="sun"?-14:-6,class:"node-role"},g);role.textContent=n.label;
    const name=svg("text",{y:n.kind==="sun"?14:14,class:"node-chord"},g);name.textContent=chordLabel(n,key);
  }
  container.replaceChildren(chart);
  previewCosmicChord(container,key,preview,mode);
}
export const cosmicMajorNodes=key=>makeNodes(key,"major");
export const cosmicNodes=makeNodes;
export const cosmicExactMatches=matchNodes;
export const cosmicJourneyPath=journeyPath;
