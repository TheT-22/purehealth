// Service worker de Pure Health : l'app fonctionne hors connexion.
// La version change à chaque build, ce qui installe automatiquement la mise à jour.
const CACHE = 'purehealth-a7d77c473522';
const ASSETS = ["./","./app.js","./fonts.css","./fonts/inter-latin-400-normal.woff2","./fonts/inter-latin-500-normal.woff2","./fonts/inter-latin-600-normal.woff2","./fonts/inter-latin-700-normal.woff2","./fonts/space-grotesk-latin-500-normal.woff2","./fonts/space-grotesk-latin-700-normal.woff2","./icons/apple-touch-icon.png","./icons/favicon.svg","./icons/icon-192.png","./icons/icon-512.png","./icons/maskable-512.png","./index.html","./manifest.webmanifest"];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('purehealth-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then((hit) => hit || fetch(req).catch(() => caches.match('./index.html')))
  );
});
