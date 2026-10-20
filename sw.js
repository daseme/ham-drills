/* The version lives in version.js; raise it there whenever any file changes, so phones pick up the new copy. */
importScripts("version.js");
const VERSION="hamdrill-v"+APP_VERSION;
const FILES=["./","index.html","version.js","data.js","manifest.webmanifest",
  "icons/icon-192.png","icons/icon-512.png","icons/icon-maskable-512.png",
  "fonts/atkinson-hyperlegible-latin-400-normal.woff2","fonts/atkinson-hyperlegible-latin-700-normal.woff2",
  "fonts/barlow-condensed-latin-500-normal.woff2","fonts/barlow-condensed-latin-600-normal.woff2"];
/* cache:"reload" makes each precache fetch bypass the HTTP cache; otherwise a copy Chrome fetched for the previous
   build within its max-age can be stored under the new cache name and never replaced. */
self.addEventListener("install",e=>{e.waitUntil(caches.open(VERSION).then(c=>c.addAll(FILES.map(f=>new Request(f,{cache:"reload"})))).then(()=>self.skipWaiting()))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==VERSION).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",e=>{
  if(e.request.method!=="GET")return;
  e.respondWith(caches.match(e.request,{ignoreSearch:true}).then(r=>r||fetch(e.request)));
});
