/* The pool tools on the General pool: pool-import reads a section verbatim, and pool-check treats sections not yet
   written as "not yet added" rather than failures. Needs the NCVEC file in private/ncvec/, which CI does not have. */
"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("fs"),path=require("path"),os=require("os");
const {execFileSync,spawnSync}=require("child_process");

const ROOT=path.join(__dirname,".."),POOL=path.join(ROOT,"private","ncvec","general-2023-2027-errata6-feb4-2026.docx");
const skip=fs.existsSync(POOL)?false:"the General pool file is not in private/ncvec/";
const tool=(name,...args)=>spawnSync(process.execPath,[path.join(ROOT,"tools",name),...args],{encoding:"utf8"});

test("pool-import reads G1 verbatim, without withdrawn questions",{skip},()=>{
  const deck=JSON.parse(tool("pool-import.js",POOL,"G1").stdout);
  const {docxParagraphs}=require("../tools/docx-text");
  const live=docxParagraphs(POOL).filter(l=>/^G1[A-Z]\d\d\s*\(/.test(l)).length;
  assert.equal(deck.Q.length,live);
  for(const w of ["G1A04","G1C08","G1C09","G1C10","G1E09"])assert.ok(!deck.Q.some(q=>q[0]===w),w);
  const a05=deck.Q.find(q=>q[0]==="G1A05");
  assert.equal(a05[3],0);
  assert.equal(a05[2].length,4);
  assert.equal(deck.exam,5);
});

test("pool-import marks the questions that use figure G7-1",{skip},()=>{
  const deck=JSON.parse(tool("pool-import.js",POOL,"G7").stdout);
  const withFig=deck.Q.filter(q=>q[5]==="G7-1").map(q=>q[0]);
  assert.equal(withFig.length,5);
});

test("pool-check reports unwritten sections, not failures",{skip},()=>{
  const deck=JSON.parse(tool("pool-import.js",POOL,"G1").stdout);
  deck.Q.forEach(q=>q[4]="Note.");
  const f=path.join(os.tmpdir(),"general-g1-only.js");
  fs.writeFileSync(f,`window.DECKS=[${JSON.stringify(deck)}];window.EXPLAIN={};`);
  const r=tool("pool-check.js","general",POOL,"--data",f);
  assert.equal(r.status,0,r.stdout);
  assert.match(r.stdout,/not yet added: G2, G3, G4, G5, G6, G7, G8, G9, G0/);
  assert.match(r.stdout,/withdrawn/);
});

test("pool-check fails a written section that is missing a question",{skip},()=>{
  const deck=JSON.parse(tool("pool-import.js",POOL,"G1").stdout);
  deck.Q.forEach(q=>q[4]="Note.");deck.Q.pop();
  const f=path.join(os.tmpdir(),"general-g1-short.js");
  fs.writeFileSync(f,`window.DECKS=[${JSON.stringify(deck)}];window.EXPLAIN={};`);
  assert.equal(tool("pool-check.js","general",POOL,"--data",f).status,1);
});

test("pool-check still passes Technician with no arguments",()=>{
  const r=tool("pool-check.js");
  assert.equal(r.status,0,r.stdout);
  assert.match(r.stdout,/409 pool questions/);
});
