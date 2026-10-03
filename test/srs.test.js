const assert=require("assert");
const S=require("../srs.js");
let passed=0;
const t=(name,fn)=>{try{fn();passed++}catch(e){console.log("FAIL:",name);console.log(e.message);process.exitCode=1}};
const ctx=(o)=>Object.assign({n:3,must:false,notSure:false,practice:false},o||{});
const D=100;

t("new phrase, eligible format, correct: box 1 due tomorrow, credited",()=>{
 const srs={};const r=S.answer(srs,1,true,"listen",D,ctx());
 assert.equal(r.credited,true);assert.equal(srs[1][0],1);assert.equal(srs[1][1],D+1)});
t("new phrase wrong: box 0 due tomorrow, demoted",()=>{
 const srs={};const r=S.answer(srs,1,false,"listen",D,ctx());
 assert.equal(r.demoted,true);assert.equal(srs[1][0],0);assert.equal(srs[1][1],D+1)});
t("second answer the same day cannot promote again",()=>{
 const srs={};S.answer(srs,1,true,"listen",D,ctx());
 const r=S.answer(srs,1,true,"pickEs",D,ctx());
 assert.equal(r.credited,false);assert.equal(srs[1][0],1)});
t("miss then retry correct does not promote",()=>{
 const srs={};S.answer(srs,1,false,"listen",D,ctx());
 S.answer(srs,1,true,"listen",D,ctx());assert.equal(srs[1][0],0)});
t("not due: never promotes",()=>{
 const srs={5:[2,D+3,4,0,D-5,D-5,-1,0]};
 const r=S.answer(srs,5,true,"build",D,ctx());
 assert.equal(r.credited,false);assert.equal(srs[5][0],2)});
t("not due: a miss demotes once per day",()=>{
 const srs={5:[3,D+3,4,0,D-5,D-5,-1,0]};
 S.answer(srs,5,false,"build",D,ctx());assert.equal(srs[5][0],0);assert.equal(srs[5][3],1);
 S.answer(srs,5,false,"build",D,ctx());assert.equal(srs[5][3],1)});
t("box 2 requires build: listen success does not promote",()=>{
 const srs={5:[2,D,4,0,-1,-1,-1,0]};
 const r=S.answer(srs,5,true,"listen",D,ctx());
 assert.equal(r.credited,false);assert.equal(srs[5][0],2)});
t("box 2 build success promotes to box 3 due in 4 days",()=>{
 const srs={5:[2,D,4,0,-1,-1,-1,0]};
 S.answer(srs,5,true,"build",D,ctx());assert.equal(srs[5][0],3);assert.equal(srs[5][1],D+4)});
t("one-word phrase at box 2 is promoted by listen",()=>{
 const srs={5:[2,D,4,0,-1,-1,-1,0]};
 S.answer(srs,5,true,"listen",D,ctx({n:1}));assert.equal(srs[5][0],3)});
t("must-say phrase at box 3 requires build",()=>{
 const srs={5:[3,D,4,0,-1,-1,-1,0]};
 assert.equal(S.answer(srs,5,true,"listen",D,ctx({must:true})).credited,false);
 assert.equal(S.answer(srs,5,true,"build",D,ctx({must:true})).promoted,true)});
t("not sure counts as a miss",()=>{
 const srs={5:[1,D,4,0,-1,-1,-1,0]};
 const r=S.answer(srs,5,true,"listen",D,ctx({notSure:true}));
 assert.equal(r.demoted,true);assert.equal(srs[5][0],0)});
t("practice mode never promotes",()=>{
 const srs={5:[1,D,4,0,-1,-1,-1,0]};
 const r=S.answer(srs,5,true,"listen",D,ctx({practice:true}));
 assert.equal(r.credited,false);assert.equal(srs[5][0],1)});
t("credited promotion clears the unverified flag",()=>{
 const srs={5:[2,D,0,0,-1,-1,-1,1]};
 S.answer(srs,5,true,"build",D,ctx());assert.equal(srs[5][7],0)});
