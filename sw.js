importScripts("ver.js");
const CACHE="frases-"+VER+"-a"+AV;
const fresh=u=>new Request(u,{cache:"reload"});

async function fill(cache,urls,prev,download){
 for(let i=0;i<urls.length;i+=24){
  await Promise.all(urls.slice(i,i+24).map(async u=>{
   if(await cache.match(u))return;
   for(const c of prev){const hit=await c.match(u);if(hit){await cache.put(u,hit);return}}
   if(download){try{await cache.add(fresh(u))}catch(e){}}
  }));
 }
}

self.addEventListener("install",e=>{
 e.waitUntil((async()=>{
  const cache=await caches.open(CACHE);
  const old=(await caches.keys()).filter(k=>k!==CACHE&&k.endsWith("-a"+AV));
  const prev=await Promise.all(old.map(k=>caches.open(k)));
  await Promise.all(CORE.map(u=>cache.add(fresh(u))));
  const ph=await (await cache.match("phrases.json")).json();
  const ms=await (await cache.match("missions.json")).json();
  const t=audioTiers(ph,ms);
  await fill(cache,t.base,prev,true);
  await fill(cache,t.extra,prev,false);
  await self.skipWaiting();
 })());
});

self.addEventListener("activate",e=>{
 e.waitUntil((async()=>{
  for(const k of await caches.keys())if(k!==CACHE)await caches.delete(k);
  await self.clients.claim();
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
