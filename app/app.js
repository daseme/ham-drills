"use strict";
/* The shared app: one exam's drills, from that exam's exam.js and data.js. Loaded by each exam's index.html. */
/* Shapes the badges draw from, placed first in the page. */
document.body.insertAdjacentHTML("afterbegin",`<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
 <g id="tower" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
  <path d="M20 66 L32 30 L44 66"/><path d="M32 30 V22"/><path d="M27.4 44 H36.6 M24.6 52 H39.4 M22 60 H42"/><path d="M18 66 H46"/></g>
 <path id="towerx" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" d="M27.4 44 L39.4 52 M36.6 44 L24.6 52 M24.6 52 L42 60 M39.4 52 L22 60"/>
 <path id="arc1" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" d="M27.4 26.6 A6.5 6.5 0 0 1 25.6 20.9 M36.6 26.6 A6.5 6.5 0 0 0 38.4 20.9"/>
 <path id="arc2" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" d="M24.2 29.8 A11 11 0 0 1 21.2 20.1 M39.8 29.8 A11 11 0 0 0 42.8 20.1"/>
 <path id="arc3" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" d="M21.0 33.0 A15.5 15.5 0 0 1 16.6 20.4 M43.0 33.0 A15.5 15.5 0 0 0 47.4 20.4"/>
</defs></svg>`);
const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const IV=[0,1,3,7,16,35],MASTER=3;
const dayNum=()=>{const d=new Date();return Math.floor((d.getTime()-d.getTimezoneOffset()*60000)/86400000)};
const shuffle=a=>{a=a.slice();for(let k=a.length-1;k>0;k--){const j=Math.floor(Math.random()*(k+1));[a[k],a[j]]=[a[j],a[k]]}return a};
const DECK=Object.fromEntries(DECKS.map(d=>[d.id,d]));
const POOL=DECKS.filter(d=>d.exam>0);
/* Everything that makes this one exam's drills, from exam.js. */
const C=window.EXAM_CONFIG;
/* While an exam's sections are still being written, only the finished ones are in DECKS. */
const COMPLETE=POOL.length===C.sections;
const NUMBER=["no","one","two","three","four","five","six","seven","eight","nine","ten"];
const {FIGS,FIG_KEY}=C.figures,{plan:DEMO_PLAN,lapse:DEMO_LAPSE,seed:DEMO_SEED}=C.demo||{};

/* ---------- storage ---------- */
/* ?demo opens the app as a sample learner under its own namespace, so a visitor's own progress is never read or touched. */
const DEMO=!!C.demo&&new URLSearchParams(location.search).has("demo");
const NS=DEMO?C.demoNs:C.ns;
const get=(k,f)=>{try{const v=localStorage.getItem(NS+k);return v==null?f:JSON.parse(v)}catch(e){return f}};
const put=(k,v)=>{try{localStorage.setItem(NS+k,JSON.stringify(v))}catch(e){toast("Couldn't save progress on this device.")}};
const drop=k=>{try{localStorage.removeItem(NS+k)}catch(e){}};
const SRS={};
const srsOf=id=>SRS[id]||(SRS[id]=get("srs:"+id,{}));
const saveSrs=id=>put("srs:"+id,SRS[id]);
function mergeSrs(a,b){const o={...a};for(const k in b){const x=o[k],y=b[k];if(!y)continue;const lx=x?(x.last??-1):-2,ly=y.last??-1;if(!x||ly>lx||(ly===lx&&(y.n||0)>(x.n||0)))o[k]=y}return o}
/* A record from a backup, or null if it is damaged: lv and due must be whole numbers in range, the rest the right
   kind when present (a version 1 backup has no w on a card never missed). Only these seven fields are kept, and
   due is clamped to today plus the longest interval, so a stray value cannot park a card out of reach. */
const isInt=v=>Number.isInteger(v);
function validRecord(r,t=dayNum()){
  if(!r||typeof r!=="object"||!isInt(r.lv)||r.lv<0||r.lv>=IV.length||!isInt(r.due))return null;
  const o={lv:r.lv,due:Math.min(r.due,t+IV[IV.length-1])};
  for(const k of ["last","fail"]){if(k in r){if(r[k]!==null&&!isInt(r[k]))return null;o[k]=r[k]}}
  for(const k of ["n","w"]){if(k in r){if(!isInt(r[k])||r[k]<0)return null;o[k]=r[k]}}
  if("n" in o&&"w" in o&&o.w>o.n)return null;
  if("ts" in r){if(typeof r.ts!=="number")return null;o.ts=r.ts}
  return o;
}
function importDecks(decks){let n=0,dropped=0;
  for(const id in decks){const d=DECK[id],src=decks[id];if(!d||!src||typeof src!=="object")continue;
    const ok={},ids=new Set(itemIds(d));
    for(const k in src){if(!ids.has(k))continue;const r=validRecord(src[k]);if(r)ok[k]=r;else dropped++}
    SRS[id]=mergeSrs(srsOf(id),ok);saveSrs(id);n++}
  return {decks:n,dropped}}
if(navigator.storage&&navigator.storage.persist)navigator.storage.persist().catch(()=>{});

const itemIds=d=>d.S?d.S.map(s=>s.n):d.Q.map(q=>q[0]);
const isDue=(id,k)=>{const r=srsOf(id)[k];return !r||r.due<=dayNum()};
const isMastered=(id,k)=>{const r=srsOf(id)[k];return !!r&&r.lv>=MASTER};
const isSeen=(id,k)=>!!srsOf(id)[k];
/* One answer on day t, as a new record; the scheduler itself, shared by record and the demo seed. */
function step(r0,ok,t,exam=EXAM.day){
  const r={...(r0||{lv:0,due:t,last:null,fail:null})};
  if(!ok){r.lv=0;r.due=t;r.fail=t}
  else if(r.fail===t){r.lv=0;r.due=t+1}
  else if(r.last!==t){r.lv=Math.min(r.lv+1,IV.length-1);r.due=t+capInterval(IV[r.lv],t,exam)}
  r.last=t;r.n=(r.n||0)+1;if(!ok)r.w=(r.w||0)+1;return r;
}
function record(id,k,ok){
  const s=srsOf(id);s[k]=step(s[k],ok,dayNum());s[k].ts=Date.now();saveSrs(id);
  if(ok)awardBadges(DECK[id]);
}
/* True if this card has ever been answered correctly; a miss on such a card gets the Lemon line instead of "Not quite." */
const hadRight=(id,k)=>{const r=srsOf(id)[k];return !!r&&((r.n||0)>(r.w||0)||r.lv>0)};
const missText=lemon=>lemon?"Good God, Lemon!":"Not quite.";
function stats(d){const ids=itemIds(d),t=dayNum();
  return{total:ids.length,due:ids.filter(k=>isDue(d.id,k)).length,seen:ids.filter(k=>isSeen(d.id,k)).length,
    mastered:ids.filter(k=>isMastered(d.id,k)).length,tomorrow:ids.filter(k=>{const r=srsOf(d.id)[k];return r&&r.due===t+1}).length}}
