/* tools/data-format.js: one question or one explanation per line, data unchanged, idempotent, a file holds DECKS or EXPLAIN
   and not both, and --check tells a formatted file from an unformatted one. */
"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("fs"),path=require("path"),os=require("os"),vm=require("vm");
const {execFileSync,spawnSync}=require("node:child_process");

const ROOT=path.join(__dirname,"..");
const TOOL=path.join(ROOT,"tools","data-format.js");
/* Values come out of the sandbox through JSON: its objects have other prototypes, which deepEqual rejects. */
const load=src=>{const w={};vm.runInNewContext(src,{window:w});return JSON.parse(JSON.stringify(w))};
const tmp=()=>fs.mkdtempSync(path.join(os.tmpdir(),"datafmt-"));

for(const exam of ["technician","general"])for(const file of ["data.js","explain.js"]){
  test(`${exam}/${file}: formatting keeps every value exactly, and is idempotent`,()=>{
    const src=fs.readFileSync(path.join(ROOT,exam,file),"utf8");
    const dir=tmp(),f=path.join(dir,file);fs.writeFileSync(f,src);
    execFileSync("node",[TOOL,f]);
    const once=fs.readFileSync(f,"utf8");
    assert.deepEqual(load(once),load(src));
    assert.ok(once.endsWith("\n"));
    execFileSync("node",[TOOL,f]);
    assert.equal(fs.readFileSync(f,"utf8"),once);
  });
}

test("data.js holds only DECKS, and explain.js only EXPLAIN",()=>{
  for(const exam of ["technician","general"]){
    assert.deepEqual(Object.keys(load(fs.readFileSync(path.join(ROOT,exam,"data.js"),"utf8"))),["DECKS"],exam);
    assert.deepEqual(Object.keys(load(fs.readFileSync(path.join(ROOT,exam,"explain.js"),"utf8"))),["EXPLAIN"],exam);
  }
});

test("a question sits on a line of its own, under the file's head comment",()=>{
  const DECKS=[{id:"t1",code:"T1",name:"Rules",exam:1,G:{T1A:"A"},Q:[["T1A01","Q?",["a","b","c","d"],0,"note"],["T1A02","Q2?",["a","b","c","d"],1,"note"]],P:{k:["Title","<p>x</p>"]},CON:{T1A01:"k",T1A02:"k"}}];
  const dir=tmp(),f=path.join(dir,"data.js");
  fs.writeFileSync(f,`/* head */\nwindow.DECKS=${JSON.stringify(DECKS)};`);
  execFileSync("node",[TOOL,f]);
  const lines=fs.readFileSync(f,"utf8").split("\n");
  assert.equal(lines[0],"/* head */");
  assert.equal(lines.filter(l=>/^\["T1A0[12]",/.test(l)).length,2);
  assert.deepEqual(load(fs.readFileSync(f,"utf8")),{DECKS});
});

test("an explanation sits on a line of its own, under the file's head comment",()=>{
  const EXPLAIN={T1A01:"one",T1A02:"two\n\nparagraphs"};
  const dir=tmp(),f=path.join(dir,"explain.js");
  fs.writeFileSync(f,`/* head */\nwindow.EXPLAIN=${JSON.stringify(EXPLAIN)};`);
  execFileSync("node",[TOOL,f]);
  const lines=fs.readFileSync(f,"utf8").split("\n");
  assert.equal(lines[0],"/* head */");
  assert.equal(lines[1],"window.EXPLAIN={");
  assert.equal(lines.filter(l=>/^"T1A0[12]":"/.test(l)).length,2);
  assert.deepEqual(load(fs.readFileSync(f,"utf8")),{EXPLAIN});
});

test("a file that sets both, or neither, is refused and left alone",()=>{
  const dir=tmp();
  for(const [name,src] of [["both.js",`window.DECKS=[];window.EXPLAIN={};`],["neither.js",`window.OTHER=1;`]]){
    const f=path.join(dir,name);fs.writeFileSync(f,src);
    const r=spawnSync("node",[TOOL,f],{encoding:"utf8"});
    assert.notEqual(r.status,0,name);
    assert.match(r.stderr,/window\.DECKS \(data\.js\) or window\.EXPLAIN \(explain\.js\)/);
    assert.equal(fs.readFileSync(f,"utf8"),src);
  }
});

test("--check passes a formatted file and fails an unformatted one without touching it",()=>{
  const dir=tmp(),f=path.join(dir,"data.js");
  const raw=`window.DECKS=[{"id":"t1","code":"T1","name":"R","exam":1,"G":{},"Q":[["T1A01","Q?",["a","b","c","d"],0,"n"]]}];`;
  fs.writeFileSync(f,raw);
  assert.equal(spawnSync("node",[TOOL,"--check",f]).status,1);
  assert.equal(fs.readFileSync(f,"utf8"),raw);
  execFileSync("node",[TOOL,f]);
  assert.equal(spawnSync("node",[TOOL,"--check",f]).status,0);
});
