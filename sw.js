const CACHE="jtp-v2-shell";
const CDN_CACHE="jtp-v2-cdn";
const FILES=["./","./index.html","./app.js","./firebase-config.js","./manifest.json","./icon.svg"];
self.addEventListener("install",e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES))));
self.addEventListener("activate",e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>![CACHE,CDN_CACHE].includes(k)).map(k=>caches.delete(k))))));
self.addEventListener("fetch",e=>{
 const u=new URL(e.request.url);
 if(e.request.method!=="GET")return;
 if(u.origin===location.origin){
  e.respondWith(caches.match(e.request).then(c=>c||fetch(e.request).then(r=>{if(r.ok)caches.open(CACHE).then(x=>x.put(e.request,r.clone()));return r})));
  return;
 }
 // Cache Firebase SDK and Leaflet library after first successful online load.
 // Map tiles are intentionally NOT cached or prefetched.
 if(u.hostname==="www.gstatic.com"||u.hostname==="unpkg.com"){
  e.respondWith(caches.open(CDN_CACHE).then(async c=>{
   const cached=await c.match(e.request);
   if(cached)return cached;
   const response=await fetch(e.request);
   if(response.ok)c.put(e.request,response.clone());
   return response;
  }));
 }
});