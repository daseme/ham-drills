/* The study week: the day log, the floor, the strip on home, weeks in a row, the end-screen line. */
"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const {load}=require("./harness");

/* Noon UTC on a known Thursday, 2026-10-22; dayNum is local, and noon keeps the date the same in every zone. */
const THU=Date.UTC(2026,9,22,12);
const at=(ms,o={})=>load({now:ms,...o});

test("the harness pins the clock, and the week starts on Monday",()=>{
  const a=at(THU),T=a.run("dayNum()");
  assert.equal(a.run("new Date().toISOString().slice(0,10)"),"2026-10-22");
  assert.equal(a.run(`weekday(${T})`),3);
  assert.equal(a.run(`weekStart(${T})`),T-3);
  assert.equal(a.run("weekday(0)"),3,"day 0 is Thursday 1970-01-01");
  assert.equal(a.run(`weekday(${T+3})`),6,"Sunday");
  assert.equal(a.run(`weekStart(${T+3})`),T-3,"Sunday is still this week");
  assert.equal(a.run(`weekStart(${T+4})`),T+4,"Monday starts the next");
});

test("the floor is 10, or what was due when fewer, and a practice exam meets the day on its own",()=>{
  const a=at(THU);
  assert.equal(a.run("dayFloor(undefined)"),10);
  assert.equal(a.run("dayFloor({d:0,n:0})"),10);
  assert.equal(a.run("dayFloor({d:3,n:0})"),3);
  assert.equal(a.run("dayFloor({d:10,n:0})"),10);
  assert.equal(a.run("dayFloor({d:87,n:0})"),10);
  assert.equal(a.run("dayMet(undefined)"),false);
  assert.equal(a.run("dayMet({d:3,n:3})"),true);
  assert.equal(a.run("dayMet({d:3,n:2})"),false);
  assert.equal(a.run("dayMet({d:0,n:9})"),false);
  assert.equal(a.run("dayMet({d:0,n:10})"),true);
  assert.equal(a.run("dayMet({d:87,n:10})"),true);
  assert.equal(a.run("dayMet({d:87,n:0,x:true})"),true);
});

const rec=(T,o={})=>JSON.stringify({lv:1,due:T+1,last:T,fail:null,n:1,w:0,...o});

test("the first touch of a day records what was due; answers count distinct items and never go down",()=>{
  const a=at(THU),T=a.run("dayNum()");
  a.run("home()");
  assert.equal(a.run("get('days',null)"),null,"nothing seen, nothing written");
  a.run("record('t1','T1A01',true);record('t1','T1A01',false);record('t1','T1A02',true)");
  assert.deepEqual(a.run(`DAYS[${T}]`),{d:0,n:2},"two distinct items; a repeat is not a third");
  a.run("SRS.t1={};saveSrs('t1');record('t2','T2A01',true)");
  assert.equal(a.run(`DAYS[${T}].n`),2,"a section reset cannot lower n");
  a.run("saveExam({day:dayNum(),right:30,missed:[],secs:60})");
  assert.equal(a.run(`DAYS[${T}].x`),true);
  assert.equal(a.run("todayMet()"),true);
  assert.deepEqual(a.run("get('days')"),a.run("DAYS"),"saved");
});

test("home takes the due count once a card has been seen, and a new day gets its own entry",()=>{
  const T=load({now:THU}).run("dayNum()");
  const a=at(THU,{storage:{"hamdrill:srs:t1":JSON.stringify({T1A01:JSON.parse(rec(T-1)),T1A02:JSON.parse(rec(T-3,{due:T+4}))})}});
  a.run("home()");
  assert.deepEqual(a.run(`DAYS[${T}]`),{d:1,n:0});
  const b=at(THU+86400000,{storage:{"hamdrill:srs:t1":JSON.stringify({T1A01:JSON.parse(rec(T-1))}),"hamdrill:days":JSON.stringify({[T]:{d:1,n:1}})}});
  b.run("record('t1','T1A01',true)");
  assert.deepEqual(b.run(`DAYS[${T}]`),{d:1,n:1},"yesterday is untouched");
  assert.deepEqual(b.run(`DAYS[${T+1}]`),{d:1,n:1});
});

