/* The scheduler: step (one answer, as record applies it) across the interval table, and capInterval near the exam. */
"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const {load}=require("./harness");

const app=load();
const IV=app.run("IV");
/* One answer on day t with no exam date, or with the exam on day exam. */
const step=(r,ok,t,exam=null)=>app.run(`step(${JSON.stringify(r)},${ok},${t},${exam})`);
const cap=(iv,t,exam)=>app.run(`capInterval(${iv},${t},${exam})`);

test("the interval table is 0, 1, 3, 7, 16, 35 and mastery is level 3",()=>{
  assert.deepEqual(IV,[0,1,3,7,16,35]);
  assert.equal(app.run("MASTER"),3);
});

test("a new card answered right goes to level 1, back tomorrow",()=>{
  assert.deepEqual(step(null,true,100),{lv:1,due:101,last:100,fail:null,n:1});
});

test("answered right on each due day, a card climbs the table and stays at the top",()=>{
  let r=null,t=100;
  for(let lv=1;lv<IV.length;lv++){r=step(r,true,t);assert.equal(r.lv,lv);assert.equal(r.due,t+IV[lv]);t=r.due}
  r=step(r,true,t);
  assert.equal(r.lv,IV.length-1);
  assert.equal(r.due,t+IV[IV.length-1]);
  assert.equal(r.n,IV.length);
});

test("three right answers on separate days master a card; a second right answer the same day doesn't count",()=>{
  let r=step(null,true,100);
  r=step(r,true,100);
  assert.equal(r.lv,1);assert.equal(r.due,101);assert.equal(r.n,2);
  r=step(r,true,101);r=step(r,true,104);
  assert.equal(r.lv,3);
});

test("a miss sends a card back to level 0, due again today, and counts against it",()=>{
  let r=step(null,true,100);r=step(r,true,101);
  r=step(r,false,104);
  assert.deepEqual({lv:r.lv,due:r.due,fail:r.fail,n:r.n,w:r.w},{lv:0,due:104,fail:104,n:3,w:1});
  r=step(r,false,104);
  assert.equal(r.w,2);
});

test("right after a miss on the same day stays at level 0 but waits until tomorrow",()=>{
  let r=step(step(null,true,100),false,103);
  r=step(r,true,103);
  assert.deepEqual({lv:r.lv,due:r.due,w:r.w},{lv:0,due:104,w:1});
  r=step(r,true,104);
  assert.equal(r.lv,1);
});

test("with no exam date, or once it has passed, intervals are the plain table",()=>{
  for(const iv of IV){assert.equal(cap(iv,100,null),iv);assert.equal(cap(iv,100,100),iv);assert.equal(cap(iv,100,90),iv)}
});

test("more than a week out, nothing is scheduled on or past the exam day",()=>{
  assert.equal(cap(35,100,120),19);
  assert.equal(cap(7,100,120),7);
  for(let D=8;D<=60;D++)for(const iv of IV.slice(1)){const c=cap(iv,100,100+D);assert.ok(c>=1&&c<=iv&&100+c<100+D,`D=${D} iv=${iv} gave ${c}`)}
});

test("inside the last week, every card comes back at least once more before the exam",()=>{
  assert.equal(cap(16,100,107),3);
  assert.equal(cap(1,100,107),1);
  for(let D=2;D<=7;D++)for(const iv of IV.slice(1)){const c=cap(iv,100,100+D);assert.ok(c>=1&&c<=Math.floor(D/2)&&c<=iv,`D=${D} iv=${iv} gave ${c}`)}
});

test("the day before the exam, a card answered right comes back on exam day",()=>{
  assert.equal(cap(35,100,101),1);
});

test("step applies the exam cap",()=>{
  let r={lv:4,due:100,last:84,fail:null,n:4};
  assert.equal(step(r,true,100).due,135);
  assert.equal(step(r,true,100,110).due,109);
  assert.equal(step(r,true,100,105).due,102);
});