t("old four-field entries are readable",()=>{
 const srs={5:[2,D,4,1]};
 const r=S.answer(srs,5,true,"build",D,ctx());assert.equal(r.promoted,true);assert.equal(srs[5].length,8)});
t("ladder never exceeds box 6",()=>{
 const srs={5:[6,D,4,0,-1,-1,-1,0]};
 S.answer(srs,5,true,"build",D,ctx());assert.equal(srs[5][0],6);assert.equal(srs[5][1],D+32)});
t("day rolls at 04:00 local",()=>{
 const base=Date.UTC(2026,0,10,0,0,0);
 assert.equal(S.dayNum(base+3*36e5,0),S.dayNum(base-1,0));
 assert.equal(S.dayNum(base+4*36e5,0),S.dayNum(base-1,0)+1)});

const ids=Array.from({length:336},(_,i)=>i);
const mk=n=>{const s={};for(let k=0;k<n;k++)s[k]=[1,D-k%5,2,0,-1,-1,-1,0];return s};
t("plan: light load gives the full 5 new phrases",()=>{
 const srs=mk(10);const p=S.plan({srs,ids,t:D,budgetMin:10,sec:15,kind:"daily",newToday:0});
 assert.equal(p.due.length,10);assert.equal(p.newAllowed,5);assert.equal(p.catchup,false)});
t("plan: heavy but tolerable load takes capacity and keeps the floor of 2 new",()=>{
 const srs=mk(40);const p=S.plan({srs,ids,t:D,budgetMin:10,sec:15,kind:"daily",newToday:0});
 assert.equal(p.due.length,p.capacity);assert.equal(p.newAllowed,2);assert.equal(p.waiting,40-p.capacity)});
t("plan: overload triggers catch-up with zero new phrases",()=>{
 const srs=mk(60);const p=S.plan({srs,ids,t:D,budgetMin:10,sec:15,kind:"daily",newToday:0});
 assert.equal(p.catchup,true);assert.equal(p.newAllowed,0);assert.ok(p.due.length>p.capacity)});
t("plan: a gap of 7 days triggers catch-up",()=>{
 const srs=mk(5);const p=S.plan({srs,ids,t:D,budgetMin:10,sec:15,kind:"daily",newToday:0,gap:7});
 assert.equal(p.catchup,true);assert.equal(p.newAllowed,0)});
t("plan: the daily new cap is shared across sessions",()=>{
 const srs=mk(5);const p=S.plan({srs,ids,t:D,budgetMin:10,sec:15,kind:"daily",newToday:4});
 assert.equal(p.newAllowed,1);
 assert.equal(S.plan({srs,ids,t:D,budgetMin:10,sec:15,kind:"daily",newToday:5}).newAllowed,0)});
t("plan: welcome-back takes at most 8 due and no new",()=>{
 const p=S.plan({srs:mk(30),ids,t:D,budgetMin:10,sec:15,kind:"back",newToday:0});
 assert.equal(p.due.length,8);assert.equal(p.newAllowed,0)});
t("plan: two-minute day takes 5 oldest due",()=>{
 const srs=mk(30);const p=S.plan({srs,ids,t:D,budgetMin:10,sec:15,kind:"two",newToday:0});
 assert.equal(p.due.length,5);assert.equal(p.newAllowed,0);
 assert.ok(srs[p.due[0]][1]<=srs[p.due[4]][1])});
t("due phrases come from the whole deck, oldest first",()=>{
 const srs={300:[1,D-9,2,0,-1,-1,-1,0],2:[1,D-1,2,0,-1,-1,-1,0],150:[1,D-3,2,0,-1,-1,-1,0]};
 const p=S.plan({srs,ids,t:D,budgetMin:10,sec:15,kind:"daily",newToday:0});
 assert.deepEqual(p.due,[300,150,2])});
