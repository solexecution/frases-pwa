const CATS=["All","Basics","Conversation","Understanding","Opinions","Plans","Social","Out & about","Work","Networking","Dating","Solar","To learn"];
const FOCUS=["All","Basics","Networking","Dating","Solar","Social","Out & about","Conversation"];
const PREP=["Networking","Dating","Solar","Basics","Social"];
const GAPS=[400,700,1200,2000];
const INTERVALS=[0,1,2,4,8,16,32];
const POCKET=[
 {t:"Meet",l:["Mucho gusto","Me llamo…","¿Cómo te llamas?","¿De dónde eres?","Soy de Eslovaquia","Hablo un poco de español","¿A qué te dedicas?","Trabajo en energía solar"]},
 {t:"Rescue",l:["No entiendo","¿Me lo repites?","Más despacio, por favor","¿Cómo se dice … en español?","Todavía estoy aprendiendo","Un segundo","¿Hablas inglés?","¿Mande?"]},
 {t:"Contact",l:["¿Me pasas tu número?","¿Nos conectamos en LinkedIn?","Aquí tienes mi tarjeta","Mantengamos el contacto","Te mando la información","Gracias por tu tiempo","Fue un gusto","Hablemos pronto"]},
 {t:"Date",l:["¿Te gustaría tomar un café?","¿Qué te gusta hacer?","Cuéntame de ti","Tienes una sonrisa bonita","La pasé muy bien","Me encantó conocerte","¿Nos vemos otra vez?","¿Qué buscas en una pareja?","Busco algo serio","¿Quieres salir conmigo?"]},
 {t:"Solar",l:["Instalamos paneles solares","Reduce tu recibo de luz","¿Cuánto pagas de luz al mes?","Hacemos una cotización gratis","Se paga solo en pocos años","Ofrecemos financiamiento","Podemos agendar una visita","Tenemos garantía de 25 años"]},
 {t:"Out",l:["¿Cuánto cuesta?","La cuenta, por favor","¿Aceptan tarjeta?","¿Dónde está el baño?","Agua, por favor","Una cerveza, por favor","Estoy perdido","Gracias por todo"]}
];
const SVG={
 say:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/></svg>',
 ok:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5 10 17 19 7"/></svg>',
 play:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 4v16l13-8z"/></svg>',
 pause:'<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>',
 prev:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 5h2v14H6zM20 5v14L9 12z"/></svg>',
 next:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 5h2v14h-2zM4 5v14l11-7z"/></svg>'};

const $=id=>document.getElementById(id);
const pad=n=>String(n).padStart(3,"0");
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const norm=s=>s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"");
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const store={get(k,d){try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch(e){return d}},
 set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
const today=()=>{const d=new Date();return Math.floor((d.getTime()-d.getTimezoneOffset()*6e4)/864e5)};
const dayStr=n=>new Date(n*864e5).toISOString().slice(0,10);

let P=[],ALIGN=[],MISS=[];
let known=new Set(store.get("frases-known",[]));
let srs=store.get("frases-srs",{});
let prof=Object.assign({xp:0,streak:0,best:0,last:-1,freeze:0,days:{},sessions:0,missions:{},badges:[],perfect:0},store.get("frases-prof",{}));
let set=Object.assign({newPerDay:5,sound:true,focus:"All"},store.get("frases-set",{}));
let opt=Object.assign({en:false,rep:false,loop:true,gap:1,slow:false,echo:false},store.get("frases-opt",{}));
let st={tab:"today",cat:store.get("frases-cat","All"),q:"",showEn:false};
const saveProf=()=>store.set("frases-prof",prof);
const saveSrs=()=>store.set("frases-srs",srs);
const saveSet=()=>store.set("frases-set",set);
const saveKnown=()=>store.set("frases-known",[...known]);
const saveOpt=()=>store.set("frases-opt",opt);

const lvl=xp=>Math.floor(Math.sqrt(xp/40))+1;
const lvlStart=l=>40*(l-1)*(l-1);
function addXp(n){prof.xp+=n;const k=dayStr(today());prof.days[k]=(prof.days[k]||0)+n;saveProf();hud()}
function liveStreak(){const t=today();if(prof.last===t||prof.last===t-1)return prof.streak;if(prof.last===t-2&&prof.freeze>0)return prof.streak;return 0}
function markActive(){const t=today();if(prof.last===t)return false;
 if(prof.last===t-1)prof.streak++;
 else if(prof.last===t-2&&prof.freeze>0){prof.freeze--;prof.streak++}
 else prof.streak=1;
 prof.last=t;prof.best=Math.max(prof.best,prof.streak);
 if(prof.streak%7===0)prof.freeze=Math.min(2,prof.freeze+1);
 saveProf();hud();return true}
function srsRight(i){const e=srs[i]||[0,0,0,0];const box=Math.min(6,e[0]+1);srs[i]=[box,today()+INTERVALS[box],e[2]+1,e[3]];saveSrs()}
function srsWrong(i){const e=srs[i]||[0,0,0,0];srs[i]=[0,today()+1,e[2]+1,e[3]+1];saveSrs()}
const seenCount=()=>P.filter(p=>srs[p.i]||known.has(p.i)).length;
const learnedCount=()=>P.filter(p=>known.has(p.i)||(srs[p.i]&&srs[p.i][0]>=3)).length;
const mastered=cat=>P.filter(p=>p.cat===cat&&(known.has(p.i)||(srs[p.i]&&srs[p.i][0]>=3))).length;
function hud(){$("hStreak").textContent="🔥 "+liveStreak();$("hLvl").textContent="Lv "+lvl(prof.xp)}

const audio=new Audio();audio.preload="auto";
let esVoice=null,enVoice=null;
function pickVoices(){if(!("speechSynthesis" in window))return;const v=speechSynthesis.getVoices();
 esVoice=v.find(x=>/es[-_]MX/i.test(x.lang))||v.find(x=>/^es/i.test(x.lang))||null;
 enVoice=v.find(x=>/en[-_]US/i.test(x.lang))||v.find(x=>/^en/i.test(x.lang))||null}
if("speechSynthesis" in window){pickVoices();speechSynthesis.onvoiceschanged=pickVoices}
function speak(text,lang){return new Promise(res=>{
 if(!("speechSynthesis" in window)){res();return}
 const u=new SpeechSynthesisUtterance(text.replace(/[…¿¡]/g,""));
 const v=lang==="en"?enVoice:esVoice;u.lang=v?v.lang:(lang==="en"?"en-US":"es-MX");if(v)u.voice=v;u.rate=.92;
 u.onend=res;u.onerror=res;try{speechSynthesis.cancel()}catch(e){}speechSynthesis.speak(u);
 setTimeout(res,12000)})}
function playSrc(src,fb,lang){return new Promise(res=>{
 const bail=()=>{if(fb)speak(fb,lang||"es").then(res);else res()};
 audio.onended=()=>res();audio.onerror=bail;
 audio.src=src;audio.currentTime=0;
 const pr=audio.play();if(pr&&pr.catch)pr.catch(bail)})}
const srcFor=(i,slow)=>(slow?"audio/slow/":"audio/")+pad(i)+".mp3";
const sayPhrase=(i,slow)=>playSrc(srcFor(i,slow),P[i].es);
const sayEn=i=>playSrc("audio/en/"+pad(i)+".mp3",P[i].en,"en");
function stopAudio(){audio.pause();try{speechSynthesis&&speechSynthesis.cancel()}catch(e){}}

let ac=null;
function beep(f,d,t,v,delay){if(!set.sound)return;try{ac=ac||new (window.AudioContext||window.webkitAudioContext)();
 const o=ac.createOscillator(),g=ac.createGain();o.type=t||"sine";o.frequency.value=f;o.connect(g);g.connect(ac.destination);
 const s=ac.currentTime+(delay||0);g.gain.setValueAtTime(v||.12,s);g.gain.exponentialRampToValueAtTime(.0001,s+d);o.start(s);o.stop(s+d)}catch(e){}}
const fx={
 good(){beep(660,.12);beep(880,.18,"sine",.12,.1)},
 bad(){beep(190,.28,"sawtooth",.07)},
 win(){[523,659,784,1047].forEach((f,k)=>beep(f,.22,"triangle",.12,k*.12))},
 tap(){beep(520,.05,"sine",.05)}};
const buzz=p=>{try{navigator.vibrate&&navigator.vibrate(p)}catch(e){}};
function confetti(){if(matchMedia("(prefers-reduced-motion: reduce)").matches)return;
 const c=$("fx"),x=c.getContext("2d");c.width=innerWidth;c.height=innerHeight;c.style.display="block";
 const cols=["#D6006F","#159C95","#FFC93C","#3CC7BE","#ffffff"];
 const ps=Array.from({length:150},()=>({x:innerWidth/2,y:innerHeight*.62,vx:(Math.random()-.5)*15,vy:-Math.random()*17-4,s:5+Math.random()*7,c:cols[Math.random()*cols.length|0],r:Math.random()*6,vr:(Math.random()-.5)*.4}));
 let f=0;(function step(){x.clearRect(0,0,c.width,c.height);
  ps.forEach(p=>{p.vy+=.45;p.x+=p.vx;p.y+=p.vy;p.r+=p.vr;x.save();x.translate(p.x,p.y);x.rotate(p.r);x.fillStyle=p.c;x.fillRect(-p.s/2,-p.s/2,p.s,p.s*.6);x.restore()});
  if(++f<120)requestAnimationFrame(step);else{x.clearRect(0,0,c.width,c.height);c.style.display="none"}})()}

function toast(m){const t=$("toast");t.textContent=m;t.style.display="block";clearTimeout(t._h);t._h=setTimeout(()=>t.style.display="none",5500)}
function closeModal(){$("md").hidden=true}
function modal(html,buttons){const p=$("mdPanel");p.innerHTML=html+'<div class="acts"></div>';
 const a=p.querySelector(".acts");
 buttons.forEach(b=>{const e=document.createElement("button");e.className="btn "+(b.cls||"");e.textContent=b.t;e.onclick=()=>{closeModal();if(b.fn)b.fn()};a.appendChild(e)});
 $("md").hidden=false}
function ask(title,msg,yes,fn,cls){modal(`<h3>${esc(title)}</h3><p>${esc(msg)}</p>`,[{t:"Cancel",cls:"sec"},{t:yes,cls:cls||"",fn}])}

function filtered(useQ){const q=useQ?norm(st.q.trim()):"";
 return P.filter(p=>{
  if(st.cat==="To learn"&&known.has(p.i))return false;
  if(st.cat!=="All"&&st.cat!=="To learn"&&p.cat!==st.cat)return false;
  return !q||norm(p.es+" "+p.en).includes(q)})}
const chipsHTML=(list,cur)=>list.map(c=>`<button class="chip" aria-pressed="${c===cur}" data-c="${esc(c)}">${esc(c)}</button>`).join("");
function renderChips(){const h=chipsHTML(CATS,st.cat);$("chipsB").innerHTML=h;$("chipsL").innerHTML=h}

function renderList(){const f=filtered(true);
 $("ul").innerHTML=f.length?f.map(p=>`<li class="p ${st.showEn?"":"hide"} ${known.has(p.i)?"known":""}" data-i="${p.i}">
  <div class="txt" tabindex="0"><div class="es">${esc(p.es)}${p.note?`<span class="note">${esc(p.note)}</span>`:""}</div><div class="en">${esc(p.en)}</div></div>
  <button class="ib say" aria-label="Listen">${SVG.say}</button>
  <button class="ib ok" aria-label="Mark as known">${SVG.ok}</button></li>`).join("")
  :`<li class="empty">No phrases match. Clear the search or pick another group.</li>`}
function tapSay(i,btn){stopAudio();document.querySelectorAll(".play").forEach(b=>b.classList.remove("play"));
 if(btn)btn.classList.add("play");
 sayPhrase(i,false).then(()=>{if(btn)btn.classList.remove("play")})}

function groupMaps(p){const esT=p.es.split(/\s+/),enT=p.en.split(/\s+/);
 const g=(ALIGN[p.i]&&ALIGN[p.i].length)?ALIGN[p.i]:[{es:esT.map((_,i)=>i),en:enT.map((_,i)=>i)}];
 const esG={},enG={};g.forEach((grp,gi)=>{(grp.es||[]).forEach(i=>esG[i]=gi);(grp.en||[]).forEach(i=>enG[i]=gi)});
 return {esT,enT,g,esG,enG}}
function wordsHTML(ts,gm){return ts.map((w,i)=>`<span class="w"${gm[i]!=null?` data-g="${gm[i]}"`:""}>${esc(w)}</span>`).join(" ")}
function timeline(g,ts,key){const items=g.map((grp,gi)=>({gi,idx:grp[key]||[]})).filter(x=>x.idx.length);
 items.sort((a,b)=>Math.min(...a.idx)-Math.min(...b.idx));
 let tot=0;const w=items.map(it=>{const c=it.idx.reduce((s,i)=>s+Math.max(1,(ts[i]||"").replace(/[^\p{L}\p{N}]/gu,"").length),0);tot+=c;return c});
 let acc=0;return items.map((it,k)=>{acc+=w[k];return {gi:it.gi,c1:tot?acc/tot:1}})}
function hlGroup(gi,root){root=root||document;root.querySelectorAll(".w.hl").forEach(e=>e.classList.remove("hl"));
 if(gi==null)return;root.querySelectorAll('.w[data-g="'+gi+'"]').forEach(e=>e.classList.add("hl"))}

let queue=[],qi=0,playing=false,token=0,hlMode="es",lastGi=null,cur=null,warm=null,lock=null;
async function keepAwake(on){try{
 if(on){if(!lock&&navigator.wakeLock){lock=await navigator.wakeLock.request("screen");lock.onrelease=()=>{lock=null}}}
 else if(lock){await lock.release();lock=null}}catch(e){}}
function rebuildQueue(keep){const before=queue[qi];queue=filtered(false);
 if(keep&&before){const j=queue.findIndex(p=>p.i===before.i);qi=j<0?0:j}else qi=0;
 if(qi>=queue.length)qi=Math.max(0,queue.length-1);showCurrent()}
function showCurrent(){const p=queue[qi];
 if(!p){cur=null;$("lEs").textContent="¡Listo!";$("lEn").textContent="No phrases in this group.";$("lCat").textContent="";$("lPos").textContent="";$("lProg").style.width="0";$("lKnow").setAttribute("aria-pressed",false);return}
 const m=groupMaps(p);
 $("lEs").innerHTML=wordsHTML(m.esT,m.esG);$("lEn").innerHTML=wordsHTML(m.enT,m.enG);
 cur={es:timeline(m.g,m.esT,"es"),en:timeline(m.g,m.enT,"en")};lastGi=null;hlGroup(null,$("s-listen"));
 $("lCat").textContent=p.cat+(p.note?" · "+p.note:"");
 $("lPos").textContent=(qi+1)+" / "+queue.length;$("lProg").style.width=((qi+1)/queue.length*100)+"%";
 $("lKnow").setAttribute("aria-pressed",known.has(p.i));setMeta(p)}
function setMeta(p){if("mediaSession" in navigator&&window.MediaMetadata){
 navigator.mediaSession.metadata=new MediaMetadata({title:p.es,artist:p.en,album:"Frases"})}}
function setPlayIcon(){$("lPlay").innerHTML=playing?SVG.pause:SVG.play;$("lPlay").setAttribute("aria-label",playing?"Pause":"Play");
 if("mediaSession" in navigator)navigator.mediaSession.playbackState=playing?"playing":"paused"}
async function playLoop(){const my=++token;playing=true;setPlayIcon();keepAwake(true);
 while(playing&&token===my){const p=queue[qi];if(!p){playing=false;break}
  showCurrent();
  if(opt.en){hlMode="en";lastGi=null;await sayEn(p.i);if(token!==my)return;await wait(200);if(token!==my)return}
  hlMode="es";lastGi=null;await sayPhrase(p.i,opt.slow);if(token!==my)return;
  if(opt.echo){const d=(audio.duration||2)*1000;$("lCat").textContent="🎤 Your turn…";await wait(d*1.5+600);if(token!==my)return;$("lCat").textContent=p.cat+(p.note?" · "+p.note:"")}
  if(opt.rep){await wait(300);if(token!==my)return;lastGi=null;await sayPhrase(p.i,opt.slow);if(token!==my)return}
  await wait(GAPS[opt.gap]);if(token!==my)return;
  let nx=qi+1;
  if(nx>=queue.length){if(opt.loop)nx=0;else{playing=false;break}}
  qi=nx;warm=new Audio();warm.preload="auto";warm.src=srcFor(queue[qi].i,opt.slow)}
 if(token===my){playing=false;setPlayIcon();keepAwake(false)}}
function play(){if(!queue.length||playing)return;playLoop()}
function pause(){playing=false;token++;stopAudio();setPlayIcon();keepAwake(false)}
const toggle=()=>playing?pause():play();
function seek(d){const was=playing;pause();if(!queue.length)return;qi=(qi+d+queue.length)%queue.length;showCurrent();if(was)play()}

const byEs=()=>{const m=new Map();P.forEach(p=>m.set(p.es,p));return m};
let pocketTab=0,pocketSlow=false;
function renderPocket(){const m=byEs();
 $("pTabs").innerHTML=POCKET.map((g,i)=>`<button class="chip" aria-pressed="${i===pocketTab}" data-t="${i}">${esc(g.t)}</button>`).join("");
 $("pGrid").innerHTML=POCKET[pocketTab].l.map(es=>m.get(es)).filter(Boolean).map(p=>`<button class="pbtn" data-i="${p.i}"><b>${esc(p.es)}</b><small>${esc(p.en)}</small></button>`).join("")}

function renderPotd(){const p=P[(today()*7919)%P.length];
 $("potd").innerHTML=`<div class="lab">Phrase of the day</div><div class="row"><div style="flex:1"><div class="es">${esc(p.es)}</div><div class="en">${esc(p.en)}</div></div><button class="ib say" data-i="${p.i}" style="flex:0 0 46px" aria-label="Listen">${SVG.say}</button></div>`}
function renderToday(){const h=new Date().getHours();
 $("greet").textContent=h<12?"¡Buenos días!":h<19?"¡Buenas tardes!":"¡Buenas noches!";
 const sk=liveStreak();
 $("greetSub").textContent=sk?`${sk}-day streak. Keep the flame alive.`:"Start a streak today.";
 const L=lvl(prof.xp),a=lvlStart(L),b=lvlStart(L+1);
 $("lvlTxt").textContent="Level "+L;$("xpTxt").textContent=(prof.xp-a)+" / "+(b-a)+" XP";$("xpBar").style.width=((prof.xp-a)/(b-a)*100)+"%";
 const done=prof.last===today();
 $("doneTxt").textContent=done?"✓ Today's goal done. Bonus rounds still earn XP.":"Today's goal: finish one session or one mission.";
 const pl=plan("daily");
 $("ctaMain").textContent=done?"▶ Another round":"▶ Start today's session";
 $("ctaSub").textContent=`${pl.due.length} to review · ${pl.fresh.length} new · about 5 min`;
 renderPotd();$("chipsF").innerHTML=chipsHTML(FOCUS,set.focus);hud();offlineCard()}

const off={have:0,need:0};
function offlineCard(){const c=$("offCard");
 if(off.need&&off.have>=off.need){c.className="card off ok";c.innerHTML='<span class="dot"></span><span>Fully offline ✓ everything is on this phone</span>';return}
 if(!("serviceWorker" in navigator)||!window.caches){c.className="card off";c.innerHTML='<span class="dot"></span><span>Offline needs a modern browser</span>';return}
 const pct=off.need?Math.round(off.have/off.need*100):0;
 c.className="card off";c.innerHTML=`<span class="dot"></span><span>Getting offline pack… ${pct}%</span><div class="bar"><i style="width:${pct}%"></i></div>`}
let filling=false;
async function fillOffline(){if(filling||!window.caches||!P.length)return;filling=true;
 try{const c=await caches.open("frases-"+VER+"-a"+AV);
  const t=audioTiers(P,MISS);const urls=[...CORE,...t.base,...t.extra].map(u=>new URL(u,location.href).href);
  const have=new Set((await c.keys()).map(k=>k.url));
  const todo=urls.filter(u=>!have.has(u));
  off.need=urls.length;off.have=urls.length-todo.length;if(st.tab==="today")offlineCard();
  for(let i=0;i<todo.length;i+=12){
   if(!navigator.onLine)break;
   await Promise.all(todo.slice(i,i+12).map(u=>c.add(u).then(()=>{off.have++}).catch(()=>{})));
   if(st.tab==="today")offlineCard();await wait(30)}
 }catch(e){}
 filling=false;if(st.tab==="today")offlineCard()}

let deferredPrompt=null;
const standalone=()=>matchMedia("(display-mode: standalone)").matches||navigator.standalone;
function renderMe(){
 const stars=Object.values(prof.missions).reduce((a,b)=>a+b,0);
 $("stats").innerHTML=[[prof.xp,"Total XP"],["Lv "+lvl(prof.xp),"Level"],[liveStreak()+" 🔥","Streak (best "+prof.best+")"],[learnedCount()+"/"+P.length,"Learned"],[prof.sessions,"Sessions"],[stars+" ⭐","Mission stars"]].map(x=>`<div class="stat"><b>${x[0]}</b><small>${x[1]}</small></div>`).join("");
 const t=today(),days=[];for(let k=6;k>=0;k--){const n=t-k;days.push({l:"SMTWTFS"[new Date(n*864e5).getUTCDay()],v:prof.days[dayStr(n)]||0})}
 const mx=Math.max(20,...days.map(d=>d.v));
 $("week").innerHTML=days.map(d=>`<div><i style="height:${d.v/mx*100}%"></i>${d.l}</div>`).join("");
 $("badges").innerHTML=BADGES.map(b=>`<div class="bd ${prof.badges.includes(b.id)?"":"lock"}"><span class="e">${b.e}</span><b>${esc(b.n)}</b><br>${esc(b.d)}</div>`).join("");
 $("settings").innerHTML=`<div class="lab">Settings</div>
 <div class="set"><span>New phrases per session</span><div class="seg" id="segNew">${[3,5,8].map(n=>`<button data-n="${n}" aria-pressed="${set.newPerDay===n}">${n}</button>`).join("")}</div></div>
 <div class="set"><span>Sound effects</span><button class="tog" id="togSnd" style="padding:10px 16px">${set.sound?"On":"Off"}</button></div>
 <div class="set"><span>Daily push reminders</span><button class="btn sec" id="btnPush">Set up</button></div>
 <div class="set"><span>Install on this phone</span><button class="btn" id="btnInstall" ${standalone()?"disabled":""}>${standalone()?"Installed ✓":"Install"}</button></div>
 <div class="set"><span>Version ${VER}</span><button class="btn sec" id="btnReset">Reset progress</button></div>`}
function pushModal(){const t=store.get("frases-topic","");
 modal(`<h3>Daily push reminders</h3><p>Reliable reminders, even when the app is closed, come from the free <b>ntfy</b> app. Install ntfy from Google Play or F-Droid, paste your private topic below, then tap Subscribe.</p><input type="text" id="topicIn" placeholder="your-private-topic" value="${esc(t)}" autocapitalize="off" autocomplete="off" spellcheck="false">`,
 [{t:"Close",cls:"sec"},{t:"Subscribe",fn:()=>{const v=$("topicIn").value.trim();if(!v){toast("Paste your topic first.");return}
  store.set("frases-topic",v);toast("If ntfy did not open, subscribe to the topic inside the ntfy app.");location.href="ntfy://ntfy.sh/"+encodeURIComponent(v)}}])}
async function doInstall(){if(!deferredPrompt){toast("Open the browser menu (⋮) and choose Install app or Add to Home screen.");return}
 deferredPrompt.prompt();await deferredPrompt.userChoice;deferredPrompt=null}
function resetAll(){["frases-srs","frases-prof","frases-known"].forEach(k=>{try{localStorage.removeItem(k)}catch(e){}});location.reload()}

function go(tab){
 if(st.tab==="listen"&&tab!=="listen")pause();
 if(st.tab==="pocket"&&tab!=="pocket"){keepAwake(false);stopAudio()}
 st.tab=tab;
 document.querySelectorAll(".screen").forEach(s=>{s.hidden=s.id!=="s-"+tab});
 document.querySelectorAll("nav button").forEach(b=>b.setAttribute("aria-pressed",b.dataset.s===tab));
 if(tab==="today")renderToday();
 else if(tab==="missions")renderMissions();
 else if(tab==="listen"){renderChips();rebuildQueue(false)}
 else if(tab==="browse"){renderChips();renderList()}
 else if(tab==="me")renderMe();
 else if(tab==="pocket"){renderPocket();keepAwake(true)}
 scrollTo(0,0)}

function wire(){
 document.querySelector("nav").onclick=e=>{const b=e.target.closest("button");if(b)go(b.dataset.s)};
 $("btnSession").onclick=()=>startSession("daily");
 $("btnPrep").onclick=()=>startSession("prep");
 $("btnPocket").onclick=()=>go("pocket");
 $("pBack").onclick=()=>go("today");
 $("potd").onclick=e=>{const b=e.target.closest("button");if(b)tapSay(+b.dataset.i,b)};
 $("chipsF").onclick=e=>{const b=e.target.closest(".chip");if(!b)return;set.focus=b.dataset.c;saveSet();renderToday()};
 $("offCard").onclick=()=>{if(!(off.need&&off.have>=off.need))fillOffline()};
 const catClick=e=>{const b=e.target.closest(".chip");if(!b)return;st.cat=b.dataset.c;store.set("frases-cat",st.cat);renderChips();
  if(st.tab==="listen"){pause();rebuildQueue(false)}else renderList()};
 $("chipsB").onclick=catClick;$("chipsL").onclick=catClick;
 $("q").oninput=e=>{st.q=e.target.value;renderList()};
 $("showEn").onclick=e=>{st.showEn=!st.showEn;e.currentTarget.setAttribute("aria-pressed",st.showEn);e.currentTarget.textContent=st.showEn?"Hide English":"Show English";renderList()};
 $("ul").onclick=e=>{const li=e.target.closest("li.p");if(!li)return;const p=P[+li.dataset.i];
  if(e.target.closest(".say"))tapSay(p.i,e.target.closest(".say"));
  else if(e.target.closest(".ok")){known.has(p.i)?known.delete(p.i):known.add(p.i);saveKnown();renderList()}
  else if(e.target.closest(".txt")&&!st.showEn)li.classList.toggle("hide")};
 $("ul").onkeydown=e=>{if(e.key==="Enter"&&e.target.classList.contains("txt"))e.target.click()};
 $("lPlay").onclick=toggle;$("lPrev").onclick=()=>seek(-1);$("lNext").onclick=()=>seek(1);
 $("lPrev").innerHTML=SVG.prev;$("lNext").innerHTML=SVG.next;setPlayIcon();
 const flag=(id,key)=>{$(id).onclick=e=>{opt[key]=!opt[key];e.currentTarget.setAttribute("aria-pressed",opt[key]);saveOpt()};$(id).setAttribute("aria-pressed",opt[key])};
 flag("oSlow","slow");flag("oEn","en");flag("oEcho","echo");flag("oRep","rep");flag("oLoop","loop");
 $("oGap").onclick=()=>{opt.gap=(opt.gap+1)%GAPS.length;$("oGap").textContent="Gap "+(GAPS[opt.gap]/1000)+"s";saveOpt()};
 $("oGap").textContent="Gap "+(GAPS[opt.gap]/1000)+"s";
 $("lKnow").onclick=()=>{const p=queue[qi];if(!p)return;known.has(p.i)?known.delete(p.i):known.add(p.i);saveKnown();showCurrent()};
 const tap=e=>{const w=e.target.closest(".w");if(!w||w.dataset.g==null)return;hlGroup(+w.dataset.g,$("s-listen"))};
 $("lEs").addEventListener("click",tap);$("lEn").addEventListener("click",tap);
 audio.addEventListener("timeupdate",()=>{
  if(st.tab!=="listen"||!playing||!cur||!audio.duration)return;
  const seq=hlMode==="en"?cur.en:cur.es;if(!seq.length)return;
  const f=audio.currentTime/audio.duration;let gi=seq[seq.length-1].gi;
  for(const s of seq){if(f<s.c1){gi=s.gi;break}}
  if(gi!==lastGi){lastGi=gi;hlGroup(gi,$("s-listen"))}});
 if("mediaSession" in navigator){
  navigator.mediaSession.setActionHandler("play",play);
  navigator.mediaSession.setActionHandler("pause",pause);
  navigator.mediaSession.setActionHandler("nexttrack",()=>seek(1));
  navigator.mediaSession.setActionHandler("previoustrack",()=>seek(-1))}
 document.addEventListener("keydown",e=>{
  if(e.key==="Escape"&&!$("md").hidden){closeModal();return}
  if(st.tab!=="listen")return;
  if(e.key===" "){e.preventDefault();toggle()}else if(e.key==="ArrowRight")seek(1);else if(e.key==="ArrowLeft")seek(-1)});
 $("pTabs").onclick=e=>{const b=e.target.closest(".chip");if(!b)return;pocketTab=+b.dataset.t;renderPocket()};
 $("pGrid").onclick=e=>{const b=e.target.closest(".pbtn");if(!b)return;
  document.querySelectorAll(".pbtn.play").forEach(x=>x.classList.remove("play"));b.classList.add("play");
  sayPhrase(+b.dataset.i,pocketSlow).then(()=>b.classList.remove("play"))};
 $("pSlow").onclick=e=>{pocketSlow=!pocketSlow;e.currentTarget.setAttribute("aria-pressed",pocketSlow)};
 $("settings").onclick=e=>{
  const n=e.target.closest("#segNew button");
  if(n){set.newPerDay=+n.dataset.n;saveSet();renderMe();return}
  if(e.target.closest("#togSnd")){set.sound=!set.sound;saveSet();renderMe();return}
  if(e.target.closest("#btnPush")){pushModal();return}
  if(e.target.closest("#btnInstall")){doInstall();return}
  if(e.target.closest("#btnReset"))ask("Reset all progress?","This clears your XP, streak, badges and learned phrases on this phone. It cannot be undone.","Reset",resetAll,"bad")};
 $("md").onclick=e=>{if(e.target===$("md"))closeModal()};
 window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredPrompt=e});
 window.addEventListener("appinstalled",()=>{deferredPrompt=null;if(st.tab==="me")renderMe()});
 window.addEventListener("online",fillOffline)}

async function boot(){
 const j=u=>fetch(u).then(r=>r.json());
 const [raw,al,ms]=await Promise.all([j("phrases.json"),j("align.json").catch(()=>[]),j("missions.json").catch(()=>[])]);
 P=raw.map((d,i)=>({i,es:d[0],en:d[1],cat:d[2],note:d[3]||""}));ALIGN=al;MISS=ms;
 known=new Set([...known].filter(i=>i<P.length));
 wire();renderChips();hud();go("today");
 if("serviceWorker" in navigator){
  const had=!!navigator.serviceWorker.controller;let reloaded=false;
  navigator.serviceWorker.addEventListener("controllerchange",()=>{if(!had||reloaded)return;reloaded=true;location.reload()});
  navigator.serviceWorker.register("sw.js").then(reg=>{reg.update();setInterval(()=>reg.update(),36e5)}).catch(()=>{});
  document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible")navigator.serviceWorker.getRegistration().then(r=>r&&r.update())})}
 setTimeout(fillOffline,1500)}
document.addEventListener("DOMContentLoaded",boot);
