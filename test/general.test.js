/* The General app: its own storage and backups, and sensible screens while only some sections are written. */
"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const {load}=require("./harness");

/* A General data file with one three-question section, as it will look while sections are still being added. */
const SAMPLE=`window.DECKS=[{id:"g1",code:"G1",name:"Rules",exam:5,G:{G1A:"Privileges"},
  Q:[["G1A01","Stem one?",["a","b","c","d"],2,"Note one."],["G1A02","Stem two?",["a","b","c","d"],0,"Note two."],["G1A03","Stem three?",["a","b","c","d"],1,"Note three."]],
  P:{p1:["Privileges","<p>Basics.</p>"]},CON:{G1A01:"p1",G1A02:"p1",G1A03:"p1"}}];window.EXPLAIN={};`;
const general=(o={})=>load({exam:"general",data:SAMPLE,...o});
const homeHtml=app=>(app.run("home()"),app.run(`$("app").innerHTML`));
const backup=(appId,deck)=>`$("importFile").onchange({target:{value:"",files:[{text:async()=>JSON.stringify({app:"${appId}",version:2,decks:{${deck}:{${deck.toUpperCase()}A01:{lv:3,due:1,last:1,fail:null,n:3}}}})}]}})`;

test("General uses its own storage",()=>{
  const app=general();
  app.run(`record("g1","G1A01",true)`);
  assert.ok(app.keys().length>0);
  assert.ok(app.keys().every(k=>k.startsWith("hamgeneral:")),app.keys().join(", "));
});

test("no estimate until every section is in",()=>{
  const html=homeHtml(general());
  assert.match(html,/The estimate appears once all 10 sections are in\./);
  assert.doesNotMatch(html,/Likely/);
});

test("first visit names the first live section",()=>{
  const html=homeHtml(general());
  assert.match(html,/3 questions in one section\. Start with G1/);
  assert.match(html,/Start with G1: Rules/);
});

test("#symbols on General goes home without error",()=>{
  const app=general();
  app.run(`location.hash="#symbols";route()`);
  assert.match(app.run(`$("app").innerHTML`),/General Class Operator License/);
});

test("?demo on General is ignored",()=>{
  const app=general({search:"?demo"});
  assert.equal(app.run("DEMO"),false);
  assert.ok(app.keys().every(k=>!k.startsWith("hamdemo:")));
});

test("a Technician backup is refused by General",async()=>{
  const app=general();
  await app.runAsync(backup("hamdrill","g1"));
  assert.deepEqual(app.run("srsOf('g1')"),{});
});

test("a General backup is refused by Technician",async()=>{
  const app=load();
  await app.runAsync(backup("hamdrill-general","t1"));
  assert.equal(app.run("srsOf('t1').X1"),undefined);
});

test("a General backup is taken by General",async()=>{
  const app=general();
  await app.runAsync(backup("hamdrill-general","g1"));
  assert.equal(app.run("srsOf('g1').G1A01.lv"),3);
});

test("General's footer doesn't offer a demo it doesn't have",()=>{
  assert.doesNotMatch(homeHtml(general()),/sample progress/);
});

test("an empty Technician app still offers the demo",()=>{
  assert.match(homeHtml(load()),/See it with sample progress/);
});

test("the real General app is complete: every section live, the estimate waiting only on progress",()=>{
  const app=load({exam:"general"});
  assert.equal(app.run("COMPLETE"),true);
  const html=homeHtml(app);
  assert.doesNotMatch(html,/once all 10 sections are in/);
  assert.match(html,/Your estimated score appears once you've seen 43 questions\./);
});

test("the estimate shows once a tenth of the pool has been seen",()=>{
  const app=load({exam:"general"});
  app.run(`itemIds(DECK.g1).slice(0,42).forEach(k=>record("g1",k,true))`);
  assert.match(homeHtml(app),/42 so far/);
  app.run(`record("g2",DECK.g2.Q[0][0],true)`);
  assert.match(homeHtml(app),/Likely/);
});

test("General's Math section groups by its own topics, not Technician's",()=>{
  const app=load({exam:"general"});
  assert.deepEqual(app.run("C.mathGroups"),["G5B","G5C"]);
  assert.equal(app.run("DECK.math.Q.length"),34);
});

test("General's review-all screen names only the sections it has",()=>{
  const g=load({exam:"general"});g.run("drill({mixed:true})");
  const html=g.run(`$("app").innerHTML`);
  assert.doesNotMatch(html,/Symbols/);
  assert.match(html,/Math, Bands, Edges and Facts are reviewed on their own/);
  const t=load();t.run("drill({mixed:true})");
  assert.match(t.run(`$("app").innerHTML`),/Math and Symbols are reviewed on their own/);
});
