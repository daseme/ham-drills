/* Backups are checked record by record on import: damaged records and unknown ids are dropped, good ones merge as before. */
"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const {load}=require("./harness");

const good={lv:2,due:20745,last:20742,fail:null,n:2,w:0,ts:1792176685061};
const valid=r=>load().run(`validRecord(${JSON.stringify(r)},20800)`);

test("a full record passes and comes back with only its seven fields",()=>{
  assert.deepEqual(valid({...good,extra:"x"}),good);
});

test("a version 1 record with no w and no ts passes",()=>{
  const r={lv:1,due:20745,last:20744,fail:20743,n:5};
  assert.deepEqual(valid(r),r);
});

test("records with a missing or wrong lv or due are rejected",()=>{
  for(const r of [{due:1},{lv:"2",due:1},{lv:6,due:1},{lv:1.5,due:1},{lv:1},{lv:1,due:"1"},{lv:1,due:1.5},null,"x",7])
    assert.equal(valid(r),null,JSON.stringify(r));
});

test("last, fail, n, w and ts must be the right kind when present",()=>{
  for(const r of [{lv:1,due:1,last:"a"},{lv:1,due:1,fail:1.5},{lv:1,due:1,n:-1},{lv:1,due:1,w:"2"},{lv:1,due:1,n:1,w:2},{lv:1,due:1,ts:"now"}])
    assert.equal(valid(r),null,JSON.stringify(r));
  assert.deepEqual(valid({lv:1,due:1,last:null,fail:null}),{lv:1,due:1,last:null,fail:null});
});

test("a due day far in the future is clamped to today plus the longest interval",()=>{
  assert.equal(valid({lv:5,due:99999},20800).due,20800+35);
  assert.equal(valid({lv:5,due:20830},20800).due,20830);
});

test("import keeps good records, drops damaged ones and unknown ids, and says so",()=>{
  const app=load();
  app.run(`toast=m=>{globalThis.LAST=m};0`);
  const decks={t1:{T1A01:good,T1A02:{lv:"bad"},ZZZ99:good},t5:{T5A01:{lv:0,due:0}},nope:{X:good}};
  assert.deepEqual(app.run(`importDecks(${JSON.stringify(decks)})`),{decks:2,dropped:1});
  assert.deepEqual(app.run(`Object.keys(srsOf("t1"))`),["T1A01"]);
  assert.deepEqual(app.run(`Object.keys(srsOf("t5"))`),["T5A01"]);
});

test("the import toast counts sections and skipped records",async()=>{
  const app=load();
  app.run(`toast=m=>{globalThis.LAST=m};0`);
  const backup=d=>`$("importFile").onchange({target:{value:"",files:[{text:async()=>JSON.stringify(${JSON.stringify(d)})}]}})`;
  await app.runAsync(backup({app:"hamdrill",version:2,decks:{t1:{T1A01:good,T1A02:{}}}}));
  assert.equal(app.run("globalThis.LAST"),"Imported progress for 1 section; 1 damaged record was skipped.");
  await app.runAsync(backup({app:"hamdrill",version:2,decks:{t1:{T1A01:good},t2:{T2A01:good}}}));
  assert.equal(app.run("globalThis.LAST"),"Imported progress for 2 sections.");
});

test("badge days and the exam day are taken only as whole numbers",async()=>{
  const app=load();
  app.run(`toast=()=>{};0`);
  const backup=d=>`$("importFile").onchange({target:{value:"",files:[{text:async()=>JSON.stringify(${JSON.stringify(d)})}]}})`;
  await app.runAsync(backup({app:"hamdrill",version:2,decks:{},badges:{t1:{1:"x",2:20700.5,3:20700},zz:{1:1}},examDay:"2030-01-01"}));
  assert.deepEqual(app.run("BADGES.t1"),{3:20700});
  assert.equal(app.run("BADGES.zz"),undefined);
  assert.equal(app.run("EXAM.day"),null);
});
