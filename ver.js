const VER="v20";
const AV="1";
const CORE=["./","index.html","app.js","learn.js","ver.js","phrases.json","align.json","missions.json","pairs.json","manifest.webmanifest","icon.svg","icon-180.png","icon-192.png","icon-512.png"];
const pad3=i=>String(i).padStart(3,"0");
function audioTiers(ph,ms){
 const base=[],extra=[];
 ph.forEach((_,i)=>{base.push("audio/"+pad3(i)+".mp3");extra.push("audio/slow/"+pad3(i)+".mp3","audio/en/"+pad3(i)+".mp3")});
 ms.forEach(m=>m.steps.forEach(s=>{base.push("audio/"+s.npc.a);s.opts.forEach(o=>base.push("audio/"+o.a))}));
 return {base:[...new Set(base)],extra};
}
