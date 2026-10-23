/* After the move to one folder per exam: every relative path resolves, and each exam's service worker keeps to
   its own caches, away from the old address's hamdrill-v* caches. */
"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("fs"),path=require("path"),vm=require("vm");

const ROOT=path.join(__dirname,"..");
const EXAMS=["technician","general"].filter(e=>fs.existsSync(path.join(ROOT,e,"sw.js")));

/* Top-level consts become readable globals, so the test can see the worker's file list and version. */
const globals=src=>src.replace(/\bconst (APP_VERSION|FILES|VERSION)\b/g,"var $1");

/* Runs an exam folder's sw.js with stub caches; returns its precache list, cache prefix and handlers. */
function worker(exam,cacheNames=[]){
  const dir=path.join(ROOT,exam),names=new Set(cacheNames),on={};
  const ctx={Promise,Request:class{constructor(u){this.url=u}},
    self:{addEventListener:(t,f)=>on[t]=f,skipWaiting(){},clients:{claim:async()=>{}}},
    caches:{keys:async()=>[...names],delete:async k=>names.delete(k),open:async k=>(names.add(k),{addAll:async()=>{}}),match:async()=>null},
    importScripts:(...fs_)=>fs_.forEach(f=>vm.runInContext(globals(fs.readFileSync(path.join(dir,f),"utf8")),ctx))};
  ctx.self.caches=ctx.caches;vm.createContext(ctx);
  vm.runInContext(globals(fs.readFileSync(path.join(dir,"sw.js"),"utf8")),ctx);
  return {dir,files:ctx.FILES,prefix:ctx.self.EXAM_CACHE,names,on,version:ctx.APP_VERSION};
}

test("there is a Technician app folder",()=>{
  assert.ok(EXAMS.includes("technician"));
});

test("every precached file exists",()=>{
  for(const e of EXAMS){const w=worker(e);
    assert.ok(w.files.length>5,e);
    for(const f of w.files)assert.ok(fs.existsSync(path.join(w.dir,f==="./"?"index.html":f)),`${e}: ${f}`)}
});

test("every url() in app.css resolves from app/",()=>{
  const css=fs.readFileSync(path.join(ROOT,"app","app.css"),"utf8"),urls=[...css.matchAll(/url\(([^)]+)\)/g)].map(m=>m[1].replace(/["']/g,""));
  assert.ok(urls.length>=4);
  for(const u of urls)assert.ok(fs.existsSync(path.join(ROOT,"app",u)),u);
});

test("every manifest icon resolves from its folder",()=>{
  for(const e of EXAMS){const m=JSON.parse(fs.readFileSync(path.join(ROOT,e,"manifest.webmanifest"),"utf8"));
    for(const i of m.icons)assert.ok(fs.existsSync(path.join(ROOT,e,i.src)),`${e}: ${i.src}`)}
});

test("every script and stylesheet an exam page loads exists",()=>{
  for(const e of EXAMS){const html=fs.readFileSync(path.join(ROOT,e,"index.html"),"utf8");
    for(const m of html.matchAll(/(?:src|href)="([^"#:]+)"/g))assert.ok(fs.existsSync(path.join(ROOT,e,m[1])),`${e}: ${m[1]}`)}
});

test("no cache prefix collides with the old address, and each matches its exam settings",()=>{
  for(const e of EXAMS){const w=worker(e);
    assert.ok(!w.prefix.startsWith("hamdrill-v"),w.prefix);
    const cfg=fs.readFileSync(path.join(ROOT,e,"exam.js"),"utf8");
    assert.ok(cfg.includes(`cachePrefix:"${w.prefix}"`),`${e}: exam.js cachePrefix differs from sw.js`)}
});

test("activation clears only this exam's older caches",async()=>{
  const w=worker("technician"),v=w.version,mine=w.prefix+v;
  const others=["hamdrill-v23","hamdrills-general-v"+v,"other-v1"],old=w.prefix+(v-1);
  const w2=worker("technician",[...others,old,mine]);
  let p;w2.on.activate({waitUntil:x=>p=x});await p;
  assert.deepEqual([...w2.names].sort(),[...others,mine].sort());
});