/* An unseen card counts as due, so untouched decks would swamp the home count. Home counts reviews only. */
const reviewsDue=d=>itemIds(d).filter(k=>isSeen(d.id,k)&&isDue(d.id,k)).length;

/* ---------- demo seed ----------
   A learner three weeks in, simulated day by day through step from a fixed seed, so every record follows the
   interval table and exam cap, badge dates are the days they were earned, and every visitor sees the same
   history dated from the day of the visit. The plan, lapses and seeds come from exam.js. */
function seedDemo(){
  if(!DEMO||get("seeded",false))return;
  const rng=x=>()=>{x=x+0x6D2B79F5|0;let z=Math.imul(x^x>>>15,1|x);z=z+Math.imul(z^z>>>7,61|z)^z;return((z^z>>>14)>>>0)/4294967296};
  const T=dayNum(),exam=T+16,tz=new Date().getTimezoneOffset()*60000,badges={};
  const cards=Object.entries(DEMO_PLAN).flatMap(([id,[from,to,acc,part=1]])=>{const ids=itemIds(DECK[id]),n=Math.round(ids.length*part),rnd=rng(DEMO_SEED[id]);
    return ids.slice(0,n).map((k,j)=>({id,k,rnd,intro:T-from+Math.floor(j*(from-to+1)/n),...(rnd()<.07?{acc:.3,learn:.75}:{acc,learn:.35})}))});
  /* Recall improves with each right answer, slowly on the few hard cards; a miss is retried later that session, as the drill does. */
  const answer=(c,t,force)=>{const s=srsOf(c.id);let tries=0,ok;
    do{const r=s[c.k],right=r?(r.n||0)-(r.w||0):0;ok=force?false:c.rnd()<1-(1-c.acc)*Math.pow(c.learn,right);
      s[c.k]=step(r,ok,t,exam);s[c.k].ts=t*864e5+tz+(18+tries)*36e5+Math.floor(c.rnd()*36e5)}while(!ok&&!force&&++tries<3)};
  for(let t=T-21;t<T;t++){
    /* Two days were skipped; yesterday ended with the plan's lapses, which drop a silver section back to bronze. */
    if(t!==T-9&&t!==T-16)for(const c of cards){const r=srsOf(c.id)[c.k];if(t>=c.intro&&(!r||r.due<=t))answer(c,t)}
    if(t===T-1)cards.filter(c=>DEMO_LAPSE.includes(c.k)).forEach(c=>answer(c,t,true));
    for(const id in DEMO_PLAN){const b=badges[id]||(badges[id]={});for(let g=1;g<=tierNow(DECK[id]);g++)if(!b[g])b[g]=t}
  }
  for(const id in DEMO_PLAN)saveSrs(id);
  put("badges",badges);put("examDay",exam);put("prefs",{showDate:true});put("seeded",true);
}
const clearDemo=()=>{try{Object.keys(localStorage).filter(k=>k.startsWith(C.demoNs)).forEach(k=>localStorage.removeItem(k))}catch(e){}};
seedDemo();
/* The banner: full above the home hero, one line on every other screen. */
function demoBar(full){
  const b=$("demobar");if(!DEMO)return;b.hidden=false;b.className="demobar"+(full?"":" small");
  b.innerHTML=`<p>${full?"Sample progress, so you can look around. Your own progress is untouched.":"Sample progress."}<button class="linkbtn" id="demoExit">Exit demo</button>${full?`<button class="linkbtn" id="demoReset">Reset sample</button>`:""}</p>`;
  $("demoExit").onclick=()=>{clearDemo();location.replace(location.pathname)};
  if(full)$("demoReset").onclick=()=>{clearDemo();location.replace(location.pathname+location.search)};
}

/* ---------- exam date (optional) ----------
   With a date set, intervals are capped so nothing is scheduled past the exam, and inside the last week
   a card comes back at least once more. Without a date, intervals are the plain IV table. */
const EXAM={day:get("examDay",null)};
let editingDate=false;
const daysToExam=(t=dayNum())=>EXAM.day==null?null:EXAM.day-t;
function capInterval(iv,t,exam=EXAM.day){const D=exam==null?null:exam-t;if(D==null||D<=0)return iv;let cap=Math.max(1,D-1);if(D<=7)cap=Math.min(cap,Math.max(1,Math.floor(D/2)));return Math.min(iv,cap)}
function setExamDay(day){EXAM.day=day;if(day==null)drop("examDay");else put("examDay",day)}
const isoToDay=iso=>{const [y,m,d]=iso.split("-").map(Number);return Math.floor(Date.UTC(y,m-1,d)/86400000)};
const dayToIso=day=>new Date(day*86400000).toISOString().slice(0,10);
const dayLabel=day=>new Date(day*86400000).toLocaleDateString(undefined,{timeZone:"UTC",weekday:"short",month:"short",day:"numeric"});

/* ---------- estimated score ----------
   Expected correct per section = its exam count times a weighted share of cards by state. Two weightings
   give a low and a high. Math and symbols are not exam sections; their questions already sit in the pool sections. */
const EST_W={lo:{m:.9,k:.55,s:.35,u:.25},hi:{m:1,k:.85,s:.65,u:.25}};
/* Until a tenth of the pool is seen the estimate is nearly all guesses, a failing score that says nothing, so it waits. */
const EST_MIN=.1;
function sectionShare(d,w){const srs=srsOf(d.id);let acc=0;for(const k of itemIds(d)){const r=srs[k];acc+=!r?w.u:r.lv>=MASTER?w.m:r.lv>=1?w.k:w.s}return acc/itemIds(d).length}
function estimate(){let lo=0,hi=0;const gain=[];for(const d of POOL){const l=d.exam*sectionShare(d,EST_W.lo),h=d.exam*sectionShare(d,EST_W.hi);lo+=l;hi+=h;gain.push([d,d.exam-(l+h)/2])}
  /* The nudge keeps a sum like 31.4999... (0.9 x 35 added up by section) rounding as the 31.5 it is. */
  gain.sort((a,b)=>b[1]-a[1]);return{lo:Math.round(lo+1e-9),hi:Math.round(hi+1e-9),gain:gain.filter(g=>g[1]>=0.75).slice(0,2).map(g=>g[0].code)}}

/* ---------- badges ----------
   Three rungs per deck, judged on every card: bronze = all seen, silver = all answered correctly at least
   once (no card sitting at level 0), gold = all mastered. A rung, once earned, is kept with the day it was
   earned; the badge dims while the deck's current standing is below its best rung. */