test("a damaged log is dropped entry by entry, and old entries fall away on save",()=>{
  const T=load({now:THU}).run("dayNum()");
  const bad={[T-1]:{d:2,n:3},[T-2]:{n:-1},[T-3]:"x",[T-4]:{n:2,d:-1,x:1},[T-500]:{n:5},abc:{n:1}};
  const a=at(THU,{storage:{"hamdrill:days":JSON.stringify(bad)}});
  assert.deepEqual(a.run("DAYS"),{[T-1]:{d:2,n:3},[T-4]:{n:2},[T-500]:{n:5}});
  a.run("saveDays()");
  assert.deepEqual(Object.keys(a.run("get('days')")),[String(T-4),String(T-1)]);
  assert.deepEqual(at(THU,{storage:{"hamdrill:days":"[1,2]"}}).run("DAYS"),{});
});

test("with no log, the last fourteen days are rebuilt from the records",()=>{
  const T=load({now:THU}).run("dayNum()");
  const srs={T1A01:JSON.parse(rec(T-2)),T1A02:JSON.parse(rec(T-2)),T1A03:JSON.parse(rec(T-14,{due:T+20}))};
  const a=at(THU,{storage:{"hamdrill:srs:t1":JSON.stringify(srs)}});
  assert.deepEqual(a.run(`DAYS[${T-2}]`),{n:2});
  assert.equal(a.run(`DAYS[${T-14}]`),undefined,"fourteen days back is outside the window");
  assert.deepEqual(a.run(`get('days')[${T-2}]`),{n:2});
  assert.deepEqual(a.run(`DAYS[${T}]`),{d:2,n:0},"the startup visit to home touched today");
  assert.deepEqual(load({now:THU}).keys(),[],"nothing to rebuild writes nothing");
});

/* A log for this week relative to a pinned day: met days as {d:3,n:3}, days off as {d:3,n:0}. */
const log=(T,met,unmet=[])=>{const o={};for(const t of met)o[t]={d:3,n:3};for(const t of unmet)o[t]={d:3,n:0};return o};
const state=(ms,days,extra={})=>at(ms,{storage:{"hamdrill:days":JSON.stringify(days),...extra}}).run("weekState()");
const home=(ms,days)=>{const a=at(ms,{storage:{"hamdrill:days":JSON.stringify(days)}});a.run("home()");return a.run(`$("app").innerHTML`)};
const SAT=THU+2*86400000,SUN=THU+3*86400000,WED=THU-86400000,MON=THU-3*86400000;
const T=load({now:THU}).run("dayNum()"),MO=T-3;

test("steady on Thursday: three days, one off, today in, four weeks in a row",()=>{
  const days=log(T,[MO,MO+1,T],[MO+2]);
  for(let w=1;w<=4;w++)for(let k=0;k<5;k++)days[MO-7*w+k]={d:3,n:3};
  const s=state(THU,days);
  assert.equal(s.shown,true);assert.equal(s.made,false);
  assert.deepEqual(s.dots.map(d=>d.cls),["done","done","off","done now","","",""]);
  assert.deepEqual(s.dots.map(d=>d.label),["Monday, studied","Tuesday, studied","Wednesday, day off","Thursday, today, studied","Friday","Saturday","Sunday"]);
  assert.equal(s.line,"3 days this week, 1 day off left.");
  assert.equal(s.small,"4 weeks in a row.");
});

test("week made on Saturday, with the sixth day as a bonus",()=>{
  const s=state(SAT,log(T,[MO,MO+1,MO+3,MO+4,MO+5],[MO+2]));
  assert.equal(s.made,true);
  assert.deepEqual(s.dots.map(d=>d.cls),["done","done","off","done","done","done now",""]);
  assert.equal(s.line,'<span class="ok">Week made,</span> 5 days.');
  assert.equal(s.small,"","one made week is not a row yet");
  const six=state(SUN,log(T,[MO,MO+1,MO+2,MO+3,MO+4,MO+5,MO+6]));
  assert.deepEqual(six.dots.map(d=>d.cls),["done","done","done","done","done","bonus","bonus now"]);
  assert.equal(six.line,'<span class="ok">Week made,</span> 7 days.');
});

test("back after ten days on Wednesday: two days off spent, the week still winnable, the cards waited",()=>{
  const s=state(WED,log(T,[MO-12,MO-11,MO-10]));
  assert.deepEqual(s.dots.map(d=>d.cls),["off","off","now","","","",""]);
  assert.equal(s.line,"Today and the next 4 days make this week.");
  assert.equal(s.small,"The cards waited. A missed stretch doesn't undo the spacing.");
  const after=state(WED,log(T,[MO-12,MO-11,MO-10,MO+2]));
  assert.equal(after.line,"1 day this week; the next 4 make it.");
  assert.equal(after.small,"");
});

