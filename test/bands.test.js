/* General's Bands deck and band chart: the deck is copies of pool questions under primers, and the chart's segments
   agree with what the pool's own answers say about General privileges. */
"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const {load}=require("./harness");

const app=load({exam:"general"});
const bands=app.run("EXAM_CONFIG.bands");
const row=name=>bands.find(b=>b.band===name);
/* Covered when the segments, in order, run from lo to hi with no gap. */
const covers=(b,lo,hi)=>{let at=lo;for(const [a,c] of b.seg.slice().sort((p,q)=>p[0]-q[0])){if(a>at)return false;at=Math.max(at,c)}return at>=hi};
const inAny=(b,f)=>b.seg.some(([a,c])=>a<=f&&f<=c);

test("the Bands deck holds 32 pool questions, each under a primer and a named group",()=>{
  const d=app.run("DECK.bands");
  assert.equal(d.exam,0);assert.equal(d.Q.length,32);assert.equal(d.cheatName,"Band chart");
  for(const q of d.Q){assert.ok(d.CON[q[0]],q[0]+" has no primer");assert.ok(d.P[d.CON[q[0]]],q[0]);assert.ok(d.G[q[0].slice(0,3)],q[0]+" group unnamed")}
  assert.equal(new Set(d.Q.map(q=>q[0])).size,32);
});

test("the chart is served as the deck's cheat sheet on the drill and the study page",()=>{
  assert.match(app.run(`cheatOf(DECK.bands)`),/^<svg class="bandchart"/);
  app.run("study(DECK.bands)");
  assert.match(app.run(`$("app").innerHTML`),/<summary>Band chart<\/summary><svg class="bandchart"/);
});

test("G1A01 and G1A08: only 80, 40, 20 and 15 meters have parts a General may not use",()=>{
  const partial=bands.filter(b=>!b.channels&&!covers(b,b.lo,b.hi)).map(b=>b.band);
  assert.deepEqual(partial,["80 m","40 m","20 m","15 m"]);
});

test("G1A05: 7.125 to 7.175 MHz is the gap in 40 meters",()=>{
  const b=row("40 m");
  assert.ok(!inAny(b,7.150));assert.ok(inAny(b,7.125));assert.ok(inAny(b,7.175));
  assert.deepEqual(b.seg.map(s=>s.slice(0,2)),[[7.025,7.125],[7.175,7.300]]);
});

test("G1A09: 21.300 MHz is inside the General phone segment of 15 meters",()=>{
  const s=row("15 m").seg.find(([a,c,k])=>k==="ph");
  assert.ok(s[0]<=21.300&&21.300<=s[1]);assert.equal(s[0],21.275);
});

test("G1A02, G1A03 and G1C01: 30 meters is CW and data only; G1A07: all of 10 meters is General",()=>{
  assert.deepEqual(row("30 m").seg,[[10.100,10.150,"cw"]]);
  assert.ok(covers(row("10 m"),28.000,29.700));
});

test("G4D08 and G4D09: 7.175 and 14.350 MHz are phone segment edges; G1B09: beacons sit in the 10 m CW segment",()=>{
  assert.equal(row("40 m").seg.find(s=>s[2]==="ph")[0],7.175);
  assert.equal(row("20 m").seg.find(s=>s[2]==="ph")[1],14.350);
  const cw=row("10 m").seg.find(s=>s[2]==="cw");assert.ok(cw[0]<=28.200&&28.300<=cw[1]);
});

test("the chart labels every General segment edge",()=>{
  const svg=app.run("EXAM_CONFIG.cheats.bands");
  for(const v of ["3.525","3.600","3.800","4.000","7.025","7.125","7.175","7.300","14.025","14.150","14.225","14.350","18.068","18.110","18.168","21.025","21.200","21.275","21.450","24.890","24.930","24.990","28.000","28.300","29.700","10.100","10.150","1.800","2.000","5.332","5.405"])
    assert.match(svg,new RegExp(">"+v.replace(".","\.")+"<"),v);
});

test("the Technician app has no Bands deck and its review-all sentence is unchanged",()=>{
  const t=load();
  assert.equal(t.run("DECK.bands"),undefined);
  t.run("drill({mixed:true})");
  assert.match(t.run(`$("app").innerHTML`),/Math and Symbols are reviewed on their own\./);
});
