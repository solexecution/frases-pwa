const fs=require("fs"),path=require("path"),vm=require("vm"),assert=require("assert");
const root=path.join(__dirname,"..");
const verSrc=fs.readFileSync(path.join(root,"ver.js"),"utf8");
const swSrc=fs.readFileSync(path.join(root,"sw.js"),"utf8");

function makeEnv(net){
 const stores=new Map();
 const key=r=>typeof r==="string"?new URL(r,"https://x.test/app/").href:r.url;
 const mk=name=>({
  async add(r){const u=key(r);const res=await net(u);if(!res.ok)throw new Error("bad");stores.get(name).set(u.split("?")[0],res)},
  async put(r,res){stores.get(name).set(key(r).split("?")[0],res)},
  async match(r){return stores.get(name).get(key(r).split("?")[0])},
  async keys(){return [...stores.get(name).keys()]}
 });
 const caches={
  async open(n){if(!stores.has(n))stores.set(n,new Map());return mk(n)},
  async keys(){return [...stores.keys()]},
  async delete(n){return stores.delete(n)},
  async match(r){for(const n of stores.keys()){const h=stores.get(n).get(key(r).split("?")[0]);if(h)return h}}
 };
 const listeners={};
 const self={location:{href:"https://x.test/app/sw.js",origin:"https://x.test"},addEventListener:(t,f)=>{listeners[t]=f},skipWaiting:async()=>{self.skipped=true},clients:{claim:async()=>{self.claimed=true}}};
 const ctx={self,caches,importScripts:()=>{},fetch:u=>net(typeof u==="string"?u:u.url),Request:class{constructor(u){this.url=new URL(u,"https://x.test/app/").href}},URL,location:self.location,console};
 vm.createContext(ctx);vm.runInContext(verSrc+";\n"+swSrc,ctx);
 const fire=async(t,extra={})=>{let p;const e=Object.assign({waitUntil:x=>{p=x},respondWith:x=>{p=x}},extra);listeners[t](e);return p&&await p};
 ctx.CORE=vm.runInContext("CORE",ctx);ctx.VER=vm.runInContext("VER",ctx);ctx.AV=vm.runInContext("AV",ctx);return {stores,caches,fire,self,ctx};
}

(async()=>{
 const hits=[];
 const net=async u=>{hits.push(u);return {ok:true,url:u,clone(){return this},body:"net:"+u}};
 const env=makeEnv(net);
 await env.caches.open("frases-v29-a1");
 (await env.caches.open("frases-v29-a1")).put("https://x.test/app/audio/005.mp3",{ok:true,body:"old-audio"});
 await env.caches.open("frases-v29");
 await env.caches.open("frases-audio-a1");

 const t0=Date.now();
 await env.fire("install");
 assert(env.self.skipped,"skipWaiting called");
 assert(hits.length===env.ctx.CORE.length,"install fetches only core files, got "+hits.length);
 assert(!hits.some(u=>u.includes("/audio/")),"install does not touch audio");
 assert(Date.now()-t0<500);

 await env.fire("activate");
 const keys=await env.caches.keys();
 assert(env.self.claimed,"clients claimed");
 assert(keys.includes("frases-v29-a1"),"legacy cache kept until purge");
 assert(!keys.includes("frases-v29")&&!keys.includes("frases-audio-a1"),"old shell and old audio-cache deleted: "+keys);

 hits.length=0;
 const fetchEv=async url=>{const req={method:"GET",url,mode:"cors"};return env.fire("fetch",{request:req})};
 let r=await fetchEv("https://x.test/app/audio/005.mp3");
 assert(r.body==="net:https://x.test/app/audio/005.mp3","new-AV audio comes from network, not legacy stale audio");
 hits.length=0;
 r=await fetchEv("https://x.test/app/audio/005.mp3");
 assert(hits.length===0&&r.body.startsWith("net:"),"second request served from audio cache");
 r=await fetchEv("https://x.test/app/app.js");
 assert(hits.length===0,"core file served from shell cache");
 hits.length=0;
 assert((await fetchEv("https://api.x.ai/v1/models"))===undefined,"cross-origin ignored");
 assert((await env.fire("fetch",{request:{method:"POST",url:"https://x.test/app/a",mode:"cors"}}))===undefined,"non-GET ignored");

 await env.fire("message",{data:"purge"});
 assert(!(await env.caches.keys()).includes("frases-v29-a1"),"purge deletes legacy caches");
 console.log("sw: all checks passed");
})().catch(e=>{console.error(e);process.exit(1)});
