// Music Buddy Cosmic Harmony graph adapter, first linked journey: Standards (major).
// Musical node definitions, parent/child relationships, and coordinates are adapted from
// cc o s s e / d3SightReadingTrainer: public/cosmic-harmony.html (Cosmic Harmony M25).
// This uses Music Buddy's state, NOT a second MIDI listener or duplicated key selector.
const NS="http://www.w3.org/2000/svg";
const CHROMATIC=["C","D♭","D","E♭","E","F","G♭","G","A♭","A","B♭","B"];
const SHARP=["C","C♯","D","D♯","E","F","F♯","G","G♯","A","A♯","B"];
const PC={C:0,"C#":1,Db:1,D:2,"D#":3,Eb:3,E:4,F:5,"F#":6,Gb:6,G:7,"G#":8,Ab:8,A:9,"A#":10,Bb:10,B:11};
const MAJOR=[["ii",2,"m7"],["iii",4,"m7"],["IV",5,"maj7"],["V",7,"7"],["vi",9,"m7"]];
const COORDS=[[425,153],[685,248],[697,524],[425,650],[164,532]];
const QUALITY_TEXT={maj7:"M7",m7:"-7",m7b5:"-7♭5",dim7:"°7",7:"7",m:"-"};
const clean=n=>(n+120)%12;
const note=(pc,key)=>["D","E","G","A","B"].includes(key)?SHARP[clean(pc)]:CHROMATIC[clean(pc)];
const chordLabel=(n,key)=>note(n.root,key)+QUALITY_TEXT[n.quality];
function makeNodes(key){
  const root=PC[key];
  if(root===undefined)throw Error("Unknown CH tonic: "+key);
  const nodes=[{id:"sun",degree:"I",kind:"sun",root,quality:"maj7",x:425,y:380,r:76,label:"SUN · I"}];
  MAJOR.forEach(([degree,offset,quality],i)=>{
    let [x,y]=COORDS[i];
    const scale=1+[-.080,-.045,0,.040,.080][i];
    x=425+(x-425)*scale;y=380+(y-380)*scale;
    nodes.push({id:degree,degree,kind:"planet",root:clean(root+offset),quality,x,y,r:49,label:degree});
  });
  // The original Cosmic Harmony graph builds moons around each planet; preserve
  // its distances, moon types, and root offsets rather than manufacturing a generic graph.
  const targets=[...nodes];
  for(const target of targets){
    const minorTarget=target.quality==="m7",sun=target.id==="sun";
    let moons=sun?[["ii","outer",2,"m7"],["V","inner",7,"7"],["bII","crossed",1,"7"]]:
      [["ii","outer",2,minorTarget?"m7b5":"m7"],["V","inner",7,"7"]];
    if(!sun){
      if(minorTarget)moons.push(["vii","inner",11,"dim7"]);
      moons.push(["bII","crossed",1,"7"]);
    }else moons=moons.filter(m=>m[0]==="bII");
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
      const label=(sub==="bII"?"♭II":sub==="vii"?"vii°":sub)+" of "+target.degree;
      nodes.push({id:target.id+":"+sub,target:target.id,sub,kind,root:clean(target.root+step),quality,
        x,y,r:kind==="outer"?30:27,label});
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
let lastKey=null, nodes=[];
export function renderCosmic({container,status,key,journey,target,played}){
  if(journey!=="standards"){
    container.replaceChildren();
    status.textContent="Graph linking is currently enabled for Standards only.";
    lastKey=null;return;
  }
  if(lastKey!==key){nodes=makeNodes(key);lastKey=key;}
  const expected=matchNodes(nodes,target);
  const actual=matchNodes(nodes,played);
  status.textContent="Target: "+(expected.length?"mapped":"no exact node")+" · You: "+(!played?"—":actual.length?"mapped":"no exact node");
  const chart=svg("svg",{viewBox:"0 0 860 775",role:"img","aria-label":"Cosmic Harmony major graph with separately highlighted target and played chords"},document.createDocumentFragment());
  // Replace only the diagram, not practice controls or heading.
  const back=svg("g",{},chart);
  for(const n of nodes.filter(n=>n.kind==="planet")){
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
  const layer=svg("g",{},chart);
  for(const n of nodes){
    const isExpected=expected.includes(n),isPlayed=actual.includes(n);
    const g=svg("g",{class:"ch-node "+n.kind+(isExpected?" expected":"")+(isPlayed?" played":""),
      transform:"translate("+n.x+" "+n.y+")"},layer);
    const title=svg("title",{},g);
    title.textContent=n.label+" · "+chordLabel(n,key)+
      (isExpected?" · current journey chord":"")+(isPlayed?" · played on MIDI":"");
    svg("circle",{r:n.r,class:"node-disc"},g);
    if(isExpected)svg("circle",{r:n.r+5,class:"expected-ring"},g);
    if(isPlayed)svg("circle",{r:n.r+12,class:"played-ring"},g);
    const role=svg("text",{y:n.kind==="sun"?-14:-6,class:"node-role"},g);role.textContent=n.label;
    const name=svg("text",{y:n.kind==="sun"?14:14,class:"node-chord"},g);name.textContent=chordLabel(n,key);
  }
  container.replaceChildren(chart);
}
export const cosmicMajorNodes=makeNodes;
export const cosmicExactMatches=matchNodes;
