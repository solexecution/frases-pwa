const CATS=["All","Basics","Conversation","Understanding","Opinions","Plans","Social","Out & about","Work","Networking","Dating","Solar","To learn"];
const GAPS=[400,700,1200,2000];
const SVG={
 say:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/></svg>',
 ok:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5 10 17 19 7"/></svg>',
 play:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 4v16l13-8z"/></svg>',
 pause:'<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>',
 prev:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 5h2v14H6zM20 5v14L9 12z"/></svg>',
 next:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 5h2v14h-2zM4 5v14l11-7z"/></svg>'};
const store={get(k,d){try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch(e){return d}},
 set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
const $=id=>document.getElementById(id);
const pad=n=>String(n).padStart(3,"0");
const esc=s=>s.replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const norm=s=>s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"");
function toast(m){let t=$("toast");if(!t){t=document.createElement("div");t.id="toast";
 t.style.cssText="position:fixed;left:16px;right:16px;bottom:calc(16px + env(safe-area-inset-bottom,0));z-index:20;max-width:648px;margin:0 auto;background:var(--ink);color:var(--bg);padding:13px 15px;border-radius:12px;font-size:.95rem;line-height:1.35;box-shadow:0 6px 24px rgba(0,0,0,.25)";
 document.body.appendChild(t)}t.textContent=m;t.style.display="block";clearTimeout(t._h);t._h=setTimeout(()=>t.style.display="none",6500)}

let P=[];
let known=new Set(store.get("frases-known",[]));
let st={mode:store.get("frases-mode","list"),cat:store.get("frases-cat","All"),q:"",showEn:false};
let opt=Object.assign({en:false,rep:false,loop:true,gap:1,slow:false},store.get("frases-opt",{}));
const srcFor=i=>(opt.slow?"audio/slow/":"audio/")+pad(i)+".mp3";
let ALIGN=[];let cur=null,hlMode="es",lastGi=null;

const audio=new Audio();audio.preload="auto";
let esVoice=null,enVoice=null;
function pickVoices(){if(!("speechSynthesis" in window))return;const v=speechSynthesis.getVoices();
 esVoice=v.find(x=>/es[-_]MX/i.test(x.lang))||v.find(x=>/^es/i.test(x.lang))||null;
 enVoice=v.find(x=>/en[-_]US/i.test(x.lang))||v.find(x=>/^en/i.test(x.lang))||null}
if("speechSynthesis" in window){pickVoices();speechSynthesis.onvoiceschanged=pickVoices}
function speak(text,lang){return new Promise(res=>{
 if(!("speechSynthesis" in window)){res();return}
 const t=lang==="es"&&opt.slow?text.replace(/[…¿¡]/g,"").split(/\s+/).join(", "):text.replace(/[…¿¡]/g,"");
 const u=new SpeechSynthesisUtterance(t);
 const v=lang==="en"?enVoice:esVoice;u.lang=v?v.lang:(lang==="en"?"en-US":"es-MX");if(v)u.voice=v;u.rate=lang==="es"&&opt.slow?.6:.92;
 u.onend=res;u.onerror=res;try{speechSynthesis.cancel()}catch(e){}speechSynthesis.speak(u);
 setTimeout(res,12000)})}
function playAudio(i){return new Promise(res=>{
 hlMode="es";lastGi=null;
 audio.onended=res;
 audio.onerror=()=>{if(opt.slow&&!audio.src.endsWith("/"+pad(i)+".mp3")){audio.onerror=()=>speak(P[i].es,"es").then(res);audio.src="audio/"+pad(i)+".mp3";audio.play().catch(()=>speak(P[i].es,"es").then(res))}else speak(P[i].es,"es").then(res)};
 audio.src=srcFor(i);audio.currentTime=0;
 const pr=audio.play();if(pr&&pr.catch)pr.catch(()=>speak(P[i].es,"es").then(res))})}
function playEn(i){return new Promise(res=>{
 hlMode="en";lastGi=null;
 audio.onended=res;audio.onerror=()=>speak(P[i].en,"en").then(res);
 audio.src="audio/en/"+pad(i)+".mp3";audio.currentTime=0;
 const pr=audio.play();if(pr&&pr.catch)pr.catch(()=>speak(P[i].en,"en").then(res))})}
const wait=ms=>new Promise(r=>setTimeout(r,ms));

function filtered(){const q=norm(st.q.trim());
 return P.filter(p=>{
  if(st.cat==="To learn"&&known.has(p.i))return false;
  if(st.cat!=="All"&&st.cat!=="To learn"&&p.cat!==st.cat)return false;
  if(!q)return true;return norm(p.es+" "+p.en).includes(q)})}

function renderChips(){$("chips").innerHTML=CATS.map(c=>`<button class="chip" aria-pressed="${c===st.cat}" data-c="${c}">${c}</button>`).join("")}
function renderList(){const f=filtered();
 $("ul").innerHTML=f.length?f.map(p=>`<li class="p ${st.showEn?"":"hide"} ${known.has(p.i)?"known":""}" data-i="${p.i}">
  <div class="txt" tabindex="0"><div class="es">${esc(p.es)}${p.note?`<span class="note">${esc(p.note)}</span>`:""}</div><div class="en">${esc(p.en)}</div></div>
  <button class="ib say" aria-label="Listen">${SVG.say}</button>
  <button class="ib ok" aria-label="Mark as known">${SVG.ok}</button></li>`).join("")
  :`<li class="empty">No phrases match. Clear the search or pick another group.</li>`;
 $("kn").textContent=known.size}
function tapSay(i,btn){try{speechSynthesis&&speechSynthesis.cancel()}catch(e){}
 audio.pause();document.querySelectorAll(".play").forEach(b=>b.classList.remove("play"));
 if(btn)btn.classList.add("play");const clr=()=>btn&&btn.classList.remove("play");
 audio.onended=clr;audio.onerror=()=>{clr();speak(P[i].es,"es")};
 audio.src=srcFor(i);audio.currentTime=0;const pr=audio.play();if(pr&&pr.catch)pr.catch(()=>{clr();speak(P[i].es,"es")})}

let queue=[],qi=0,playing=false,token=0;
function rebuildQueue(keep){const before=queue[qi];queue=filtered();
 if(keep&&before){const j=queue.findIndex(p=>p.i===before.i);qi=j<0?0:j}else qi=0;
 if(qi>=queue.length)qi=Math.max(0,queue.length-1);showCurrent()}
function groupMaps(p){const esT=p.es.split(/\s+/),enT=p.en.split(/\s+/);
 const g=(ALIGN[p.i]&&ALIGN[p.i].length)?ALIGN[p.i]:[{es:esT.map((_,i)=>i),en:enT.map((_,i)=>i)}];
 const esG={},enG={};g.forEach((grp,gi)=>{(grp.es||[]).forEach(i=>esG[i]=gi);(grp.en||[]).forEach(i=>enG[i]=gi)});
 return {esT,enT,g,esG,enG}}
function wordsHTML(ts,gm){return ts.map((w,i)=>`<span class="w"${gm[i]!=null?` data-g="${gm[i]}"`:""}>${esc(w)}</span>`).join(" ")}
function timeline(g,ts,key){const items=g.map((grp,gi)=>({gi,idx:grp[key]||[]})).filter(x=>x.idx.length);
 items.sort((a,b)=>Math.min(...a.idx)-Math.min(...b.idx));
 let tot=0;const w=items.map(it=>{const c=it.idx.reduce((s,i)=>s+Math.max(1,(ts[i]||"").replace(/[^\p{L}\p{N}]/gu,"").length),0);tot+=c;return c});
 let acc=0;return items.map((it,k)=>{acc+=w[k];return {gi:it.gi,c1:tot?acc/tot:1}})}
function hlGroup(gi){document.querySelectorAll('#lEs .w.hl,#lEn .w.hl').forEach(e=>e.classList.remove('hl'));
 if(gi==null)return;document.querySelectorAll('#lEs .w[data-g="'+gi+'"],#lEn .w[data-g="'+gi+'"]').forEach(e=>e.classList.add('hl'))}
function showCurrent(){const p=queue[qi];
 if(!p){cur=null;$("lEs").textContent="¡Listo!";$("lEn").textContent="No phrases in this group.";$("lCat").textContent="";$("lPos").textContent="";$("lProg").style.width="0";$("lKnow").setAttribute("aria-pressed",false);return}
 const m=groupMaps(p);
 $("lEs").innerHTML=wordsHTML(m.esT,m.esG);$("lEn").innerHTML=wordsHTML(m.enT,m.enG);
 cur={es:timeline(m.g,m.esT,"es"),en:timeline(m.g,m.enT,"en")};lastGi=null;hlGroup(null);
 $("lCat").textContent=p.cat+(p.note?" · "+p.note:"");
 $("lPos").textContent=(qi+1)+" / "+queue.length;$("lProg").style.width=((qi+1)/queue.length*100)+"%";
 $("lKnow").setAttribute("aria-pressed",known.has(p.i));$("kn").textContent=known.size;setMeta(p)}
function setMeta(p){if("mediaSession" in navigator&&window.MediaMetadata){
 navigator.mediaSession.metadata=new MediaMetadata({title:p.es,artist:p.en,album:"Frases"})}}
function setPlayIcon(){$("lPlay").innerHTML=playing?SVG.pause:SVG.play;$("lPlay").setAttribute("aria-label",playing?"Pause":"Play");
 if("mediaSession" in navigator)navigator.mediaSession.playbackState=playing?"playing":"paused"}

async function playLoop(){const my=++token;playing=true;setPlayIcon();
 while(playing&&token===my){const p=queue[qi];if(!p){playing=false;break}
  showCurrent();
  if(opt.en){await playEn(p.i);if(token!==my)return;await wait(200);if(token!==my)return}
  await playAudio(p.i);if(token!==my)return;
  if(opt.rep){await wait(300);if(token!==my)return;await playAudio(p.i);if(token!==my)return}
  await wait(GAPS[opt.gap]);if(token!==my)return;
  if(qi+1>=queue.length){if(opt.loop)qi=0;else{playing=false;break}}else qi++;}
 playing=false;setPlayIcon()}
function play(){if(!queue.length)return;if(playing)return;playLoop()}
function pause(){playing=false;token++;audio.pause();try{speechSynthesis&&speechSynthesis.cancel()}catch(e){}setPlayIcon()}
function toggle(){playing?pause():play()}
function seek(d){const was=playing;pause();if(!queue.length)return;
 qi=(qi+d+queue.length)%queue.length;showCurrent();if(was)play()}

function saveKnown(){store.set("frases-known",[...known])}
function saveOpt(){store.set("frases-opt",opt)}
function setMode(m){st.mode=m;store.set("frases-mode",m);
 $("mList").setAttribute("aria-pressed",m==="list");$("mListen").setAttribute("aria-pressed",m==="listen");
 $("list").style.display=m==="list"?"block":"none";$("listen").style.display=m==="listen"?"block":"none";
 $("searchRow").style.display=m==="list"?"flex":"none";
 if(m==="listen"){rebuildQueue(false)}else{pause();renderList()}}

function wire(){
 $("mList").onclick=()=>setMode("list");$("mListen").onclick=()=>setMode("listen");
 $("q").oninput=e=>{st.q=e.target.value;renderList()};
 $("showEn").onclick=e=>{st.showEn=!st.showEn;e.target.setAttribute("aria-pressed",st.showEn);e.target.textContent=st.showEn?"Hide English":"Show English";renderList()};
 $("chips").onclick=e=>{const b=e.target.closest(".chip");if(!b)return;st.cat=b.dataset.c;store.set("frases-cat",st.cat);renderChips();
  st.mode==="listen"?(pause(),rebuildQueue(false)):renderList()};
 $("ul").onclick=e=>{const li=e.target.closest("li.p");if(!li)return;const p=P[+li.dataset.i];
  if(e.target.closest(".say"))tapSay(p.i,e.target.closest(".say"));
  else if(e.target.closest(".ok")){known.has(p.i)?known.delete(p.i):known.add(p.i);saveKnown();renderList()}
  else if(e.target.closest(".txt")&&!st.showEn)li.classList.toggle("hide")};
 $("ul").onkeydown=e=>{if(e.key==="Enter"&&e.target.classList.contains("txt"))e.target.click()};
 $("lPlay").onclick=toggle;$("lPrev").onclick=()=>seek(-1);$("lNext").onclick=()=>seek(1);
 $("lPrev").innerHTML=SVG.prev;$("lNext").innerHTML=SVG.next;setPlayIcon();
 const flag=(id,key)=>{$(id).onclick=e=>{opt[key]=!opt[key];e.currentTarget.setAttribute("aria-pressed",opt[key]);saveOpt()};
  $(id).setAttribute("aria-pressed",opt[key])};
 flag("oSlow","slow");flag("oEn","en");flag("oRep","rep");flag("oLoop","loop");
 $("oGap").onclick=()=>{opt.gap=(opt.gap+1)%GAPS.length;$("oGap").textContent="Gap "+(GAPS[opt.gap]/1000)+"s";saveOpt()};
 $("oGap").textContent="Gap "+(GAPS[opt.gap]/1000)+"s";
 $("lKnow").onclick=()=>{const p=queue[qi];if(!p)return;known.has(p.i)?known.delete(p.i):known.add(p.i);saveKnown();showCurrent()};
 if("mediaSession" in navigator){
  navigator.mediaSession.setActionHandler("play",play);
  navigator.mediaSession.setActionHandler("pause",pause);
  navigator.mediaSession.setActionHandler("nexttrack",()=>seek(1));
  navigator.mediaSession.setActionHandler("previoustrack",()=>seek(-1));}
 const tap=e=>{const w=e.target.closest(".w");if(!w||w.dataset.g==null)return;hlGroup(+w.dataset.g)};
 $("lEs").addEventListener("click",tap);$("lEn").addEventListener("click",tap);
 audio.addEventListener("timeupdate",()=>{
  if(st.mode!=="listen"||!playing||!cur||!audio.duration)return;
  const seq=hlMode==="en"?cur.en:cur.es;if(!seq.length)return;
  const f=audio.currentTime/audio.duration;let gi=seq[seq.length-1].gi;
  for(const s of seq){if(f<s.c1){gi=s.gi;break}}
  if(gi!==lastGi){lastGi=gi;hlGroup(gi)}});
 wireInstall();wireRemind();
 document.addEventListener("keydown",e=>{if(st.mode!=="listen")return;
  if(e.key===" "){e.preventDefault();toggle()}else if(e.key==="ArrowRight")seek(1);else if(e.key==="ArrowLeft")seek(-1)})}

let deferredPrompt=null;
function wireInstall(){const b=$("btnInstall");
 const standalone=matchMedia("(display-mode: standalone)").matches||navigator.standalone;
 window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredPrompt=e;b.hidden=false});
 window.addEventListener("appinstalled",()=>{deferredPrompt=null;b.hidden=true});
 b.onclick=async()=>{if(!deferredPrompt){toast("To install: open the browser menu (⋮) and choose \"Install app\" / \"Add to Home screen\".");return}
  deferredPrompt.prompt();await deferredPrompt.userChoice;deferredPrompt=null;b.hidden=true};
 if(standalone)b.hidden=true}

