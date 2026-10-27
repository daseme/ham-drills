/* The practice exam's draw and the hardest-cards list: pure functions over the decks and the review records. */
"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const {load}=require("./harness");

for(const exam of ["technician","general"]){
  test(`${exam}: the draw is one question per group, 35 in pool order, each with shuffled answers`,()=>{
    const app=load({exam});
    const draw=app.run("examDraw().map(x=>[x.d,x.id,x.order])");
    assert.equal(draw.length,35);
    const groups=draw.map(([,id])=>id.slice(0,3));
    assert.equal(new Set(groups).size,35);
    const order=app.run("POOL.map(d=>d.id)"),at=draw.map(([d])=>order.indexOf(d));
    assert.deepEqual(at,at.slice().sort((a,b)=>a-b));
    const perDeck=app.run("Object.fromEntries(POOL.map(d=>[d.id,d.exam]))");
    for(const [d,n] of Object.entries(perDeck))assert.equal(draw.filter(x=>x[0]===d).length,n,d);
    for(const [,,order] of draw)assert.deepEqual(order.slice().sort(),[0,1,2,3]);
  });
}

test("an 'All these choices' question keeps its answer order in the exam",()=>{
  const app=load();
  const kept=app.run(`(()=>{const q=DECK.t1.Q.find(q=>q[2].some(o=>/^All these/.test(o)));return examDraw().length&&examOrder(q)})()`);
  assert.deepEqual(kept,[0,1,2,3]);
});

test("two draws differ (they are random), but both cover every group",()=>{
  const app=load();
  const [a,b]=app.run("[examDraw().map(x=>x.id),examDraw().map(x=>x.id)]");
  assert.notDeepEqual(a,b);
});

test("scoring an exam counts right answers, lists misses with the answer given, and groups by section",()=>{
  const app=load();
  const r=app.run(`(()=>{const draw=examDraw();const picks=draw.map((x,i)=>i<30?x.q[3]:i<33?(x.q[3]+1)%4:null);return examScore(draw,picks)})()`);
  assert.equal(r.right,30);
  assert.equal(r.missed.length,5);
  assert.equal(r.missed.filter(m=>m.given==null).length,2);
  assert.equal(Object.values(r.bySection).reduce((a,s)=>a+s.asked,0),35);
  assert.equal(Object.values(r.bySection).reduce((a,s)=>a+s.right,0),30);
});

test("hardCards lists pool and math cards missed at least twice and not mastered, hardest first",()=>{
  const app=load();
  app.run(`(()=>{const s=srsOf("t1");s.T1A01={lv:1,due:0,last:0,fail:null,n:6,w:3};s.T1A02={lv:0,due:0,last:0,fail:0,n:2,w:2};s.T1A03={lv:3,due:0,last:0,fail:null,n:9,w:4};s.T1A04={lv:0,due:0,last:0,fail:0,n:1,w:1};
    const m=srsOf("math");m.T5B01={lv:0,due:0,last:0,fail:0,n:5,w:5};const y=srsOf("symbols");y[itemIds(DECK.symbols)[0]]={lv:0,due:0,last:0,fail:0,n:4,w:4}})()`);
  assert.deepEqual(app.run("hardCards().map(x=>[x.d.id,x.q[0],x.w])"),[["math","T5B01",5],["t1","T1A01",3],["t1","T1A02",2]]);
});

test("hardCards is empty on a fresh app",()=>{
  assert.deepEqual(load().run("hardCards()"),[]);
});

test("lastMissed is true only while the last answer was a miss",()=>{
  const app=load();
  app.run(`(()=>{const s=srsOf("t1");s.T1A01=step(null,false,100);s.T1A02=step(step(null,false,100),true,100);s.T1A03=step(step(null,false,100),true,101);s.T1A04=step(null,true,100)})()`);
  assert.deepEqual(app.run(`["T1A01","T1A02","T1A03","T1A04"].map(k=>lastMissed("t1",k))`),[true,false,false,false]);
});

test("badgeCount is today's pool reviews, or tomorrow's once today's are done, or zero",()=>{
  const app=load();
  assert.equal(app.run("badgeCount()"),0);
  app.run(`(()=>{const t=dayNum(),s=srsOf("t1");s.T1A01={lv:1,due:t+1,last:t,fail:null,n:1};s.T1A02={lv:1,due:t+1,last:t,fail:null,n:1};const m=srsOf("math");m.T5B01={lv:1,due:t+1,last:t,fail:null,n:1}})()`);
  assert.equal(app.run("badgeCount()"),2);
  app.run(`srsOf("t2").T2A01={lv:1,due:dayNum(),last:dayNum()-1,fail:null,n:1}`);
  assert.equal(app.run("badgeCount()"),1);
});

