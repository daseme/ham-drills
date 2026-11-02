/* The miss line: "Not quite." on a card never yet answered right; on a card that has been, the two Lemon lines take
   turns through the visit, Jack Donaghy first, then Malcolm Tucker, then Jack again. */
"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const {load}=require("./harness");

const T=load().run("dayNum()");
const basics=a=>{if(a.run(`$("card").innerHTML`).includes('id="go"'))a.run(`$("go").onclick();0`)};
const miss=a=>a.run(`(()=>{const id=$("card").innerHTML.match(/class="qid">([^<]+)</)[1];const q=POOL.flatMap(d=>d.Q).find(q=>q[0]===id);[...$("ans").children].find(b=>+b.dataset.oi!==q[3]).onclick();return $("after").innerHTML.match(/<strong class="no">([^<]+)<\\/strong>/)[1]})()`);
const next=a=>a.run(`$("next").onclick();0`);

test("a card never answered right gets Not quite, however often it is missed",()=>{
  const a=load();a.run("drill({deck:DECK.t1})");
  basics(a);assert.equal(miss(a),"Not quite.");next(a);
  basics(a);assert.equal(miss(a),"Not quite.");
});

test("cards answered right before get the two Lemon lines in turn",()=>{
  /* Every T1 card once right and due today, so each miss is a Lemon. */
  const ids=load().run("DECK.t1.Q.map(q=>q[0])"),srs={};
  for(const id of ids)srs[id]={lv:1,due:T,last:T-1,fail:null,n:1,w:0};
  const a=load({storage:{"hamdrill:srs:t1":JSON.stringify(srs)}});a.run("drill({deck:DECK.t1})");
  const seen=[];
  for(let k=0;k<4;k++){basics(a);seen.push(miss(a));next(a)}
  assert.deepEqual(seen,["Good God, Lemon!","Difficult difficult, lemon difficult.","Good God, Lemon!","Difficult difficult, lemon difficult."]);
});

test("the symbol drill takes its turn in the same sequence",()=>{
  const names=load().run("DECK.symbols.S.map(s=>s.n)"),srs={};
  for(const n of names)srs[n]={lv:1,due:T,last:T-1,fail:null,n:1,w:0};
  const a=load({storage:{"hamdrill:srs:symbols":JSON.stringify(srs)}});
  a.run("lemonTurn=1");
  a.run("symbols()");
  /* Name mode: the symbol on the card is the longest drawing in it; a wrong button is any other name. */
  const line=a.run(`(()=>{const h=$("card").innerHTML,s=DECK.symbols.S.filter(x=>h.includes(x.d)).sort((p,q)=>q.d.length-p.d.length)[0];[...$("ans").children].find(b=>b.dataset.n!==s.n).onclick();return $("after").innerHTML.match(/<strong class="no">([^<]+)<\\/strong>/)[1]})()`);
  assert.equal(line,"Difficult difficult, lemon difficult.");
});