const TIER=["","Bronze","Silver","Gold"],TIER_WHY=["","every card seen","every card answered correctly","every card mastered"];
const BADGES=get("badges",{});
const saveBadges=()=>put("badges",BADGES);
function tierNow(d){const s=srsOf(d.id);let t=3;for(const k of itemIds(d)){const r=s[k];if(!r)return 0;if(r.lv<1)t=Math.min(t,1);else if(r.lv<MASTER)t=Math.min(t,2)}return t}
const tierEarned=d=>{const b=BADGES[d.id]||{};return b[3]?3:b[2]?2:b[1]?1:0};
function awardBadges(d,quiet){
  const now=tierNow(d),b=BADGES[d.id]||(BADGES[d.id]={});let top=0;
  for(let t=1;t<=now;t++)if(!b[t]){b[t]=dayNum();top=t}
  if(top){saveBadges();if(!quiet)toast(`${TIER[top]} badge: ${d.code} ${d.name}. ${TIER_WHY[top][0].toUpperCase()+TIER_WHY[top].slice(1)}.`)}
  return top;
}
function mergeBadges(src){if(!src||typeof src!=="object")return;for(const id in src){if(!DECK[id]||!src[id]||typeof src[id]!=="object")continue;const b=BADGES[id]||(BADGES[id]={});for(const t of [1,2,3]){const v=src[id][t];if(Number.isInteger(v)&&v>0&&(!b[t]||v<b[t]))b[t]=v}}saveBadges()}
DECKS.forEach(d=>awardBadges(d,true));
function badgeSvg(tier,size,{lapsed=false,full=false}={}){
  const arcs=['','<use href="#arc1"/>','<use href="#arc1"/><use href="#arc2"/>','<use href="#arc1"/><use href="#arc2"/><use href="#arc3"/>'][tier];
  return `<svg class="badge t${tier}${lapsed?" lapsed":""}" width="${size}" height="${size}" viewBox="0 0 64 76" aria-hidden="true"><circle class="ring" cx="32" cy="42" r="30"/><use class="tw" href="#tower"/>${full?'<use class="tw" href="#towerx"/>':""}${arcs}</svg>`;
}
const deckBadge=(d,size,full)=>{const e=tierEarned(d);return badgeSvg(e,size,{lapsed:e>0&&tierNow(d)<e,full})};

/* Due today resets to on each time a deck opens, so one practice run never leaks into the next review. */
const prefs=Object.assign({showEst:true,showDate:false,haveFRN:false},get("prefs",{}));prefs.dueOnly=true;
["shuffleQ","shuffleA","basics"].forEach(k=>delete prefs[k]);
const savePrefs=()=>{const {dueOnly,...keep}=prefs;put("prefs",keep)};

/* In-app moves push a history entry carrying its depth from home, so the phone's Back button retraces them and
   "All sections" returns by going back, not by stacking a new home entry on top. */
const depth=()=>(history.state&&history.state.d)||0;
const go=h=>{history.pushState({d:depth()+1},"","#"+h);route()};
const goHome=()=>{const d=depth();if(d>0){history.go(-d);if(updateReady)return}else if(location.hash)history.replaceState(null,"",location.pathname+location.search);home();window.scrollTo(0,0)};
document.addEventListener("click",e=>{const a=e.target.closest&&e.target.closest('a[href^="#"]');if(!a||e.ctrlKey||e.metaKey||e.shiftKey)return;e.preventDefault();go(a.getAttribute("href").slice(1))});
function wink(top,msg){const w=document.createElement("div");w.className="wink";w.setAttribute("role","status");const t=document.createElement("b"),m=document.createElement("span");t.textContent=top;m.textContent=msg;w.append(t,m);document.body.appendChild(w);setTimeout(()=>w.remove(),4800)}
function toast(msg){const t=document.createElement("div");t.className="toast";t.setAttribute("role","status");t.textContent=msg;document.body.appendChild(t);setTimeout(()=>t.remove(),Math.max(2600,msg.length*60))}
/* A reset takes two taps; unless the second comes within five seconds, the button goes back to how it was. */
function armReset(b,what,erase){const label=b.textContent;
  b.onclick=()=>{if(b.dataset.armed){delete b.dataset.armed;erase();b.textContent="Progress reset";return}
    b.dataset.armed="1";b.textContent=`Tap again to erase all ${what} progress`;
    setTimeout(()=>{if(b.dataset.armed){delete b.dataset.armed;b.textContent=label}},5000)}}
/* In a drill, 1 to 4 or A to D picks an answer; Enter already presses the focused Next button. */
document.addEventListener("keydown",e=>{
  if(e.ctrlKey||e.metaKey||e.altKey||e.key.length!==1||(e.target.closest&&e.target.closest("input,textarea,select")))return;
  const n=Math.max("1234".indexOf(e.key),"abcd".indexOf(e.key.toLowerCase())),b=n>=0&&$("ans")&&$("ans").children[n];
  if(b&&!b.disabled){e.preventDefault();b.click()}});
/* What a screen reader hears after an answer and at the end of a drill; the question itself labels the answer group. */
const say=t=>{const s=$("said");if(s)s.textContent=t};
/* After a long explanation the page can sit scrolled below the card's top; bring the next question's start into view. */
const keepInView=el=>{if(el.getBoundingClientRect().top<0)el.scrollIntoView({block:"start"})};
/* Set when a new version has taken over; the page reloads at the next safe moment (home, or the app going to the background). */
let updateReady=false;

/* ---------- router ---------- */
function route(){
  const h=location.hash.slice(1);demoBar(false);
  const m=h.match(/^([a-z0-9]+)\/(study|p)(?:\/([a-z0-9_-]+))?$/);
  if(h==="due")drill({mixed:true});
  else if(h==="study")study(null);
  else if(h==="about")about();
  else if(m&&DECK[m[1]]&&m[2]==="study")study(DECK[m[1]]);
  else if(m&&DECK[m[1]]&&m[2]==="p"&&DECK[m[1]].P&&DECK[m[1]].P[m[3]])drill({deck:DECK[m[1]],primer:m[3]});
  else if(h==="symbols"&&DECK.symbols)symbols();
  else if(DECK[h])drill({deck:DECK[h]});
  else home();
  window.scrollTo(0,0);
}
window.addEventListener("hashchange",route);
/* Opened straight at a screen (a bookmark, say): put home beneath it, so Back lands on home rather than closing the app. */
if(location.hash&&history.state==null){const h=location.hash;history.replaceState(null,"",location.pathname+location.search);history.pushState({d:1},"",h)}
let lastDay=dayNum();
document.addEventListener("visibilitychange",()=>{
  if(document.hidden){if(updateReady)location.reload();return}
  if(dayNum()!==lastDay){lastDay=dayNum();if(!location.hash)home()}});

