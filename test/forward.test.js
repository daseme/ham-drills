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

test("the old worker deletes only the old app's caches, takes over open windows and sends them to the new address",async()=>{
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
  let p;on.activate({waitUntil:x=>p=x});await p;
  assert.deepEqual([...names].sort(),["hamdrills-general-v30","hamdrills-technician-v30","other-v1"]);
  /* Straight to the new address: reloading the old one could get the stale old page again. */
  /* It stays registered, so the old home-screen icon keeps working offline (see the next test). */
  assert.deepEqual(log,["claim","go https://daseme.github.io/ham-drills/technician/?demo#t8","go https://daseme.github.io/ham-drills/technician/"]);
});

/* Runs the old worker and hands it one fetch event; returns what it responded with, or undefined if it left the request alone. */
async function oldWorkerFetch(request){
  const on={};
  const ctx={Promise,Response:class{constructor(body,init){this.body=body;this.headers=init&&init.headers}},
    caches:{keys:async()=>[],delete:async()=>true},
    self:{addEventListener:(t,f)=>on[t]=f,skipWaiting(){},registration:{unregister:async()=>true},clients:{claim:async()=>{},matchAll:async()=>[]}}};
  vm.createContext(ctx);vm.runInContext(read("sw.js"),ctx);
  let res;on.fetch({request,respondWith:r=>res=r});
  return res&&await res;
}

test("offline, the old icon still opens: the old worker answers its own page with a forward, keeping ?demo and the screen",async()=>{
  const r=await oldWorkerFetch({mode:"navigate",url:"https://daseme.github.io/ham-technicians-drills/?demo#t8"});
  assert.ok(r,"a navigation must get an answer from the worker, with no network");
  assert.match(r.body,/location\.replace\("\/ham-drills\/technician\/"\+location\.search\+location\.hash\)/);
  assert.match(r.headers["Content-Type"],/text\/html/);
});

test("the old worker leaves everything but page loads alone",async()=>{
  assert.equal(await oldWorkerFetch({mode:"no-cors",url:"https://daseme.github.io/ham-technicians-drills/icons/icon-192.png"}),undefined);
});

test("nothing at the old address touches progress",()=>{
  for(const f of fs.readdirSync(DIR))assert.ok(!read(f).includes("localStorage"),f);
});

test("the forwarding page installs the old address's worker before moving on, so the icon works offline next time",async()=>{
  const calls=[];let done;const ok=new Promise(r=>done=r);
  const ctx={setTimeout:()=>0,navigator:{serviceWorker:{register:u=>(calls.push("register "+u),Promise.resolve())}},
    location:{search:"?demo",hash:"#t8",replace:u=>{calls.push("go "+u);done()}}};
  vm.createContext(ctx);vm.runInContext(read("index.html").match(/<script>([\s\S]*?)<\/script>/)[1],ctx);
  await ok;
  assert.deepEqual(calls,["register sw.js","go /ham-drills/technician/?demo#t8"]);
});
