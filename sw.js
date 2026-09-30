const CACHE="frases-v2";
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
