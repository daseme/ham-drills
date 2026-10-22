/* The estimate and the badges, on fixed fixtures written straight into the app's progress store. */
"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const {load}=require("./harness");

/* A fresh app where every card in the named decks is set to the given record (or left unseen with null). */
function withProgress(levels){
  const app=load();
  app.run(`(${(levels=>{for(const d of DECKS){const L=levels[d.id];if(L===undefined)continue;
    SRS[d.id]={};itemIds(d).forEach((k,j)=>{const lv=typeof L==="function"?L(j):L;if(lv!=null)SRS[d.id][k]={lv,due:0,last:0,fail:null,n:1}})}}).toString()})(${toSource(levels)})`);
  return app;
}
/* Fixtures can hold functions (level by card index), so they are passed as source rather than JSON. */
const toSource=o=>"{"+Object.entries(o).map(([k,v])=>`${JSON.stringify(k)}:${typeof v==="function"||(v&&typeof v==="object")?v.toString():JSON.stringify(v)}`).join(",")+"}";
const pool=["t1","t2","t3","t4","t5","t6","t7","t8","t9","t0"];
const all=lv=>Object.fromEntries(pool.map(id=>[id,lv]));

test("with nothing seen, the estimate is a guess on every question: 35 x 0.25",()=>{
  assert.deepEqual(withProgress({}).run("estimate()").lo,9);
  assert.deepEqual(withProgress({}).run("estimate()").hi,9);
});

test("with everything mastered, the estimate runs from 0.9 to 1 of 35",()=>{
  const e=withProgress(all(3)).run("estimate()");
  assert.deepEqual([e.lo,e.hi,e.gain],[32,35,[]]);
});

test("with everything answered right once, the estimate uses the middle weights",()=>{
  const e=withProgress(all(1)).run("estimate()");
  assert.deepEqual([e.lo,e.hi],[Math.round(35*.55),Math.round(35*.85)]);
});

test("with every card missed at its last answer, the estimate uses the missed weights",()=>{
  const e=withProgress(all(0)).run("estimate()");
  assert.deepEqual([e.lo,e.hi],[Math.round(35*.35),Math.round(35*.65)]);
});

test("the estimate's 'most room to gain' names the two sections with the most to gain",()=>{
  const levels=all(3);levels.t1=null;levels.t5=null;
  assert.deepEqual(withProgress(levels).run("estimate()").gain,["T1","T5"]);
});

test("the low and high estimates bracket each other for any mix",()=>{
  for(let s=0;s<20;s++){
    /* Built as source with the numbers filled in, since a fixture function crosses into the app as text. */
    const levels=Object.fromEntries(pool.map((id,i)=>[id,{toString:()=>`j=>[null,0,1,2,3,4][(j*7+${i*3+s})%6]`}]));
    const e=withProgress(levels).run("estimate()");
    assert.ok(e.lo<=e.hi&&e.lo>=0&&e.hi<=35,JSON.stringify(e));
  }
});

test("a deck's standing: none until every card is seen, then bronze, silver, gold",()=>{
  const tier=L=>withProgress({t9:L}).run("tierNow(DECK.t9)");
  assert.equal(tier(j=>j===0?null:3),0);
  assert.equal(tier(j=>j===0?0:3),1);
  assert.equal(tier(j=>j===0?2:3),2);
  assert.equal(tier(j=>j===0?1:3),2);
  assert.equal(tier(3),3);
  assert.equal(tier(5),3);
});

test("a badge, once earned, is kept and shows dimmed when standing drops",()=>{
  const app=withProgress({t9:3});
  app.run("awardBadges(DECK.t9,true)");
  assert.equal(app.run("tierEarned(DECK.t9)"),3);
  app.run("SRS.t9[itemIds(DECK.t9)[0]].lv=0");
  assert.deepEqual(app.run("[tierNow(DECK.t9),tierEarned(DECK.t9)]"),[1,3]);
  assert.match(app.run("deckBadge(DECK.t9,32)"),/class="badge t3 lapsed"/);
});

test("earning a badge records every rung up to it, each on the day earned",()=>{
  const app=withProgress({t9:2});
  app.run("awardBadges(DECK.t9,true)");
  const b=app.run("BADGES.t9"),today=app.run("dayNum()");
  assert.deepEqual(b,{1:today,2:today});
});
