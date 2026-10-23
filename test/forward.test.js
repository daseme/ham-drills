/* The old address, /ham-technicians-drills/: its page forwards to /ham-drills/technician/ keeping ?demo and #screen,
   and its service worker retires the old offline copy without touching progress or the new apps' caches. */
"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("fs"),path=require("path"),vm=require("vm");

const DIR=path.join(__dirname,"..","forward");
const read=f=>fs.readFileSync(path.join(DIR,f),"utf8");

/* Runs the forwarding page's script; returns where it sent the browser and its forwardUrl. */
function page(search,hash){
  const ctx={location:{search,hash,replace:u=>ctx.went=u}};vm.createContext(ctx);
  vm.runInContext(read("index.html").match(/<script>([\s\S]*?)<\/script>/)[1],ctx);
  return ctx;
}

test("the old address forwards to the new one, keeping ?demo and the screen",()=>{
  assert.equal(page("?demo","#t1").went,"/ham-drills/technician/?demo#t1");
  assert.equal(page("","").went,"/ham-drills/technician/");
  assert.equal(page("","#t5/study").went,"/ham-drills/technician/#t5/study");
});

test("the forward never points back at the old address",()=>{
  assert.ok(!page("?demo","#x").went.includes("ham-technicians-drills"));
});

test("without scripts there is still a link to the new address",()=>{
  assert.match(read("index.html"),/href="\/ham-drills\/technician\/"/);
});

test("the old worker deletes only the old app's caches, takes over open windows, sends them to the new address, then unregisters",async()=>{
  const names=new Set(["hamdrill-v23","hamdrill-v1","hamdrills-technician-v30","hamdrills-general-v30","other-v1"]),on={},log=[];
  let claimed=false;
  /* Two open windows: one the old worker controls, and one showing a stale copy of the old page from the web cache,
     which no worker controls until claimed. A worker can only send a window it controls elsewhere. */
  const win=(url,controlled)=>({url,navigate:async u=>{if(!controlled&&!claimed)throw new TypeError("not controlled");log.push("go "+u)}});
  const ctx={Promise,caches:{keys:async()=>[...names],delete:async k=>names.delete(k)},
    self:{addEventListener:(t,f)=>on[t]=f,skipWaiting(){},registration:{unregister:async()=>(log.push("unregister"),true)},
      clients:{claim:async()=>{claimed=true;log.push("claim")},
        matchAll:async()=>[win("https://daseme.github.io/ham-technicians-drills/?demo#t8",true),...(claimed?[win("https://daseme.github.io/ham-technicians-drills/",false)]:[])]}}};
  vm.createContext(ctx);vm.runInContext(read("sw.js"),ctx);
  assert.equal(on.fetch,undefined);
  let p;on.activate({waitUntil:x=>p=x});await p;
  assert.deepEqual([...names].sort(),["hamdrills-general-v30","hamdrills-technician-v30","other-v1"]);
  /* Straight to the new address: reloading the old one could get the stale old page again. */
  assert.deepEqual(log,["claim","go https://daseme.github.io/ham-drills/technician/?demo#t8","go https://daseme.github.io/ham-drills/technician/","unregister"]);
});

test("nothing at the old address touches progress",()=>{
  for(const f of fs.readdirSync(DIR))assert.ok(!read(f).includes("localStorage"),f);
});
