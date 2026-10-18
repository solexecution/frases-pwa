let ST=null,stTok=0;
const stTr=o=>SKL()?o.sk:o.en;
const stGl=c=>SKL()?c[2]:c[1];
const stLang=()=>SKL()?"sk":"en";
const stAudio=(id,n)=>"audio/st/"+id+"_"+String(n).padStart(2,"0")+".ogg";
const ckEs=c=>c[3]?"audio/ck/es/"+c[3]+".ogg":"";
const ckGl=c=>{const h=SKL()?c[5]:c[4];return h?"audio/ck/"+stLang()+"/"+h+".ogg":""};
const spEs=c=>c[6]||c[0];
const spGl=c=>(SKL()?c[8]:c[7])||stGl(c);
const wordKey=w=>norm(w).replace(/[^a-z0-9]/g,"");
const smooth=()=>matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth";
const SPEEDS={slow:{rate:.8,word:900,gl:260,sent:1800,label:"Slow"},normal:{rate:1,word:450,gl:180,sent:1200,label:"Normal"},fast:{rate:1.15,word:200,gl:100,sent:800,label:"Fast"}};
const SPEED_ORDER=["slow","normal","fast"];
const IC={
 left:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
 right:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg>',
 lens:'<svg class="lensIc" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="10" cy="10" r="6.5"/><path d="M15 15l6 6"/></svg>'};

const NUM_UNITS=["cero","uno","dos","tres","cuatro","cinco","seis","siete","ocho","nueve","diez","once","doce","trece","catorce","quince","dieciseis","diecisiete","dieciocho","diecinueve","veinte"];
const NUM_TENS={3:"treinta",4:"cuarenta",5:"cincuenta",6:"sesenta",7:"setenta",8:"ochenta",9:"noventa"};
function numWords(n){
 if(n<=20)return [NUM_UNITS[n]];
 if(n<30)return ["veinti"+NUM_UNITS[n-20]];
 if(n===100)return ["cien"];
 if(n<100){const t=Math.floor(n/10),u=n%10;return u?[NUM_TENS[t],"y",NUM_UNITS[u]]:[NUM_TENS[t]]}
 return null}
const heardTokens=s=>s.split(/\s+/).map(t=>t.replace(/[^\p{L}\p{N}]/gu,"")).filter(Boolean)
 .flatMap(t=>/^\d+$/.test(t)?(numWords(+t)||[t]):[t]).map(wordKey).filter(Boolean);

const STORY_GROUPS={"Marek en Mérida":"Marek in Mérida","Leyendas mayas":"Maya legends from the villages"};
function renderStories(){
 const el=$("stList");if(!el)return;
 if(!STORIES.length){el.innerHTML='<div class="sub" style="margin-top:10px">Stories are not available yet.</div>';return}
 let last=null;
 el.innerHTML=STORIES.map(s=>{
  const g=s.group||"",head=g!==last?`<div class="lab" style="margin:20px 0 4px">${esc(STORY_GROUPS[g]||g)}</div>`:"";
  last=g;
  const r=prof.stories&&prof.stories[s.id];
  return head+`<button class="mcard" data-sid="${esc(s.id)}"><span class="mt"><b lang="es">${esc(s.title.es)}</b><span class="sub">${esc(stTr(s.title))} · ${s.sentences.length} sentences</span><br><span class="tag">Beginner ${s.level}</span>${r&&r.n?` <span class="tag">Read ${r.n} time${r.n===1?"":"s"}</span>`:""}</span></button>`}).join("")}

function openStory(id){
 const s=STORIES.find(x=>x.id===id);if(!s)return;
 if(playing)pause();
 stopAudio();S=null;M=null;
 const sp=store.get("frases-frspeed","normal");
 ST={s,i:0,k:0,view:"lens",speed:SPEEDS[sp]?sp:"normal",voice:store.get("frases-frvoice",true)!==false,whole:store.get("frases-frwhole",true)!==false,playing:false,tok:++stTok,res:{},done:new Set(),heard:new Set(),rec:null,listening:false,rt:0,endAsk:0};
 openOv();frRender();
 stSay("Tap play. Each word is spoken, then its meaning.")}

