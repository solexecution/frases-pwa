const CATS=["All","Basics","Conversation","Understanding","Opinions","Plans","Social","Out & about","Work","Networking","Dating","Solar","Mine"];
const FOCUS=["All","Basics","Networking","Dating","Solar","Social","Out & about","Conversation"];
const PREP=["Networking","Dating","Solar","Basics","Social"];
const GAPS=[400,700,1200,2000];
const POCKET=[
 {t:"Meet",l:["Mucho gusto","Me llamo…","¿Cómo te llamas?","¿De dónde eres?","Soy de Eslovaquia","Hablo un poco de español","¿A qué te dedicas?","Trabajo en energía solar"]},
 {t:"Rescue",l:["No entiendo","¿Me lo repites?","Más despacio, por favor","¿Cómo se dice … en español?","Todavía estoy aprendiendo","Un segundo","¿Hablas inglés?","¿Mande?"]},
 {t:"Contact",l:["¿Me pasas tu número?","¿Nos conectamos en LinkedIn?","Aquí tienes mi tarjeta","Mantengamos el contacto","Te mando la información","Gracias por tu tiempo","Fue un gusto","Hablemos pronto"]},
 {t:"Date",l:["¿Te gustaría tomar un café?","¿Qué te gusta hacer?","Cuéntame de ti","Tienes una sonrisa bonita","La pasé muy bien","Me encantó conocerte","¿Nos vemos otra vez?","¿Qué buscas en una pareja?","Busco algo serio","¿Quieres salir conmigo?"]},
 {t:"Solar",l:["Instalamos paneles solares","Reduce tu recibo de luz","¿Cuánto pagas de luz al mes?","Hacemos una cotización gratis","Se paga solo en pocos años","Ofrecemos financiamiento","Podemos agendar una visita","Tenemos garantía de 25 años"]},
 {t:"Out",l:["¿Cuánto cuesta?","La cuenta, por favor","¿Aceptan tarjeta?","¿Dónde está el baño?","Agua, por favor","Una cerveza, por favor","Estoy perdido","Gracias por todo"]}
];
const SVG={
 x:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
 say:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/></svg>',
 play:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 4v16l13-8z"/></svg>',
 pause:'<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>',
 prev:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 5h2v14H6zM20 5v14L9 12z"/></svg>',
 next:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 5h2v14h-2zM4 5v14l11-7z"/></svg>',
 mic:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>',
 eye:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
 star:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="m12 2 3 6.5 7 .8-5.2 4.8 1.5 7L12 17.5 5.7 21l1.5-7L2 9.3l7-.8z"/></svg>'};

const $=id=>document.getElementById(id);
const pad=n=>String(n).padStart(3,"0");
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const norm=s=>s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"");
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const store={get(k,d){try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch(e){return d}},
 set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){if(!store.warned&&typeof toast==="function"){store.warned=true;toast("Could not save. Storage may be full or blocked. Export a backup from Me.")}}}};
const today=()=>SRS.dayNum(Date.now(),new Date().getTimezoneOffset());
const dayStr=n=>new Date(n*864e5).toISOString().slice(0,10);

let P=[],ALIGN=[],MISS=[],PAIRS=[],BASE=0,MINE=store.get("frases-mine",[]);
const MUST=new Set();
let srs=store.get("frases-srs",{});
let prof=Object.assign({sessions:0,missions:{},rev:{},lis:{},newLog:{},lastSess:-1,lastBackup:0,sess:[]},store.get("frases-prof",{}));
let set=Object.assign({budget:10,sound:true,focus:"All",talkTo:"both"},store.get("frases-set",{}));
const MAN_ADDR=new Set(["¿Estás soltero?","¿Tienes novia?","Eres muy guapo","¿Vives solo?"]);
const WOMAN_ADDR=new Set(["¿Estás soltera?","¿Tienes novio?","Eres muy guapa","¿Vives sola?"]);
const skipped=p=>p.skip||(set.talkTo==="women"&&MAN_ADDR.has(p.es))||(set.talkTo==="men"&&WOMAN_ADDR.has(p.es));
const partners=i=>(PAIRS[i]||[]).filter(x=>!skipped(P[x[0]]));
let opt=Object.assign({en:false,rep:false,loop:true,gap:1,slow:false,echo:false,pairs:false,rate:.85},store.get("frases-opt",{}));
let LOG=store.get("frases-log",[]);
let st={tab:"today",cat:CATS.includes(store.get("frases-cat","All"))?store.get("frases-cat","All"):"All",q:"",showEn:false};
const saveProf=()=>store.set("frases-prof",prof);
const saveSrs=()=>store.set("frases-srs",srs);
const saveSet=()=>store.set("frases-set",set);
const saveOpt=()=>store.set("frases-opt",opt);
let logT=null,resetting=false,reloadWanted=false,modalOpener=null,checkUpdates=()=>{};
function applyUpdate(){if(reloadWanted&&$("ov").hidden&&!playing){reloadWanted=false;location.reload()}}
function logRow(r){LOG.push(r);if(LOG.length>6000)LOG=LOG.slice(-5000);clearTimeout(logT);logT=setTimeout(()=>store.set("frases-log",LOG),400)}
function flushLog(){clearTimeout(logT);store.set("frases-log",LOG)}
function applyRate(){audio.defaultPlaybackRate=opt.rate;audio.playbackRate=opt.rate;audio.preservesPitch=true}

const ids=()=>P.filter(p=>!skipped(p)).map(p=>p.i);
const newToday=()=>prof.newLog[today()]||0;
const gapDays=()=>prof.lastSess<0?0:today()-prof.lastSess;
function secPerTrial(){
 const r=LOG.filter(x=>x[4]>800&&x[4]<120000&&(x[2]==="listen"||x[2]==="pickEs"||x[2]==="build")&&!(x[7]&32)).slice(-60).map(x=>x[4]).sort((a,b)=>a-b);
 if(r.length<30)return 15;
 return Math.min(30,Math.max(8,r[r.length>>1]/1000+4))}
function todayPlan(kind){return SRS.plan({srs,ids:ids(),t:today(),budgetMin:set.budget,sec:secPerTrial(),kind,newToday:newToday(),gap:gapDays(),unseen:unseenPool().length})}
function markReview(){prof.rev[today()]=1;saveProf()}
function practisedDays(){const t=today();let n=0;for(let k=0;k<14;k++)if(prof.rev[t-k])n++;return n}
function hud(){$("hDue").textContent=SRS.dueList(srs,ids(),today()).length+" due"}

const saveMine=()=>store.set("frases-mine",MINE);
function shiftIds(a,b){const dl=b-a,n={};
 Object.keys(srs).forEach(k=>{n[+k>=a?+k+dl:+k]=srs[k]});srs=n;saveSrs();
 LOG.forEach(r=>{if(r[1]>=a)r[1]+=dl});flushLog()}