test("the other lines: nothing yet, singulars, none in hand on Sunday, and a week that can't be made",()=>{
  assert.equal(state(MON,{[MO-7]:{d:3,n:3}}).line,"Nothing yet this week, 2 days off left.");
  assert.equal(state(THU,log(T,[T],[MO,MO+1,MO+2])).line,"1 day this week.","three days off: no clause about days off");
  assert.equal(state(THU,log(T,[MO-7],[MO,MO+1,MO+2])).line,"Nothing yet this week.");
  assert.equal(state(SUN,log(T,[MO,MO+1,MO+2,MO+3],[MO+4,MO+5])).line,"Today makes this week.");
  assert.equal(state(SAT,log(T,[MO,MO+1,MO+2],[MO+3,MO+4])).line,"Today and tomorrow make this week.");
  assert.equal(state(SAT,log(T,[MO,MO+1,MO+2,MO+5],[MO+3,MO+4])).line,"4 days this week; the next one makes it.");
});

test("a learner who starts on a Thursday: the earlier days are neither studied nor off, and the week can't be made",()=>{
  const s=state(THU,log(T,[T]));
  assert.deepEqual(s.dots.map(d=>d.cls),["","","","done now","","",""]);
  assert.deepEqual(s.dots.slice(0,3).map(d=>d.label),["Monday","Tuesday","Wednesday"]);
  assert.equal(s.line,"1 day this week.");
  assert.equal(state(WED,log(T,[MO+2])).line,"1 day this week; the next 4 make it.","Wednesday is just in time");
  assert.equal(state(THU,{[MO]:{d:0,n:0},[T]:{d:3,n:3}}).dots[0].cls,"off","an opened app with nothing done is a day off");
});

test("weeks in a row: a missed week drops it, this week counts once made",()=>{
  const row=(n,extra=[])=>{const d={};for(let w=1;w<=n;w++)for(let k=0;k<5;k++)d[MO-7*w+k]={d:3,n:3};for(const t of extra)d[t]={d:3,n:3};return d};
  const a=at(THU,{storage:{"hamdrill:days":JSON.stringify(row(5))}});
  assert.equal(a.run("weeksInARow(dayNum())"),5);
  assert.equal(at(THU,{storage:{"hamdrill:days":JSON.stringify(row(5,[MO,MO+1,MO+2,MO+3,MO+4]))}}).run("weeksInARow(dayNum())"),6);
  const gap=row(3);for(let k=0;k<5;k++)delete gap[MO-7+k];
  assert.equal(at(THU,{storage:{"hamdrill:days":JSON.stringify(gap)}}).run("weeksInARow(dayNum())"),0);
  assert.equal(state(THU,row(1,[MO])).small,"");
  assert.equal(state(THU,row(2,[MO])).small,"2 weeks in a row.");
  assert.equal(state(THU,row(2)).small,"The cards waited. A missed stretch doesn't undo the spacing.","nothing since last week: the welcome line wins");
});

test("home shows the strip after the first answers, after the hard line and before the plan panel, and hides it before",()=>{
  assert.doesNotMatch(home(THU,{}),/class="week"/);
  assert.doesNotMatch(home(THU,{[T]:{d:0,n:0}}),/class="week"/);
  const h=home(THU,log(T,[MO,MO+1,T],[MO+2]));
  assert.match(h,/<div class="week"><ul class="days" aria-label="This week"><li class="d done" aria-label="Monday, studied"><i><\/i>M<\/li>/);
  assert.match(h,/<li class="d done now" aria-label="Thursday, today, studied"><i><\/i>T<\/li>/);
  assert.match(h,/<p class="wl">3 days this week, 1 day off left\.<\/p>/);
  assert.ok(h.indexOf('class="week"')<h.indexOf('class="plan"'));
  const a=at(THU,{storage:{"hamdrill:days":JSON.stringify(log(T,[T]))}});
  a.run(`SRS.t1={T1A01:{lv:0,due:dayNum(),last:dayNum()-1,fail:dayNum()-1,n:3,w:2}};saveSrs("t1");home()`);
  const hh=a.run(`$("app").innerHTML`);
  assert.ok(hh.indexOf('class="reach hard"')<hh.indexOf('class="week"'),"after the hard line");
});