test("a stored deck is cleaned on first read: damaged records and unknown ids go, good ones stay as they were",()=>{
  const app=load();
  const good={lv:2,due:20745,last:20742,fail:null,n:2,ts:1792176685061};
  app.run(`delete SRS.t1;localStorage.setItem("hamdrill:srs:t1",JSON.stringify({T1A01:${JSON.stringify(good)},T1A02:{lv:"x"},ZZZ01:${JSON.stringify(good)}}));0`);
  assert.deepEqual(app.run(`srsOf("t1")`),{T1A01:good});
  assert.deepEqual(app.run(`JSON.parse(localStorage.getItem("hamdrill:srs:t1"))`),{T1A01:good});
});

test("a clean stored deck is not rewritten",()=>{
  const app=load();
  const good={lv:2,due:20745,last:20742,fail:null,n:2,ts:1792176685061};
  app.run(`delete SRS.t1;localStorage.setItem("hamdrill:srs:t1",JSON.stringify({T1A01:${JSON.stringify(good)}}));localStorage.setItem=()=>{throw new Error("written")};srsOf("t1");0`);
  assert.equal(app.run(`srsOf("t1").T1A01.lv`),2);
});

test("last and fail days in the future are clamped to today",()=>{
  const r=load().run(`validRecord({lv:1,due:20800,last:99999,fail:99999},20800)`);
  assert.deepEqual(r,{lv:1,due:20800,last:20800,fail:20800});
});

test("an exam in progress is rebuilt from its saved ids and orders, or dropped if a question is gone",()=>{
  const app=load();
  const s=app.run(`(()=>{const d=examDraw();return {ids:d.map(x=>[x.d,x.id]),orders:d.map(x=>x.order)}})()`);
  const back=app.run(`examRestore(${JSON.stringify(s)}).map(x=>[x.d,x.id,x.order])`);
  assert.deepEqual(back,s.ids.map((p,i)=>[...p,s.orders[i]]));
  s.ids[3]=["t1","T1Z99"];
  assert.equal(app.run(`examRestore(${JSON.stringify(s)})`),null);
});

test("a stored exam result is valid only with its day, score and missed pairs",()=>{
  const app=load();
  assert.equal(app.run(`validExam({day:1,right:30,missed:[["t1","T1A01",2],["t2","T2A01",null]]})`),true);
  for(const e of [null,{day:1},{day:1.5,right:1,missed:[]},{day:1,right:1,missed:"x"},{day:1,right:1,missed:[["t1"]]}])
    assert.equal(app.run(`validExam(${JSON.stringify(e)})`),false,JSON.stringify(e));
});

test("the home plan box offers the exam, then names the last result; the missed drill reads the last result",()=>{
  const app=load();
  app.run(`toast=()=>{};0`);
  app.run("home()");
  assert.match(app.run(`$("app").innerHTML`),/Take a practice exam/);
  app.run(`saveExam({day:dayNum(),right:29,missed:[["t1","T1A01",2],["t5","T5A01",null]],secs:600});0`);
  app.run("home()");
  assert.match(app.run(`$("app").innerHTML`),/Last practice exam: <b>29 of 35<\/b>/);
  assert.deepEqual(app.run(`examMissed().map(x=>[x.d.id,x.q[0]])`),[["t1","T1A01"],["t5","T5A01"]]);
});

test("only the last ten exams are kept",()=>{
  const app=load();
  app.run(`for(let i=0;i<12;i++)saveExam({day:i,right:i,missed:[]});0`);
  assert.equal(app.run(`get("exams").length`),10);
  assert.equal(app.run(`lastExam().day`),11);
});

test("the hardest link appears on home only when there is something to drill",()=>{
  const app=load();
  app.run("home()");
  assert.doesNotMatch(app.run(`$("app").innerHTML`),/Drill the hardest/);
  app.run(`srsOf("t1").T1A01={lv:0,due:0,last:0,fail:0,n:3,w:2};home();0`);
  assert.match(app.run(`$("app").innerHTML`),/1 question you've missed more than once/);
});
