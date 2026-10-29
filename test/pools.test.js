/* The committed pool snapshots: each is the official NCVEC file parsed, with its source recorded; data.js matches
   it question for question (pool-check compares against it by default, so CI always does); and pool-fetch tells
   a changed file from an unchanged one. With the .docx files in private/ncvec/, the snapshots are also checked
   against them. */
"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("fs"),os=require("os"),path=require("path");
const {spawnSync}=require("child_process");
const {parsePool,loadPool,sha256,snapshotPath,diffPools,makeSnapshot,snapshotText}=require("../tools/pool-parse");

const ROOT=path.join(__dirname,"..");
const tool=(name,...args)=>spawnSync(process.execPath,[path.join(ROOT,"tools",name),...args],{encoding:"utf8"});
const EXAMS={technician:{letter:"T",questions:409},general:{letter:"G",questions:423}};
const docxOf=exam=>{const s=loadPool(snapshotPath(exam)).source;const f=path.join(ROOT,"private","ncvec",s.file);return fs.existsSync(f)?f:null};

for(const [exam,{letter,questions}] of Object.entries(EXAMS)){
  test(`${exam}: the snapshot records its source and holds the whole pool`,()=>{
    const s=JSON.parse(fs.readFileSync(snapshotPath(exam),"utf8"));
    assert.match(s.source.sha256,/^[0-9a-f]{64}$/);
    assert.match(s.source.url,/^https:\/\/ncvec\.org\/downloads\/.+\.docx$/);
    assert.match(s.source.page,/^https:\/\/ncvec\.org\//);
    assert.ok(s.source.pageFiles.includes(s.source.url),"the page listed the file");
    assert.match(s.source.saved,/^\d{4}-\d\d-\d\d$/);
    assert.equal(Object.keys(s.questions).length,questions);
    for(const [id,q] of Object.entries(s.questions)){assert.match(id,new RegExp(`^${letter}\\d[A-Z]\\d\\d$`));assert.equal(q.opts.length,4);assert.ok(q.ans>=0&&q.ans<=3)}
    assert.equal(Object.values(s.sections).reduce((a,x)=>a+x.exam,0),35);
    /* The layout is one question per line, so a change diffs as the questions it touched. */
    assert.equal(fs.readFileSync(snapshotPath(exam),"utf8").replace(/\r\n/g,"\n"),snapshotText(s));
  });

  test(`${exam}: data.js matches the snapshot, every question, and pool-check says so by default`,()=>{
    const r=tool("pool-check.js",exam);
    assert.equal(r.status,0,r.stdout);
    assert.match(r.stdout,new RegExp(`${questions} questions \\(\\d+ withdrawn\\); ${questions} match exactly, 0 differ`));
  });

  test(`${exam}: the snapshot is the .docx, byte for byte and question for question`,{skip:docxOf(exam)?false:`the ${exam} pool file is not in private/ncvec/`},()=>{
    const file=docxOf(exam),snap=loadPool(snapshotPath(exam));
    assert.equal(sha256(file),snap.source.sha256);
    assert.deepEqual(diffPools(snap,parsePool(file,letter)),[]);
    assert.deepEqual(diffPools(parsePool(file,letter),snap),[]);
    const r=tool("pool-fetch.js",exam,"--file",file);
    assert.equal(r.status,0,r.stdout);assert.match(r.stdout,/unchanged/);
  });
}

test("diffPools names what changed: new, gone, stem, option, answer, exam count",()=>{
  const a=loadPool(snapshotPath("general")),b=loadPool(snapshotPath("general"));
  b.questions=new Map(b.questions);
  const g1a01={...b.questions.get("G1A01")};g1a01.ans=(g1a01.ans+1)%4;b.questions.set("G1A01",g1a01);
  b.questions.set("G1A02",{...b.questions.get("G1A02"),stem:"Changed"});
  b.questions.set("G1A03",{...b.questions.get("G1A03"),opts:["x","y","z","w"]});
  b.questions.delete("G1A05");b.withdrawn=b.withdrawn.concat(["G1A05"]);
  b.questions.set("G1A99",{stem:"New",opts:["a","b","c","d"],ans:0});
  b.sections={...b.sections,G1:{...b.sections.G1,exam:6}};
  const d=diffPools(a,b);
  assert.ok(d.includes("G1A99: new"));
  assert.ok(d.includes("G1A05: gone (withdrawn)"));
  assert.ok(d.includes("G1A02: stem changed"));
  assert.ok(d.some(x=>/^G1A01: answer changed from [A-D] to [A-D]$/.test(x)));
  assert.equal(d.filter(x=>/^G1A03: option [A-D] changed$/.test(x)).length,4);
  assert.ok(d.includes("G1: now 6 exam questions"));
  assert.deepEqual(diffPools(a,a),[]);
});

test("pool-fetch fails on a file that differs from the snapshot and says how",{skip:docxOf("technician")?false:"the Technician pool file is not in private/ncvec/"},()=>{
  const file=docxOf("technician"),tmp=fs.mkdtempSync(path.join(os.tmpdir(),"pool-test-"));
  /* A byte appended to the zip changes the hash but not the text. */
  const copy=path.join(tmp,path.basename(file));fs.writeFileSync(copy,Buffer.concat([fs.readFileSync(file),Buffer.from([0])]));
  const r=tool("pool-fetch.js","technician","--file",copy);
  assert.equal(r.status,1);
  assert.match(r.stdout,/the official pool has changed/);assert.match(r.stdout,/only the file's bytes differ/);
  fs.rmSync(tmp,{recursive:true,force:true});
});

test("a snapshot round-trips through makeSnapshot and loadPool",()=>{
  const snap=loadPool(snapshotPath("technician"));
  const again=makeSnapshot(snap,snap.source);
  assert.equal(snapshotText(again),fs.readFileSync(snapshotPath("technician"),"utf8").replace(/\r\n/g,"\n"));
});