function frClip(src,rate,fb,lang){
 return new Promise(res=>{
  inGap=false;
  let used=false;
  const once=()=>{if(used)return false;used=true;return true};
  const bail=()=>{if(!once())return;if(fb)speak(fb,lang).then(res);else res()};
  if(!src){bail();return}
  try{speechSynthesis.cancel()}catch(e){}
  audio.onended=()=>{if(once())res()};audio.onerror=bail;
  audio.src=src;audio.defaultPlaybackRate=rate;audio.playbackRate=rate;audio.preservesPitch=true;audio.currentTime=0;
  const pr=audio.play();if(pr&&pr.catch)pr.catch(e=>{if(e&&e.name==="AbortError")return;bail()})})}

function stSay(msg){const g=$("frMsg");if(g)g.textContent=msg}

function frBtns(){
 if(!ST)return;
 const p=$("frPlay"),r=$("frRead"),l=$("lens");
 if(p){p.innerHTML=ST.playing?SVG.pause:SVG.play;p.setAttribute("aria-label",ST.playing?"Pause":"Play")}
 if(r)r.textContent=ST.listening?"Listening...":"Read aloud";
 if(l)l.classList.toggle("listening",ST.listening)}

function frMeta(){
 if(!ST||!("mediaSession" in navigator)||!window.MediaMetadata)return;
 navigator.mediaSession.metadata=new MediaMetadata({title:ST.s.title.es,artist:stTr(ST.s.title),album:"Frases stories",artwork:[{src:"icon-192.png",sizes:"192x192",type:"image/png"},{src:"icon-512.png",sizes:"512x512",type:"image/png"}]});
 navigator.mediaSession.playbackState=ST.playing?"playing":"paused"}

function frRender(){
 if(!ST)return;
 if(ST.view==="text"){frText();return}
 const s=ST.s;
 setBody(`<div class="frSticky"><div class="frHead"><div class="frTitle"><b lang="es">${esc(s.title.es)}</b><span class="sub" id="frCount"></span></div><div class="frTools"><button class="chip" id="frRead">Read aloud</button><button class="chip" id="frView">Text</button></div></div>
 <div class="lens" id="lens">${IC.lens}<div class="lensEs" id="lensEs" lang="es"></div><div class="frGloss" id="frGloss"></div></div></div>
 <div class="frTr" id="frTr"></div>
 <button class="chip frHear" id="frHear">Hear the whole sentence</button>
 <div class="frMsg" id="frMsg" role="status" aria-live="polite"></div>
 <div class="snRes" id="frRes"></div>`);
 $("ovFoot").innerHTML=`<div class="frCtl"><button class="cb" id="frPS" aria-label="Previous sentence">${SVG.prev}</button><button class="cb" id="frPW" aria-label="Previous word">${IC.left}</button><button class="cb big" id="frPlay" aria-label="Play">${SVG.play}</button><button class="cb" id="frNW" aria-label="Next word">${IC.right}</button><button class="cb" id="frNS" aria-label="Next sentence">${SVG.next}</button></div>
 <div class="frChips"><button class="chip" id="frSpeed"></button><button class="chip" id="frVoice" aria-pressed="${ST.voice}" aria-label="Translation voice after each word">Say meaning</button><button class="chip" id="frWhole" aria-pressed="${ST.whole}" aria-label="Play the whole sentence after the words">Full sentence</button></div>`;
 $("frSpeed").textContent="Speed: "+SPEEDS[ST.speed].label;
 frBind();
 const i=ST.i,k=ST.k;ST.i=-1;
 frShow(i,k);frBtns()}

