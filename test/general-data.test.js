/* General's question data: the pool check as CI runs it, against the committed snapshot, and the expected size. */
"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const {execFileSync}=require("child_process");
const path=require("path");

test("general/data.js passes the pool check with all 423 questions",()=>{
  const out=execFileSync(process.execPath,[path.join(__dirname,"..","tools","pool-check.js"),"general"],{encoding:"utf8"});
  assert.match(out,/423 pool questions in 10 sections, exam counts sum to 35/);
  assert.match(out,/423 match exactly/);
  assert.match(out,/OK\s*$/);
});