/* ---------- home ---------- */
function home(){
  if(updateReady){location.reload();return}
  const app=$("app");demoBar(true);
  const reviews=DECKS.map(d=>[d,reviewsDue(d),stats(d)]);
  const poolDue=POOL.reduce((a,d)=>a+reviewsDue(d),0);
  const poolSeen=POOL.reduce((a,d)=>a+stats(d).seen,0),poolTotal=POOL.reduce((a,d)=>a+stats(d).total,0);
  const untouched=POOL.filter(d=>stats(d).seen===0);
  const untouchedQs=untouched.reduce((a,d)=>a+d.exam,0);
  /* With nothing due, offer the first section that still has unseen questions, so the screen never dead-ends. */
  const next=POOL.find(d=>{const s=stats(d);return s.seen<s.total});
  let hinted=false;
  const row=([d,due,s])=>{
    const m=s.mastered/s.total*100,sn=(s.seen-s.mastered)/s.total*100;
    const how=s.mastered===s.total?`All ${s.total} mastered.`:`${s.seen} of ${s.total} seen, ${s.mastered} mastered.`;
    const meta=d.exam?`${s.seen?`${d.exam} on the exam. ${how}`:`${d.exam} on the exam, ${s.total} questions. Not started.`}`
      :`${s.seen?how:`${s.total} ${d.S?"symbols":"questions"}. Not started.`}`;
    const earned=tierEarned(d);
    return `<li><button class="row${s.seen?"":" untouched"}${earned?" badged":""}" data-go="${d.id}">
      <span class="code${d.code.length>2?" long":""}">${deckBadge(d,32)}${d.code}${earned?`<span class="sr">, ${TIER[earned]} badge</span>`:""}</span><span class="nm">${esc(d.name)}</span>
      <span class="due${due?"":" zero"}">${due||""}<small>${due?"due":""}</small></span>
      <span class="meta">${meta}</span>
      <span class="meter" aria-hidden="true"><i class="m" style="width:${m}%"></i><i class="s" style="width:${sn}%"></i></span></button>${!s.seen&&!hinted&&(d.P||d.S)&&(hinted=true)?`<span class="study-link">New to ${d.code}? <a href="#${d.id}/study">Read its basics first</a>.</span>`:""}</li>`};
  app.innerHTML=`
  <p class="over">${C.over}</p>
  <h1>${C.title}</h1>
  ${poolSeen?`<div class="today"><b>${poolDue}</b><span>${poolDue===1?"question":"questions"} due today</span></div>
  <p class="reach">${poolSeen} of ${poolTotal} seen.${untouched.length?` Untouched sections hold ${untouchedQs} exam questions.`:""}</p>`
  :`<p class="reach">${poolTotal} questions in ${NUMBER[POOL.length]||POOL.length} ${POOL.length===1?"section":"sections"}. Start with ${POOL[0].code}; each answer shows why.</p>`}
  ${poolDue?`<div class="actions"><button class="btn" data-go="due">${poolDue===1?"Review the 1 due question":`Review all ${poolDue} due questions`}</button></div>`
  :next?`<div class="actions"><button class="btn" data-go="${next.id}">${stats(next).seen?"Keep going with":"Start with"} ${next.code}: ${esc(next.name)}</button></div>`:""}
  ${planBlock()}
  <ul class="decks">${reviews.filter(([d])=>d.exam).map(row).join("")}</ul>
  <ul class="decks section-gap">${reviews.filter(([d])=>!d.exam).map(row).join("")}</ul>
  <div class="sashbox"><ul class="sash" aria-label="Section badges">${DECKS.map(d=>{const e=tierEarned(d);return `<li aria-label="${d.code}: ${e?TIER[e]+" badge":"no badge yet"}">${deckBadge(d,44,true)}<b aria-hidden="true">${d.code}</b></li>`}).join("")}</ul>
  <p class="sash-cap">${sashCaption()}</p></div>
  <div class="foot">
    <p class="links"><button class="linkbtn" id="exp">${DEMO?"Export sample":"Export progress"}</button>${DEMO?"":`<button class="linkbtn" id="imp">Import progress</button>`}<a href="#study">Study guide</a><a href="#about">About</a>${C.demo&&!DEMO&&DECKS.every(d=>!stats(d).seen)?`<a href="?demo">See it with sample progress</a>`:""}<span>Version ${APP_VERSION}${DEMO?", demo":""}</span></p>
  </div>`;
  app.querySelectorAll("[data-go]").forEach(b=>b.onclick=()=>go(b.dataset.go));
  $("exp").onclick=exportProgress;if($("imp"))$("imp").onclick=()=>$("importFile").click();
  if($("setDate"))$("setDate").onclick=()=>{prefs.showDate=true;savePrefs();home()};
  if($("changeDate"))$("changeDate").onclick=()=>{editingDate=true;home()};
  if($("cancelDate"))$("cancelDate").onclick=()=>{if(editingDate)editingDate=false;else{prefs.showDate=false;savePrefs()}home()};
  /* A typed date fires change at every keystroke that forms a valid date (year 0002, 0020...), so only a date
     from today to two years out is taken; anything else waits for more typing. */
  if($("examDate"))$("examDate").onchange=e=>{
    const v=e.target.value;if(!/^\d{4}-\d{2}-\d{2}$/.test(v))return;
    const day=isoToDay(v),t=dayNum();
    if(day<t){if(+v.slice(0,4)>=new Date().getFullYear())toast("Pick today or a later date.");return}
    if(day>t+730)return;
    setExamDay(day);editingDate=false;prefs.showDate=true;savePrefs();home()};
  if($("clearDate"))$("clearDate").onclick=()=>{setExamDay(null);editingDate=false;prefs.showDate=false;savePrefs();home()};
  if($("haveFRN"))$("haveFRN").onclick=()=>{prefs.haveFRN=true;savePrefs();home()};
  if($("hideEst"))$("hideEst").onclick=()=>{prefs.showEst=!prefs.showEst;savePrefs();home()};
}
function planBlock(){
  const e=estimate(),D=daysToExam(),pass=e.lo>=C.pass;
  const seen=POOL.reduce((a,d)=>a+stats(d).seen,0),need=Math.ceil(POOL.reduce((a,d)=>a+d.Q.length,0)*EST_MIN);
  const est=!COMPLETE?`<p class="muted">The estimate appears once all ${C.sections} sections are in.</p>`
    :seen<need?`<p class="muted">Your estimated score appears once you've seen ${need} questions${seen?`; ${seen} so far`:""}.</p>`
    :prefs.showEst?`<p class="${pass?"pass":e.hi<C.pass?"short":""}">Likely <b>${e.lo===e.hi?e.lo:`${e.lo} to ${e.hi}`} of ${C.examQ}</b>; ${C.pass} passes.${e.gain.length?` Most to gain: ${e.gain.join(", ")}.`:""} <button class="linkbtn" id="hideEst">Hide</button></p>`
    :`<p class="muted">Estimated score hidden. <button class="linkbtn" id="hideEst">Show</button></p>`;
  let date;
  if(editingDate||(EXAM.day==null&&prefs.showDate)){
    date=`<div class="set"><label for="examDate">Exam date</label><input type="date" id="examDate" min="${dayToIso(dayNum())}"${EXAM.day!=null?` value="${dayToIso(EXAM.day)}"`:""}><button class="linkbtn" id="cancelDate">Never mind</button>${EXAM.day!=null?`<button class="linkbtn" id="clearDate">Remove the date</button>`:""}</div>
    <p class="links"><a href="https://hamstudy.org/sessions" target="_blank" rel="noopener">HamStudy session finder</a><a href="https://www.arrl.org/find-an-amateur-radio-license-exam-session" target="_blank" rel="noopener">ARRL session finder</a></p>`;
  }else if(EXAM.day!=null){
    date=D>0?`<p>Exam in <b>${D} ${D===1?"day":"days"}</b>, ${dayLabel(EXAM.day)}.${D<=7?` Reviews are tightened so every card comes back before then.`:""} <button class="linkbtn" id="changeDate">Change</button>${prefs.showDate!==false?`<a href="https://hamstudy.org/sessions" target="_blank" rel="noopener">Find a session</a>`:""}</p>`
      :D===0?`<p>Exam day. Good luck. <button class="linkbtn" id="clearDate">Clear date</button></p>`
      :`<p class="muted">Your exam date (${dayLabel(EXAM.day)}) has passed. <button class="linkbtn" id="clearDate">Clear it</button></p>`;
    /* The FRN reminder stays until the person says they have one. */
    if(D!=null&&D>0&&prefs.showDate!==false&&!prefs.haveFRN)
      date+=`<p>Have your FRN? You'll need it at the exam. <a href="https://www.fcc.gov/wireless/support/universal-licensing-system-uls-resources/getting-fcc-registration-number-frn/" target="_blank" rel="noopener">Get one from the FCC</a><button class="linkbtn" id="haveFRN">I have one</button></p>`;
  }else{
    date=`<p class="muted"><button class="linkbtn" id="setDate">Set your exam date</button> to time reviews to it.</p>`;
  }
  return `<div class="plan">${est}${date}</div>`;
}
function sashCaption(){
  const c=[0,0,0,0];DECKS.forEach(d=>c[tierEarned(d)]++);
  const parts=[3,2,1].filter(t=>c[t]).map(t=>`${c[t]} ${TIER[t].toLowerCase()}`);
  return parts.length?`${parts.join(", ")} of ${DECKS.length} sections.`:"No badges yet. Bronze comes when every card in a section has been seen once.";
}
function exportProgress(){
  const data={app:C.exportApp,version:2,...(DEMO?{sample:true}:{}),exported:Date.now(),decks:Object.fromEntries(DECKS.map(d=>[d.id,srsOf(d.id)])),badges:BADGES,examDay:EXAM.day};
  const blob=new Blob([JSON.stringify(data)],{type:"application/json"});
  const d=new Date(),name=`${C.exportName}-${DEMO?"sample":"progress"}-${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}.json`;
  const file=new File([blob],name,{type:"application/json"});
  const download=()=>{const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),5000);
    toast(`Backup saved as ${name}, usually in your Downloads folder.`)};
  /* Phones offer the share sheet (Drive, email, Files). If sharing fails for any reason but the person backing out, download instead. */
  if(navigator.canShare&&navigator.canShare({files:[file]})){
    navigator.share({files:[file],title:"Ham drill progress"})
      .then(()=>toast("Backup sent. Keep it somewhere you can find it, like Google Drive or your email."))
      .catch(err=>{if(!err||err.name!=="AbortError")download()});
    return}
  download();
}
$("importFile").onchange=async e=>{
  const f=e.target.files[0];e.target.value="";if(!f)return;
  try{const d=JSON.parse(await f.text());
    if(d&&d.decks&&/^hamdrill/.test(d.app)&&d.app!==C.exportApp){toast("That backup is from another exam's drills.");return}
    if(!d||d.app!==C.exportApp||!d.decks)throw 0;
    if(d.sample){toast("That's the demo's sample progress, not a backup of yours.");return}
    const {decks:n,dropped}=importDecks(d.decks);mergeBadges(d.badges);if(Number.isInteger(d.examDay)&&EXAM.day==null&&d.examDay>=dayNum())setExamDay(d.examDay);DECKS.forEach(x=>awardBadges(x,true));
    toast(`Imported progress for ${n} ${n===1?"section":"sections"}${dropped?`; ${dropped} damaged ${dropped===1?"record was":"records were"} skipped`:""}.`);route()}
  catch(err){toast("That file isn't a drill progress export.")}
};