function loadMine(){
 if(!Array.isArray(MINE))MINE=[];
 const ob=store.get("frases-mybase",BASE);
 if(ob!==BASE&&MINE.length)shiftIds(ob,BASE);
 store.set("frases-mybase",BASE);
 MINE.forEach((d,k)=>P.push({i:BASE+k,es:d[0],en:d[1],cat:"Mine",note:"",skip:!!d[2],my:1}))}
function migrate(){
 if(store.get("frases-schema",1)>=2)return;
 const oldLast=typeof prof.last==="number"?prof.last:-1;
 const kn=store.get("frases-known",[]);
 store.set("frases-backup-v1",{srs,prof,known:kn,set,opt});
 let k=0;
 kn.forEach(i=>{if(i<P.length&&!srs[i])srs[i]=[2,today()+1+(k++%7),0,0,-1,-1,-1,1]});
 Object.keys(srs).forEach(i=>{const e=srs[i];if(e.length<8&&e[0]>=3)e[7]=1});
 ["xp","streak","best","last","freeze","days","badges","perfect"].forEach(x=>{delete prof[x]});
 if(oldLast>=0){prof.lastSess=Math.max(prof.lastSess,oldLast);prof.rev[oldLast]=1}
 delete set.newPerDay;
 saveSrs();saveProf();saveSet();store.set("frases-schema",2);
 try{localStorage.removeItem("frases-known")}catch(e){}}

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
 if(!src){bail();return}
 audio.onended=()=>res();audio.onerror=bail;
 audio.src=src;applyRate();audio.currentTime=0;
 const pr=audio.play();if(pr&&pr.catch)pr.catch(e=>{if(e&&e.name==="AbortError")return;bail()})})}
const srcFor=(i,slow)=>P[i]&&P[i].my?"":(slow?"audio/slow/":"audio/")+pad(i)+".mp3";
const sayPhrase=(i,slow)=>playSrc(srcFor(i,slow),P[i].es);
const sayEn=i=>playSrc(P[i].my?"":"audio/en/"+pad(i)+".mp3",P[i].en,"en");
function stopAudio(){audio.pause();try{speechSynthesis&&speechSynthesis.cancel()}catch(e){}}

let ac=null;
function tick(){if(!set.sound)return;try{ac=ac||new (window.AudioContext||window.webkitAudioContext)();
 const o=ac.createOscillator(),g=ac.createGain();o.type="sine";o.frequency.value=520;o.connect(g);g.connect(ac.destination);
 const s=ac.currentTime;g.gain.setValueAtTime(.05,s);g.gain.exponentialRampToValueAtTime(.0001,s+.06);o.start(s);o.stop(s+.06)}catch(e){}}

function toast(m){const t=$("toast");t.textContent=m;t.style.display="block";clearTimeout(t._h);t._h=setTimeout(()=>t.style.display="none",5500)}
function closeModal(){$("md").hidden=true;$("mdPanel").onclick=null;if(modalOpener&&modalOpener.focus)modalOpener.focus();modalOpener=null}
function modal(html,buttons){const p=$("mdPanel");p.onclick=null;p.innerHTML=html+'<div class="acts"></div>';
 const a=p.querySelector(".acts");
 buttons.forEach(b=>{const e=document.createElement("button");e.className="btn "+(b.cls||"");e.textContent=b.t;e.onclick=()=>{closeModal();if(b.fn)b.fn()};a.appendChild(e)});
 modalOpener=document.activeElement;$("md").hidden=false;const f=p.querySelector("input")||a.lastElementChild;if(f)f.focus()}
function ask(title,msg,yes,fn,cls){modal(`<h3>${esc(title)}</h3><p>${esc(msg)}</p>`,[{t:"Cancel",cls:"sec"},{t:yes,cls:cls||"",fn}])}

function filtered(useQ){const q=useQ?norm(st.q.trim()):"";
 return P.filter(p=>{
  if(p.my&&p.skip)return false;
  if(st.cat!=="All"&&p.cat!==st.cat)return false;
  return !q||norm(p.es+" "+p.en).includes(q)})}
const chipsHTML=(list,cur)=>list.map(c=>`<button class="chip" aria-pressed="${c===cur}" data-c="${esc(c)}">${esc(c)}</button>`).join("");
function renderChips(){$("chipsB").innerHTML=chipsHTML(CATS,st.cat);$("catBtn").innerHTML=`<span>Group: ${esc(st.cat)}</span><span class="sl">Change</span>`}

const pairsHTML=(i,max)=>partners(i).slice(0,max).map(x=>`<div class="pr" data-j="${x[0]}"><span class="pl">${esc(x[1])}</span>${esc(P[x[0]].es)}<span class="pe"> ${esc(P[x[0]].en)}</span></div>`).join("");
function renderList(){const f=filtered(true);
 $("ul").innerHTML=f.length?f.map(p=>`<li class="p ${st.showEn?"":"hide"}" data-i="${p.i}">
  <div class="txt" tabindex="0"><div class="es" lang="es">${esc(p.es)}${p.note?`<span class="note">${esc(p.note)}</span>`:""}</div><div class="en">${esc(p.en)}</div>${pairsHTML(p.i,2)}</div>
  <button class="ib say" aria-label="Listen">${SVG.say}</button>${p.my?`<button class="ib del" aria-label="Remove phrase">${SVG.x}</button>`:""}</li>`).join("")
  :`<li class="empty">No phrases match. Clear the search or pick another group.</li>`}
const decode=s=>{const t=document.createElement("textarea");t.innerHTML=s;return t.value};
const SWAPS=[["coche","carro"],["coches","carros"],["ordenador","computadora"],["ordenadores","computadoras"],["móvil","celular"],["móviles","celulares"],["aparcar","estacionar"],["aparcamiento","estacionamiento"],["zumo","jugo"],["patata","papa"],["patatas","papas"],["gafas","lentes"],["billete","boleto"],["conducir","manejar"],["conduzco","manejo"],["vosotros","ustedes"],["vosotras","ustedes"]];
const swapMx=s=>SWAPS.reduce((x,[a,b])=>x.replace(new RegExp("(^|[^\\p{L}])"+a+"(?![\\p{L}])","giu"),(m,p)=>p+b),s);
const fixMarks=s=>{if(/\?$/.test(s)&&!/^¿/.test(s))s="¿"+s;if(/!$/.test(s)&&!/^¡/.test(s))s="¡"+s;return s};
async function myMemory(t){
 const r=await fetch("https://api.mymemory.translated.net/get?q="+encodeURIComponent(t)+"&langpair=en|es");
 const j=await r.json();let s=decode(String(j&&j.responseData&&j.responseData.translatedText||"")).trim();
 if(!s||/MYMEMORY|QUERY LENGTH|INVALID/i.test(s)||+j.responseStatus!==200)throw new Error("no");
 if(!/[.]$/.test(t)&&/[^.]\.$/.test(s))s=s.slice(0,-1);
 return fixMarks(swapMx(s))}
