/* General's Band edges flash cards: eleven bands asked both ways, the numbers held to the band table and the power
   limit to the pool, the hooks' arithmetic checked, a drill you flip and grade yourself that keeps a pair apart, badges from the old cards
   dropped, and the chart unchanged by the refactor that lets one band be drawn alone. */
"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("fs"),path=require("path");
const {load}=require("./harness");

const app=load({exam:"general"});
const bands=app.run("EXAM_CONFIG.bands");
const deck=app.run("DECK.edges");
const nums=s=>(s.match(/\d+(?:\.\d+)?/g)||[]).map(Number);
const EDGES={...Object.fromEntries(bands.map(b=>[b.band,[b.lo,b.hi]])),"6 m":[50,54]};
const fwd=deck.flash.filter(c=>c.k.endsWith("-range")),rev=deck.flash.filter(c=>c.k.endsWith("-band"));
/* The forward answer is the range, then the band's power limit; the reverse card asks the range alone. */
const split=a=>{const m=a.match(/^(\d+(?:\.\d+)? to \d+(?:\.\d+)? MHz), (\d+ W (?:PEP|ERP))$/);assert.ok(m,a);return {range:m[1],power:m[2]}};
const POWER={"60 m":"100 W ERP","30 m":"200 W PEP"};

test("22 cards: the ten HF bands and 6 m, each asked both ways, forward then reverse",()=>{
  assert.equal(deck.exam,0);assert.ok(deck.flash);assert.equal(deck.Q,undefined);assert.equal(deck.prompt,undefined);assert.equal(deck.gen,2);
  assert.equal(deck.flash.length,22);assert.deepEqual(deck.flash,fwd.concat(rev));
  assert.deepEqual(fwd.map(c=>c.n),Object.keys(EDGES));
  for(const [j,f] of fwd.entries()){const r=rev[j],band=f.n.split(" ")[0];
    assert.equal(f.k,`${band}-range`);assert.equal(r.k,`${band}-band`);
    assert.equal(f.p,"Frequency range of");assert.equal(r.p,"Which band is");
    assert.equal(r.n,split(f.a).range,"the reverse card asks the forward card's range, without the power");assert.equal(r.a,f.n);
    assert.ok(f.t.trim());assert.equal(r.t,f.t,"one hook per band")}
  assert.deepEqual(app.run("itemIds(DECK.edges)"),deck.flash.map(c=>c.k));
  assert.equal(app.run("stats(DECK.edges).total"),22);
});

test("each range is the band table's outer edges, 6 m is 50 to 54, and the power limit is the pool's",()=>{
  for(const f of fwd){const {range,power}=split(f.a);assert.deepEqual(nums(range),EDGES[f.n],f.n);assert.equal(power,POWER[f.n]||"1500 W PEP",f.n)}
  /* G1C01 (10.140 MHz), G1C06 (1.8 MHz), G1C05 (28 MHz), G1C02 (12 m): the pool's own limits. */
  const ans=id=>{const q=app.run(`DECKS.flatMap(d=>d.Q||[]).find(q=>q[0]==="${id}")`);return q[2][q[3]]};
  assert.equal(ans("G1C01"),"200 watts PEP output");assert.equal(ans("G1C06"),"1500 watts PEP output");
  assert.equal(ans("G1C05"),"1500 watts PEP output");assert.equal(ans("G1C02"),"1500 watts PEP output");
});

test("each hook's arithmetic holds: 300 divided by a frequency inside the band gives the band, within a tenth",()=>{
  for(const f of fwd){const m=f.t.match(/^300 ÷ (\d+(?:\.\d+)?) (≈|=) (\d+)[.,]/);assert.ok(m,f.t);
    const [lo,hi]=EDGES[f.n],x=Number(m[1]),band=parseInt(f.n),said=Number(m[3]),got=300/x;
    assert.ok(x>=lo&&x<=hi,`${f.n}: ${x} is inside the band`);
    assert.ok(said===band||said===Math.round(got),`${f.n}: says ${said}, 300/${x} = ${got}`);
    if(m[2]==="=")assert.equal(got,band,`${f.n}: an exact sign means exact`);
    else assert.ok(Math.abs(got-band)/band<=0.1,`${f.n}: 300/${x} = ${got}`)}
});

