/* Exam settings: everything that makes this the Technician app lives in exam.js, not in the shared code. */
"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("fs"),path=require("path");
const {load,script}=require("./harness");

test("Technician settings are what the app used to hard-code",()=>{
  const app=load();
  const c=app.run("EXAM_CONFIG");
  assert.deepEqual([c.examQ,c.pass,c.ns,c.demoNs,c.exportApp],[35,26,"hamdrill:","hamdemo:","hamdrill"]);
  assert.equal(app.run("NS"),"hamdrill:");
  assert.deepEqual(app.run("Object.keys(FIGS)"),["T-1","T-2","T-3"]);
});

test("no Technician-specific text is left in the shared code",()=>{
  for(const s of ["Technician","T5B","Element 2","2026-2030","of 35","pass is 26","26 passes","74%",'"T-1"',"T8A02","T8 ","T5 "])
    assert.ok(!script().includes(s),`shared code still contains "${s}"`);
});