const GROK_SYS="You help an adult male beginner learn Mexican Spanish for solar-industry networking and dating. The user message is an English phrase, possibly from speech recognition with mistakes; fix obvious mishearings using that context. Translate it into natural, everyday Mexican Spanish: tu form unless the English is clearly formal, carro/celular/computadora not Spain words, masculine forms when the speaker refers to himself. Keep it short, one phrase, correct punctuation including the opening question and exclamation marks. Reply with JSON only: {\"en\":\"corrected English\",\"es\":\"Spanish\"}.";
const grokKey=()=>store.get("frases-grok","");
async function grokModels(key){
 const r=await fetch("https://api.x.ai/v1/models",{headers:{Authorization:"Bearer "+key}});
 if(r.status===401||r.status===403)throw new Error("key");
 if(!r.ok)throw new Error("net");
 const j=await r.json();const ids=(j.data||[]).map(m=>m.id).filter(id=>!/image|imagine|video|embed|vision|aurora/i.test(id));
 const pick=[/fast.*non-reasoning/i,/non-reasoning/i,/mini/i,/^grok-\d/i].map(re=>ids.find(id=>re.test(id))).find(Boolean)||ids[0];
 if(!pick)throw new Error("net");store.set("frases-grokmodel",pick);return pick}
async function grokCall(t,key){
 const c=new AbortController(),to=setTimeout(()=>c.abort(),8000);
 try{
  const r=await fetch("https://api.x.ai/v1/chat/completions",{method:"POST",signal:c.signal,headers:{"Content-Type":"application/json",Authorization:"Bearer "+key},
   body:JSON.stringify({model:store.get("frases-grokmodel","grok-4-fast-non-reasoning"),temperature:0,max_tokens:200,messages:[{role:"system",content:GROK_SYS},{role:"user",content:t}]})});
  if(!r.ok){const e=new Error("http");e.status=r.status;throw e}
  const j=await r.json(),m=String(j.choices[0].message.content).match(/\{[\s\S]*\}/),o=JSON.parse(m[0]);
  const es=String(o.es||"").trim(),en=String(o.en||"").trim();
  if(!es||es.length>200)throw new Error("bad");
  return {es:fixMarks(es),en:en&&en.length<200?en:""}}
 finally{clearTimeout(to)}}
async function grokTranslate(t){
 const key=grokKey();if(!key)throw new Error("nokey");
 try{return await grokCall(t,key)}
 catch(e){if(e.status===404||e.status===400){await grokModels(key);return await grokCall(t,key)}throw e}}
async function translate(t){
 if(grokKey()){try{const r=await grokTranslate(t);r.src="Grok";return r}catch(e){}}
 if(window.Translator){try{
  const o={sourceLanguage:"en",targetLanguage:"es"};
  if(await Translator.availability(o)==="available"){const tr=await Translator.create(o);const s=String(await tr.translate(t)).trim();if(s)return {es:fixMarks(swapMx(s)),src:"device"}}}catch(e){}}
 return {es:await myMemory(t),src:grokKey()?"backup":"free"}}
function grokModal(){
 const has=!!grokKey();
 modal(`<h3>Smart translation</h3><p>Paste your xAI (Grok) API key. It stays on this phone and is sent only to api.x.ai. Without it the free translator is used.</p><input type="password" id="gKey" autocomplete="off" placeholder="${has?"Key saved. Paste a new one to replace it":"xai-..."}"><p id="gMsg" class="hi" role="status"></p><button class="btn block" id="gSave">Save and test</button>`,
  [{t:"Close",cls:"sec"},...(has?[{t:"Remove key",cls:"bad",fn:()=>{store.set("frases-grok","");renderMe();toast("Key removed.")}}]:[])]);
 const msg=m=>{$("gMsg").textContent=m};
 const save=async()=>{const k=$("gKey").value.trim();if(k.length<10){msg("Paste the key first.");return}
  msg("Testing...");$("gSave").disabled=true;
  try{const m=await grokModels(k);store.set("frases-grok",k);msg("Works. Using "+m+".");renderMe()}
  catch(e){msg(e.message==="key"?"xAI rejected that key.":"Could not reach xAI. Check your connection.")}
  $("gSave").disabled=false};
 $("gSave").onclick=save;
 $("gKey").onkeydown=e=>{if(e.key==="Enter"){e.preventDefault();e.stopPropagation();save()}}}
function toastUndo(m,fn){const t=$("toast");t.textContent="";
 const s=document.createElement("span");s.textContent=m;
 const b=document.createElement("button");b.className="btn sec";b.textContent="Undo";b.style.cssText="min-height:36px;padding:4px 14px;margin-left:10px";
 b.onclick=()=>{t.style.display="none";fn()};t.append(s,b);t.style.display="block";clearTimeout(t._h);t._h=setTimeout(()=>t.style.display="none",9000)}
