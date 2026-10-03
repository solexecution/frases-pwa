const RR=["Basics","Networking","Dating","Solar","Social","Out & about","Conversation","Understanding","Plans","Opinions","Work"];
let S=null,M=null;
const starsHtml=n=>[0,1,2].map(i=>SVG.star.replace("<svg",`<svg class="${i<n?"on":"off"}"`)).join("");
const avatar=m=>`<span class="avatar">${esc(m.who.replace(/^(Sr\.|Doña)\s*/,"").charAt(0))}</span>`;
const core=w=>w.replace(/^[¿¡"'(«]+|[?!.,…:;"')»]+$/g,"");

function pickNew(pool,n){
 const g={};pool.forEach(p=>(g[p.cat]=g[p.cat]||[]).push(p));
 const order=RR.filter(c=>g[c]);const out=[];
 while(out.length<n&&order.some(c=>g[c].length)){for(const c of order){if(out.length>=n)break;if(g[c].length)out.push(g[c].shift())}}
 return out}
const unseenPool=cats=>P.filter(p=>!srs[p.i]&&(cats?cats.includes(p.cat):(set.focus==="All"||p.cat===set.focus)));

function lev(a,b){
 if(Math.abs(a.length-b.length)>3)return 9;
 let prev=Array.from({length:b.length+1},(_,j)=>j);
 for(let i=1;i<=a.length;i++){const cur=[i];
  for(let j=1;j<=b.length;j++)cur[j]=Math.min(prev[j]+1,cur[j-1]+1,prev[j-1]+(a[i-1]===b[j-1]?0:1));
  prev=cur}
 return prev[b.length]}
function similar(a,b){const x=norm(core(a)),y=norm(core(b));return x===y||x.startsWith(y)||y.startsWith(x)||lev(x,y)<=3}
function conflictSet(p){const s=new Set([p.i]);(PAIRS[p.i]||[]).forEach(x=>s.add(x[0]));
 (PAIRS[p.i]||[]).forEach(x=>{if(x[1]==="Alternative")(PAIRS[x[0]]||[]).forEach(y=>{if(y[1]==="Alternative")s.add(y[0])})});
 P.forEach(x=>{if(x.i!==p.i&&(norm(x.en)===norm(p.en)||similar(x.es,p.es)||similar(x.en,p.en)))s.add(x.i)});return s}
function lures(p,key,n){
 const bad=conflictSet(p),sig=s=>[/[?¿]/.test(s),/…|\.\.\./.test(s),/[!¡]/.test(s),/,/.test(s),/\d/.test(s)].join(),wc=s=>s.trim().split(/\s+/).length;
 const pool=shuffle(P.filter(x=>!bad.has(x.i)));
 const ord=[...pool.filter(x=>x.cat===p.cat),...pool.filter(x=>x.cat!==p.cat)];
 const q=x=>sig(x[key])===sig(p[key]),d=x=>Math.abs(wc(x[key])-wc(p[key]));
 const tiers=[x=>q(x)&&d(x)<=1,x=>q(x)&&d(x)<=2,x=>q(x),()=>true];
 const out=[],seen=new Set([norm(p[key])]);
 for(const f of tiers){for(const x of ord){if(out.length>=n)break;const v=norm(x[key]);if(seen.has(v)||!f(x))continue;seen.add(v);out.push(x)}if(out.length>=n)break}
 return out}
function renderChoices(labels,ci,cb){
 const ch=$("chs");
 const lock=()=>[...ch.querySelectorAll("button")].forEach(x=>{x.disabled=true});
 labels.forEach((t,k)=>{const b=document.createElement("button");b.textContent=t;
  b.onclick=()=>{lock();const ok=k===ci;b.classList.add(ok?"good":"bad");if(!ok)ch.children[ci].classList.add("good");cb(ok,false)};
  ch.appendChild(b)});
 const ns=document.createElement("button");ns.className="ns";ns.textContent="Not sure";
 ns.onclick=()=>{lock();ch.children[ci].classList.add("good");cb(false,true)};
 ch.appendChild(ns)}

function openOv(){$("ov").hidden=false;$("ovBody").innerHTML="";$("ovBody").onclick=null;$("ovBody").classList.remove("hint");$("ovFoot").innerHTML="";$("ovBar").style.width="0";document.body.style.overflow="hidden"}
function closeOv(){stopAudio();$("ov").hidden=true;document.body.style.overflow="";S=null;M=null;if(reloadWanted){location.reload();return}go(st.tab)}
function setBody(h){$("ovBody").onclick=null;$("ovBody").classList.remove("hint");$("ovBody").innerHTML=h;$("ovBody").scrollTop=0}
$("ovX").onclick=()=>{
 const live=(S&&S.i<S.steps.length)||(M&&M.i<M.m.steps.length);
 if(!live){closeOv();return}
 ask("Leave this one?","Answers so far are saved.","Leave",closeOv,"bad")};

function qType(p){
 const e=SRS.get(srs,p.i),box=e?e.box:0,n=p.es.split(/\s+/).length;
 const f=SRS.formatsFor(box,n,MUST.has(p.i));
 if(e&&e.u&&f.includes("build"))return "build";
 return f[Math.random()*f.length|0]}
function queueRetry(p,fmt){S.steps.splice(Math.min(S.i+6,S.steps.length),0,{k:fmt,p})}
const tagHtml=p=>p.note?`<div class="tag">${esc(p.note)}</div>`:"";

function startSession(kind){
 const t=today(),all=ids();let due=[],fresh=[],practice=false,waiting=0;
 if(kind==="extra"){
  practice=true;
  due=all.filter(i=>srs[i]&&(srs[i][0]<=2||(srs[i][3]||0)>0)).sort((a,b)=>srs[a][0]-srs[b][0]||(srs[b][3]||0)-(srs[a][3]||0)).slice(0,10).map(i=>P[i]);
 }else if(kind==="prep"){
  due=all.filter(i=>srs[i]&&PREP.includes(P[i].cat)).sort((a,b)=>(srs[a][1]<=t?0:1)-(srs[b][1]<=t?0:1)||srs[a][0]-srs[b][0]).slice(0,9).map(i=>P[i]);
  const np=todayPlan("daily");
  fresh=np.catchup||np.overload?[]:pickNew(unseenPool(PREP),Math.max(0,Math.min(3,SRS.NEW_CAP-newToday())));
 }else{
  const pl=todayPlan(kind);
  if(pl.catchup){SRS.spread(srs,all,t,pl.capacity);saveSrs()}
  due=pl.due.map(i=>P[i]);waiting=pl.waiting;
  fresh=pl.newAllowed?pickNew(unseenPool(),pl.newAllowed):[];
 }
 if(!due.length&&!fresh.length){toast(kind==="extra"?"Nothing weak to practise right now.":"Nothing is due right now.");return}
 const mk=p=>({k:qType(p),p});
 const dd=shuffle(due),half=Math.ceil(dd.length/2);
 const steps=[...dd.slice(0,half).map(mk),...fresh.map(p=>({k:"intro",p})),...dd.slice(half).map(mk),...fresh.map(mk)];
 if((kind==="daily"||kind==="prep"||kind==="extra")&&steps.length>=6)steps.splice(Math.floor(steps.length/2),0,{k:"sayBlock"});
 M=null;S={kind,steps,i:0,first:{},failed:new Set(),retried:new Set(),fresh:fresh.length,waiting,practice,trials:0,scored:0,active:0,start:Date.now(),t0:0,slowTap:false,dueIds:due.map(p=>p.i)};
 openOv();nextStep()}
function sayCards(){
 const f=[...S.failed].map(i=>P[i]);
 const rest=S.dueIds.filter(i=>i in S.first&&!S.failed.has(i)&&srs[i]&&srs[i][0]>=2).map(i=>P[i]);
 return [...f,...shuffle(rest)].slice(0,4)}
function nextStep(){
 if(!S)return;
 let s=S.steps[S.i];
 while(s&&s.k==="sayBlock"){S.steps.splice(S.i,1,...sayCards().map(p=>({k:"say",p})));s=S.steps[S.i]}
 if(!s){finishSession();return}
 $("ovBar").style.width=(S.i/S.steps.length*100)+"%";$("ovFoot").innerHTML="";
 S.t0=performance.now();S.slowTap=false;
 ({intro:rIntro,listen:rListen,pickEs:rPickEs,build:rBuild,say:rSay})[s.k](s.p)}
function feedback(ok,p,ns){
 $("ovFoot").innerHTML=`<div class="fb ${ok?"ok":"bad"}">${ok?"Correct":ns?"No problem":"Not quite"}<small>${esc(p.es)} = ${esc(p.en)}${ok?"":"<br>Say it out loud once."}</small></div><button class="btn block" id="ovNext">Continue</button>`;
 $("ovNext").onclick=()=>{S.i++;nextStep()};
 sayPhrase(p.i,false)}
function grade(ok,p,fmt,ns){
 const ms=Math.round(performance.now()-S.t0),good=ok&&!ns,wasNew=!srs[p.i];
 const r=SRS.answer(srs,p.i,good,fmt,today(),{n:p.es.split(/\s+/).length,must:MUST.has(p.i),notSure:false,practice:S.practice});
 saveSrs();
 if(wasNew){const d=today();prof.newLog[d]=(prof.newLog[d]||0)+1}
 if(!S.practice&&(r.credited||r.demoted))prof.lastSess=today();
 S.active+=ms+4000;saveProf();
 const first=!(p.i in S.first);if(first)S.first[p.i]=good;
 logRow([Date.now(),p.i,fmt,ns?2:good?1:0,ms,r.box0,r.box1,(r.credited?1:0)|(r.due?2:0)|(S.slowTap?4:0)|(S.practice?16:0)|(first?0:32)]);
 S.trials++;if(r.credited||r.demoted)S.scored++;
 if(!good){S.failed.add(p.i);if(!S.retried.has(p.i)){S.retried.add(p.i);queueRetry(p,fmt)}}
 else tick();
 feedback(good,p,ns)}

const introPairs=p=>{
 const ok=["Answer","Question","Goes with"];
 const l=(PAIRS[p.i]||[]).filter(x=>ok.includes(x[1])&&srs[x[0]]).slice(0,2);
 return l.length?`<div class="prs"><div class="q" style="margin:18px 0 2px">Pairs with</div>${l.map(x=>`<div class="pr" data-j="${x[0]}"><span class="pl">${esc(x[1])}</span>${esc(P[x[0]].es)}<span class="pe"> ${esc(P[x[0]].en)}</span></div>`).join("")}</div>`:""};
function rIntro(p){
 const m=groupMaps(p);
 setBody(`<div class="q">New phrase</div><div class="big">${wordsHTML(m.esT,m.esG)}</div><div class="bigen">${wordsHTML(m.enT,m.enG)}</div>${tagHtml(p)}${introPairs(p)}<div class="hear" style="margin-top:22px"><button class="hearb" id="iPlay" aria-label="Hear">${SVG.say}</button><button class="hearb sm" id="iSlow" aria-label="Slow">Slow</button></div><div class="sub center">Tap any word to see its match.</div>`);
 $("ovBody").onclick=e=>{const r=e.target.closest(".pr");if(r){sayPhrase(+r.dataset.j,false);return}const w=e.target.closest(".w");if(w&&w.dataset.g!=null)hlGroup(+w.dataset.g,$("ovBody"))};
 $("iPlay").onclick=()=>sayPhrase(p.i,false);$("iSlow").onclick=()=>sayPhrase(p.i,true);
 $("ovFoot").innerHTML='<button class="btn block" id="ovNext">Got it</button>';
 $("ovNext").onclick=()=>{tick();S.i++;nextStep()};
 sayPhrase(p.i,false)}
function rListen(p){
 const opts=shuffle([p,...lures(p,"en",3)]);
 setBody(`<div class="q">Listen. What does it mean?</div><div class="hear"><button class="hearb" id="qPlay" aria-label="Hear">${SVG.say}</button><button class="hearb sm" id="qSlow" aria-label="Slow">Slow</button></div><div class="ch" id="chs"></div>`);
 $("qPlay").onclick=()=>sayPhrase(p.i,false);$("qSlow").onclick=()=>{S.slowTap=true;sayPhrase(p.i,true)};
 renderChoices(opts.map(x=>x.en),opts.indexOf(p),(ok,ns)=>grade(ok,p,"listen",ns));
 sayPhrase(p.i,false)}
function rPickEs(p){
 const opts=shuffle([p,...lures(p,"es",3)]);
 setBody(`<div class="q">How do you say it?</div><div class="big">${esc(p.en)}</div>${tagHtml(p)}<div class="ch" id="chs"></div>`);
 renderChoices(opts.map(x=>x.es),opts.indexOf(p),(ok,ns)=>grade(ok,p,"pickEs",ns))}
function rBuild(p){
 const lab=p.es.split(/\s+/).map(w=>core(w).toLowerCase()).filter(Boolean);
 const have=new Set(lab.map(norm)),dec=[],nd=lab.length>=3?2:4;
 for(const x of shuffle(P.filter(x=>x.i!==p.i))){
  for(const w of x.es.split(/\s+/)){const c=core(w).toLowerCase();if(c&&!have.has(norm(c))){have.add(norm(c));dec.push(c);break}}
  if(dec.length>=nd)break}
 const all=[...lab,...dec],items=shuffle(all.map((w,i)=>({w,i})));
 const target=lab.map(norm).join(" ");
 let order=[],done=false;
 setBody(`<div class="q">Build the sentence</div><div class="big">${esc(p.en)}</div>${tagHtml(p)}<div class="ans" id="bAns"></div><div class="bank" id="bBank"></div>`);
 const draw=()=>{
  $("bAns").innerHTML=order.map(k=>`<button class="tk" data-a="${k}">${esc(all[k])}</button>`).join("");
  $("bBank").innerHTML=items.map(x=>`<button class="tk ${order.includes(x.i)?"used":""}" data-k="${x.i}">${esc(x.w)}</button>`).join("");
  $("ovFoot").innerHTML=`<div class="row"><button class="btn sec" id="bNs">Not sure</button><button class="btn" id="bCheck" ${order.length?"":"disabled"}>Check</button></div>`;
  $("bNs").onclick=()=>{done=true;grade(false,p,"build",true)};
  $("bCheck").onclick=()=>{done=true;grade(order.map(k=>norm(all[k])).join(" ")===target,p,"build",false)}};
 $("ovBody").onclick=e=>{if(done)return;
  const a=e.target.closest("[data-a]"),k=e.target.closest("[data-k]");
  if(a){order=order.filter(x=>x!==+a.dataset.a);tick();draw()}
  else if(k&&!order.includes(+k.dataset.k)){order.push(+k.dataset.k);tick();draw()}};
 draw()}
function rSay(p){
 setBody(`<div class="q">Say it out loud</div><div class="big center">${esc(p.en)}</div>${tagHtml(p)}<div class="center say"><div class="mic">${SVG.mic}</div><div class="sub">Say it in Spanish out loud, then tap the button.</div></div><div id="sayAns" class="center" style="margin-top:14px"></div>`);
 $("ovFoot").innerHTML='<div class="row"><button class="btn sec" id="sSkip">Cannot speak now</button><button class="btn" id="sSaid">I said it</button></div>';
 $("sSkip").onclick=()=>{S.i++;nextStep()};
 $("sSaid").onclick=()=>{
  $("sayAns").innerHTML=`<div class="big">${esc(p.es)}</div>`;sayPhrase(p.i,false);
  $("ovFoot").innerHTML='<div class="row"><button class="btn sec" id="sNo">Missed it</button><button class="btn" id="sYes">Got it</button></div>';
  const finish=ok=>{
   const ms=Math.round(performance.now()-S.t0),e0=SRS.get(srs,p.i);S.active+=ms+4000;
   const r=ok?{box0:e0?e0.box:0,box1:e0?e0.box:0}:SRS.answer(srs,p.i,false,"say",today(),{n:1,must:false,notSure:false,practice:S.practice});
   if(!ok)saveSrs();
   logRow([Date.now(),p.i,"say",ok?1:0,ms,r.box0,r.box1,0]);S.i++;nextStep()};
  $("sYes").onclick=()=>finish(true);$("sNo").onclick=()=>finish(false)}}

function finishSession(){
 const t=today();
 const need=S.kind==="two"||S.kind==="back"?Math.max(1,Math.min(5,S.dueIds.length)):5;
 if(!S.practice&&S.scored>=need)markReview();
 prof.sessions++;if(!S.practice)prof.lastSess=t;prof.sess.push([Date.now(),S.trials,S.active]);
 if(prof.sess.length>40)prof.sess=prof.sess.slice(-40);
 saveProf();flushLog();
 const total=Object.keys(S.first).length,right=Object.values(S.first).filter(Boolean).length;
 const tomorrow=Object.values(srs).filter(e=>e[1]===t+1).length;
 const left=SRS.dueList(srs,ids(),t).length;
 $("ovBar").style.width="100%";
 setBody(`<div class="sum"><h2>${S.practice?"Practice done":"Session done"}</h2>
 <div class="mx"><span>Right on the first try</span><b>${right} of ${total}</b></div>
 <div class="mx"><span>Phrases coming back tomorrow</span><b>${tomorrow}</b></div>
 <div class="mx"><span>New phrases added</span><b>${S.fresh}</b></div>
 <div class="mx"><span>Still waiting</span><b>${left}</b></div>
 <div class="mx"><span>Practised in the last 14 days</span><b>${practisedDays()} day${practisedDays()===1?"":"s"}</b></div>
 ${S.practice?'<p class="sub" style="margin-top:12px">Practice never moves a phrase up. Missed phrases are scheduled for tomorrow.</p>':""}</div>`);
 $("ovFoot").innerHTML='<div class="row"><button class="btn sec" id="sDone">Done</button><button class="btn" id="sMore">Extra practice</button></div>';
 $("sDone").onclick=closeOv;$("sMore").onclick=()=>startSession("extra")}

function renderMissions(){
 $("mList").innerHTML=MISS.map(m=>{const s=prof.missions[m.id]||0;
  return `<button class="mcard" data-id="${m.id}">${avatar(m)}<span class="mt"><b>${esc(m.title)}</b><span class="sub">${esc(m.who)} · ${m.steps.length} replies</span><br><span class="tag">${esc(m.cat)}</span></span><span class="stars">${starsHtml(s)}</span></button>`}).join("")}
$("mList").onclick=e=>{const b=e.target.closest(".mcard");if(b)startMission(b.dataset.id)};

function startMission(id){
 const m=MISS.find(x=>x.id===id);if(!m)return;
 S=null;M={m,i:0,wrong:0,right:0};
 openOv();
 setBody(`<div class="sum"><div class="em">${avatar(m)}</div><h2>${esc(m.title)}</h2><p class="sub">${esc(m.intro)}</p><p class="sub">You are talking to <b>${esc(m.who)}</b>. Listen first, then pick your reply. The text is hidden until you answer; the eye button shows it.</p></div>`);
 $("ovFoot").innerHTML='<button class="btn block" id="mGo">Start</button>';
 $("mGo").onclick=mStep}
function mStep(){
 if(!M)return;
 const m=M.m;
 if(M.i>=m.steps.length){mFinish();return}
 const s=m.steps[M.i],opts=shuffle(s.opts);
 $("ovBar").style.width=(M.i/m.steps.length*100)+"%";$("ovFoot").innerHTML="";
 M.hint=false;M.t0=performance.now();
 setBody(`<div class="who">${avatar(m)}${esc(m.who)}</div><div class="bub"><div class="npcq" id="mQ">Listen, then choose your reply.</div><div class="big" id="mEs" style="font-size:1.5rem;display:none">${esc(s.npc.es)}</div><div class="bigen" id="mEn" style="display:none">${esc(s.npc.en)}</div></div><div class="hear" style="margin:0 0 10px"><button class="hearb sm" id="mReplay" aria-label="Replay">${SVG.say}</button><button class="hearb sm" id="mHint" aria-label="Show text">${SVG.eye}</button></div><div class="ch" id="chs"></div>`);
 const ch=$("chs"),reveal=()=>{$("ovBody").classList.add("hint");$("mQ").style.display="none";$("mEs").style.display="block";$("mEn").style.display="block"};
 opts.forEach(o=>{const b=document.createElement("button");b.innerHTML=`${esc(o.es)}<span class="tr">${esc(o.en)}</span>`;
  b.onclick=()=>{
   [...ch.querySelectorAll("button")].forEach(x=>{x.disabled=true});
   const ok=!!o.ok;b.classList.add(ok?"good":"bad");
   if(ok){if(!M.hint)M.right++;tick()}
   else{M.wrong++;ch.children[opts.findIndex(x=>x.ok)].classList.add("good")}
   logRow([Date.now(),-1,"m:"+m.id+":"+M.i,ok?1:0,Math.round(performance.now()-M.t0),0,0,M.hint?8:0]);
   reveal();playSrc("audio/"+o.a,o.es);
   $("ovFoot").innerHTML=`<div class="fb ${ok?"ok":"bad"}">${ok?"Correct":"Not quite"}<small>${esc(s.why)}</small></div><button class="btn block" id="mNext">Continue</button>`;
   $("mNext").onclick=()=>{M.i++;mStep()}};
  ch.appendChild(b)});
 $("mReplay").onclick=()=>playSrc("audio/"+s.npc.a,s.npc.es);
 $("mHint").onclick=()=>{M.hint=true;reveal()};
 playSrc("audio/"+s.npc.a,s.npc.es)}
function mFinish(){
 const m=M.m,stars=M.wrong===0?3:M.wrong===1?2:1;
 prof.missions[m.id]=Math.max(prof.missions[m.id]||0,stars);
 const pl=todayPlan("daily");
 if(pl.dueTotal*SRS.COST.due<=SRS.budgetTrials(set.budget,secPerTrial()))markReview();
 saveProf();flushLog();
 $("ovBar").style.width="100%";
 setBody(`<div class="sum"><div class="em">${avatar(m)}</div><h2>Mission done</h2><div class="stars big">${starsHtml(stars)}</div><div class="sub">${esc(m.title)}</div>
 <div class="mx"><span>Right on the first try, no text shown</span><b>${M.right} of ${m.steps.length}</b></div>
 <div class="mx"><span>Reviews still due today</span><b>${pl.dueTotal}</b></div>
 <p class="sub" style="margin-top:12px">A mission counts toward Reviews done only when your due reviews are under today's budget.</p></div>`);
 $("ovFoot").innerHTML='<div class="row"><button class="btn sec" id="mDone">Done</button><button class="btn" id="mAgain">Play again</button></div>';
 $("mDone").onclick=closeOv;$("mAgain").onclick=()=>startMission(m.id)}
