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

/* The resources page: a second plain page of outward links, reached from the splash and leading back to it. */
const resources=()=>fs.readFileSync(path.join(ROOT,"resources.html"),"utf8");

test("splash links to the resources page",()=>{
  assert.match(page(),/href="resources\.html"/);
});

test("resources page links back to the splash and uses no storage or worker",()=>{
  assert.match(resources(),/class="back" href="\.\/"/);
  assert.ok(!/localStorage|serviceWorker|<script/.test(resources()));
});

test("every outward link on the resources page is https and opens safely in a new tab",()=>{
  const links=[...resources().matchAll(/<a ([^>]*href="https?:[^"]*"[^>]*)>/g)].map(m=>m[1]);
  assert.ok(links.length>=8);
  for(const a of links){assert.match(a,/href="https:/,a);assert.match(a,/target="_blank"/,a);assert.match(a,/rel="noopener"/,a)}
});

test("every file the resources page loads exists",()=>{
  for(const m of resources().matchAll(/(?:src|href)="([^"#:?]+\.[a-z0-9]+)"/g))assert.ok(fs.existsSync(path.join(ROOT,m[1])),m[1]);
});

/* The about page: one paragraph, in the same style, back to the splash. */
test("splash links to the about page, which links back and loads only files that exist",()=>{
  assert.match(page(),/href="about\.html"/);
  const about=fs.readFileSync(path.join(ROOT,"about.html"),"utf8");
  assert.match(about,/class="back" href="\.\/"/);
  assert.match(about,/KO6PRL/);
  assert.ok(!/localStorage|serviceWorker|<script/.test(about));
  for(const m of about.matchAll(/(?:src|href)="([^"#:?]+\.[a-z0-9]+)"/g))assert.ok(fs.existsSync(path.join(ROOT,m[1])),m[1]);
  for(const a of [...about.matchAll(/<a ([^>]*href="https?:[^"]*"[^>]*)>/g)].map(m=>m[1])){assert.match(a,/href="https:/,a);assert.match(a,/rel="noopener"/,a)}
});
