/* General's Numbers to know flash cards: every number on a card is one the pool's own answer gives, each card has a
   stable key, and the drill renders a card with no prompt line while Edges keeps its own. */
"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const {load}=require("./harness");

const app=load({exam:"general"});
const deck=app.run("DECK.facts");
const pool=app.run("Object.fromEntries(POOL.flatMap(d=>d.Q.map(q=>[q[0],q[2][q[3]]])))");
/* Numbers as the pool and the cards write them: thousands commas allowed, decimals allowed. */
const nums=s=>(s.match(/\d[\d,]*(?:\.\d+)?/g)||[]).map(x=>Number(x.replace(/,/g,"")));
const sources=c=>c.q==null?[]:[].concat(c.q);

test("31 cards with unique keys and names, every source a pool question",()=>{
  assert.equal(deck.flash.length,31);assert.equal(deck.prompt,undefined);
  assert.equal(new Set(deck.flash.map(c=>c.k)).size,31);
  assert.equal(new Set(deck.flash.map(c=>c.n)).size,31);
  for(const c of deck.flash){assert.match(c.k,/^[a-z0-9-]+$/);assert.ok(sources(c).length,c.n+" has no source");
    for(const q of sources(c))assert.ok(pool[q],`${c.n}: ${q} is not a pool question`)}
  assert.deepEqual(app.run("itemIds(DECK.facts)"),deck.flash.map(c=>c.k));
});

test("every number in a source's correct answer is on its card's back",()=>{
  for(const c of deck.flash){const on=nums(c.a);
    for(const q of sources(c))for(const v of nums(pool[q]))assert.ok(on.includes(v),`${c.n}: ${q} says ${v}, the card says ${JSON.stringify(c.a)}`)}
});

test("the record key is the card's key, so rewording a card keeps its progress",()=>{
  const a=load({exam:"general"});
  a.run("flash(DECK.facts)");
  const name=a.run(`$("card").innerHTML`).match(/id="qname">([^<]+)</)[1];
  const key=deck.flash.find(c=>c.n===name).k;
  a.run(`$("ans").onclick({target:{closest:()=>({dataset:{act:"show"}})}});$("ans").onclick({target:{closest:()=>({dataset:{act:"ok"}})}});0`);
  assert.deepEqual(a.run(`Object.keys(srsOf("facts"))`),[key]);
});

test("a deck without a prompt shows the name alone, labelled by itself; Edges keeps its prompt",()=>{
  const a=load({exam:"general"});
  a.run("flash(DECK.facts)");
  let html=a.run(`$("card").innerHTML`);
  assert.doesNotMatch(html,/class="prompt"/);
  assert.match(html,/^<p class="name" id="qname">[^<]+<\/p><div class="ans" id="ans" role="group" aria-labelledby="qname"><button data-act="show">Show<\/button><\/div>$/);
  a.run(`$("ans").onclick({target:{closest:()=>({dataset:{act:"show"}})}});0`);
  html=a.run(`$("card").innerHTML`);
  assert.match(html,/<p class="hook" id="qhook">[^<]*<\/p><p class="src">G\d[A-Z]\d\d(, G\d[A-Z]\d\d)*<\/p>\n\s*<div class="ans grade"/);
  assert.doesNotMatch(html,/bandbar/);
  a.run("flash(DECK.edges)");
  html=a.run(`$("card").innerHTML`);
  assert.match(html,/^<p class="prompt" id="qtext">General privileges on<\/p><p class="name" id="qname">\d+ m<\/p><div class="ans" id="ans" role="group" aria-labelledby="qtext qname">/);
  a.run(`$("ans").onclick({target:{closest:()=>({dataset:{act:"show"}})}});0`);
  assert.doesNotMatch(a.run(`$("card").innerHTML`),/class="src"/);
});

test("home and the study page list the deck, with sources on the study page",()=>{
  app.run("home()");
  assert.match(app.run(`$("app").innerHTML`),/31 cards\. Not started\./);
  app.run("study(DECK.facts)");
  const html=app.run(`$("app").innerHTML`);
  assert.match(html,/<h1>Numbers to know<\/h1>/);
  assert.equal((html.match(/<p class="src">/g)||[]).length,31);
  assert.match(html,/<p class="src">G6A05, G6A03<\/p>/);
});