/* ---------- study pages ----------
   One source, three views: the primers in data.js feed the Basics-first cards, the explanation panel
   and these pages. A page per deck, or every deck at once for printing. */
const SYM_SW='stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"';
const figBox=f=>FIGS[f]?`<figure class="figbox">${FIGS[f]}<figcaption>Figure ${f}</figcaption></figure>`:`<p class="fig">Uses figure ${f} from the pool.</p>`;
function studySection(d,{solo}){
  const h="h1";
  let body="";
  if(d.S){
    body=`<p class="sub">${d.S.length} symbols that appear on the exam. The hook under each is how to spot it.</p>
    <div class="gallery">${d.S.map(s=>`<div><svg viewBox="0 0 120 60" role="img" aria-label="${esc(s.n)}"><g ${SYM_SW}>${s.d}</g></svg><b>${esc(s.n)}</b>${esc(s.def)}<p>${esc(s.t)}</p></div>`).join("")}</div>
    <h2>${C.symbolText.figsHead}</h2><p>${C.symbolText.figsNote} Each figure also appears on the card for any question that uses it.</p>
    <div class="figs">${Object.keys(FIGS).map(f=>`<figure class="figbox">${FIGS[f]}<figcaption>Figure ${f}. The pool asks about ${FIG_KEY[f]}.</figcaption></figure>`).join("")}</div>`;
  }else{
    const cov={};for(const q of d.Q){const k=d.CON&&d.CON[q[0]];if(k)(cov[k]=cov[k]||[]).push(q[0])}
    const intro=d.exam?`${d.code} supplies ${d.exam} of the ${C.examQ} exam questions, drawn from ${d.Q.length} in the pool.`:`${d.Q.length} questions, with the formulas they rest on.`;
    body=`<p class="sub">${intro}</p>
    ${d.cheat?`<details class="cheat" open><summary>Formulas</summary>${d.cheat}</details>`:""}
    ${Object.keys(d.P||{}).map(k=>{const [t,b]=d.P[k],ids=cov[k]||[];
      return `<h2>${t}</h2><div class="primer">${b}</div>
      <p class="cover">Covers <b>${ids.length===1?ids[0]:`${ids.length} questions, ${ids[0]} to ${ids[ids.length-1]}`}</b>${ids.length?` <a href="#${d.id}/p/${k}">&middot; Drill these</a>`:""}</p>`}).join("")}`;
  }
  return `<section class="sec"><${h}>${d.id==="math"||d.id==="symbols"?esc(d.name):`${d.code}: ${esc(d.name)}`}</${h}>${body}</section>`;
}
function study(deck){
  const app=$("app");
  const decks=deck?[deck]:DECKS;
  app.innerHTML=`<div class="study">
  <button class="back" id="back">&larr; All sections</button>
  ${deck?"":`<p class="over">${C.over}</p><h1>${C.studyTitle}</h1><p class="sub">The basics behind every section of the ${C.poolYears} pool, in pool order. Print this page for a paper copy.</p>`}
  <p class="tools">${deck?`<a href="#${deck.id}">Drill ${deck.code}</a><a href="#study">Whole guide</a>`:""}<button class="linkbtn" id="print">Print</button></p>
  ${decks.map(d=>studySection(d,{solo:!!deck})).join("")}
  </div>`;
  $("back").onclick=goHome;
  $("print").onclick=()=>window.print();
}

