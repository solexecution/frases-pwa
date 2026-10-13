importScripts("ver.js");
const CACHE="frases-"+VER;
const AUD="frases-audio-a"+AV;
const LEGACY=/^frases-v\d+-a\d+$/;
const fresh=u=>new Request(u,{cache:"reload"});

self.addEventListener("install",e=>{
 e.waitUntil((async()=>{
  const cache=await caches.open(CACHE);
  await Promise.all(CORE.map(u=>cache.add(fresh(u))));
  await self.skipWaiting();
 })());
});

self.addEventListener("activate",e=>{
 e.waitUntil((async()=>{
  for(const k of await caches.keys()){
   if(k===CACHE||k===AUD||LEGACY.test(k))continue;
   if(/^frases-v\d+$/.test(k)||/^frases-audio-a\d+$/.test(k))await caches.delete(k);
  }
  await self.clients.claim();
 })());
});

self.addEventListener("message",e=>{
 if(e.data!=="purge")return;
 e.waitUntil((async()=>{for(const k of await caches.keys())if(LEGACY.test(k))await caches.delete(k)})());
});

self.addEventListener("fetch",e=>{
 const req=e.request;
 if(req.method!=="GET")return;
 const url=new URL(req.url);
 if(url.origin!==location.origin)return;
 const aud=/\/audio\//.test(url.pathname);
 e.respondWith((async()=>{
  const cache=await caches.open(aud?AUD:CACHE);
  const hit=await cache.match(req,{ignoreSearch:true});
  if(hit)return hit;
  try{
   const res=await fetch(req);
   if(res&&res.ok)cache.put(req,res.clone());
   return res;
  }catch(err){
   const old=await caches.match(req,{ignoreSearch:true});
   if(old)return old;
   if(req.mode==="navigate"){const i=await caches.match("index.html");if(i)return i}
   throw err;
  }
 })());
});
