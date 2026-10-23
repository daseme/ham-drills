/* The old address's last service worker. Phones that installed the drills here fetch this as an update. It deletes
   the old app's offline copies (hamdrill-v*, and nothing else on daseme.github.io), takes control of every open
   window at the old address (including one showing a stale copy of the old page from the web cache, which no worker
   controls), sends each straight to the new address keeping ?demo and #screen, then unregisters. Sending windows to
   the old address instead could load that stale copy again. It never touches progress. */
self.addEventListener("install",()=>self.skipWaiting());
self.addEventListener("activate",e=>{e.waitUntil(
  caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith("hamdrill-v")).map(k=>caches.delete(k))))
    .then(()=>self.clients.claim())
    .then(()=>self.clients.matchAll({type:"window"}))
    .then(cs=>Promise.all(cs.map(c=>c.navigate(c.url.replace("/ham-technicians-drills/","/ham-drills/technician/")).catch(()=>{}))))
    .then(()=>self.registration.unregister()))});