function frShow(i,k){
 if(!ST||ST.view!=="lens")return;
 const list=ST.s.sentences,sn=list[i],es=$("lensEs");
 if(!es||!sn)return;
 if(ST.i!==i||es.dataset.n!==String(i)){
  es.dataset.n=i;
  es.innerHTML=sn.w.map((c,j)=>`<span class="fc" data-k="${j}">${esc(c[0])}</span>`).join(" ");
  $("frTr").textContent=stTr(sn);
  $("frRes").innerHTML=ST.res[i]||"";
  $("frCount").textContent="Sentence "+(i+1)+" of "+list.length;
  if(ST.i!==-1)stSay("")}
 ST.i=i;ST.k=k;ST.rt=0;
 es.querySelectorAll(".fc").forEach((el,j)=>{el.classList.toggle("on",j===k);el.classList.toggle("done",j<k)});
 $("frGloss").innerHTML=`<span class="eq">=</span> <span lang="${stLang()}">${esc(stGl(sn.w[k]))}</span>`;
 $("ovBar").style.width=((i+(k+1)/sn.w.length)/list.length*100)+"%"}

function frBind(){
 $("ovBody").onclick=e=>{
  if(!ST)return;
  if(e.target.closest("#frView")){frStop();ST.view="text";frRender();$("frView")&&$("frView").focus();return}
  if(e.target.closest("#frRead")){frRead();return}
  if(e.target.closest("#frHear")){frHear();return}
  const c=e.target.closest(".fc");
  if(c)frJump(ST.i,+c.dataset.k)};
 $("frPlay").onclick=()=>ST.playing?frStop():frLoop();
 $("frPW").onclick=()=>frStep(-1);
 $("frNW").onclick=()=>frStep(1);
 $("frPS").onclick=()=>frSentence(-1);
 $("frNS").onclick=()=>frSentence(1);
 $("frSpeed").onclick=()=>{
  ST.speed=SPEED_ORDER[(SPEED_ORDER.indexOf(ST.speed)+1)%SPEED_ORDER.length];
  store.set("frases-frspeed",ST.speed);$("frSpeed").textContent="Speed: "+SPEEDS[ST.speed].label;
  if(ST.playing&&audio.src&&!audio.src.startsWith("blob:")){audio.defaultPlaybackRate=SPEEDS[ST.speed].rate;audio.playbackRate=SPEEDS[ST.speed].rate}
  stSay("Speed: "+SPEEDS[ST.speed].label+".")};
 $("frVoice").onclick=e=>{ST.voice=!ST.voice;store.set("frases-frvoice",ST.voice);e.currentTarget.setAttribute("aria-pressed",ST.voice);stSay(ST.voice?"Meaning voice on: each word is followed by its "+LN()+" meaning.":"Meaning voice off: Spanish only, the meaning stays on the screen.")};
 $("frWhole").onclick=e=>{ST.whole=!ST.whole;store.set("frases-frwhole",ST.whole);e.currentTarget.setAttribute("aria-pressed",ST.whole);stSay(ST.whole?"After the words, the whole sentence is played once, smoothly.":"The whole sentence is not played after the words.")}}

function frStop(){
 if(!ST)return;
 const was=ST.playing;
 ST.tok=++stTok;ST.playing=false;ST.listening=false;stopAudio();
 const r=ST.rec;ST.rec=null;
 try{r&&r.abort()}catch(e){}
 if(!playing){keepAwake(false);keepStop()}
 if("mediaSession" in navigator&&was)navigator.mediaSession.playbackState="paused";
 frBtns()}

function frJump(i,k){
 if(!ST)return;
 const was=ST.playing;
 frStop();frShow(i,k);
 if(was)frLoop();else frPreview()}

function frStep(d){
 if(!ST)return;
 const list=ST.s.sentences;
 let i=ST.i,k=ST.k+d;
 if(k<0){if(i===0)return;i--;k=list[i].w.length-1}
 else if(k>=list[i].w.length){if(i>=list.length-1)return;i++;k=0}
 frJump(i,k)}

function frSentence(d){
 if(!ST)return;
 const n=ST.i+d,last=ST.s.sentences.length-1;
 if(d<0&&ST.k>0){frJump(ST.i,0);return}
 if(n<0)return;
 if(n>last){
  const now=performance.now();
  if(now-ST.endAsk<4000){frStop();stFinish();return}
  ST.endAsk=now;stSay("That was the last sentence. Tap next again to finish the story.");return}
 frJump(n,0)}