/* ---------- about ---------- */
function about(){
  $("app").innerHTML=`<div class="about">
  <button class="back" id="back">&larr; All sections</button>
  <p class="over">${C.over}</p><h1>About these drills</h1>
  <p>Drills for the ${C.poolYears} ${C.shortName} question pool, worded as on the exam, with spaced review. ${C.aboutFacts}</p>
  <h2>How review works</h2>
  <p>A card comes back after one day, then three, then seven, then longer. Three correct answers on separate days marks it mastered. A miss sends it back to the start. Nothing is scheduled past your exam date if you set one, and inside the last week every card comes back at least once more.</p>
  <h2>Badges</h2>
  <p>A section earns bronze when every card has been seen, silver when every card has been answered correctly at least once, and gold when every card is mastered. A rung, once earned, stays; the badge dims while the section's current standing is below its best rung.</p>
  <h2>The estimated score</h2>
  <p>Each section is weighed by how many of the ${C.examQ} exam questions it supplies and by how far along its cards are: mastered cards count almost fully, cards answered right once count partly, unseen cards count as a guess. It's a rough gauge, not a prediction. Hide it from the home screen if it's unwelcome.</p>
  <h2>Study pages</h2>
  <p>Every section has a study page with its basics in pool order; the <a href="#study">whole guide</a> is one page you can print. The same text appears before your first new question on each topic, and under Explain this more.</p>
  <h2>Testing yourself</h2>
  <p>This app is for learning the pool. For practice exams under exam conditions, use <a href="https://hamstudy.org/" target="_blank" rel="noopener">HamStudy.org</a>. When you're ready, find a session through <a href="https://hamstudy.org/sessions" target="_blank" rel="noopener">HamStudy</a> or the <a href="https://www.arrl.org/find-an-amateur-radio-license-exam-session" target="_blank" rel="noopener">ARRL</a>, and get your <a href="https://www.fcc.gov/wireless/support/universal-licensing-system-uls-resources/getting-fcc-registration-number-frn/" target="_blank" rel="noopener">FCC Registration Number</a> before test day.</p>
  <h2>Your progress</h2>
  <p>Progress is saved on this phone and nowhere else. Export progress on the home screen makes a backup file; import it on a new phone. Do that before clearing browser data or switching phones.</p>
  <h2>Credits</h2>
  <p>Pool text from the <a href="https://ncvec.org" target="_blank" rel="noopener">NCVEC</a>; the pool is public domain. Version ${APP_VERSION}.</p>
  </div>`;
  $("back").onclick=goHome;
}