t("spread: no day exceeds the load limit and boxes are unchanged",()=>{
 const srs=mk(100);const before=JSON.stringify(Object.values(srs).map(e=>e[0]));
 const cap=S.plan({srs,ids,t:D,budgetMin:10,sec:15,kind:"daily"}).capacity;
 const moved=S.spread(srs,ids,D,cap);
 assert.ok(moved>0);
 const load={};Object.values(srs).forEach(e=>{load[e[1]]=(load[e[1]]||0)+1});
 const L=Math.floor(1.5*cap);
 Object.keys(load).forEach(d=>{if(+d>D)assert.ok(load[d]<=L,"day "+d+" has "+load[d])});
 assert.equal(JSON.stringify(Object.values(srs).map(e=>e[0])),before)});
t("spread is idempotent",()=>{
 const srs=mk(100);const cap=30;S.spread(srs,ids,D,cap);
 assert.equal(S.spread(srs,ids,D,cap),0)});

function rng(seed){let s=seed;return()=>{s=(s*1664525+1013904223)%4294967296;return s/4294967296}}
function simulate(acc,days,budget,seed){
 const r=rng(seed),srs={};let t=0,seen=0,newLog={},peak=0,overdueMax=0,catchDays=0,trialsTotal=0;
 const stats=[];
 for(let day=0;day<days;day++){
  t++;
  let p=S.plan({srs,ids,t,budgetMin:budget,sec:15,kind:"daily",newToday:0});
  if(p.catchup){catchDays++;S.spread(srs,ids,t,p.capacity);p=S.plan({srs,ids,t,budgetMin:budget,sec:15,kind:"daily",newToday:0})}
  peak=Math.max(peak,p.dueTotal);
  const oldest=p.due.length?t-srs[p.due[0]][1]:0;overdueMax=Math.max(overdueMax,oldest);
  let trials=0;
  p.due.forEach(i=>{const e=S.get(srs,i);const f=S.formatsFor(e.box,3,false)[0];
   S.answer(srs,i,r()<acc,f,t,{n:3,must:false});trials++});
  const fresh=[];for(let i=0;i<336&&fresh.length<p.newAllowed;i++){if(!srs[i])fresh.push(i)}
  fresh.forEach(i=>{S.answer(srs,i,r()<acc,"listen",t,{n:3,must:false});trials++;trials+=2});
  seen+=fresh.length;trialsTotal+=trials;
  stats.push({day,due:p.dueTotal,new:fresh.length,trials});
 }
 const c=S.counts(srs,ids,t);
 return {seen,peak,overdueMax,catchDays,counts:c,lastDue:stats[stats.length-1].due,avgNew:seen/days,stats};
}
[[1.0,"perfect recall"],[0.9,"90% pass"],[0.8,"80% pass"],[0.7,"70% pass"]].forEach(([acc,label])=>{
 t("simulation 10 min budget, "+label+": backlog stays bounded",()=>{
  const s=simulate(acc,200,10,7);
  console.log("  "+label+": introduced "+s.seen+"/336 in 200 days, peak due "+s.peak+", oldest overdue "+s.overdueMax+" days, catch-up days "+s.catchDays+", due at end "+s.lastDue);
  assert.ok(s.peak<=51,"peak due "+s.peak);
  assert.ok(s.overdueMax<=3,"oldest overdue "+s.overdueMax);
  assert.ok(s.lastDue<=51)});
});
t("simulation: old behaviour piles up while the new one does not",()=>{
 const t0=0;let srs={},t1=0;const old=[];
 for(let day=0;day<30;day++){t1++;
  const due=S.dueList(srs,ids,t1);old.push(due.length);
  due.slice(0,8).forEach(i=>{const e=S.get(srs,i);const b=Math.min(6,e.box+1);srs[i]=[b,t1+S.INTERVALS[b],e.rev+1,0,-1,-1,-1,0]});
  let n=0;for(let i=0;i<336&&n<5;i++){if(!srs[i]){srs[i]=[1,t1+1,1,0,-1,-1,-1,0];n++}}}
 const nw=simulate(1.0,30,10,3);
 console.log("  old rules due on day 30: "+old[29]+" (cap of 8 per session); new rules due on day 30: "+nw.lastDue);
 assert.ok(old[29]>nw.lastDue)});

console.log(passed+" checks passed"+(process.exitCode?" (with failures)":""));