const getSR=()=>window.SpeechRecognition||window.webkitSpeechRecognition;
function addModal(auto){
 modal(`<h3>Add a phrase</h3><p>Type it in English. It is translated and kept in your list under Mine.</p><input type="text" id="aEn" placeholder="English" autocomplete="off" maxlength="120"><div class="row" style="margin:8px 0"><button class="btn sec" id="aMic" style="flex:1">Dictate</button><button class="btn sec" id="aGo" style="flex:1">Translate</button></div><input type="text" id="aEs" lang="es" placeholder="Spanish" autocomplete="off" maxlength="160"><p id="aMsg" class="hi" role="status"></p><button class="btn block" id="aSave">Save phrase</button>`,[{t:"Cancel",cls:"sec"}]);
 const msg=m=>{$("aMsg").textContent=m};
 const go=async()=>{let t=$("aEn").value.trim();if(!t){msg("Type the English first.");return}
  t=t[0].toUpperCase()+t.slice(1);if(/^(who|what|when|where|why|how|which|do|does|did|can|could|is|are|will|would|should|may|have|has)/i.test(t)&&!/[?.!]$/.test(t))t+="?";$("aEn").value=t;
  msg("Translating...");$("aGo").disabled=true;
  try{const r=await translate(t);$("aEs").value=r.es;if(r.en)$("aEn").value=r.en;msg(r.src==="Grok"?"Translated by Grok. Check it, then save.":r.src==="device"?"Translated on this phone. Check it, then save.":r.src==="backup"?"Grok was unavailable, used the free translator. Check it, then save.":"Check the Spanish, change it if it sounds off, then save.")}
  catch(e){msg("Could not translate (offline?). Type the Spanish yourself, then save.")}
  $("aGo").disabled=false};
 const save=()=>{const en=$("aEn").value.trim(),es=$("aEs").value.trim();
  if(!en||!es){msg("Fill in both English and Spanish.");return}
  const n=norm(es);if(P.some(p=>!p.skip&&norm(p.es)===n)){msg("That phrase is already in your list.");return}
  MINE.push([es,en,0]);saveMine();P.push({i:BASE+MINE.length-1,es,en,cat:"Mine",note:"",skip:false,my:1});
  const ni=BASE+MINE.length-1;closeModal();st.cat="Mine";store.set("frases-cat","Mine");renderChips();renderList();hud();if(auto){toastUndo("Saved: "+es,()=>{MINE[ni-BASE][2]=1;P[ni].skip=true;saveMine();hud();renderList()});sayPhrase(ni,false)}else toast("Saved. It will come up in your next session.")};
 const mic=()=>{
  const SR=getSR();if(!SR){msg("Dictation is not supported in this browser. Type it instead.");return}
  const r=new SR();r.lang="en-US";r.interimResults=false;r.maxAlternatives=1;
  let got=false,bad=false;
  msg("Listening. Say the phrase in English.");$("aMic").disabled=true;
  r.onresult=async e=>{got=true;$("aEn").value=e.results[0][0].transcript.trim();await go();if(auto&&$("aEs").value)save()};
  r.onerror=e=>{bad=true;msg(e.error==="not-allowed"||e.error==="service-not-allowed"?"The microphone is blocked. Allow it in the browser site settings.":e.error==="network"?"Dictation needs a connection.":"Did not catch that. Tap Dictate and try again.")};
  r.onend=()=>{$("aMic").disabled=false;if(!got&&!bad)msg("Did not catch that. Tap Dictate and try again.")};
  try{r.start()}catch(x){$("aMic").disabled=false;msg("Could not start the microphone.")}};
 $("aMic").onclick=()=>{auto=false;mic()};
 if(auto)mic();
 $("aGo").onclick=go;$("aSave").onclick=save;
 [["aEn",go],["aEs",save]].forEach(([id,f])=>$(id).onkeydown=e=>{if(e.key==="Enter"){e.preventDefault();e.stopPropagation();f()}})}
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

let queue=[],qi=0,playing=false,token=0,hlMode="es",lastGi=null,cur=null,warm=null,lock=null,lisT0=0;
function lisStop(){if(!lisT0)return;const m=(Date.now()-lisT0)/6e4;lisT0=0;
 if(m>0){const d=today();prof.lis[d]=(prof.lis[d]||0)+Math.min(m,180);saveProf()}}
async function keepAwake(on){try{
 if(on){if(!lock&&navigator.wakeLock){lock=await navigator.wakeLock.request("screen");lock.onrelease=()=>{lock=null}}}
 else if(lock){await lock.release();lock=null}}catch(e){}}
function rebuildQueue(keep){const before=queue[qi];queue=filtered(false).filter(p=>!skipped(p));
 if(keep&&before){const j=queue.findIndex(p=>p.i===before.i);qi=j<0?0:j}else qi=0;
 if(qi>=queue.length)qi=Math.max(0,queue.length-1);showCurrent()}
function fitPlayer(p){const pl=document.querySelector("#s-listen .player");if(!pl.clientHeight)return;
 const lv=["s","m","l","x","y"];let k=p.es.length<=16?0:p.es.length<=30?1:2;pl.dataset.l=lv[k];
 while(pl.scrollHeight>pl.clientHeight+1&&k<4){k++;pl.dataset.l=lv[k]}}
function showPair(p){const q=partners(p.i)[0],el=$("lPair");el.classList.remove("on");
 if(!q){el.innerHTML="";delete el.dataset.j;return}
 const t=P[q[0]];el.dataset.j=q[0];el.innerHTML=`<span class="pl">${esc(q[1])}</span>${esc(t.es)}<span class="pe"> ${esc(t.en)}</span>`}
function showCurrent(){const p=queue[qi];
 if(!p){cur=null;$("lPair").innerHTML="";$("lEs").textContent="No phrases";$("lEn").textContent="Pick another group.";$("lCat").textContent="";$("lPos").textContent="";$("lProg").style.width="0";return}
 const m=groupMaps(p);
 $("lEs").innerHTML=wordsHTML(m.esT,m.esG);$("lEn").innerHTML=wordsHTML(m.enT,m.enG);showPair(p);fitPlayer(p);
 cur={es:timeline(m.g,m.esT,"es"),en:timeline(m.g,m.enT,"en")};lastGi=null;hlGroup(null,$("s-listen"));
 $("lCat").textContent=p.cat+(p.note?" · "+p.note:"");
 $("lPos").textContent=(qi+1)+" / "+queue.length;$("lProg").style.width=((qi+1)/queue.length*100)+"%";
 setMeta(p)}
function setMeta(p){if("mediaSession" in navigator&&window.MediaMetadata){
 navigator.mediaSession.metadata=new MediaMetadata({title:p.es,artist:p.en,album:"Frases"})}}
function setPlayIcon(){$("lPlay").innerHTML=playing?SVG.pause:SVG.play;$("lPlay").setAttribute("aria-label",playing?"Pause":"Play");
 if("mediaSession" in navigator)navigator.mediaSession.playbackState=playing?"playing":"paused"}
async function playLoop(){const my=++token;playing=true;lisT0=Date.now();setPlayIcon();keepAwake(true);
 while(playing&&token===my){const p=queue[qi];if(!p){playing=false;break}
  showCurrent();
  if(opt.en){hlMode="en";lastGi=null;await sayEn(p.i);if(token!==my)return;await wait(200);if(token!==my)return}
  hlMode="es";lastGi=null;await sayPhrase(p.i,opt.slow);if(token!==my)return;
  if(opt.echo){const d=(audio.duration||2)*1000/opt.rate;$("lCat").textContent="Your turn…";await wait(d*1.5+600);if(token!==my)return;$("lCat").textContent=p.cat+(p.note?" · "+p.note:"")}
  if(opt.rep){await wait(300);if(token!==my)return;lastGi=null;await sayPhrase(p.i,opt.slow);if(token!==my)return}
  const q=opt.pairs?partners(p.i)[0]:null;
  if(q){await wait(400);if(token!==my)return;$("lPair").classList.add("on");hlMode="none";
   if(opt.en){await sayEn(q[0]);if(token!==my)return;await wait(200);if(token!==my)return}
   await sayPhrase(q[0],opt.slow);if(token!==my)return;$("lPair").classList.remove("on")}
  await wait(GAPS[opt.gap]);if(token!==my)return;
  let nx=qi+1;
  if(nx>=queue.length){if(opt.loop)nx=0;else{playing=false;break}}
  qi=nx;warm=new Audio();warm.preload="auto";warm.src=srcFor(queue[qi].i,opt.slow)}
 if(token===my){playing=false;lisStop();setPlayIcon();keepAwake(false)}}
