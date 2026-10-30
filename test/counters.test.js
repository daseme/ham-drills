/* The drill counters, in all three drills: the session line counts the session's own start pool and how many of
   those are still due (a miss stays, a card that becomes due after midnight is not counted), the position counts
   the list with its repeats, the score counts distinct items, a repeat is marked Repeat for eyes and screen
   readers, and Start over is hidden once nothing is left due. */
"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const {load}=require("./harness");

const line=a=>a.run(`$("srsline").textContent`),pos=a=>a.run(`$("pos").textContent`),score=a=>a.run(`$("score").textContent`),card=a=>a.run(`$("card").innerHTML`);
const T=load().run("dayNum()");

/* Question drill: skip a Basics interstitial, read the card's id, answer right or wrong through its buttons. */
const basics=a=>{if(card(a).includes('id="go"'))a.run(`$("go").onclick();0`)};
const qid=a=>card(a).match(/class="qid">([^<]+)</)[1];
const answer=(a,right)=>a.run(`(()=>{const id=$("card").innerHTML.match(/class="qid">([^<]+)</)[1];const q=POOL.flatMap(d=>d.Q).find(q=>q[0]===id);const b=[...$("ans").children].find(b=>(+b.dataset.oi===q[3])===${right});b.onclick();return id})()`);
const next=a=>a.run(`$("next").onclick();0`);
const ended=a=>/class="end"/.test(card(a));

