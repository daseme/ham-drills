/* The question data: tools/pool-check.js as CI runs it, against the committed snapshot of the official pool. */
"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const {execFileSync}=require("child_process");
const path=require("path");

test("data.js passes the pool check",()=>{
  const out=execFileSync(process.execPath,[path.join(__dirname,"..","tools","pool-check.js")],{encoding:"utf8"});
  assert.match(out,/409 pool questions in 10 sections, exam counts sum to 35/);
  assert.match(out,/409 match exactly/);
  assert.match(out,/OK\s*$/);
});