function play(){if(!queue.length||playing)return;playLoop()}
function pause(){playing=false;token++;lisStop();stopAudio();setPlayIcon();keepAwake(false);applyUpdate();$("lPair").classList.remove("on");hlGroup(null,$("s-listen"));const p=queue[qi];if(p)$("lCat").textContent=p.cat+(p.note?" · "+p.note:"")}
const toggle=()=>playing?pause():play();
function seek(d){const was=playing;playing=false;token++;lisStop();stopAudio();if(!queue.length){setPlayIcon();return}qi=(qi+d+queue.length)%queue.length;showCurrent();if(was)playLoop();else{setPlayIcon();keepAwake(false)}}

const byEs=()=>{const m=new Map();P.forEach(p=>m.set(p.es,p));return m};
let pocketTab=0,pocketSlow=false;
function renderPocket(){const m=byEs();
 $("pTabs").innerHTML=POCKET.map((g,i)=>`<button class="chip" aria-pressed="${i===pocketTab}" data-t="${i}">${esc(g.t)}</button>`).join("");
 $("pGrid").innerHTML=POCKET[pocketTab].l.map(es=>m.get(es)).filter(Boolean).map(p=>`<button class="pbtn" data-i="${p.i}"><b>${esc(p.es)}</b><small>${esc(p.en)}</small></button>`).join("")}