async function frChunk(c,my){
 const sp=()=>SPEEDS[ST.speed];
 await frClip(ckEs(c),sp().rate,spEs(c),"es");
 if(!ST||my!==ST.tok)return false;
 if(ST.voice){
  await gap(sp().gl);
  if(!ST||my!==ST.tok)return false;
  await frClip(ckGl(c),sp().rate,spGl(c),stLang());
  if(!ST||my!==ST.tok)return false}
 return true}

async function frPreview(){
 if(!ST)return;
 const my=ST.tok=++stTok;
 await frChunk(ST.s.sentences[ST.i].w[ST.k],my)}

async function frHear(){
 if(!ST)return;
 frStop();
 const my=ST.tok=++stTok,n=ST.i;
 await frClip(stAudio(ST.s.id,n),SPEEDS[ST.speed].rate,ST.s.sentences[n].es,"es");
 if(ST&&my===ST.tok)stSay("")}

async function frLoop(){
 if(!ST)return;
 frStop();
 const my=ST.tok=++stTok;ST.playing=true;frBtns();
 keepAwake(true);keepStart();frMeta();
 const list=ST.s.sentences;
 let startK=ST.k;
 while(ST&&my===ST.tok){
  const n=ST.i,sn=list[n],full=startK===0;
  for(let k=startK;k<sn.w.length;k++){
   if(!ST||my!==ST.tok)return;
   frShow(n,k);
   if(!(await frChunk(sn.w[k],my)))return;
   await gap(SPEEDS[ST.speed].word);
   if(!ST||my!==ST.tok)return}
  startK=0;
  if(ST.whole){
   await gap(300);
   if(!ST||my!==ST.tok)return;
   await frClip(stAudio(ST.s.id,n),SPEEDS[ST.speed].rate,sn.es,"es");
   if(!ST||my!==ST.tok)return}
  if(full)ST.heard.add(n);
  await gap(SPEEDS[ST.speed].sent);
  if(!ST||my!==ST.tok)return;
  if(n>=list.length-1){frStop();stFinish();return}
  frShow(n+1,0)}}

function frText(){
 const s=ST.s;
 setBody(`<div class="frHead"><div class="frTitle"><b lang="es">${esc(s.title.es)}</b><span class="sub">${esc(stTr(s.title))}</span></div><div class="frTools"><button class="chip" id="frView">Focus view</button></div></div>
 <div id="stBody">${s.sentences.map((sn,n)=>`<div class="sn${n===ST.i?" cur":""}" data-n="${n}"><div class="snEs" lang="es">${esc(sn.es)}</div><div class="snTr">${esc(stTr(sn))}</div></div>`).join("")}</div>`);
 $("ovFoot").innerHTML='<div class="frMsg" id="frMsg" role="status" aria-live="polite">Tap a sentence to open it in the focus view.</div>';
 $("ovBar").style.width=((ST.i+1)/s.sentences.length*100)+"%";
 const cur=document.querySelector("#stBody .sn.cur");
 if(cur&&cur.scrollIntoView)cur.scrollIntoView({block:"center"});
 $("ovBody").onclick=e=>{
  if(!ST)return;
  if(e.target.closest("#frView")){ST.view="lens";ST.k=0;frRender();$("frView")&&$("frView").focus();return}
  const sn=e.target.closest(".sn");
  if(sn){ST.i=+sn.dataset.n;ST.k=0;ST.view="lens";frRender()}}}

