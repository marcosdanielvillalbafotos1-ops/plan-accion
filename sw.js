// Service worker: guarda la app en el celular para que abra sin señal.
// Red primero (así llegan las actualizaciones); si no hay señal o tarda más de 4 s, usa la copia guardada.
const CACHE='plan-accion-v6';
const APP=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png','./icon-maskable-512.png'];

self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE)
    .then(c=>c.addAll(APP.map(u=>new Request(u,{cache:'reload'}))))
    .then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys()
    .then(ks=>Promise.all(ks.filter(k=>k.startsWith('plan-accion-')&&k!==CACHE).map(k=>caches.delete(k))))
    .then(()=>self.clients.claim()));
});
function conLimite(p,ms){
  return new Promise((res,rej)=>{
    const t=setTimeout(()=>rej(new Error('timeout')),ms);
    p.then(r=>{clearTimeout(t);res(r);},e=>{clearTimeout(t);rej(e);});
  });
}
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  // Mapa satelital, tipografías, etc.: van directo a internet
  if(e.request.method!=='GET'||u.origin!==location.origin)return;
  e.respondWith(
    // no-cache: siempre pregunta al servidor si hay algo nuevo (no se queda con la copia del navegador)
    conLimite(fetch(u.href,{cache:'no-cache'}),4000)
      .then(r=>{
        if(r.ok){const copia=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copia));}
        return r;
      })
      .catch(()=>caches.match(e.request,{ignoreSearch:true}).then(r=>r||caches.match('./index.html')))
  );
});