function renderPotd(){const pool=P.filter(x=>!x.skip&&!/[\/(…]/.test(x.en)),p=pool[(today()*7919)%pool.length];
 $("potd").innerHTML=`<div class="lab">Phrase of the day</div><div class="potdq">How do you say: ${esc(p.en.replace(/[?!.]+$/,""))}?</div><div id="potdAns" class="es" lang="es" style="margin-top:8px"></div><div style="margin-top:10px"><button class="btn sec" data-i="${p.i}">Show and play</button></div>`}
function rowsHTML(){const t=today();
 const row=(label,fn)=>{let h="",n=0;for(let k=13;k>=0;k--){const on=fn(t-k);if(on)n++;h+=`<i class="${on?"on":""}"></i>`}return `<div class="rowlab"><span>${label}</span></div><div class="dots" role="img" aria-label="${label}: ${n} of the last 14 days">${h}</div>`};
 return row("Reviews done",d=>prof.rev[d])+row("Listened 5+ minutes",d=>(prof.lis[d]||0)>=5)}
function renderToday(){const h=new Date().getHours();
 $("greet").textContent=h<12?"¡Buenos días!":h<19?"¡Buenas tardes!":"¡Buenas noches!";
 const t=today(),all=ids(),pl=todayPlan("daily"),sec=secPerTrial();
 const unseen=P.filter(p=>!srs[p.i]&&!skipped(p)).length;
 const back=gapDays()>=2&&gapDays()<7&&pl.dueTotal>0&&!pl.catchup;
 let main,sub,kind="daily";
 if(pl.catchup){main="Catch-up session";sub=`${pl.dueTotal} waiting, about ${SRS.estMinutes(pl.due.length,0,sec)} min today, no new phrases`}
 else if(back){kind="back";main="Welcome back";const n=Math.min(8,pl.dueTotal);sub=`${n} due, about ${SRS.estMinutes(n,0,sec)} min`}
 else if(pl.due.length||pl.newAllowed){const nf=Math.min(pl.newAllowed,unseen);main="Start session";sub=`${pl.due.length} due, ${nf} new, about ${SRS.estMinutes(pl.due.length,nf,sec)} min`}
 else{kind="extra";main="Extra practice";sub="Nothing due. Weak phrases only, no new ones"}
 $("ctaMain").textContent=main;$("ctaSub").textContent=sub;$("btnSession").dataset.kind=kind;
 const clear=pl.dueTotal?Math.ceil(pl.dueTotal/pl.capacity):0;
 $("greetSub").textContent=pl.waiting>0?`${pl.waiting} waiting after this session, about ${clear} days to clear.`:`${pl.dueTotal} due today.`;
 const days=Object.keys(prof.newLog).filter(d=>+d>t-14),span=days.length?Math.min(14,t-Math.min(...days.map(Number))+1):0,perDay=days.length>=3?Math.max(1,days.reduce((a,d)=>a+prof.newLog[d],0)/span):3;
 $("paceLine").textContent=unseen?`At this pace the ${unseen} phrases you have not met are introduced in about ${Math.max(1,Math.ceil(unseen/perDay/7))} weeks.`:"All phrases have been introduced.";
 $("btnTwo").hidden=!pl.dueTotal;$("btnExtra").hidden=kind==="extra";
 $("rows14").innerHTML=rowsHTML()+`<div class="sub" style="margin-top:8px">Practised ${practisedDays()} of the last 14 days.</div>`;
 renderPotd();$("chipsF").innerHTML=chipsHTML(FOCUS,set.focus);hud();offlineCard()}

const off={have:0,need:0};
function offlineCard(){const c=$("offCard");
 if(off.need&&off.have>=off.need){c.className="card off ok";c.innerHTML='<span class="dot"></span><span>Fully offline. Everything is on this phone</span>';return}
 if(!("serviceWorker" in navigator)||!window.caches){c.className="card off";c.innerHTML='<span class="dot"></span><span>Offline needs a modern browser</span>';return}
 const pct=off.need?Math.floor(off.have/off.need*100):0;
 c.className="card off";c.innerHTML=`<span class="dot"></span><span>Getting offline pack… ${pct}%</span><div class="bar"><i style="width:${pct}%"></i></div>`}
let filling=false;
async function curCache(){
 const ks=(await caches.keys()).filter(k=>/^frases-v\d+-a\d+$/.test(k)).sort((a,b)=>parseInt(b.slice(8))-parseInt(a.slice(8)));
 return caches.open(ks[0]||"frases-"+VER+"-a"+AV)}
async function fillOffline(){if(filling||!window.caches||!P.length)return;filling=true;
 try{const c=await curCache();
  const t=audioTiers(P,MISS);const urls=[...CORE,...t.base,...t.extra].map(u=>new URL(u,location.href).href);
  off.need=urls.length;
  for(let pass=0;pass<4;pass++){
   const have=new Set((await c.keys()).map(k=>k.url));
   const todo=urls.filter(u=>!have.has(u));
   off.have=urls.length-todo.length;if(st.tab==="today")offlineCard();
   if(!todo.length||!navigator.onLine)break;
   if(pass>0)await wait(1500);
   for(let i=0;i<todo.length;i+=12){
    if(!navigator.onLine)break;
    await Promise.all(todo.slice(i,i+12).map(u=>c.add(u).then(()=>{off.have++}).catch(()=>{})));
    if(st.tab==="today")offlineCard();await wait(30)}}
 }catch(e){}
 filling=false;if(st.tab==="today")offlineCard()}

let deferredPrompt=null;
const standalone=()=>matchMedia("(display-mode: standalone)").matches||navigator.standalone;
function renderMe(){
 const t=today(),c=SRS.counts(srs,ids(),t),since=Date.now()-14*864e5;
 const rows=LOG.filter(x=>x[0]>since&&(x[7]&3)===3&&!(x[7]&32));
 const right=rows.filter(x=>x[3]===1).length;
 const acc=rows.length>=12?Math.round(right/rows.length*100)+"% ("+right+" of "+rows.length+")":rows.length?right+" of "+rows.length:"not enough yet";
 const retMin=Math.round(prof.sess.filter(s=>s[0]>since).reduce((a,s)=>a+s[2],0)/6e4);
 const lisMin=Math.round(Object.keys(prof.lis).filter(d=>+d>t-14).reduce((a,d)=>a+prof.lis[d],0));
 const stars=Object.values(prof.missions).reduce((a,b)=>a+(+b||0),0);
 $("progress").innerHTML=`<div class="lab">Progress</div>
 <div class="mx"><span>Not met yet</span><b>${c.unseen}</b></div>
 <div class="mx"><span>Learning</span><b>${c.learning}</b></div>
 <div class="mx"><span>Kept (recalled after a gap of 4+ days)</span><b>${c.kept}</b></div>
 <div class="mx"><span>Unverified (carried over, not yet re-tested)</span><b>${c.unverified}</b></div>
 <div class="mx"><span>Due now</span><b>${c.due}</b></div>
 <div class="mx"><span>First-try accuracy on scored answers, 14 days</span><b>${acc}</b></div>
 <div class="mx"><span>Review minutes / listening minutes, 14 days</span><b>${retMin} / ${lisMin}</b></div>
 <div class="mx"><span>Mission stars</span><b>${stars}</b></div>
 <div class="sub" style="margin-top:8px">Accuracy on older phrases is lower than on fresh ones. That is expected: it is the number that predicts what you will still know in a month.</div>
 ${rowsHTML()}`;
 $("backup").innerHTML=`<div class="lab">Backup</div>
 <div class="sub">Last backup: ${prof.lastBackup?new Date(prof.lastBackup).toLocaleDateString():"never"}. Your progress lives only on this phone.</div>
 <div class="row" style="margin-top:10px"><button class="btn sec" id="btnExport">Export</button><button class="btn sec" id="btnImport">Import</button></div>`;
 $("settings").innerHTML=`<div class="lab">Settings</div>
 <div class="set"><span>Session length</span><div class="seg" id="segBud">${[6,10,15].map(n=>`<button data-n="${n}" aria-pressed="${set.budget===n}">${n} min</button>`).join("")}</div></div>
 <div class="set"><span>Dating phrases for</span><div class="seg" id="segTalk">${[["women","Women"],["men","Men"],["both","Both"]].map(x=>`<button data-v="${x[0]}" aria-pressed="${set.talkTo===x[0]}">${x[1]}</button>`).join("")}</div></div>
 <div class="set"><span>Soft tick sounds</span><button class="tog" id="togSnd" aria-pressed="${set.sound}" style="padding:10px 16px">${set.sound?"On":"Off"}</button></div>
 <div class="set"><span>Smart translation (Grok)</span><button class="btn sec" id="btnGrok">${grokKey()?"On":"Set up"}</button></div>
 <div class="set"><span>Daily push reminder</span><button class="btn sec" id="btnPush">Set up</button></div>
 <div class="set"><span>Install on this phone</span><button class="btn" id="btnInstall" ${standalone()?"disabled":""}>${standalone()?"Installed":"Install"}</button></div>
 <div class="set"><span>Version ${VER}</span><button class="btn sec" id="btnUpd">Check for updates</button></div>
 <div class="set"><span>Reset all progress</span><button class="btn sec" id="btnReset">Reset</button></div>`}
function pushModal(){const t=store.get("frases-topic","");
 modal(`<h3>Daily push reminder</h3><p>One reminder a day, even when the app is closed, comes from the free <b>ntfy</b> app. Install ntfy from Google Play or F-Droid, paste your private topic below, then tap Subscribe.</p><input type="text" id="topicIn" placeholder="your-private-topic" value="${esc(t)}" autocapitalize="off" autocomplete="off" spellcheck="false">`,
 [{t:"Close",cls:"sec"},{t:"Subscribe",fn:()=>{const v=$("topicIn").value.trim();if(!v){toast("Paste your topic first.");return}
  store.set("frases-topic",v);toast("If ntfy did not open, subscribe to the topic inside the ntfy app.");location.href="ntfy://ntfy.sh/"+encodeURIComponent(v)}}])}
async function checkNow(){
 if(!("serviceWorker" in navigator)){toast("Updates need a modern browser.");return}
 toast("Checking for updates...");
 try{const reg=await navigator.serviceWorker.getRegistration();
  if(!reg){toast("This is not set up as an offline app yet.");return}
  await reg.update();await wait(1800);
  if(reg.installing||reg.waiting)toast("Update found. Installing now; the app will refresh by itself.");
  else toast("You have the latest version ("+VER+").")}
 catch(e){toast("Could not check. Are you offline?")}}
async function doInstall(){if(!deferredPrompt){toast("Open the browser menu (three dots) and choose Install app or Add to Home screen.");return}
 deferredPrompt.prompt();await deferredPrompt.userChoice;deferredPrompt=null}
function resetAll(){resetting=true;clearTimeout(logT);LOG=[];["frases-srs","frases-prof","frases-known","frases-log"].forEach(k=>{try{localStorage.removeItem(k)}catch(e){}});store.set("frases-schema",2);location.reload()}
function exportData(){flushLog();prof.lastBackup=Date.now();saveProf();
 const blob=new Blob([JSON.stringify({v:2,date:new Date().toISOString(),srs,prof,set,opt,log:LOG,mine:MINE})],{type:"application/json"});
 const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="frases-backup-"+dayStr(today())+".json";
 document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),4000);
 toast("Backup saved to your downloads.");renderMe()}
const isObj=x=>x&&typeof x==="object"&&!Array.isArray(x);
function validBackup(d){
 if(!isObj(d)||d.v!==2||!isObj(d.srs))return "That is not a Frases backup.";
 for(const k of Object.keys(d.srs)){const e=d.srs[k];
  if(!/^\d+$/.test(k)||+k>=BASE+(Array.isArray(d.mine)?d.mine.length:0)||!Array.isArray(e)||e.length<4||e.length>8||!e.every(x=>x===null||Number.isFinite(x)))return "The backup has damaged schedule data."}
 if(d.mine!=null&&(!Array.isArray(d.mine)||d.mine.length>500||!d.mine.every(m=>Array.isArray(m)&&typeof m[0]==="string"&&typeof m[1]==="string"&&m[0].length<200&&m[1].length<200)))return "The backup has damaged custom phrases.";
 if(d.prof!=null&&!isObj(d.prof))return "The backup has damaged progress data.";
 if(d.set!=null&&!isObj(d.set))return "The backup has damaged settings.";
 if(d.opt!=null&&!isObj(d.opt))return "The backup has damaged options.";
 if(d.log!=null&&(!Array.isArray(d.log)||d.log.length>20000||!d.log.every(r=>Array.isArray(r)&&r.length===8)))return "The backup has a damaged review log.";
 return ""}