function stScore(n,alts){
 const words=ST.s.sentences[n].es.split(/\s+/),exp=words.map(wordKey);
 let best=null;
 alts.forEach(a=>{
  const heard=heardTokens(a),used=heard.map(()=>false);
  const ok=exp.map(w=>{
   if(!w)return true;
   const j=heard.findIndex((h,k)=>!used[k]&&(h===w||(w.length>=5&&lev(h,w)<=1)));
   if(j<0)return false;used[j]=true;return true});
  const c=ok.filter(Boolean).length;
  if(!best||c>best.c)best={ok,c,a}});
 const total=exp.filter(Boolean).length;
 const html=`<div class="rr" lang="es">${words.map((w,i)=>`<span class="${best.ok[i]?"ok":"miss"}">${esc(w)}</span>`).join(" ")}</div><div class="sub">Heard: <span lang="es">${esc(best.a)}</span></div>`;
 ST.res[n]=html;ST.done.add(n);
 const el=$("frRes");
 if(el&&ST.i===n){el.innerHTML=html;if(el.scrollIntoView)el.scrollIntoView({block:"nearest"})}
 const missed=words.filter((w,i)=>!best.ok[i]).map(w=>w.replace(/[.,;:!?¿¡"]+$/g,""));
 stSay(`${best.c} of ${total} words clear.`+(missed.length?` Missed: ${missed.join(", ")}. Hear the whole sentence, then try again.`:" Well read."));
 if(best.c>=total)tick()}

function frRead(){
 if(!ST)return;
 if(ST.listening){try{ST.rec&&ST.rec.stop()}catch(e){}return}
 const n=ST.i,SR=getSR();
 frStop();
 if(!SR){ST.done.add(n);stSay("Speech check is not available here. Read the sentence out loud, then go on.");return}
 const r=new SR();ST.rec=r;ST.listening=true;frBtns();stSay("Listening. Read the sentence out loud.");
 r.lang="es-MX";r.interimResults=false;r.maxAlternatives=3;
 let got=false;
 r.onresult=e=>{got=true;if(!ST||ST.rec!==r)return;stScore(n,[...e.results[0]].map(a=>a.transcript))};
 r.onerror=e=>{
  got=true;if(!ST||ST.rec!==r)return;
  stSay(e.error==="not-allowed"||e.error==="service-not-allowed"?"The microphone is blocked. Allow it in the browser site settings.":e.error==="network"?"Speech check needs a connection. Read it out loud, then go on.":e.error==="aborted"?"":"Did not catch that. Tap Read aloud and try again.")};
 r.onend=()=>{
  if(!ST||ST.rec!==r)return;
  ST.listening=false;ST.rec=null;frBtns();
  if(!got)stSay("Did not catch that. Tap Read aloud and try again.")};
 try{r.start()}catch(x){ST.listening=false;ST.rec=null;frBtns();stSay("Could not start the microphone.")}}

function stFinish(){
 if(!ST)return;
 const s=ST.s;frStop();
 prof.stories=prof.stories&&typeof prof.stories==="object"?prof.stories:{};
 const r=prof.stories[s.id]||{n:0,last:0};
 r.n=(r.n||0)+1;r.last=today();prof.stories[s.id]=r;saveProf();
 const read=ST.done.size,heard=ST.heard.size;
 $("ovBar").style.width="100%";
 setBody(`<div class="sum"><h2>Story done</h2><div class="sub" lang="es" style="font-size:1.1rem">${esc(s.title.es)}</div>
 <div class="mx"><span>Sentences you heard word by word</span><b>${heard} of ${s.sentences.length}</b></div>
 <div class="mx"><span>Sentences you read aloud</span><b>${read} of ${s.sentences.length}</b></div>
 <div class="mx"><span>Times you finished this story</span><b>${r.n}</b></div>
 <p class="sub" style="margin-top:12px">Reading the same story again, aloud, is one of the fastest ways to make the words stick. Try Slow speed first, then Normal.</p></div>`);
 $("ovFoot").innerHTML='<div class="row"><button class="btn sec" id="stDone">Done</button><button class="btn" id="stAgain">Read again</button></div>';
 $("stDone").onclick=closeOv;
 $("stAgain").onclick=()=>openStory(s.id)}

audio.addEventListener("pause",()=>{
 if(!ST||!ST.playing)return;
 setTimeout(()=>{
  if(!ST||!ST.playing||!audio.paused||audio.ended)return;
  ST.rt=(ST.rt||0)+1;
  if(ST.rt>4){frStop();toast("Android stopped the audio. Tap play to continue.");return}
  const pr=audio.play();
  if(pr&&pr.catch)pr.catch(()=>{if(ST&&ST.playing)frStop()})},450)});

$("stList").onclick=e=>{const b=e.target.closest(".mcard");if(b)openStory(b.dataset.sid)};