/* ---------- question drills ---------- */
function drill({deck,mixed,primer}){
  const app=$("app");prefs.dueOnly=!primer;
  const decks=mixed?POOL:[deck];
  const all=decks.flatMap(d=>d.Q.map(q=>({d,q})));
  const grpOf=(d,id)=>d.id==="math"?(C.mathGroups.includes(id.slice(0,3))?id.slice(0,3):"X"):id.slice(0,3);
  let group="all",items=[],i=0,done=0,fr=0,fd=0,shown=null;
  const title=mixed?"Everything due":deck.id==="math"?deck.name:`${deck.code}: ${deck.name}`;
  const sub=mixed?`Every pool question due today, mixed across sections. ${DECK.symbols?"Math and Symbols are reviewed on their own.":"Math is reviewed on its own."}`:
    deck.id==="math"?"Every math question in the pool, with a worked solution after each answer.":`All ${deck.Q.length} ${deck.code} questions, worded as on the exam. ${deck.code} supplies ${deck.exam} of your ${C.examQ} exam questions.`;
  const chips=mixed||primer?[]:[["all",`All ${deck.Q.length}`],...Object.keys(deck.G).map(g=>[g,g==="X"?"Other":g])];
  app.innerHTML=`<button class="back" id="back">&larr; All sections</button>
  <h1>${title}</h1>${mixed?`<p class="sub">${sub}</p>`:""}
  ${primer?`<p class="only">Drilling the ${deck.Q.filter(q=>deck.CON[q[0]]===primer).length} questions under <b>${esc(deck.P[primer][0])}</b>, due or not. <a href="#${deck.id}/study">Back to the ${deck.code} study page</a>.</p>`:""}
  ${!mixed&&deck.cheat?`<details class="cheat"><summary>Cheat sheet</summary>${deck.cheat}</details>`:""}
  ${!mixed&&deck.P&&!primer?`<p class="tools"><a href="#${deck.id}/study">Read the ${deck.code} basics</a></p>`:""}
  ${chips.length?`<div class="groups" id="groups" role="group" aria-label="Question group">${chips.map(([v,l])=>`<button class="chip" data-v="${v}" aria-pressed="${v===group}">${l}</button>`).join("")}</div>`:""}
  ${mixed?"":`<div class="opts"><label><input type="checkbox" id="dueOnly"> Due today</label></div>`}
  <p class="srs" id="srsline"></p>
  <div class="status"><span id="pos"></span><span id="score"></span></div>
  <div class="bar"><span id="fill"></span></div>
  <div class="card" id="card"></div><p class="sr" id="said" aria-live="polite"></p>
  ${mixed?"":`<p class="foot"><button class="linkbtn" id="reset">Reset ${deck.code} progress</button></p>`}`;
  $("back").onclick=goHome;
  const dueOnly=()=>mixed||prefs.dueOnly;
  if($("dueOnly")){$("dueOnly").checked=prefs.dueOnly;$("dueOnly").onchange=()=>{prefs.dueOnly=$("dueOnly").checked;start()}}
  if($("groups"))$("groups").querySelectorAll(".chip").forEach(b=>b.onclick=()=>{group=b.dataset.v;$("groups").querySelectorAll(".chip").forEach(c=>c.setAttribute("aria-pressed",c===b));start()});
  if(!mixed)armReset($("reset"),deck.code,()=>{SRS[deck.id]={};saveSrs(deck.id);start()});

  const inGroup=()=>all.filter(x=>primer?deck.CON[x.q[0]]===primer:(group==="all"||grpOf(x.d,x.q[0])===group));
  const due=x=>mixed?(isSeen(x.d.id,x.q[0])&&isDue(x.d.id,x.q[0])):isDue(x.d.id,x.q[0]);
  function srsLine(){
    const g=inGroup(),t=dayNum();
    const n=g.filter(due).length,m=g.filter(x=>isMastered(x.d.id,x.q[0])).length,tom=g.filter(x=>{const r=srsOf(x.d.id)[x.q[0]];return r&&r.due===t+1}).length;
    $("srsline").textContent=mixed?`${n} due today${tom?`, ${tom} coming up tomorrow`:""}.`:`${n} due today, ${m} of ${g.length} mastered${tom?`, ${tom} coming up tomorrow`:""}.`;
  }
  /* Reviews come first, shuffled. New cards follow grouped by topic in pool order, and the topic's basics
     come before its first new card; a review never stops for basics. */
  const basicsFor=x=>!mixed&&!primer&&deck.CON&&!isSeen(deck.id,x.q[0])?deck.CON[x.q[0]]:null;
  function start(){
    let pool=inGroup();
    if(dueOnly())pool=pool.filter(due);
    pool=shuffle(pool);
    const ord=Object.keys(deck&&deck.P||{}),fresh=pool.filter(basicsFor);
    items=pool.filter(x=>!basicsFor(x)).concat(ord.flatMap(k=>fresh.filter(x=>basicsFor(x)===k)));
    shown=null;i=0;done=0;fr=0;fd=0;render();
  }
  function status(){
    srsLine();
    $("pos").textContent=items.length?`Question ${Math.min(i+1,items.length)} of ${items.length}`:"";
    $("score").textContent=fd?`${fr} of ${fd} right first try`:"";
    $("fill").style.width=items.length?(done/items.length*100)+"%":"0";
  }
  function render(){
    status();const c=$("card");keepInView(c);
    if(!items.length){c.innerHTML=mixed?`<p class="q">Nothing is due for review today.</p><p>Spacing works best when cards rest. Come back tomorrow, or go back to all sections and open one to practice anyway.</p>`
      :dueOnly()?`<p class="q">Nothing is due here today.</p><p>Spacing works best when cards rest. Come back tomorrow, or turn off Due today to practice anyway.</p>`:`<p class="q">No questions match.</p>`;return}
    if(i>=items.length){
      const pct=Math.round(fr/Math.max(fd,1)*100),left=inGroup().filter(due).length,t=dayNum();
      const tom=inGroup().filter(x=>{const r=srsOf(x.d.id)[x.q[0]];return r&&r.due===t+1}).length;
      c.innerHTML=`<div class="end"><h2>${fr}/${fd}</h2><p>${pct}% right on the first try.${fd&&fr===fd?"":` The exam pass mark is ${Math.round(C.pass/C.examQ*100)}%.`}</p>${dueOnly()?`<p>${left?`${left} more ${left===1?"question is":"questions are"} due today.`:"That's everything due today."} ${tom} will be back tomorrow.</p>`:""}</div>
      <div class="actions"><button class="btn" id="home">Back to all sections</button><button class="btn ghost" id="again">Start over</button></div>`;
      $("home").onclick=goHome;$("again").onclick=start;say(c.querySelector(".end").textContent);
      if(fd&&fr===fd)wink(`${fr} out of ${fd}`,"Wouldn't that be just like you?");
      return;
    }
    const {d,q}=items[i];
    if(basicsFor(items[i])&&basicsFor(items[i])!==shown){
      const k=basicsFor(items[i]),[t,b]=deck.P[k];let n=0;while(i+n<items.length&&basicsFor(items[i+n])===k)n++;
      c.innerHTML=`<p class="topic">Basics</p><h2 class="ptitle" id="ptitle">${t}</h2><div class="primer">${b}</div><p class="topic">Covers the next ${n===1?"question":n+" questions"}. <a href="#${deck.id}/study" style="color:inherit">Read all of ${deck.code}'s basics</a>.</p><div class="actions"><button class="btn" id="go" aria-describedby="ptitle">Show the question</button></div>`;
      $("go").onclick=()=>{shown=k;render()};$("go").focus({preventScroll:true});return;
    }
    const [id,text,opts,ans,note,fig]=q;
    const hasAll=opts.some(o=>/^All these/.test(o));
    const order=hasAll?[0,1,2,3]:shuffle([0,1,2,3]);
    c.innerHTML=`<p class="topic"><span class="qid">${id}</span>${esc(d.G[grpOf(d,id)]||d.name)}</p>
      ${fig?figBox(fig):""}
      <p class="q" id="qtext">${text}</p><div class="ans" id="ans" role="group" aria-labelledby="qtext"></div><div id="after"></div>`;
    order.forEach((oi,pos)=>{const b=document.createElement("button");b.innerHTML=`<b>${"ABCD"[pos]}</b><span>${opts[oi]}</span>`;b.dataset.oi=oi;b.onclick=()=>pick(oi);$("ans").appendChild(b)});
    $("ans").firstChild.focus({preventScroll:true});
  }
  function pick(oi){
    const {d,q}=items[i],[id,,,ans,note]=q,ok=oi===ans;
    [...$("ans").children].forEach(b=>{b.disabled=true;const v=+b.dataset.oi;if(v===ans)b.classList.add("right");else if(v===oi)b.classList.add("wrong")});
    done++;if(!items[i].re){fd++;if(ok)fr++}
    const lemon=!ok&&hadRight(d.id,id);record(d.id,id,ok);
    if(!ok&&dueOnly()){items.splice(Math.min(i+4,items.length),0,{...items[i],re:1})}
    status();
    const F=d.F&&d.F[id],ex=EXPLAIN[id],ck=d.CON&&d.CON[id],pr=ck&&d.P[ck];
    $("after").innerHTML=`<p class="note"><strong class="${ok?"ok":"no"}">${ok?"Correct.":missText(lemon)}</strong> ${note}</p>
      ${F?`<div class="fx"><p class="eq">${F[0]}</p><ul class="leg">${F[1].map(x=>`<li>${x}</li>`).join("")}</ul></div>`:""}
      <div class="actions"><button class="btn" id="next">${i+1<items.length?"Next question":"See results"}</button>${ex?`<button class="btn ghost" id="more" aria-expanded="false">Explain this more</button>`:""}</div>
      <div class="explain" id="exbox" hidden>${ex?ex.split(/\n\s*\n/).map(p=>`<p>${esc(p)}</p>`).join(""):""}
      ${pr?`<details><summary>Basics: ${pr[0]}</summary>${pr[1]}</details>`:""}</div>`;
    say($("after").querySelector(".note").textContent);
    $("next").onclick=()=>{i++;render()};
    if($("more"))$("more").onclick=function(){const box=$("exbox"),open=box.hidden;box.hidden=!open;this.setAttribute("aria-expanded",open);this.textContent=open?"Hide explanation":"Explain this more"};
    $("next").focus({preventScroll:true});
  }
  start();
}