test("the full chart is byte for byte what it was before one band could be drawn alone",()=>{
  const fixture=fs.readFileSync(path.join(__dirname,"fixtures","bandchart.svg"),"utf8").replace(/\r\n/g,"\n");
  assert.equal(app.run("EXAM_CONFIG.cheats.bands").slice(0,fixture.length),fixture);
  assert.equal(bands.length,10,"6 m is drawn for the cards only");
});

test("both cards of a band draw the same bar, hidden from screen readers; 6 m has one; a stranger draws nothing",()=>{
  const bar=app.run(`artOf(DECK.edges,DECK.edges.flash.find(c=>c.k==="40-range"))`);
  assert.match(bar,/^<svg class="bandchart bandbar" viewBox="0 0 380 32" aria-hidden="true">/);
  for(const v of ["7.025","7.125","7.175","7.300"])assert.ok(bar.includes(`>${v}<`),v);
  assert.ok(!bar.includes('class="bname"'));
  assert.equal(app.run(`artOf(DECK.edges,DECK.edges.flash.find(c=>c.k==="40-band"))`),bar);
  const six=app.run(`artOf(DECK.edges,DECK.edges.flash.find(c=>c.k==="6-band"))`);
  assert.ok(six.includes(">50.100<")&&six.includes(">54.000<"),"6 m labels its CW-only edge and its top");
  assert.equal(app.run(`artOf(DECK.edges,{n:"2 m",a:"144 to 148 MHz"})`),"");
  assert.equal(app.run(`artOf(DECK.bands,{n:"40 m",a:""})`),"");
});

test("home lists the deck as cards and widens the badge sash to seven columns",()=>{
  app.run("home()");
  const html=app.run(`$("app").innerHTML`);
  assert.match(html,/22 cards\. Not started\./);
  assert.match(html,/class="sash seven"/);
  const t=load();t.run("home()");
  assert.doesNotMatch(t.run(`$("app").innerHTML`),/sash seven/);
});

test("the study pages render every card with its prompt, alone and inside the whole guide",()=>{
  app.run("study(DECK.edges)");
  let html=app.run(`$("app").innerHTML`);
  assert.match(html,/<h1>Band edges<\/h1>/);
  assert.equal((html.match(/class="bandchart bandbar"/g)||[]).length,22);
  assert.equal((html.match(/<p class="prompt">Frequency range of<\/p><b>/g)||[]).length,11);
  assert.equal((html.match(/<p class="prompt">Which band is<\/p><b>/g)||[]).length,11);
  assert.match(html,/<p class="prompt">Frequency range of<\/p><b>160 m<\/b><svg[^]*?<\/svg>1\.8 to 2\.0 MHz, 1500 W PEP<p>/);
  assert.match(html,/<p class="prompt">Which band is<\/p><b>1\.8 to 2\.0 MHz<\/b><svg[^]*?<\/svg>160 m<p>/);
  app.run("study(null)");
  html=app.run(`$("app").innerHTML`);
  assert.match(html,/<h1>Band edges<\/h1>/);assert.match(html,/<h1>G1: /);
});

test("the Bands chart primer links to the cards",()=>{
  assert.match(app.run("DECK.bands.P.chart[1]"),/<a href="#edges">/);
});

test("the review-all line and the hardest list leave the cards out, and nothing throws over a deck without questions",()=>{
  const g=load({exam:"general"});
  g.run(`srsOf("edges")["40-range"]={lv:0,due:0,last:0,fail:0,n:5,w:4};0`);
  assert.deepEqual(g.run("hardCards().map(c=>c.q[0])"),[]);
  g.run("drill({mixed:true})");
  assert.match(g.run(`$("app").innerHTML`),/Math, Bands, Edges and Facts are reviewed on their own\./);
});

test("records and badges from the old cards are dropped: unknown keys on first read, a badge of another generation at startup and on import",()=>{
  const g=load({exam:"general",storage:{"hamgeneral:srs:edges":JSON.stringify({"40 m":{lv:2,due:0,last:0,fail:null,n:3,w:0}}),"hamgeneral:badges":JSON.stringify({edges:{1:20700},facts:{1:20700}})}});
  assert.deepEqual(g.run(`srsOf("edges")`),{});
  assert.equal(g.run("tierEarned(DECK.edges)"),0);assert.equal(g.run("tierEarned(DECK.facts)"),1);
  assert.equal(g.run(`JSON.parse(localStorage.getItem("hamgeneral:badges")).edges`),undefined);
  g.run("mergeBadges({edges:{1:20700},facts:{2:20701}});0");
  assert.equal(g.run("tierEarned(DECK.edges)"),0,"an old-generation badge is not imported");
  assert.equal(g.run("tierEarned(DECK.facts)"),2);
  g.run("mergeBadges({edges:{1:20700,gen:2}});0");
  assert.equal(g.run("tierEarned(DECK.edges)"),1,"a badge of the current generation is");
  assert.deepEqual(g.run("BADGES.edges"),{1:20700,gen:2});
});

