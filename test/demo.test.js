/* Demo mode: the seeded learner lands where the spec puts it, under its own namespace, the same every time. */
"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const {load}=require("./harness");

const demo=load({search:"?demo"});
const standing=app=>app.run(`Object.fromEntries(DECKS.map(d=>[d.id,[tierNow(d),tierEarned(d)]]))`);

test("demo progress is kept under hamdemo: and never touches hamdrill:",()=>{
  const keys=demo.keys();
  assert.ok(keys.length>0);
  assert.ok(keys.every(k=>k.startsWith("hamdemo:")),keys.join(", "));
});

test("without ?demo nothing is seeded",()=>{
  assert.deepEqual(load().keys(),[]);
});

test("each section shows the badge state the demo is built to show",()=>{
  /* [standing now, best rung earned]: T8 earned silver, then three misses yesterday put it back to bronze. */
  assert.deepEqual(standing(demo),{t1:[3,3],t2:[2,2],t3:[1,1],t4:[0,0],t5:[2,2],t6:[1,1],t7:[1,1],t8:[1,2],t9:[0,0],t0:[0,0],math:[0,0],symbols:[1,1]});
});

test("the estimate straddles the pass mark, with the untouched sections as the most room to gain",()=>{
  const e=demo.run("estimate()");
  assert.ok(e.lo<26&&e.hi>=26,JSON.stringify(e));
  assert.deepEqual(e.gain,["T0","T9"]);
});

test("the exam is 16 days out and the exam-date links are on",()=>{
  assert.equal(demo.run("daysToExam()"),16);
  assert.equal(demo.run("prefs.showDate"),true);
});

test("T4 and Math are half started; T9 and T0 untouched",()=>{
  const seen=demo.run(`Object.fromEntries(DECKS.map(d=>[d.id,[stats(d).seen,stats(d).total]]))`);
  for(const id of ["t4","math"])assert.equal(seen[id][0],Math.round(seen[id][1]/2),id);
  assert.equal(seen.t9[0],0);assert.equal(seen.t0[0],0);
});

test("every record is one the scheduler could have written",()=>{
  const bad=demo.run(`(()=>{const T=dayNum(),bad=[];for(const d of DECKS)for(const [k,r] of Object.entries(srsOf(d.id))){
    if(r.last>=T||r.n<1||(r.w||0)>r.n)bad.push(k+" history");
    else if(r.lv===0&&r.due!==r.fail&&r.due!==r.last+1)bad.push(k+" level 0 due");
    else if(r.lv>0&&r.due!==r.last+capInterval(IV[r.lv],r.last))bad.push(k+" due "+r.due+" vs "+(r.last+capInterval(IV[r.lv],r.last)));
    else if(r.lv>r.n-(r.w||0))bad.push(k+" level above right answers")}return bad})()`);
  assert.deepEqual(bad,[]);
});

test("the sample is the same on every load",()=>{
  const dump=app=>app.run(`JSON.stringify(DECKS.map(d=>Object.entries(srsOf(d.id)).map(([k,r])=>[k,r.lv,r.due,r.last,r.n,r.w])))`);
  assert.equal(dump(load({search:"?demo"})),dump(demo));
});
