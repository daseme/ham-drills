/* The explanations (explain.js) load after the first screen. A card answered before they land throws nothing and
   keeps Basics reachable; once they are there, "Explain this more" opens the explanation. A fetch that fails, or
   lands without defining EXPLAIN, is asked for again at the next answer. */
"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const {load}=require("./harness");

const card=a=>a.run(`$("card").innerHTML`);
const basics=a=>{if(card(a).includes('id="go"'))a.run(`$("go").onclick();0`)};
const answer=a=>a.run(`(()=>{const id=$("card").innerHTML.match(/class="qid">([^<]+)</)[1];const q=POOL.flatMap(d=>d.Q).find(q=>q[0]===id);const b=[...$("ans").children].find(b=>+b.dataset.oi===q[3]);b.onclick();return id})()`);
const asked=a=>a.run(`document.body.children.map(c=>c.src)`);

test("the app asks for explain.js once the first screen is up, and only once",()=>{
  const a=load({explain:false});
  assert.equal(a.run("typeof EXPLAIN"),"undefined");
  assert.deepEqual(asked(a),["explain.js"]);
  a.run("loadExplain();loadExplain()");
  assert.deepEqual(asked(a),["explain.js"]);
});

test("with the explanations loaded, nothing is asked for and the button opens the explanation",()=>{
  const a=load();
  assert.deepEqual(asked(a),[]);
  a.run("drill({deck:DECK.t1})");basics(a);const id=answer(a);
  const after=a.run(`$("after").innerHTML`);
  assert.match(after,/id="more"/);
  assert.ok(after.includes(`<p>${a.run(`esc(EXPLAIN[${JSON.stringify(id)}].split(/\\n\\s*\\n/)[0])`)}</p>`),"the explanation's first paragraph");
});

test("answered before they land: no error, no explanation, Basics still behind the button",()=>{
  const a=load({explain:false});
  a.run("drill({deck:DECK.t1})");basics(a);const id=answer(a);
  const after=a.run(`$("after").innerHTML`);
  const primer=a.run(`!!(DECK.t1.CON&&DECK.t1.CON[${JSON.stringify(id)}])`);
  assert.equal(/id="more"/.test(after),primer);
  assert.doesNotMatch(after,/<div class="explain" id="exbox" hidden><p>/);
  if(primer)assert.match(after,/<details><summary>Basics: /);
});

test("a failed fetch, or one that lands without EXPLAIN, is asked for again at the next answer",()=>{
  const a=load({explain:false});
  /* A screen's rebuild empties every stub element, the body too, so the tags made from here on are counted as they are made. */
  a.run("window.made=[];const ce=document.createElement;document.createElement=t=>{const e=ce(t);made.push(e);return e};0");
  const made=()=>a.run("made.map(e=>e.src)");
  a.run("explainTag.onerror();0");
  a.run("drill({deck:DECK.t1})");basics(a);answer(a);
  assert.deepEqual(made().filter(s=>s==="explain.js"),["explain.js"]);
  a.run("explainTag.onload();0");
  a.run(`$("next").onclick();0`);basics(a);answer(a);
  assert.deepEqual(made().filter(s=>s==="explain.js"),["explain.js","explain.js"]);
  a.run("window.EXPLAIN={};explainTag.onload();0");
  a.run(`$("next").onclick();0`);basics(a);answer(a);
  assert.deepEqual(made().filter(s=>s==="explain.js"),["explain.js","explain.js"],"loaded: not asked again");
});

test("whatever follows the load runs once, on load, on error or when the file is already there",()=>{
  const a=load({explain:false});
  a.run("explainTag.onload();0");
  assert.equal(a.run("(()=>{let n=0;loadExplain(()=>n++);const t=explainTag;t.onload();t.onload();return n})()"),1);
  assert.equal(a.run("(()=>{let n=0;loadExplain(()=>n++);explainTag.onerror();return n})()"),1);
  assert.equal(a.run("(()=>{let n=0;window.EXPLAIN={};loadExplain(()=>n++);return n})()"),1);
});
