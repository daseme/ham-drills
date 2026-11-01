/* The study week: the day log, the floor, the strip on home, weeks in a row, the end-screen line. */
"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const {load}=require("./harness");

/* Noon UTC on a known Thursday, 2026-10-22; dayNum is local, and noon keeps the date the same in every zone. */
const THU=Date.UTC(2026,9,22,12);
const at=(ms,o={})=>load({now:ms,...o});

test("the harness pins the clock, and the week starts on Monday",()=>{
  const a=at(THU),T=a.run("dayNum()");
  assert.equal(a.run("new Date().toISOString().slice(0,10)"),"2026-10-22");
  assert.equal(a.run(`weekday(${T})`),3);
  assert.equal(a.run(`weekStart(${T})`),T-3);
  assert.equal(a.run("weekday(0)"),3,"day 0 is Thursday 1970-01-01");
  assert.equal(a.run(`weekday(${T+3})`),6,"Sunday");
  assert.equal(a.run(`weekStart(${T+3})`),T-3,"Sunday is still this week");
  assert.equal(a.run(`weekStart(${T+4})`),T+4,"Monday starts the next");
});

test("the floor is 10, or what was due when fewer, and a practice exam meets the day on its own",()=>{
  const a=at(THU);
  assert.equal(a.run("dayFloor(undefined)"),10);
  assert.equal(a.run("dayFloor({d:0,n:0})"),10);
  assert.equal(a.run("dayFloor({d:3,n:0})"),3);
  assert.equal(a.run("dayFloor({d:10,n:0})"),10);
  assert.equal(a.run("dayFloor({d:87,n:0})"),10);
  assert.equal(a.run("dayMet(undefined)"),false);
  assert.equal(a.run("dayMet({d:3,n:3})"),true);
  assert.equal(a.run("dayMet({d:3,n:2})"),false);
  assert.equal(a.run("dayMet({d:0,n:9})"),false);
  assert.equal(a.run("dayMet({d:0,n:10})"),true);
  assert.equal(a.run("dayMet({d:87,n:10})"),true);
  assert.equal(a.run("dayMet({d:87,n:0,x:true})"),true);
});