function cleanProf(p){
 const o=Object.assign({sessions:0,missions:{},rev:{},lis:{},newLog:{},lastSess:-1,lastBackup:0,sess:[]},isObj(p)?p:{});
 ["missions","rev","lis","newLog"].forEach(k=>{if(!isObj(o[k]))o[k]={}});
 Object.keys(o.missions).forEach(k=>{const v=Number(o.missions[k]);o.missions[k]=v>=1&&v<=3?Math.floor(v):0});
 o.sess=Array.isArray(o.sess)?o.sess.filter(Array.isArray).slice(-40):[];
 ["sessions","lastSess","lastBackup"].forEach(k=>{if(!Number.isFinite(o[k]))o[k]=k==="lastSess"?-1:0});
 return o}
function importModal(){
 modal(`<h3>Import a backup</h3><p>Choose a frases-backup file. Your current progress on this phone will be replaced.</p><input type="file" id="impFile" accept="application/json,.json">`,[{t:"Cancel",cls:"sec"}]);
 $("impFile").onchange=e=>{const f=e.target.files[0];if(!f)return;
  const r=new FileReader();
  r.onerror=()=>toast("That file could not be read.");
  r.onload=()=>{let d;try{d=JSON.parse(r.result)}catch(x){toast("That file could not be read.");return}
   const bad=validBackup(d);if(bad){toast(bad);return}
   closeModal();
   ask("Replace progress?",`Backup from ${String(d.date||"").slice(0,10)} with ${Object.keys(d.srs).length} phrases tracked will replace what is on this phone. A copy of the current progress is kept first.`,"Replace",()=>{
    store.set("frases-backup-pre-import",{srs,prof,set,opt,log:LOG.slice(-2000)});
    MINE=Array.isArray(d.mine)?d.mine.map(m=>[m[0],m[1],m[2]?1:0]):MINE;saveMine();srs=d.srs;prof=cleanProf(d.prof);set=Object.assign(set,d.set||{});if(d.opt)opt=Object.assign(opt,d.opt);LOG=d.log||[];
    saveSrs();saveProf();saveSet();saveOpt();flushLog();store.set("frases-schema",2);location.reload()},"bad")};
  r.readAsText(f)}}

function go(tab){
 const same=st.tab===tab;
 if(st.tab==="listen"&&tab!=="listen")pause();
 if(st.tab==="pocket"&&tab!=="pocket"){keepAwake(false);stopAudio()}
 st.tab=tab;
 document.body.classList.toggle("fit",tab==="listen");
 document.querySelectorAll(".screen").forEach(s=>{s.hidden=s.id!=="s-"+tab});
 document.querySelectorAll("nav button").forEach(b=>b.setAttribute("aria-pressed",b.dataset.s===tab));
 if(tab==="today")renderToday();
 else if(tab==="missions")renderMissions();
 else if(tab==="listen"){renderChips();if(!same)rebuildQueue(false)}
 else if(tab==="browse"){renderChips();renderList()}
 else if(tab==="me")renderMe();
 else if(tab==="pocket"){renderPocket();keepAwake(true)}
 scrollTo(0,0);applyUpdate()}

