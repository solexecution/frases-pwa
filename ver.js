const VER="v42";
const AV="2";
const CORE=["./","index.html","app.js","learn.js","ver.js","srs.js","phrases.json","align.json","missions.json","pairs.json","core.json","sk.json","sk_m.json","stories.json","stories.js","manifest.webmanifest","icon.svg","icon-180.png","icon-192.png","icon-512.png"];
const pad3=i=>String(i).padStart(3,"0");
function audioTiers(ph,ms,sk,st){
 const base=[],extra=[];
 ph.forEach((_,i)=>{base.push("audio/"+pad3(i)+".ogg");extra.push("audio/slow/"+pad3(i)+".ogg");if(!sk)extra.push("audio/en/"+pad3(i)+".ogg")});

 ph.forEach((_,i)=>{if(sk)extra.push("audio/sk/"+pad3(i)+".ogg")});
 const seen=new Set(),add=u=>{if(u&&!seen.has(u)){seen.add(u);extra.push(u)}};
 (st||[]).forEach(s=>s.sentences.forEach((sn,n)=>{add("audio/st/"+s.id+"_"+String(n).padStart(2,"0")+".ogg");sn.w.forEach(c=>{if(c[3])add("audio/ck/es/"+c[3]+".ogg");const h=sk?c[5]:c[4];if(h)add("audio/ck/"+(sk?"sk":"en")+"/"+h+".ogg")})}));
 ms.forEach(m=>m.steps.forEach(s=>{base.push("audio/"+s.npc.a);s.opts.forEach(o=>base.push("audio/"+o.a))}));
 return {base:[...new Set(base)],extra};
}
