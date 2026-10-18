let ST=null,stTok=0;
const stTr=o=>SKL()?o.sk:o.en;
const stGl=c=>SKL()?c[2]:c[1];
const stGlLang=()=>SKL()?"sk":"en";
const stAudio=(id,n,slow)=>"audio/st/"+id+"_"+String(n).padStart(2,"0")+(slow?"_s":"")+".ogg";
const wordKey=w=>norm(w).replace(/[^a-z0-9]/g,"");
const smooth=()=>matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth";

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
 stopAudio();S=null;M=null;stTok++;
 ST={s,i:0,slow:store.get("frases-stslow",false)===true,inter:store.get("frases-stinter",true)!==false,res:{},done:new Set(),all:false,rec:null,listening:false};
 openOv();stRender()}

function stSentenceHtml(sn,n){
 const chunks=sn.w.map((c,k)=>`<span class="wc" data-n="${n}" data-k="${k}"><b lang="es">${esc(c[0])}</b><i lang="${stGlLang()}">${esc(stGl(c))}</i></span>`).join(" ");
 return `<div class="sn${n===ST.i?" cur":""}" data-n="${n}"><div class="snEs">${chunks}</div><div class="snTr" data-n="${n}">${esc(stTr(sn))}</div><div class="snRes" id="snRes${n}">${ST.res[n]||""}</div></div>`}

function stRender(){
 const s=ST.s;
 setBody(`<div class="q">Story · Beginner ${s.level}</div><h2 class="stT" lang="es">${esc(s.title.es)}</h2><div class="sub">${esc(stTr(s.title))}</div>
 <div class="stTools"><button class="chip" id="stInter" aria-pressed="${ST.inter}">Word by word</button><button class="chip" id="stSlow" aria-pressed="${ST.slow}">Slow speech</button><button class="chip" id="stAll">Play story</button></div>
 <div id="stBody" class="${ST.inter?"":"nogloss"}">${s.sentences.map(stSentenceHtml).join("")}</div>`);
 $("ovFoot").innerHTML=`<div class="stGloss" id="stGloss" role="status" aria-live="polite"></div>
 <div class="row"><button class="btn sec" id="stPrev">Back</button><button class="btn sec" id="stHear">Hear it</button><button class="btn" id="stRead" style="flex:1.7">Read it aloud</button><button class="btn sec" id="stNext">Next</button></div>`;
 stSay("Tap a word for its meaning. Tap a translation to hear that sentence.");
 stBind();stSetCur(ST.i,true);stBtns()}

function stSay(msg){const g=$("stGloss");if(g)g.textContent=msg}

function stBind(){
 $("ovBody").onclick=e=>{
  if(!ST)return;
  const t=e.target.closest("#stInter,#stSlow,#stAll");
  if(t){
   if(t.id==="stInter"){ST.inter=!ST.inter;store.set("frases-stinter",ST.inter);t.setAttribute("aria-pressed",ST.inter);$("stBody").classList.toggle("nogloss",!ST.inter)}
   else if(t.id==="stSlow"){ST.slow=!ST.slow;store.set("frases-stslow",ST.slow);t.setAttribute("aria-pressed",ST.slow)}
   else stPlayAll();
   return}
  const w=e.target.closest(".wc"),tr=e.target.closest(".snTr"),sn=e.target.closest(".sn");
  if(w){
   const n=+w.dataset.n,c=ST.s.sentences[n].w[+w.dataset.k];
   stSetCur(n);const g=$("stGloss");g.innerHTML=`<b lang="es">${esc(c[0])}</b> = <span lang="${stGlLang()}">${esc(stGl(c))}</span>`;return}
  if(tr){stPlay(+tr.dataset.n);return}
  if(sn)stSetCur(+sn.dataset.n)};
 $("stPrev").onclick=()=>stMove(-1);
 $("stNext").onclick=()=>stMove(1);
 $("stHear").onclick=()=>stPlay(ST.i);
 $("stRead").onclick=stRead}

function stSetCur(n,quiet){
 if(!ST)return;
 ST.i=n;
 document.querySelectorAll("#stBody .sn").forEach(x=>x.classList.toggle("cur",+x.dataset.n===n));
 const last=ST.s.sentences.length-1;
 const nx=$("stNext"),pv=$("stPrev");
 if(nx)nx.textContent=n>=last?"Finish":"Next";
 if(pv)pv.disabled=n===0;
 $("ovBar").style.width=((n+1)/ST.s.sentences.length*100)+"%";
 if(quiet)return;
 const el=document.querySelector(`#stBody .sn[data-n="${n}"]`);
 if(el&&el.scrollIntoView)el.scrollIntoView({block:"center",behavior:smooth()})}

