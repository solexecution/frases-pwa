const VER="v39";
const AV="2";
const CORE=["./","index.html","app.js","learn.js","ver.js","srs.js","phrases.json","align.json","missions.json","pairs.json","core.json","sk.json","sk_m.json","stories.json","stories.js","manifest.webmanifest","icon.svg","icon-180.png","icon-192.png","icon-512.png"];
const pad3=i=>String(i).padStart(3,"0");
function audioTiers(ph,ms,sk,st){
 const base=[],extra=[];
 ph.forEach((_,i)=>{base.push("audio/"+pad3(i)+".ogg");extra.push("audio/slow/"+pad3(i)+".ogg");if(!sk)extra.push("audio/en/"+pad3(i)+".ogg")});

 ph.forEach((_,i)=>{if(sk)extra.push("audio/sk/"+pad3(i)+".ogg")});
 (st||[]).forEach(s=>s.sentences.forEach((_,n)=>{const b="audio/st/"+s.id+"_"+String(n).padStart(2,"0");extra.push(b+".ogg",b+"_s.ogg")}));
 ms.forEach(m=>m.steps.forEach(s=>{base.push("audio/"+s.npc.a);s.opts.forEach(o=>base.push("audio/"+o.a))}));
 return {base:[...new Set(base)],extra};
}
