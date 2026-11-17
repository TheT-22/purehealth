// Service worker de Pure Health.
// Avec connexion : on charge toujours la dernière version publiée (réseau d'abord).
// Sans connexion : on utilise la copie enregistrée sur le téléphone.
const CACHE = 'purehealth-8e29c6b5f49e';
const ASSETS = ["./","./app.js","./fonts.css","./fonts/inter-latin-400-normal.woff2","./fonts/inter-latin-500-normal.woff2","./fonts/inter-latin-600-normal.woff2","./fonts/inter-latin-700-normal.woff2","./fonts/space-grotesk-latin-500-normal.woff2","./fonts/space-grotesk-latin-700-normal.woff2","./icons/apple-touch-icon.png","./icons/favicon.svg","./icons/icon-192.png","./icons/icon-512.png","./icons/maskable-512.png","./index.html","./manifest.webmanifest"];
const TIMEOUT = 4000; // au-delà, on bascule sur la copie locale pour ne pas faire attendre

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(ASSETS.map((u) => new Request(u, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('purehealth-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function fromNetwork(req) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), TIMEOUT);
    fetch(req, { cache: 'no-cache' }).then((res) => {
      clearTimeout(timer);
      if (!res || !res.ok) { reject(new Error('http')); return; }
      const copy = res.clone();
      caches.open(CACHE).then((cache) => cache.put(req, copy)).catch(() => {});
      resolve(res);
    }, (err) => { clearTimeout(timer); reject(err); });
  });
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  event.respondWith(
    fromNetwork(req).catch(() =>
      caches.match(req, { ignoreSearch: true }).then((hit) => hit || caches.match('./index.html'))
    )
  );
});
