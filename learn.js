const RR=["Basics","Networking","Dating","Solar","Social","Out & about","Conversation","Understanding","Plans","Opinions","Work"];
const BADGES=[
 {id:"first",n:"First step",d:"Finish a session",t:()=>prof.sessions>=1},
 {id:"s3",n:"3-day streak",d:"3 days in a row",t:()=>prof.best>=3},
 {id:"s7",n:"7-day streak",d:"A full week",t:()=>prof.best>=7},
 {id:"s30",n:"30-day streak",d:"A whole month",t:()=>prof.best>=30},
 {id:"x500",n:"500 XP",d:"Earn 500 XP",t:()=>prof.xp>=500},
 {id:"x2000",n:"2000 XP",d:"Earn 2000 XP",t:()=>prof.xp>=2000},
 {id:"c50",n:"50 phrases",d:"Meet 50 phrases",t:()=>seenCount()>=50},
 {id:"c150",n:"150 phrases",d:"Meet 150 phrases",t:()=>seenCount()>=150},
 {id:"perfect",n:"Flawless",d:"A perfect session",t:()=>prof.perfect>=1},
 {id:"solar",n:"Solar pro",d:"Master 12 solar phrases",t:()=>mastered("Solar")>=12},
 {id:"dating",n:"Smooth talker",d:"Master 12 dating phrases",t:()=>mastered("Dating")>=12},
 {id:"net",n:"Networker",d:"Master 12 networking phrases",t:()=>mastered("Networking")>=12},
 {id:"m1",n:"Role player",d:"Finish a mission",t:()=>Object.keys(prof.missions).length>=1},
 {id:"m8",n:"Mission master",d:"3 stars on every mission",t:()=>MISS.length>0&&MISS.every(m=>(prof.missions[m.id]||0)>=3)}
];
let S=null,M=null;
const starsHtml=n=>[0,1,2].map(i=>SVG.star.replace("<svg",`<svg class="${i<n?"on":"off"}"`)).join("");
const avatar=m=>`<span class="avatar">${esc(m.who.replace(/^(Sr\.|Doña)\s*/,"").charAt(0))}</span>`;

function checkBadges(){const out=[];
 BADGES.forEach(b=>{if(!prof.badges.includes(b.id)&&b.t()){prof.badges.push(b.id);out.push(b)}});
 if(out.length)saveProf();return out}
const badgeHtml=nb=>nb.length?`<div class="card"><div class="lab">New badge${nb.length>1?"s":""}</div>${nb.map(b=>`<div style="padding:4px 0"><span class="mini">${SVG.star}</span> <b>${esc(b.n)}</b> <span class="sub">${esc(b.d)}</span></div>`).join("")}</div>`:"";

function pickNew(pool,n){
 const g={};pool.filter(p=>!srs[p.i]).forEach(p=>(g[p.cat]=g[p.cat]||[]).push(p));
 const order=RR.filter(c=>g[c]);const out=[];
 while(out.length<n&&order.some(c=>g[c].length)){for(const c of order){if(out.length>=n)break;if(g[c].length)out.push(g[c].shift())}}
 return out}
function plan(kind){
 const t=today();
 const all=P.filter(p=>!known.has(p.i));
 const prep=kind==="prep";
 const pool=prep?all.filter(p=>PREP.includes(p.cat)):(set.focus==="All"?all:all.filter(p=>p.cat===set.focus));
 const due=pool.filter(p=>srs[p.i]&&srs[p.i][1]<=t).sort((a,b)=>srs[a.i][1]-srs[b.i][1]).slice(0,prep?5:8);
 const fresh=pickNew(pool,prep?4:kind==="more"?3:set.newPerDay);
 const used=new Set([...due,...fresh].map(p=>p.i));
 const need=(prep?9:10)-due.length-fresh.length;
 const fill=need>0?shuffle(pool.filter(p=>srs[p.i]&&!used.has(p.i))).slice(0,need):[];
 return {due,fresh,fill}}

function openOv(){$("ov").hidden=false;$("ovBody").innerHTML="";$("ovBody").onclick=null;$("ovBody").classList.remove("hint");$("ovFoot").innerHTML="";$("ovCombo").textContent="";$("ovBar").style.width="0";document.body.style.overflow="hidden"}
function closeOv(){stopAudio();$("ov").hidden=true;document.body.style.overflow="";S=null;M=null;go(st.tab)}
function setBody(h){$("ovBody").onclick=null;$("ovBody").innerHTML=h;$("ovBody").scrollTop=0}
$("ovX").onclick=()=>{
 const live=(S&&S.i<S.steps.length)||(M&&M.i<M.m.steps.length);
 if(!live){closeOv();return}
 ask("Leave this one?","Answers so far are saved. The streak only counts when you finish.","Leave",closeOv,"bad")};

