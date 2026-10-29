/* General's Band edges flash cards: ten cards whose numbers match the band table, a drill you flip and grade yourself,
   and the chart unchanged by the refactor that lets one band be drawn alone. */
"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("fs"),path=require("path");
const {load}=require("./harness");

const app=load({exam:"general"});
const bands=app.run("EXAM_CONFIG.bands");
const deck=app.run("DECK.edges");
const nums=s=>(s.match(/\d+\.\d+/g)||[]).map(Number);

test("ten cards, one per band in the table, each with text and a hook",()=>{
  assert.equal(deck.exam,0);assert.ok(deck.flash);assert.equal(deck.Q,undefined);
  assert.deepEqual(deck.flash.map(c=>c.n),bands.map(b=>b.band));
  for(const c of deck.flash){assert.ok(c.a.trim());assert.ok(c.t.trim())}
  assert.deepEqual(app.run("itemIds(DECK.edges)"),bands.map(b=>b.band));
  assert.equal(app.run("stats(DECK.edges).total"),10);
});

test("every segment edge and 60 m channel in the table is on its band's card",()=>{
  for(const b of bands){
    const on=nums(deck.flash.find(c=>c.n===b.band).a);
    for(const [lo,hi] of b.seg)for(const v of [lo,hi])assert.ok(on.includes(v),`${b.band}: ${v} missing`);
    for(const v of b.channels||[])assert.ok(on.includes(v),`${b.band}: channel ${v} missing`);
  }
});

test("the full chart is byte for byte what it was before one band could be drawn alone",()=>{
  const fixture=fs.readFileSync(path.join(__dirname,"fixtures","bandchart.svg"),"utf8").replace(/\r\n/g,"\n");
  assert.equal(app.run("EXAM_CONFIG.cheats.bands").slice(0,fixture.length),fixture);
});

test("a band's bar is hidden from screen readers, labels its General edges, and an unknown band draws nothing",()=>{
  const bar=app.run(`artOf(DECK.edges,"40 m")`);
  assert.match(bar,/^<svg class="bandchart bandbar" viewBox="0 0 380 32" aria-hidden="true">/);
  for(const v of ["7.025","7.125","7.175","7.300"])assert.ok(bar.includes(`>${v}<`),v);
  assert.ok(!bar.includes(">7.000<"),"the band edge 25 kHz from the General edge is dropped");
  assert.ok(!bar.includes('class="bname"'));
  assert.equal(app.run(`artOf(DECK.edges,"2 m")`),"");
  assert.equal(app.run(`artOf(DECK.bands,"40 m")`),"");
});

test("home lists the deck as cards and widens the badge sash to seven columns",()=>{
  app.run("home()");
  const html=app.run(`$("app").innerHTML`);
  assert.match(html,/10 cards\. Not started\./);
  assert.match(html,/class="sash seven"/);
  const t=load();t.run("home()");
  assert.doesNotMatch(t.run(`$("app").innerHTML`),/sash seven/);
});

test("the study pages render the cards, alone and inside the whole guide",()=>{
  app.run("study(DECK.edges)");
  let html=app.run(`$("app").innerHTML`);
  assert.match(html,/<h1>Band edges<\/h1>/);
  assert.equal((html.match(/class="bandchart bandbar"/g)||[]).length,10);
  assert.match(html,/<b>160 m<\/b>/);
  app.run("study(null)");
  html=app.run(`$("app").innerHTML`);
  assert.match(html,/<h1>Band edges<\/h1>/);assert.match(html,/<h1>G1: /);
});

test("the Bands chart primer links to the cards",()=>{
  assert.match(app.run("DECK.bands.P.chart[1]"),/<a href="#edges">/);
});

test("the review-all line and the hardest list leave the cards out, and nothing throws over a deck without questions",()=>{
  const g=load({exam:"general"});
  g.run(`srsOf("edges")["40 m"]={lv:0,due:0,last:0,fail:0,n:5,w:4};0`);
  assert.deepEqual(g.run("hardCards().map(c=>c.q[0])"),[]);
  g.run("drill({mixed:true})");
  assert.match(g.run(`$("app").innerHTML`),/Math, Bands and Edges are reviewed on their own\./);
});

/* Drive the drill through its answer group as a tap would. */
const tap=(a,act)=>a.run(`$("ans").onclick({target:{closest:()=>({dataset:{act:"${act}"}})}});0`);
const card=a=>a.run(`$("card").innerHTML`);

test("flip, grade, requeue a miss, count first tries only, and finish",()=>{
  const a=load({exam:"general"});
  a.run("flash(DECK.edges)");
  assert.equal(a.run(`$("pos").textContent`),"Card 1 of 10");
  assert.match(card(a),/General privileges on<\/p><p class="name" id="qname">\d+ m<\/p><div class="ans" id="ans" role="group" aria-labelledby="qtext qname"><button data-act="show">Show<\/button>/);
  const first=card(a).match(/id="qname">([^<]+)</)[1];
  tap(a,"show");
  assert.match(card(a),/aria-labelledby="qans qhook"><button data-act="ok">Got it<\/button><button data-act="no">Missed it<\/button>/);
  assert.match(card(a),/class="bandchart bandbar"/);
  assert.ok(card(a).includes(deck.flash.find(c=>c.n===first).a));
  tap(a,"no");
  assert.equal(a.run(`srsOf("edges")[${JSON.stringify(first)}].lv`),0);
  assert.equal(a.run(`$("pos").textContent`),"Card 2 of 11");
  assert.equal(a.run(`$("score").textContent`),"0 of 1 right first try");
  for(let k=0;k<3;k++){tap(a,"show");tap(a,"ok")}
  assert.equal(a.run(`$("score").textContent`),"3 of 4 right first try");
  assert.ok(card(a).includes(`id="qname">${first}<`),"the missed card returns four places on");
  tap(a,"show");tap(a,"ok");
  assert.equal(a.run(`$("score").textContent`),"3 of 4 right first try","a requeued card is not a first try");
  assert.equal(a.run(`srsOf("edges")[${JSON.stringify(first)}].lv`),0,"right the same day as a miss stays at level 0, due tomorrow");
  for(let k=0;k<6;k++){tap(a,"show");tap(a,"ok")}
  assert.equal(a.run(`$("score").textContent`),"9 of 10 right first try");
  assert.match(card(a),/<div class="end"><h2>9\/10<\/h2><p>90% right on the first try\.<\/p><p>That's everything due today. 10 will be back tomorrow\.<\/p>/);
  assert.equal(a.run("stats(DECK.edges).mastered"),0);assert.equal(a.run("stats(DECK.edges).seen"),10);
  assert.equal(a.run("tierNow(DECK.edges)"),1);
});

test("Technician has no flash deck and #edges there goes home",()=>{
  const t=load();
  assert.equal(t.run("DECKS.filter(d=>d.flash).length"),0);
  t.run(`location.hash="#edges";route();0`);
  assert.match(t.run(`$("app").innerHTML`),/Technician/);
});