/* ---------- symbol drill ---------- */
function symbols(){
  const d=DECK.symbols,S=d.S,app=$("app");prefs.dueOnly=true;
  const SW='stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"';
  const svg=s=>`<svg viewBox="0 0 120 60" role="img" aria-label="Schematic symbol"><g ${SW}>${s.d}</g></svg>`;
  let mode="name",items=[],i=0,done=0,fr=0,fd=0;
  app.innerHTML=`<button class="back" id="back">&larr; All sections</button>
  <h1>Symbol drill</h1><p class="sub">${C.symbolText.drill}</p>
  <div class="groups" id="modes" role="group" aria-label="Drill mode">${[["name","Name the symbol"],["find","Find the symbol"],["mix","Mixed"]].map(([v,l])=>`<button class="chip" data-v="${v}" aria-pressed="${v===mode}">${l}</button>`).join("")}</div>
  <div class="opts"><label><input type="checkbox" id="dueOnly"> Due today</label></div>
  <p class="srs" id="srsline"></p>
  <div class="status"><span id="pos"></span><span id="score"></span></div>
  <div class="bar"><span id="fill"></span></div>
  <div class="card" id="card"></div><p class="sr" id="said" aria-live="polite"></p>
  <p class="foot"><button class="linkbtn" id="reset">Reset symbol progress</button></p>`;
  $("back").onclick=goHome;
  $("dueOnly").checked=prefs.dueOnly;$("dueOnly").onchange=()=>{prefs.dueOnly=$("dueOnly").checked;savePrefs();start()};
  $("modes").querySelectorAll(".chip").forEach(b=>b.onclick=()=>{mode=b.dataset.v;$("modes").querySelectorAll(".chip").forEach(c=>c.setAttribute("aria-pressed",c===b));start()});
  armReset($("reset"),"symbol",()=>{SRS.symbols={};saveSrs("symbols");start()});
  const due=s=>isDue("symbols",s.n);
  const tomorrow=()=>S.filter(s=>{const r=srsOf("symbols")[s.n];return r&&r.due===dayNum()+1}).length;
  function srsLine(){$("srsline").textContent=`${S.filter(due).length} due today, ${S.filter(s=>isMastered("symbols",s.n)).length} of ${S.length} mastered${tomorrow()?`, ${tomorrow()} coming up tomorrow`:""}.`}
  function choices(s){const same=shuffle(S.filter(x=>x!==s&&x.f===s.f)),rest=shuffle(S.filter(x=>x!==s&&x.f!==s.f));return shuffle([s,...same.concat(rest).slice(0,3)])}
  function start(){const pool=prefs.dueOnly?S.filter(due):S;items=shuffle(pool).map(s=>({s,m:mode==="mix"?(Math.random()<.5?"name":"find"):mode}));i=0;done=0;fr=0;fd=0;render()}
  function status(){srsLine();$("pos").textContent=items.length?`Symbol ${Math.min(i+1,items.length)} of ${items.length}`:"";$("score").textContent=fd?`${fr} of ${fd} right first try`:"";$("fill").style.width=items.length?(done/items.length*100)+"%":"0"}
  function render(){
    status();const c=$("card");keepInView(c);
    if(!items.length){c.innerHTML=`<p class="q">Nothing is due here today.</p><p>Come back tomorrow, or turn off Due today to practice anyway.</p>`;return}
    if(i>=items.length){const left=S.filter(due).length;
      c.innerHTML=`<div class="end"><h2>${fr}/${fd}</h2><p>${Math.round(fr/Math.max(fd,1)*100)}% right on the first try.</p>${prefs.dueOnly?`<p>${left?`${left} more ${left===1?"symbol is":"symbols are"} due today.`:"That's everything due today."} ${tomorrow()} will be back tomorrow.</p>`:""}</div>
      <div class="actions"><button class="btn" id="home">Back to all sections</button><button class="btn ghost" id="again">Start over</button></div>`;
      $("home").onclick=goHome;$("again").onclick=start;say(c.querySelector(".end").textContent);return}
    const {s,m}=items[i],opts=choices(s);
    if(m==="name"){c.innerHTML=`<p class="prompt" id="qtext">What is this symbol?</p><div class="big">${svg(s)}</div><div class="ans" id="ans" role="group" aria-labelledby="qtext"></div><div id="after"></div>`;
      opts.forEach(o=>{const b=document.createElement("button");b.textContent=o.n;b.dataset.n=o.n;b.onclick=()=>pick(o,s);$("ans").appendChild(b)})}
    else{c.innerHTML=`<p class="prompt" id="qtext">Tap the symbol for</p><p class="name" id="qname">${esc(s.n)}</p><div class="ans tiles" id="ans" role="group" aria-labelledby="qtext qname"></div><div id="after"></div>`;
      opts.forEach((o,k)=>{const b=document.createElement("button");b.innerHTML=svg(o);b.dataset.n=o.n;b.setAttribute("aria-label","Option "+"ABCD"[k]);b.onclick=()=>pick(o,s);$("ans").appendChild(b)})}
    $("ans").firstChild.focus({preventScroll:true});
  }
  function pick(o,s){
    const ok=o===s;
    [...$("ans").children].forEach(b=>{b.disabled=true;if(b.dataset.n===s.n)b.classList.add("right");else if(b.dataset.n===o.n)b.classList.add("wrong")});
    done++;if(!items[i].re){fd++;if(ok)fr++}const lemon=!ok&&hadRight("symbols",s.n);record("symbols",s.n,ok);
    if(!ok&&prefs.dueOnly)items.splice(Math.min(i+4,items.length),0,{...items[i],re:1});
    status();
    $("after").innerHTML=`<div class="note"><p class="defn"><strong class="${ok?"ok":"no"}">${ok?"Correct.":missText(lemon)}</strong> <b>${esc(s.n)}</b>: ${s.def}</p><p class="hook">How to spot it: ${s.t}</p></div><div class="actions"><button class="btn" id="next">${i+1<items.length?"Next symbol":"See results"}</button></div>`;
    say($("after").querySelector(".note").textContent);
    $("next").onclick=()=>{i++;render()};$("next").focus({preventScroll:true});
  }
  start();
}

route();
if("serviceWorker" in navigator&&location.protocol!=="file:"){
  const had=!!navigator.serviceWorker.controller;
  /* A new version has taken over. Reload now if on home, where nothing is in progress; otherwise at the next
     return home or when the app goes to the background. Answers are saved as they're given, so nothing is lost. */
  navigator.serviceWorker.addEventListener("controllerchange",()=>{if(!had)return;
    try{sessionStorage.setItem(NS+"updated","1")}catch(e){}
    updateReady=true;if(!location.hash)location.reload()});
  try{if(sessionStorage.getItem(NS+"updated")){sessionStorage.removeItem(NS+"updated");toast(`Updated to version ${APP_VERSION}.`)}}catch(e){}
  navigator.serviceWorker.register("sw.js",{updateViaCache:"none"}).catch(()=>{});
}