const card=a=>a.run(`$("card").innerHTML`);
const basics=a=>{if(card(a).includes('id="go"'))a.run(`$("go").onclick();0`)};
const answer=a=>a.run(`(()=>{const id=$("card").innerHTML.match(/class="qid">([^<]+)</)[1];const q=POOL.flatMap(d=>d.Q).find(q=>q[0]===id);const b=[...$("ans").children].find(b=>+b.dataset.oi===q[3]);b.onclick();return id})()`);
const next=a=>a.run(`$("next").onclick();0`);
const tap=(a,act)=>a.run(`$("ans").onclick({target:{closest:()=>({dataset:{act:"${act}"}})}});0`);
const answerSym=a=>a.run(`(()=>{const h=$("card").innerHTML,s=DECK.symbols.S.filter(x=>h.includes(x.d)).sort((p,q)=>q.d.length-p.d.length)[0];const b=[...$("ans").children].find(b=>b.dataset.n===s.n);b.onclick();return s.n})()`);

test("the drill's end screen says Today's in once, the session that met the day",()=>{
  const a=at(MON);a.run("drill({deck:DECK.t1})");
  const N=a.run("DECK.t1.Q.length");
  for(let k=0;k<N;k++){basics(a);answer(a);next(a)}
  assert.match(card(a),/<p class="win">Today's in\. 1 day this week, 2 days off left\.<\/p>/);
  a.run(`$("dueOnly").checked=false;$("dueOnly").onchange();0`);
  for(let k=0;k<N;k++){basics(a);answer(a);next(a)}
  assert.doesNotMatch(card(a),/Today's in/,"already met before this session");
});

test("the flash and symbol drills say it too",()=>{
  const f=at(MON,{exam:"general"});f.run("flash(DECK.facts)");
  const K=f.run("DECK.facts.flash.length");
  for(let k=0;k<K;k++){tap(f,"show");tap(f,"ok")}
  assert.match(card(f),/<p class="win">Today's in\. 1 day this week, 2 days off left\.<\/p>/);
  const s=at(MON);s.run("symbols()");
  const N=s.run("DECK.symbols.S.length");
  for(let k=0;k<N;k++){answerSym(s);next(s)}
  assert.match(card(s),/<p class="win">Today's in\. 1 day this week, 2 days off left\.<\/p>/);
});

test("export carries the log; import merges it day by day and rebuilds days a backup never had",()=>{
  const a=at(THU,{storage:{"hamdrill:days":JSON.stringify({[T-1]:{d:4,n:4},[T-2]:{d:2,n:1}})}});
  assert.deepEqual(JSON.parse(a.run("JSON.stringify(exportData())")).days,{[T-1]:{d:4,n:4},[T-2]:{d:2,n:1}});
  a.run(`mergeDays(${JSON.stringify({[T-1]:{d:6,n:2,x:true},[T-2]:{n:5},[T-3]:"bad",[T-4]:{n:1}})})`);
  assert.deepEqual(a.run("DAYS"),{[T-1]:{d:4,n:4,x:true},[T-2]:{d:2,n:5},[T-4]:{n:1}});
  assert.deepEqual(a.run("get('days')"),a.run("DAYS"),"saved");
  const b=at(THU,{storage:{"hamdrill:days":"{}"}});
  b.run(`importDecks({t1:{T1A01:${rec(T-5)},T1A02:${rec(T-5)}}});mergeDays(undefined)`);
  assert.deepEqual(b.run("DAYS"),{[T-5]:{n:2}},"a backup from before the log still fills the week");
});

test("How it works explains the week",()=>{
  const a=at(THU);a.run("about()");
  assert.match(a.run(`$("app").innerHTML`),/<h2>The week<\/h2>\s*<p>Home shows the week as seven dots/);
});

test("the practice exam's result says Today's in from Finish, not when the result is reopened",()=>{
  /* Finish as the screen's button does, with a draw scored as test/exam.test.js scores one. */
  const a=at(MON);
  a.run(`(()=>{const draw=examDraw();examFinish(draw,draw.map(x=>x.q[3]),{t0:Date.now()-60000,est:null})})()`);
  assert.match(a.run(`$("app").innerHTML`),/<p class="win">Today's in\. 1 day this week, 2 days off left\.<\/p>/);
  a.run("examResult()");
  assert.doesNotMatch(a.run(`$("app").innerHTML`),/Today's in/);
});
