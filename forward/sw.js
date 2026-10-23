/* The old address's service worker. Phones that installed the drills here fetch this as an update. It deletes the
   old app's offline copies (hamdrill-v*, and nothing else on daseme.github.io), takes control of every open window
   at the old address (including one showing a stale copy of the old page from the web cache, which no worker
   controls) and sends each straight to the new address, keeping ?demo and #screen. Sending windows to the old
   address instead could load that stale copy again.
   It stays installed and answers page loads at the old address itself with a tiny forwarding page, so an old
   home-screen icon still opens with no signal: the new app is already stored on the phone. It never touches
   progress. */
const PAGE=`<!DOCTYPE html><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Technician drills</title><script>location.replace("/ham-drills/technician/"+location.search+location.hash)</script>`;
self.addEventListener("install",()=>self.skipWaiting());
self.addEventListener("activate",e=>{e.waitUntil(
  caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith("hamdrill-v")).map(k=>caches.delete(k))))
    .then(()=>self.clients.claim())
    .then(()=>self.clients.matchAll({type:"window"}))
    .then(cs=>Promise.all(cs.map(c=>c.navigate(c.url.replace("/ham-technicians-drills/","/ham-drills/technician/")).catch(()=>{})))))});
self.addEventListener("fetch",e=>{
  if(e.request.mode!=="navigate")return;
  e.respondWith(Promise.resolve(new Response(PAGE,{headers:{"Content-Type":"text/html; charset=utf-8"}})));
});
