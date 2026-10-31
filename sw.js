// Service worker de hucha: la web funciona sin conexión con los últimos datos descargados.
// - Páginas, estilos, scripts y datos: primero la red (así nunca se mezclan versiones);
//   si no hay conexión, lo último guardado.
// - Fuente e imágenes, que casi nunca cambian: lo guardado, y se actualiza en segundo plano.

const VERSION = 'hucha-v2';
const BASICOS = [
  './',
  'a-donde-va/',
  'quien-gasta/',
  'fuentes/',
  'assets/css/estilos.css',
  'assets/js/comun.js',
  'assets/js/datos.js',
  'assets/js/jsonstat.js',
  'assets/js/cofog.js',
  'assets/js/impuestos.js',
  'assets/js/formato.js',
  'assets/js/portada.js',
  'assets/js/a-donde-va.js',
  'assets/js/quien-gasta.js',
  'assets/js/fuentes.js',
  'assets/img/favicon.svg',
  'data/cofog.json',
  'manifest.webmanifest',
  '404.html',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(VERSION).then((c) => Promise.all(BASICOS.map((u) => c.add(u).catch(() => {})))).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((claves) => Promise.all(claves.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

async function primeroRed(req) {
  const cache = await caches.open(VERSION);
  try {
    const r = await fetch(req);
    if (r.ok) cache.put(req, r.clone());
    return r;
  } catch {
    return (await cache.match(req, { ignoreSearch: true })) ?? Response.error();
  }
}

async function primeroCache(req, evento) {
  const cache = await caches.open(VERSION);
  const guardada = await cache.match(req);
  const nueva = fetch(req)
    .then((r) => { if (r.ok) cache.put(req, r.clone()); return r; })
    .catch(() => guardada);
  if (guardada) { evento.waitUntil(nueva); return guardada; }
  return nueva;
}

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return; // visitas: siempre a la red
  const estable = url.pathname.includes('/vendor/') || url.pathname.includes('/assets/img/');
  e.respondWith(estable ? primeroCache(e.request, e) : primeroRed(e.request));
});