test("question drill: the lines name what they count, a miss stays due and comes back marked Repeat, Start over hides at the end",()=>{
  const a=load();a.run("drill({deck:DECK.t1})");
  const N=a.run("DECK.t1.Q.length");
  assert.equal(line(a),`${N} due today, ${N} still to get right, 0 of ${N} mastered.`);
  assert.equal(pos(a),`Question 1 of ${N}`);assert.equal(score(a),"");
  basics(a);const first=qid(a);
  assert.doesNotMatch(card(a),/qrep/);assert.match(card(a),/aria-labelledby="qtext"/);
  answer(a,false);
  assert.equal(pos(a),`Question 1 of ${N+1}, including 1 repeat`);
  assert.equal(score(a),"0 of 1 question right on the first try");
  assert.equal(line(a),`${N} due today, ${N} still to get right, 0 of ${N} mastered.`,"a miss is due again today");
  next(a);
  for(let k=0;k<3;k++){basics(a);answer(a,true);next(a)}
  assert.equal(score(a),"3 of 4 questions right on the first try");
  assert.match(line(a),new RegExp(`^${N} due today, ${N-3} still to get right, 0 of ${N} mastered, 3 coming up tomorrow\\.$`));
  basics(a);
  assert.equal(qid(a),first,"the miss returns four places on");
  assert.match(card(a),/^<p class="topic"><span class="rep" id="qrep">Repeat<\/span> &middot; <span class="qid">/);
  assert.match(card(a),/aria-labelledby="qrep qtext"/);
  answer(a,true);
  assert.equal(score(a),"3 of 4 questions right on the first try","a repeat is not a first try");
  assert.equal(pos(a),`Question 5 of ${N+1}, including 1 repeat`);
  assert.match(line(a),new RegExp(`^${N} due today, ${N-4} still to get right, 0 of ${N} mastered, 4 coming up tomorrow\\.$`));
  next(a);
  for(let k=0;k<N+2&&!ended(a);k++){basics(a);answer(a,true);next(a)}
  assert.ok(ended(a));
  assert.equal(line(a),`${N} due today, all answered right, 0 of ${N} mastered, ${N} coming up tomorrow.`);
  assert.equal(pos(a),`Question ${N+1} of ${N+1}, including 1 repeat`);
  assert.equal(score(a),`${N-1} of ${N} questions right on the first try`);
  assert.match(card(a),/That's everything due today\. \d+ will be back tomorrow\./);
  assert.doesNotMatch(card(a),/id="again"/,"nothing is left due, so Start over would show nothing");
  /* Due today off: the session is not the due set, so the line says what is due, as before. */
  a.run(`$("dueOnly").checked=false;$("dueOnly").onchange();0`);
  assert.equal(line(a),`0 due today, 0 of ${N} mastered, ${N} coming up tomorrow.`);
  assert.equal(pos(a),`Question 1 of ${N}`);
});

test("question drill: the review-all line has no mastered clause, and nothing due reads Nothing due today",()=>{
  const a=load();a.run("drill({mixed:true})");
  assert.equal(line(a),"Nothing due today.");assert.equal(pos(a),"");
  const b=load({storage:{"hamdrill:srs:t1":JSON.stringify({T1A01:{lv:1,due:T,last:T-1,fail:null,n:1,w:0},T1A02:{lv:1,due:T+1,last:T,fail:null,n:1,w:0}})}});
  b.run("drill({mixed:true})");
  assert.equal(line(b),"1 due today, 1 still to get right, 1 coming up tomorrow.");
  assert.equal(pos(b),"Question 1 of 1");
  answer(b,true);
  assert.equal(line(b),"1 due today, all answered right, 1 coming up tomorrow.");
  assert.equal(score(b),"1 of 1 question right on the first try");
});

/* Flash drill: tap the answer group as a finger would. */
const tap=(a,act)=>a.run(`$("ans").onclick({target:{closest:()=>({dataset:{act:"${act}"}})}});0`);

test("flash drill: a card that becomes due after midnight is not counted against the session, and a repeat is marked front and back",()=>{
  const a=load({exam:"general",storage:{"hamgeneral:srs:facts":JSON.stringify({faa:{lv:1,due:T+1,last:T-1,fail:null,n:1,w:0}})}});
  a.run("flash(DECK.facts)");
  assert.equal(line(a),"30 due today, 30 still to get right, 0 of 31 mastered, 1 coming up tomorrow.");
  assert.equal(pos(a),"Card 1 of 30");
  /* Midnight: the card scheduled for tomorrow is due now. The session did not include it, so the line does not count it. */
  a.run(`srsOf("facts").faa.due=dayNum();0`);
  const first=card(a).match(/id="qname">([^<]+)</)[1];
  tap(a,"show");tap(a,"no");
  assert.equal(line(a),"30 due today, 30 still to get right, 0 of 31 mastered.");
  assert.equal(pos(a),"Card 2 of 31, including 1 repeat");assert.equal(score(a),"0 of 1 card right on the first try");
  assert.doesNotMatch(card(a),/qrep/);
  for(let k=0;k<3;k++){tap(a,"show");tap(a,"ok")}
  assert.equal(line(a),"30 due today, 27 still to get right, 0 of 31 mastered, 3 coming up tomorrow.");
  assert.match(card(a),new RegExp(`^<p class="topic rep" id="qrep">Repeat</p><p class="name" id="qname">${first.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}</p><div class="ans" id="ans" role="group" aria-labelledby="qrep qname">`));
  tap(a,"show");
  assert.match(card(a),/^<p class="topic rep" id="qrep">Repeat<\/p><p class="name" id="qname">/);
  assert.match(card(a),/aria-labelledby="qrep qans qhook"/);
  tap(a,"ok");
  assert.equal(score(a),"3 of 4 cards right on the first try");
  assert.equal(line(a),"30 due today, 26 still to get right, 0 of 31 mastered, 4 coming up tomorrow.");
  for(let k=0;k<26;k++){tap(a,"show");tap(a,"ok")}
  assert.match(card(a),/class="end"/);
  assert.equal(line(a),"30 due today, all answered right, 0 of 31 mastered, 30 coming up tomorrow.");
  assert.equal(pos(a),"Card 31 of 31, including 1 repeat");
  /* The midnight card is due and outside the session, so the end screen says so and Start over is offered. */
  assert.match(card(a),/1 more card is due today\. 30 will be back tomorrow\./);assert.match(card(a),/id="again"/);
  a.run(`$("again").onclick();0`);
  assert.equal(line(a),"1 due today, 1 still to get right, 0 of 31 mastered, 30 coming up tomorrow.");assert.equal(pos(a),"Card 1 of 1");
  tap(a,"show");tap(a,"ok");
  assert.doesNotMatch(card(a),/id="again"/,"now nothing is left due");
  /* Due today off: Start over is offered, since the session is every card. */
  a.run(`$("dueOnly").checked=false;$("dueOnly").onchange();0`);
  assert.equal(line(a),"0 due today, 0 of 31 mastered, 30 coming up tomorrow.");
  assert.equal(pos(a),"Card 1 of 31");
});

/* Symbol drill, in name mode: the symbol on the card is found by its drawing (the longest one on the card, since one
   drawing can be part of another), and a button by its name. */
const answerSym=(a,right)=>a.run(`(()=>{const h=$("card").innerHTML,s=DECK.symbols.S.filter(x=>h.includes(x.d)).sort((p,q)=>q.d.length-p.d.length)[0];const b=[...$("ans").children].find(b=>(b.dataset.n===s.n)===${right});b.onclick();return s.n})()`);

test("symbol drill: the same lines, with symbols as the noun, and the Repeat mark above the prompt",()=>{
  const a=load();a.run("symbols()");
  const N=a.run("DECK.symbols.S.length");
  assert.equal(line(a),`${N} due today, ${N} still to get right, 0 of ${N} mastered.`);
  assert.equal(pos(a),`Symbol 1 of ${N}`);
  assert.match(card(a),/^<p class="prompt" id="qtext">What is this symbol\?<\/p>/);assert.match(card(a),/aria-labelledby="qtext"/);
  const first=answerSym(a,false);
  assert.equal(pos(a),`Symbol 1 of ${N+1}, including 1 repeat`);
  assert.equal(score(a),"0 of 1 symbol right on the first try");
  assert.equal(line(a),`${N} due today, ${N} still to get right, 0 of ${N} mastered.`);
  next(a);
  for(let k=0;k<3;k++){answerSym(a,true);next(a)}
  assert.match(card(a),/^<p class="topic rep" id="qrep">Repeat<\/p><p class="prompt" id="qtext">What is this symbol\?<\/p>/);
  assert.match(card(a),/aria-labelledby="qrep qtext"/);
  assert.equal(answerSym(a,true),first);
  assert.equal(score(a),"3 of 4 symbols right on the first try");
  assert.equal(line(a),`${N} due today, ${N-4} still to get right, 0 of ${N} mastered, 4 coming up tomorrow.`);
  next(a);
  for(let k=0;k<N&&!ended(a);k++){answerSym(a,true);next(a)}
  assert.ok(ended(a));
  assert.equal(line(a),`${N} due today, all answered right, 0 of ${N} mastered, ${N} coming up tomorrow.`);
  assert.doesNotMatch(card(a),/id="again"/);
});

test("the shared lines: singular and plural, no repeats clause without repeats, nothing without items",()=>{
  const a=load();
  assert.equal(a.run(`posLine("Card",0,[1,2,3],3)`),"Card 1 of 3");
  assert.equal(a.run(`posLine("Card",3,[1,2,3,4],3)`),"Card 4 of 4, including 1 repeat");
  assert.equal(a.run(`posLine("Card",0,[],0)`),"");
  assert.equal(a.run(`scoreLine("symbol",1,1)`),"1 of 1 symbol right on the first try");
  assert.equal(a.run(`scoreLine("symbol",0,0)`),"");
  assert.equal(a.run(`sessionLine(0,0,", 0 of 5 mastered")`),"Nothing due today, 0 of 5 mastered.");
  assert.equal(a.run(`sessionLine(5,0,"")`),"5 due today, all answered right.");
});
