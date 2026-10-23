/* The splash page at /ham-drills/: a plain page of links, with nothing stored and no service worker. */
"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("fs"),path=require("path"),vm=require("vm");

const ROOT=path.join(__dirname,"..");
const page=()=>fs.readFileSync(path.join(ROOT,"index.html"),"utf8");
/* General is linked once it has at least one section to drill. */
function generalLive(){
  const f=path.join(ROOT,"general","data.js");if(!fs.existsSync(f))return false;
  const ctx={window:{}};vm.createContext(ctx);vm.runInContext(fs.readFileSync(f,"utf8"),ctx);
  return (ctx.window.DECKS||[]).some(d=>d.exam>0);
}

test("splash links to the Technician app",()=>{
  assert.match(page(),/href="technician\/"/);
});

test("splash links to General only once General has a section",()=>{
  assert.equal(/href="general\/"/.test(page()),generalLive());
});

test("splash uses no storage and registers no worker",()=>{
  assert.ok(!/localStorage|serviceWorker/.test(page()));
});

test("every file the splash loads exists",()=>{
  for(const m of page().matchAll(/(?:src|href)="([^"#:?]+\.[a-z0-9]+)"/g))assert.ok(fs.existsSync(path.join(ROOT,m[1])),m[1]);
});