/* Drive the drill through its answer group as a tap would. */
const tap=(a,act)=>a.run(`$("ans").onclick({target:{closest:()=>({dataset:{act:"${act}"}})}});0`);
const card=a=>a.run(`$("card").innerHTML`);

const shown=a=>{const m=card(a).match(/id="qtext">([^<]+)<\/p><p class="name" id="qname">([^<]+)</);return m[1]==="Which band is"?fwd.find(c=>split(c.a).range===m[2]).n:m[2]};
test("the shuffle never puts the two cards of a band side by side",()=>{
  const a=load({exam:"general"});
  for(let run=0;run<40;run++){a.run(`flash(DECK.edges);$("dueOnly").checked=false;$("dueOnly").onchange();0`);
    const seen=[];for(let j=0;j<22;j++){seen.push(shown(a));tap(a,"show");tap(a,"ok")}
    assert.match(card(a),/class="end"/);
    assert.equal(new Set(seen).size,11);
    for(let j=1;j<seen.length;j++)assert.notEqual(seen[j-1],seen[j],seen.join(", "))}
});

test("flip, grade, requeue a miss, count first tries only, and finish",()=>{
  const a=load({exam:"general"});
  a.run("flash(DECK.edges)");
  assert.equal(a.run(`$("pos").textContent`),"Card 1 of 22");
  assert.match(card(a),/^<p class="prompt" id="qtext">(Frequency range of|Which band is)<\/p><p class="name" id="qname">[^<]+<\/p><div class="ans" id="ans" role="group" aria-labelledby="qtext qname"><button data-act="show">Show<\/button>/);
  assert.doesNotMatch(card(a),/bandbar/,"the front gives nothing away");
  const m=card(a).match(/id="qtext">([^<]+)<\/p><p class="name" id="qname">([^<]+)</),first=deck.flash.find(c=>c.n===m[2]&&c.p===m[1]);
  tap(a,"show");
  assert.match(card(a),/aria-labelledby="qans qhook"><button data-act="ok">Got it<\/button><button data-act="no">Missed it<\/button>/);
  assert.match(card(a),/class="bandchart bandbar"/);
  assert.ok(card(a).includes(`<p class="defn" id="qans">${first.a}</p>`));
  tap(a,"no");
  assert.equal(a.run(`srsOf("edges")[${JSON.stringify(first.k)}].lv`),0);
  assert.equal(a.run(`$("pos").textContent`),"Card 2 of 23");
  assert.equal(a.run(`$("score").textContent`),"0 of 1 right first try");
  for(let k=0;k<3;k++){tap(a,"show");tap(a,"ok")}
  assert.equal(a.run(`$("score").textContent`),"3 of 4 right first try");
  assert.ok(card(a).includes(`id="qname">${first.n}<`),"the missed card returns four places on");
  tap(a,"show");tap(a,"ok");
  assert.equal(a.run(`$("score").textContent`),"3 of 4 right first try","a requeued card is not a first try");
  assert.equal(a.run(`srsOf("edges")[${JSON.stringify(first.k)}].lv`),0,"right the same day as a miss stays at level 0, due tomorrow");
  for(let k=0;k<18;k++){tap(a,"show");tap(a,"ok")}
  assert.equal(a.run(`$("score").textContent`),"21 of 22 right first try");
  assert.match(card(a),/<div class="end"><h2>21\/22<\/h2><p>95% right on the first try\.<\/p><p>That's everything due today. 22 will be back tomorrow\.<\/p>/);
  assert.equal(a.run("stats(DECK.edges).mastered"),0);assert.equal(a.run("stats(DECK.edges).seen"),22);
  assert.equal(a.run("tierNow(DECK.edges)"),1);assert.deepEqual(a.run("Object.keys(BADGES.edges).sort()"),["1","gen"]);
});

test("Technician has no flash deck and #edges there goes home",()=>{
  const t=load();
  assert.equal(t.run("DECKS.filter(d=>d.flash).length"),0);
  t.run(`location.hash="#edges";route();0`);
  assert.match(t.run(`$("app").innerHTML`),/Technician/);
});
