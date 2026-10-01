const CACHE="frases-v3";
const CORE=["./","index.html","app.js","phrases.json","manifest.webmanifest","icon.svg","icon-180.png"];

self.addEventListener("install",e=>{
 e.waitUntil((async()=>{
  const cache=await caches.open(CACHE);
  await cache.addAll(CORE);
  try{
   const phrases=await fetch("phrases.json").then(r=>r.json());
   const audio=phrases.map((_,i)=>"audio/"+String(i).padStart(3,"0")+".mp3");
   await Promise.all(audio.map(u=>cache.add(u).catch(()=>{})));
  }catch(e){}
  self.skipWaiting();
 })());
});

self.addEventListener("activate",e=>{
 e.waitUntil((async()=>{
  const keys=await caches.keys();
  await Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)));
  self.clients.claim();
 })());
});

async function dailyNotification(){
 let p={es:"¡Hora de practicar!",en:"Time to practice your Spanish"};
 try{const cache=await caches.open(CACHE);
  const res=await cache.match("phrases.json")||await fetch("phrases.json");
  const list=await res.json();const r=list[Math.floor(Math.random()*list.length)];
  p={es:r[0],en:r[1]};
 }catch(e){}
 return self.registration.showNotification("¡Hora de practicar! 🌮",{
  body:p.es+" — "+p.en,icon:"icon-192.png",badge:"icon-192.png",tag:"frases-daily",lang:"es",
  data:{url:"./"}});}

self.addEventListener("periodicsync",e=>{
 if(e.tag==="daily-phrase")e.waitUntil(dailyNotification());});

self.addEventListener("notificationclick",e=>{
 e.notification.close();
 e.waitUntil((async()=>{
  const all=await clients.matchAll({type:"window",includeUncontrolled:true});
  for(const c of all){if("focus" in c)return c.focus()}
  if(clients.openWindow)return clients.openWindow("./");
 })());});

self.addEventListener("message",e=>{if(e.data==="test-notification")e.waitUntil(dailyNotification())});

self.addEventListener("fetch",e=>{
 const req=e.request;
 if(req.method!=="GET")return;
 e.respondWith((async()=>{
  const cached=await caches.match(req,{ignoreSearch:true});
  if(cached)return cached;
  try{
   const res=await fetch(req);
   if(res&&res.ok&&new URL(req.url).origin===location.origin){
    const cache=await caches.open(CACHE);cache.put(req,res.clone());
   }
   return res;
  }catch(err){
   if(req.mode==="navigate")return caches.match("index.html");
   throw err;
  }
 })());
});
