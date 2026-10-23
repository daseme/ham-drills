/* The service worker every exam app shares. The exam's sw.js sets self.EXAM_CACHE and imports version.js and this.
   Caches belong to the whole origin, shared with every other site on daseme.github.io, so each app clears only
   its own older caches. */
const VERSION=self.EXAM_CACHE+APP_VERSION;
const FILES=["./","index.html","exam.js","data.js","manifest.webmanifest","../version.js","../app/app.js","../app/app.css",
  "../icons/icon-192.png","../icons/icon-512.png","../icons/icon-maskable-512.png",
  "../fonts/atkinson-hyperlegible-latin-400-normal.woff2","../fonts/atkinson-hyperlegible-latin-700-normal.woff2",
  "../fonts/barlow-condensed-latin-500-normal.woff2","../fonts/barlow-condensed-latin-600-normal.woff2"];
/* cache:"reload" makes each precache fetch bypass the HTTP cache; otherwise a copy Chrome fetched for the previous
   build within its max-age can be stored under the new cache name and never replaced. */
self.addEventListener("install",e=>{e.waitUntil(caches.open(VERSION).then(c=>c.addAll(FILES.map(f=>new Request(f,{cache:"reload"})))).then(()=>self.skipWaiting()))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith(self.EXAM_CACHE)&&k!==VERSION).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",e=>{
  if(e.request.method!=="GET")return;
  e.respondWith(caches.match(e.request,{ignoreSearch:true}).then(r=>r||fetch(e.request)));
});