const core=w=>w.replace(/^[¿¡"'(«]+|[?!.,…:;"')»]+$/g,"");
function qType(p){
 const e=srs[p.i],box=e?e[0]:0,n=p.es.split(/\s+/).length;
 const o=["listen","pickEs"];
 if(box>=1&&n>=2)o.push("fill");
 if(box>=1&&n>=2&&n<=8)o.push("build");
 if(box>=3&&n>=2){o.push("fill");if(n<=8)o.push("build")}
 if(box>=1&&(PAIRS[p.i]||[]).length){o.push("pair");if(box>=3)o.push("pair")}
 return o[Math.random()*o.length|0]}
function queueRetry(p){
 const n=p.es.split(/\s+/).length;
 const t=["listen","pickEs","fill"];if(n>=2&&n<=8)t.push("build");
 let at=S.steps.findIndex((s,i)=>i>S.i&&s.k==="say");if(at<0)at=S.steps.length;
 S.steps.splice(at,0,{k:t[Math.random()*t.length|0],p})}
function distract(p,key,n){
 const pool=shuffle(P.filter(x=>x.i!==p.i&&norm(x.en)!==norm(p.en)&&norm(x.es)!==norm(p.es)));
 const ordered=[...pool.filter(x=>x.cat===p.cat),...pool.filter(x=>x.cat!==p.cat)];
 const seen=new Set([norm(p[key])]),out=[];
 for(const x of ordered){const v=norm(x[key]);if(seen.has(v))continue;seen.add(v);out.push(x);if(out.length>=n)break}
 return out}
function renderChoices(labels,ci,cb){
 const ch=$("chs");
 labels.forEach((t,k)=>{const b=document.createElement("button");b.textContent=t;
  b.onclick=()=>{[...ch.children].forEach(x=>{x.disabled=true});const ok=k===ci;b.classList.add(ok?"good":"bad");if(!ok)ch.children[ci].classList.add("good");cb(ok)};
  ch.appendChild(b)})}

function startSession(kind){
 const pl=plan(kind);
 const cards=[...pl.fresh,...pl.due,...pl.fill];
 if(!cards.length){toast("Nothing to practice here. Try another focus on Today.");return}
 const steps=[];
 if(kind!=="prep")pl.fresh.forEach(p=>steps.push({k:"intro",p}));
 shuffle(cards).forEach(p=>steps.push({k:qType(p),p}));
 shuffle(cards).slice(0,Math.min(3,cards.length)).forEach(p=>steps.push({k:"say",p}));
 M=null;S={kind,steps,i:0,xp:0,right:0,wrong:0,combo:0,best:0,failed:new Set(),retried:new Set(),lvl0:lvl(prof.xp),fresh:pl.fresh.length};
 openOv();nextStep()}
function nextStep(){
 if(!S)return;
 if(S.i>=S.steps.length){finishSession();return}
 const s=S.steps[S.i];
 $("ovBar").style.width=(S.i/S.steps.length*100)+"%";
 $("ovCombo").textContent=S.combo>=2?"×"+S.combo:"";
 $("ovFoot").innerHTML="";
 S.extra=null;S.extraJ=null;
 ({intro:rIntro,pair:rPair,listen:rListen,pickEs:rPickEs,fill:rFill,build:rBuild,say:rSay})[s.k](s.p)}
const praise=()=>["¡Perfecto!","¡Muy bien!","¡Excelente!","¡Así se hace!","¡Eso es!"][Math.random()*5|0];
function feedback(ok,p){
 $("ovFoot").innerHTML=`<div class="fb ${ok?"ok":"bad"}">${ok?praise():"Not quite"}<small>${esc(p.es)} = ${esc(p.en)}${S.extra?"<br>"+S.extra:""}</small></div><button class="btn block" id="ovNext">Continue</button>`;
 $("ovNext").onclick=()=>{S.i++;nextStep()};
 sayPhrase(p.i,false).then(()=>{if(S&&S.extraJ!=null)sayPhrase(S.extraJ,false)})}
function grade(ok,p){
 if(ok){
  S.combo++;S.best=Math.max(S.best,S.combo);S.right++;
  const g=10+2*Math.min(S.combo-1,5);S.xp+=g;addXp(g);
  if(!S.failed.has(p.i))srsRight(p.i);
  fx.good();buzz(25)}
 else{
  S.combo=0;S.wrong++;S.failed.add(p.i);srsWrong(p.i);fx.bad();buzz([60,40,60]);
  if(!S.retried.has(p.i)){S.retried.add(p.i);queueRetry(p)}}
 $("ovCombo").textContent=S.combo>=2?"×"+S.combo:"";
 feedback(ok,p)}

const introPairs=p=>(PAIRS[p.i]||[]).length?`<div class="prs"><div class="q" style="margin:18px 0 2px">Pairs with</div>${pairsHTML(p.i,3)}</div>`:"";
const PAIR_ASK={"Opposite":"Pick the opposite","Alternative":"Pick another way to say it","Goes with":"Pick the phrase that goes with it","Answer":"Pick a good answer","Question":"Pick the question it answers","Next":"Pick the next one","Previous":"Pick the one before"};
function rPair(p){
 const q=shuffle(PAIRS[p.i])[0],t=P[q[0]];
 const bad=new Set([p.i,...PAIRS[p.i].map(x=>x[0])]);
 const pool=shuffle(P.filter(x=>!bad.has(x.i)&&norm(x.en)!==norm(t.en)&&norm(x.es)!==norm(t.es)));
 const d=[...pool.filter(x=>x.cat===t.cat),...pool.filter(x=>x.cat!==t.cat)].slice(0,3);
 const opts=shuffle([t,...d]);
 setBody(`<div class="q">${esc(PAIR_ASK[q[1]]||"Pick its partner")}</div><div class="big">${esc(p.es)}</div><div class="bigen">${esc(p.en)}</div><div class="hear" style="margin:14px 0"><button class="hearb sm" id="qPlay" aria-label="Hear">${SVG.say}</button></div><div class="ch" id="chs"></div>`);
 $("qPlay").onclick=()=>sayPhrase(p.i,false);
 S.extra=`<b>${esc(q[1])}:</b> ${esc(t.es)} = ${esc(t.en)}`;S.extraJ=t.i;
 renderChoices(opts.map(x=>x.es),opts.indexOf(t),ok=>grade(ok,p));
 sayPhrase(p.i,false)}
function rIntro(p){
 const m=groupMaps(p);
 setBody(`<div class="q">New phrase</div><div class="big">${wordsHTML(m.esT,m.esG)}</div><div class="bigen">${wordsHTML(m.enT,m.enG)}</div>${p.note?`<div class="tag">${esc(p.note)}</div>`:""}${introPairs(p)}<div class="hear" style="margin-top:22px"><button class="hearb" id="iPlay" aria-label="Hear">${SVG.say}</button><button class="hearb sm" id="iSlow" aria-label="Slow">Slow</button></div><div class="sub center">Tap any word to see its match.</div>`);
 $("ovBody").onclick=e=>{const r=e.target.closest(".pr");if(r){sayPhrase(+r.dataset.j,false);return}const w=e.target.closest(".w");if(w&&w.dataset.g!=null)hlGroup(+w.dataset.g,$("ovBody"))};
 $("iPlay").onclick=()=>sayPhrase(p.i,false);$("iSlow").onclick=()=>sayPhrase(p.i,true);
 $("ovFoot").innerHTML='<button class="btn block" id="ovNext">Got it</button>';
 $("ovNext").onclick=()=>{S.xp+=2;addXp(2);fx.tap();S.i++;nextStep()};
 sayPhrase(p.i,false)}
function rListen(p){
 const opts=shuffle([p,...distract(p,"en",3)]);
 setBody(`<div class="q">Listen. What does it mean?</div><div class="hear"><button class="hearb" id="qPlay" aria-label="Hear">${SVG.say}</button><button class="hearb sm" id="qSlow" aria-label="Slow">Slow</button></div><div class="ch" id="chs"></div>`);
 $("qPlay").onclick=()=>sayPhrase(p.i,false);$("qSlow").onclick=()=>sayPhrase(p.i,true);
 renderChoices(opts.map(x=>x.en),opts.indexOf(p),ok=>grade(ok,p));
 sayPhrase(p.i,false)}
function rPickEs(p){
 const opts=shuffle([p,...distract(p,"es",3)]);
 setBody(`<div class="q">How do you say it?</div><div class="big">${esc(p.en)}</div><div class="ch" id="chs"></div>`);
 renderChoices(opts.map(x=>x.es),opts.indexOf(p),ok=>grade(ok,p))}
function rFill(p){
 const ts=p.es.split(/\s+/);
 const cand=ts.map((w,i)=>({w,i,c:core(w)})).filter(x=>x.c.length>=3);
 if(!cand.length){rPickEs(p);return}
 const t=cand[Math.random()*cand.length|0],ans=t.c.toLowerCase();
 const shown=ts.map((w,i)=>i===t.i?w.replace(t.c,"_____"):w).join(" ");
 const seen=new Set([ans]),d=[];
 for(const x of shuffle(P.filter(x=>x.i!==p.i))){
  for(const w of x.es.split(/\s+/)){const c=core(w).toLowerCase();if(c.length>=3&&!seen.has(c)){seen.add(c);d.push(c);break}}
  if(d.length>=3)break}
 if(d.length<3){rPickEs(p);return}
 const opts=shuffle([ans,...d]);
 setBody(`<div class="q">Fill the blank</div><div class="big">${esc(shown)}</div><div class="bigen">${esc(p.en)}</div><div class="ch" id="chs"></div>`);
 renderChoices(opts,opts.indexOf(ans),ok=>grade(ok,p))}
function rBuild(p){
 const ts=p.es.split(/\s+/),bank=shuffle(ts.map((w,i)=>({w,i})));
 let order=[],done=false;
 setBody(`<div class="q">Build the sentence</div><div class="big">${esc(p.en)}</div><div class="ans" id="bAns"></div><div class="bank" id="bBank"></div>`);
 const draw=()=>{
  $("bAns").innerHTML=order.map(k=>`<button class="tk" data-a="${k}">${esc(ts[k])}</button>`).join("");
  $("bBank").innerHTML=bank.map(x=>`<button class="tk ${order.includes(x.i)?"used":""}" data-k="${x.i}">${esc(x.w)}</button>`).join("");
  $("ovFoot").innerHTML=`<button class="btn block" id="bCheck" ${order.length===ts.length?"":"disabled"}>Check</button>`;
  $("bCheck").onclick=()=>{done=true;const key=a=>a.map(k=>norm(core(ts[k]))).join(" ");grade(key(order)===key(ts.map((_,i)=>i)),p)}};
 $("ovBody").onclick=e=>{if(done)return;
  const a=e.target.closest("[data-a]"),k=e.target.closest("[data-k]");
  if(a){order=order.filter(x=>x!==+a.dataset.a);fx.tap();draw()}
  else if(k&&!order.includes(+k.dataset.k)){order.push(+k.dataset.k);fx.tap();draw()}};
 draw()}
function rSay(p){
 setBody(`<div class="q">Say it out loud</div><div class="big center">${esc(p.en)}</div><div class="center say"><div class="mic">${SVG.mic}</div><div class="sub">Say it in Spanish. Then reveal the answer.</div></div><div id="sayAns" class="center" style="margin-top:14px"></div>`);
 $("ovFoot").innerHTML='<button class="btn block" id="sReveal">Reveal</button>';
 $("sReveal").onclick=()=>{
  $("sayAns").innerHTML=`<div class="big">${esc(p.es)}</div>`;sayPhrase(p.i,false);
  $("ovFoot").innerHTML='<div class="row"><button class="btn sec" id="sNo">Not yet</button><button class="btn" id="sYes">Nailed it</button></div>';
  $("sYes").onclick=()=>{S.xp+=8;addXp(8);fx.good();buzz(25);S.i++;nextStep()};
  $("sNo").onclick=()=>{srsWrong(p.i);fx.tap();S.i++;nextStep()}}}

function finishSession(){
 const first=markActive();
 prof.sessions++;
 const perfect=S.wrong===0&&S.right>0;
 const bonus=20+(perfect?10:0);S.xp+=bonus;addXp(bonus);
 if(perfect)prof.perfect++;
 saveProf();
 const nb=checkBadges(),L1=lvl(prof.xp);
 const tot=S.right+S.wrong,acc=tot?Math.round(S.right/tot*100):100;
 $("ovBar").style.width="100%";$("ovCombo").textContent="";
 setBody(`<div class="sum"><div class="em">${SVG.star}</div><h2>${perfect?"Perfect session!":"Session complete!"}</h2><div class="sub">${first?prof.streak+"-day streak!":"Bonus round, nice."}</div><div class="sg"><div><b>+${S.xp}</b><small>XP</small></div><div><b>${acc}%</b><small>Accuracy</small></div><div><b>${S.fresh}</b><small>New phrases</small></div></div>${L1>S.lvl0?`<div class="card"><b>Level ${L1} reached!</b></div>`:""}${badgeHtml(nb)}</div>`);
 $("ovFoot").innerHTML='<div class="row"><button class="btn sec" id="sDone">Done</button><button class="btn" id="sMore">One more round</button></div>';
 $("sDone").onclick=closeOv;$("sMore").onclick=()=>startSession("more");
 fx.win();confetti();buzz([40,40,80])}

function renderMissions(){
 $("mList").innerHTML=MISS.map(m=>{const s=prof.missions[m.id]||0;
  return `<button class="mcard" data-id="${m.id}">${avatar(m)}<span class="mt"><b>${esc(m.title)}</b><span class="sub">${esc(m.who)} · ${m.steps.length} replies</span><br><span class="tag">${esc(m.cat)}</span></span><span class="stars">${starsHtml(s)}</span></button>`}).join("")}
$("mList").onclick=e=>{const b=e.target.closest(".mcard");if(b)startMission(b.dataset.id)};

function startMission(id){
 const m=MISS.find(x=>x.id===id);if(!m)return;
 S=null;M={m,i:0,wrong:0,right:0,xp:0};
 openOv();
 setBody(`<div class="sum"><div class="em">${avatar(m)}</div><h2>${esc(m.title)}</h2><p class="sub">${esc(m.intro)}</p><p class="sub">You are talking to <b>${esc(m.who)}</b>. Listen first, then pick your reply.</p></div>`);
 $("ovFoot").innerHTML='<button class="btn block" id="mGo">Start</button>';
 $("mGo").onclick=mStep}
function mStep(){
 if(!M)return;
 const m=M.m;
 if(M.i>=m.steps.length){mFinish();return}
 const s=m.steps[M.i],opts=shuffle(s.opts);
 $("ovBar").style.width=(M.i/m.steps.length*100)+"%";$("ovFoot").innerHTML="";
 setBody(`<div class="who">${avatar(m)}${esc(m.who)}</div><div class="bub"><div class="big" style="font-size:1.5rem">${esc(s.npc.es)}</div><div class="bigen" id="mEn" style="visibility:hidden">${esc(s.npc.en)}</div></div><div class="hear" style="margin:0 0 10px"><button class="hearb sm" id="mReplay" aria-label="Replay">${SVG.say}</button><button class="hearb sm" id="mHint" aria-label="Show English">${SVG.eye}</button></div><div class="ch" id="chs"></div>`);
 const ch=$("chs");
 opts.forEach(o=>{const b=document.createElement("button");b.innerHTML=`${esc(o.es)}<span class="tr">${esc(o.en)}</span>`;
  b.onclick=()=>{
   [...ch.children].forEach(x=>{x.disabled=true});
   const ok=!!o.ok;b.classList.add(ok?"good":"bad");
   if(ok){M.right++;M.xp+=12;addXp(12);fx.good();buzz(25)}
   else{M.wrong++;ch.children[opts.findIndex(x=>x.ok)].classList.add("good");fx.bad();buzz([60,40,60])}
   $("ovBody").classList.add("hint");$("mEn").style.visibility="visible";
   playSrc("audio/"+o.a,o.es);
   $("ovFoot").innerHTML=`<div class="fb ${ok?"ok":"bad"}">${ok?praise():"Not quite"}<small>${esc(s.why)}</small></div><button class="btn block" id="mNext">Continue</button>`;
   $("mNext").onclick=()=>{M.i++;mStep()}};
  ch.appendChild(b)});
 $("mReplay").onclick=()=>playSrc("audio/"+s.npc.a,s.npc.es);
 $("mHint").onclick=()=>{$("ovBody").classList.add("hint");$("mEn").style.visibility="visible"};
 playSrc("audio/"+s.npc.a,s.npc.es)}
function mFinish(){
 const m=M.m,stars=M.wrong===0?3:M.wrong===1?2:1;
 const bonus=stars*10;M.xp+=bonus;addXp(bonus);
 prof.missions[m.id]=Math.max(prof.missions[m.id]||0,stars);
 const first=markActive();saveProf();
 const nb=checkBadges();
 $("ovBar").style.width="100%";
 setBody(`<div class="sum"><div class="em">${avatar(m)}</div><h2>Mission complete!</h2><div class="stars big">${starsHtml(stars)}</div><div class="sub">${first?prof.streak+"-day streak!":esc(m.title)}</div><div class="sg"><div><b>+${M.xp}</b><small>XP</small></div><div><b>${M.right}/${m.steps.length}</b><small>Right first try</small></div><div><b>${stars}</b><small>Stars</small></div></div>${badgeHtml(nb)}</div>`);
 $("ovFoot").innerHTML='<div class="row"><button class="btn sec" id="mDone">Done</button><button class="btn" id="mAgain">Play again</button></div>';
 $("mDone").onclick=closeOv;$("mAgain").onclick=()=>startMission(m.id);
 fx.win();if(stars===3)confetti()}
