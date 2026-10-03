(function(g){
 const INTERVALS=[0,1,2,4,8,16,32];
 const COST={due:1.2,fresh:3.3,say:3};
 const NEW_CAP=5,NEW_FLOOR=2,BACKLOG_X=1.5,CATCHUP_MIN=12,BACK_N=8,TWO_N=5;
 const dayNum=(now,tz)=>Math.floor((now-tz*6e4-144e5)/864e5);
 const get=(srs,i)=>{const e=srs[i];
  return e?{box:e[0],due:e[1],rev:e[2]||0,lap:e[3]||0,scored:e[4]==null?-1:e[4],promoted:e[5]==null?-1:e[5],demoted:e[6]==null?-1:e[6],u:e[7]||0}:null};
 const put=(srs,i,o)=>{srs[i]=[o.box,o.due,o.rev,o.lap,o.scored,o.promoted,o.demoted,o.u||0]};
 function formatsFor(box,n,must){
  const canBuild=n>=2&&n<=8;
  if(box<=1){const f=["listen","pickEs"];if(canBuild&&box===1)f.push("build");return f}
  if(box===2)return canBuild?["build"]:["listen"];
  return canBuild?(must?["build"]:["build","listen"]):["listen"]}
 const eligible=(box,n,must,fmt)=>formatsFor(box,n,must).includes(fmt);
 function answer(srs,i,ok,fmt,t,ctx){
  const had=get(srs,i);
  const e=had||{box:0,due:t,rev:0,lap:0,scored:-1,promoted:-1,demoted:-1,u:0};
  const due=!had||e.due<=t;
  const good=ok&&!ctx.notSure;
  const res={credited:false,promoted:false,demoted:false,box0:e.box,box1:e.box,due:due};
  if(due&&!ctx.practice&&e.scored!==t&&eligible(e.box,ctx.n,ctx.must,fmt)){
   e.scored=t;e.rev++;res.credited=true;e.u=0;
   if(good){e.box=Math.min(6,e.box+1);e.due=t+INTERVALS[e.box];e.promoted=t;res.promoted=true}
   else{const late=had?t-e.due:0;e.lap++;e.box=late>14?Math.max(0,e.box-1):0;e.due=t+1;e.demoted=t;res.demoted=true}
   put(srs,i,e)}
  else if(!good&&e.demoted!==t){
   e.lap++;e.box=0;e.due=t+1;e.demoted=t;res.demoted=true;put(srs,i,e)}
  res.box1=e.box;return res}
 const dueList=(srs,ids,t)=>ids.filter(i=>srs[i]&&srs[i][1]<=t).sort((a,b)=>srs[a][1]-srs[b][1]||a-b);
 const budgetTrials=(min,sec)=>min*60/sec;
 function plan(o){
  const sec=o.sec||15,bt=budgetTrials(o.budgetMin,sec);
  const due=dueList(o.srs,o.ids,o.t);
  const capacity=Math.max(1,Math.floor((bt-COST.say)/COST.due));
  const overload=due.length*COST.due>BACKLOG_X*bt;
  const catchup=o.kind==="daily"&&(overload||((o.gap||0)>=7&&due.length>0));
  const keep=Math.floor(BACKLOG_X*capacity);
  let take,newAllowed=0;
  if(o.kind==="back"){take=Math.min(BACK_N,due.length)}
  else if(o.kind==="two"){take=Math.min(TWO_N,due.length)}
  else if(catchup){take=Math.min(Math.floor((CATCHUP_MIN*60/sec-COST.say)/COST.due),keep,due.length)}
  else{
   take=Math.min(capacity,due.length);
   const left=bt-COST.say-take*COST.due;
   newAllowed=Math.max(0,Math.min(NEW_CAP-(o.newToday||0),Math.max(NEW_FLOOR,Math.floor(left/COST.fresh)),o.unseen==null?NEW_CAP:o.unseen))}
  return {due:due.slice(0,take),dueTotal:due.length,waiting:due.length-take,newAllowed,catchup,overload,capacity,keep}}
 const estMinutes=(nDue,nFresh,sec)=>Math.max(1,Math.round((nDue*COST.due+nFresh*COST.fresh+COST.say)*sec/60));
 function spread(srs,ids,t,capacity){
  const L=Math.floor(BACKLOG_X*capacity),load={};
  ids.forEach(i=>{const e=srs[i];if(e&&e[1]>t)load[e[1]]=(load[e[1]]||0)+1});
  let moved=0;
  dueList(srs,ids,t).slice(L).forEach(i=>{let d=t+1;while((load[d]||0)>=L)d++;srs[i][1]=d;load[d]=(load[d]||0)+1;moved++});
  return moved}
 function counts(srs,ids,t){
  const c={unseen:0,learning:0,kept:0,unverified:0,due:0};
  ids.forEach(i=>{const e=get(srs,i);
   if(!e){c.unseen++;return}
   if(e.due<=t)c.due++;
   if(e.u)c.unverified++;else if(e.box>=4)c.kept++;else c.learning++});
  return c}
 const api={INTERVALS,COST,NEW_CAP,NEW_FLOOR,BACKLOG_X,CATCHUP_MIN,dayNum,get,put,formatsFor,eligible,answer,dueList,budgetTrials,plan,estMinutes,spread,counts};
 g.SRS=api;
 if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof window!=="undefined"?window:globalThis);