function stStopAll(){
 if(!ST)return;
 stTok++;ST.all=false;ST.listening=false;stopAudio();
 const r=ST.rec;ST.rec=null;
 try{r&&r.abort()}catch(e){}
 stBtns()}

function stBtns(){
 if(!ST)return;
 const a=$("stAll"),r=$("stRead");
 if(a)a.textContent=ST.all?"Stop":"Play story";
 if(r)r.textContent=ST.listening?"Listening...":"Read it aloud"}

async function stPlay(n){
 if(!ST)return;
 stStopAll();stSetCur(n);const my=stTok;
 await playSrc(stAudio(ST.s.id,n,ST.slow),ST.s.sentences[n].es);
 return my===stTok}

async function stPlayAll(){
 if(!ST)return;
 if(ST.all){stStopAll();return}
 stStopAll();ST.all=true;stBtns();const my=stTok,list=ST.s.sentences;
 for(let n=ST.i;n<list.length&&ST.all&&my===stTok;n++){
  stSetCur(n);
  await playSrc(stAudio(ST.s.id,n,ST.slow),list[n].es);
  if(my!==stTok||!ST)return;
  await gap(ST.slow?1100:750);
  if(my!==stTok||!ST)return}
 if(ST&&my===stTok){ST.all=false;stBtns();stFinish()}}

function stMove(d){
 if(!ST)return;
 const n=ST.i+d;
 if(n<0)return;
 stStopAll();
 if(n>=ST.s.sentences.length){stFinish();return}
 stSetCur(n)}

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
 const el=$("snRes"+n);if(el)el.innerHTML=html;
 const missed=words.filter((w,i)=>!best.ok[i]);
 stSay(`${best.c} of ${total} words clear.`+(missed.length?` Missed: ${missed.join(", ")}. Hear it, then try again.`:" Well read."));
 if(best.c>=total)tick()}

function stRead(){
 if(!ST)return;
 if(ST.listening){try{ST.rec&&ST.rec.stop()}catch(e){}return}
 const n=ST.i,SR=getSR();
 stStopAll();
 if(!SR){ST.done.add(n);stSay("Speech check is not available here. Read the sentence out loud, then tap Next.");return}
 const r=new SR();ST.rec=r;ST.listening=true;stBtns();stSay("Listening. Read the sentence out loud.");
 r.lang="es-MX";r.interimResults=false;r.maxAlternatives=3;
 let got=false;
 r.onresult=e=>{got=true;if(!ST||ST.rec!==r)return;stScore(n,[...e.results[0]].map(a=>a.transcript))};
 r.onerror=e=>{
  got=true;if(!ST||ST.rec!==r)return;
  stSay(e.error==="not-allowed"||e.error==="service-not-allowed"?"The microphone is blocked. Allow it in the browser site settings.":e.error==="network"?"Speech check needs a connection. Read it out loud, then tap Next.":e.error==="aborted"?"":"Did not catch that. Tap Read it aloud and try again.")};
 r.onend=()=>{
  if(!ST||ST.rec!==r)return;
  ST.listening=false;ST.rec=null;stBtns();
  if(!got)stSay("Did not catch that. Tap Read it aloud and try again.")};
 try{r.start()}catch(x){ST.listening=false;ST.rec=null;stBtns();stSay("Could not start the microphone.")}}

function stFinish(){
 if(!ST)return;
 const s=ST.s;stStopAll();
 prof.stories=prof.stories&&typeof prof.stories==="object"?prof.stories:{};
 const r=prof.stories[s.id]||{n:0,last:0};
 r.n=(r.n||0)+1;r.last=today();prof.stories[s.id]=r;saveProf();
 const read=ST.done.size;
 $("ovBar").style.width="100%";
 setBody(`<div class="sum"><h2>Story done</h2><div class="sub" lang="es" style="font-size:1.1rem">${esc(s.title.es)}</div>
 <div class="mx"><span>Sentences you read aloud</span><b>${read} of ${s.sentences.length}</b></div>
 <div class="mx"><span>Times you finished this story</span><b>${r.n}</b></div>
 <p class="sub" style="margin-top:12px">Reading the same story again, aloud, is one of the fastest ways to make the words stick. Try the slow speech, then the normal one.</p></div>`);
 $("ovFoot").innerHTML='<div class="row"><button class="btn sec" id="stDone">Done</button><button class="btn" id="stAgain">Read again</button></div>';
 $("stDone").onclick=closeOv;
 $("stAgain").onclick=()=>openStory(s.id)}

audio.addEventListener("pause",()=>{
 if(!ST||!ST.all)return;
 setTimeout(()=>{if(ST&&ST.all&&audio.paused&&!audio.ended)stStopAll()},450)});

$("stList").onclick=e=>{const b=e.target.closest(".mcard");if(b)openStory(b.dataset.sid)};