function wire(){
 document.querySelector("nav").onclick=e=>{const b=e.target.closest("button");if(b)go(b.dataset.s)};
 $("btnSession").onclick=()=>startSession($("btnSession").dataset.kind||"daily");
 $("btnTwo").onclick=()=>startSession("two");
 $("btnExtra").onclick=()=>startSession("extra");
 $("btnPrep").onclick=()=>startSession("prep");
 $("btnPocket").onclick=()=>go("pocket");
 $("pBack").onclick=()=>go("today");
 $("potd").onclick=e=>{const b=e.target.closest("button");if(!b)return;const i=+b.dataset.i;$("potdAns").textContent=P[i].es;tapSay(i,null)};
 $("chipsF").onclick=e=>{const b=e.target.closest(".chip");if(!b)return;set.focus=b.dataset.c;saveSet();renderToday()};
 $("offCard").onclick=()=>{if(!(off.need&&off.have>=off.need))fillOffline()};
 const catClick=e=>{const b=e.target.closest(".chip");if(!b)return;st.cat=b.dataset.c;store.set("frases-cat",st.cat);renderChips();
  if(st.tab==="listen"){pause();rebuildQueue(false)}else renderList()};
 $("chipsB").onclick=catClick;
 $("catBtn").onclick=()=>{modal(`<h3>Choose a group</h3><div class="chips">${chipsHTML(CATS,st.cat)}</div>`,[{t:"Close",cls:"sec"}]);
  $("mdPanel").onclick=e=>{const b=e.target.closest(".chip");if(!b)return;st.cat=b.dataset.c;store.set("frases-cat",st.cat);closeModal();renderChips();pause();rebuildQueue(false)}};
 $("q").oninput=e=>{st.q=e.target.value;renderList()};
 $("addPh").onclick=()=>addModal(false);
 $("micPh").onclick=()=>addModal(true)
 $("showEn").onclick=e=>{st.showEn=!st.showEn;e.currentTarget.setAttribute("aria-pressed",st.showEn);e.currentTarget.textContent=st.showEn?"Hide English":"Show English";renderList()};
 $("ul").onclick=e=>{const li=e.target.closest("li.p");if(!li)return;const pr=e.target.closest(".pr");if(pr){tapSay(+pr.dataset.j,null);return}const p=P[+li.dataset.i];
  if(e.target.closest(".del")){ask("Remove this phrase?",p.es+" - "+p.en,"Remove",()=>{MINE[p.i-BASE][2]=1;p.skip=true;saveMine();hud();renderList()},"bad");return}
  if(e.target.closest(".say"))tapSay(p.i,e.target.closest(".say"));
  else if(e.target.closest(".txt")&&!st.showEn)li.classList.toggle("hide")};
 $("ul").onkeydown=e=>{if(e.key==="Enter"&&e.target.classList.contains("txt"))e.target.click()};
 $("lPlay").onclick=toggle;$("lPrev").onclick=()=>seek(-1);$("lNext").onclick=()=>seek(1);
 $("lPrev").innerHTML=SVG.prev;$("lNext").innerHTML=SVG.next;setPlayIcon();
 const flag=(id,key)=>{$(id).onclick=e=>{opt[key]=!opt[key];e.currentTarget.setAttribute("aria-pressed",opt[key]);saveOpt()};$(id).setAttribute("aria-pressed",opt[key])};
 flag("oSlow","slow");flag("oEn","en");flag("oEcho","echo");flag("oPairs","pairs");flag("oRep","rep");flag("oLoop","loop");
 const rateUi=()=>{$("rate").setAttribute("aria-valuetext",(+opt.rate).toFixed(2)+" times speed");$("rate").value=opt.rate;$("rateTxt").textContent=(+opt.rate).toFixed(2).replace(/0$/,"")+"×"};
 rateUi();applyRate();
 $("rate").oninput=e=>{opt.rate=+e.target.value;rateUi();applyRate()};
 $("rate").onchange=saveOpt;
 $("oGap").onclick=()=>{opt.gap=(opt.gap+1)%GAPS.length;$("oGap").textContent="Gap "+(GAPS[opt.gap]/1000)+"s";saveOpt()};
 $("oGap").textContent="Gap "+(GAPS[opt.gap]/1000)+"s";
 const tap=e=>{const w=e.target.closest(".w");if(!w||w.dataset.g==null)return;hlGroup(+w.dataset.g,$("s-listen"))};
 $("lEs").addEventListener("click",tap);$("lEn").addEventListener("click",tap);
 $("lPair").onclick=()=>{if(playing||$("lPair").dataset.j==null)return;stopAudio();sayPhrase(+$("lPair").dataset.j,opt.slow)};
 audio.addEventListener("timeupdate",()=>{
  if(st.tab!=="listen"||!playing||!cur||!audio.duration)return;
  if(hlMode==="none")return;const seq=hlMode==="en"?cur.en:cur.es;if(!seq.length)return;
  const f=audio.currentTime/audio.duration;let gi=seq[seq.length-1].gi;
  for(const s of seq){if(f<s.c1){gi=s.gi;break}}
  if(gi!==lastGi){lastGi=gi;hlGroup(gi,$("s-listen"))}});
 if("mediaSession" in navigator){
  navigator.mediaSession.setActionHandler("play",()=>{if(st.tab==="listen")play()});
  navigator.mediaSession.setActionHandler("pause",pause);
  navigator.mediaSession.setActionHandler("nexttrack",()=>{if(st.tab==="listen")seek(1)});
  navigator.mediaSession.setActionHandler("previoustrack",()=>{if(st.tab==="listen")seek(-1)})}
 audio.addEventListener("pause",()=>{setTimeout(()=>{if(playing&&st.tab==="listen"&&audio.paused&&!audio.ended&&audio.currentTime>0)pause()},400)});
 document.addEventListener("keydown",e=>{
  if(e.key==="Escape"&&!$("md").hidden){closeModal();return}
  if(e.key==="Enter"&&!$("md").hidden&&e.target.tagName!=="BUTTON"){const b=$("mdPanel").querySelector(".acts button:last-child");if(b){e.preventDefault();b.click()}return}
  if(st.tab!=="listen")return;
  if(e.key===" "){e.preventDefault();toggle()}else if(e.key==="ArrowRight")seek(1);else if(e.key==="ArrowLeft")seek(-1)});
 $("pTabs").onclick=e=>{const b=e.target.closest(".chip");if(!b)return;pocketTab=+b.dataset.t;renderPocket()};
 $("pGrid").onclick=e=>{const b=e.target.closest(".pbtn");if(!b)return;
  document.querySelectorAll(".pbtn.play").forEach(x=>x.classList.remove("play"));b.classList.add("play");
  sayPhrase(+b.dataset.i,pocketSlow).then(()=>b.classList.remove("play"))};
 $("pSlow").onclick=e=>{pocketSlow=!pocketSlow;e.currentTarget.setAttribute("aria-pressed",pocketSlow)};
 $("backup").onclick=e=>{if(e.target.closest("#btnExport"))exportData();else if(e.target.closest("#btnImport"))importModal()};
 $("settings").onclick=e=>{
  const n=e.target.closest("#segBud button");
  if(n){set.budget=+n.dataset.n;saveSet();renderMe();return}
  const tk=e.target.closest("#segTalk button");
  if(tk){set.talkTo=tk.dataset.v;saveSet();renderMe();hud();return}
  if(e.target.closest("#togSnd")){set.sound=!set.sound;saveSet();renderMe();return}
  if(e.target.closest("#btnPush")){pushModal();return}
  if(e.target.closest("#btnGrok")){grokModal();return}
  if(e.target.closest("#btnInstall")){doInstall();return}
  if(e.target.closest("#btnUpd")){checkNow();return}
  if(e.target.closest("#btnReset"))ask("Reset all progress?","This clears your review history and everything you have learned on this phone. Export a backup first if you want to keep it. It cannot be undone.","Reset",resetAll,"bad")};
 $("md").onclick=e=>{if(e.target===$("md"))closeModal()};
 window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredPrompt=e});
 window.addEventListener("appinstalled",()=>{deferredPrompt=null;if(st.tab==="me")renderMe()});
 window.addEventListener("online",fillOffline);
 window.addEventListener("pagehide",()=>{if(resetting)return;lisStop();flushLog()});
 document.addEventListener("visibilitychange",()=>{
  if(document.visibilityState==="hidden"){if(!resetting)flushLog()}
  else{if(playing||st.tab==="pocket")keepAwake(true);applyUpdate()}})}

async function boot(){
 const j=u=>fetch(u).then(r=>r.json());
 const [raw,al,ms,pr]=await Promise.all([j("phrases.json"),j("align.json").catch(()=>[]),j("missions.json").catch(()=>[]),j("pairs.json").catch(()=>[])]);
 P=raw.map((d,i)=>({i,es:d[0],en:d[1],cat:d[2],note:d[3]||"",skip:d[4]==="x"}));BASE=P.length;loadMine();ALIGN=al;MISS=ms;PAIRS=pr;
 const m=byEs();POCKET.forEach(g=>g.l.forEach(es=>{const p=m.get(es);if(p)MUST.add(p.i)}));
 migrate();
 const pv=store.get("frases-lastver",null);if(pv&&pv!==VER)setTimeout(()=>toast("Updated to "+VER),600);store.set("frases-lastver",VER);
 wire();renderChips();hud();go("today");
 if("serviceWorker" in navigator){
  const had=!!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener("controllerchange",()=>{if(!had)return;reloadWanted=true;applyUpdate()});
  const check=()=>navigator.serviceWorker.getRegistration().then(r=>r&&r.update()).catch(()=>{});
  checkUpdates=check;
  navigator.serviceWorker.register("sw.js",{updateViaCache:"none"}).then(()=>{check();setInterval(check,6e5)}).catch(()=>{});
  document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible")check()});
  window.addEventListener("online",check);
  window.addEventListener("pageshow",e=>{if(e.persisted)check()})}
 setTimeout(fillOffline,1500)}
document.addEventListener("DOMContentLoaded",boot);