async function registerReminder(){
 try{const reg=await navigator.serviceWorker.ready;
  if("periodicSync" in reg){
   const status=await navigator.permissions.query({name:"periodic-background-sync"}).catch(()=>({state:"granted"}));
   if(status.state!=="denied"){await reg.periodicSync.register("daily-phrase",{minInterval:22*60*60*1000}).catch(()=>{})}}
 }catch(e){}}
function wireRemind(){const b=$("btnRemind");
 const on=store.get("frases-remind",false)&&("Notification" in window)&&Notification.permission==="granted";
 b.classList.toggle("on",on);b.textContent=on?"🔔 Reminders on":"🔔 Daily reminder";
 if(on)registerReminder();
 b.onclick=async()=>{
  if(!("Notification" in window)){toast("This browser can't show notifications. Install the app to your home screen first.");return}
  if(store.get("frases-remind",false)&&Notification.permission==="granted"){
   store.set("frases-remind",false);b.classList.remove("on");b.textContent="🔔 Daily reminder";
   try{const reg=await navigator.serviceWorker.ready;reg.periodicSync&&reg.periodicSync.unregister("daily-phrase")}catch(e){}return}
  let perm=Notification.permission;if(perm!=="granted")perm=await Notification.requestPermission();
  if(perm!=="granted"){toast("Notifications are blocked. Enable them for this app in your browser/site settings, then tap again.");return}
  store.set("frases-remind",true);b.classList.add("on");b.textContent="🔔 Reminders on";
  await registerReminder();
  const p=P[Math.floor(Math.random()*P.length)];
  try{const reg=await navigator.serviceWorker.ready;
   reg.showNotification("¡Hora de practicar! 🌮",{body:p.es+" — "+p.en,icon:"icon-192.png",badge:"icon-192.png",tag:"frases-daily",lang:"es"})}catch(e){}
  if(!matchMedia("(display-mode: standalone)").matches&&!navigator.standalone)
   toast("Reminders on. For reliable daily reminders on Android, install the app to your home screen (⬇ Install app) and keep notifications allowed.")}}

async function boot(){
 P=(await fetch("phrases.json").then(r=>r.json())).map((d,i)=>({i,es:d[0],en:d[1],cat:d[2],note:d[3]||""}));
 ALIGN=await fetch("align.json").then(r=>r.json()).catch(()=>[]);
 known=new Set([...known].filter(i=>i<P.length));
 $("tot").textContent=P.length;
 wire();renderChips();setMode(st.mode);
 if("serviceWorker" in navigator){
  const hadController=!!navigator.serviceWorker.controller;let reloaded=false;
  navigator.serviceWorker.addEventListener("controllerchange",()=>{
   if(!hadController||reloaded)return;reloaded=true;location.reload()});
  navigator.serviceWorker.register("sw.js").then(reg=>{
   reg.update();setInterval(()=>reg.update(),60*60*1000)}).catch(()=>{});
  document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible")
   navigator.serviceWorker.getRegistration().then(r=>r&&r.update())})}}
boot();
