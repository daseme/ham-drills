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
