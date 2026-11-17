// Service worker de Pure Health.
// L'app s'ouvre avec la version enregistrée sur le téléphone (elle marche donc hors connexion).
// Une nouvelle version se télécharge en arrière-plan puis attend : l'utilisateur choisit
// quand l'installer (fenêtre « Nouvelle version disponible »).
const CACHE = 'purehealth-a46428e45142';
const ASSETS = ["./","./app.js","./fonts.css","./fonts/inter-latin-400-normal.woff2","./fonts/inter-latin-500-normal.woff2","./fonts/inter-latin-600-normal.woff2","./fonts/inter-latin-700-normal.woff2","./fonts/space-grotesk-latin-500-normal.woff2","./fonts/space-grotesk-latin-700-normal.woff2","./icons/apple-touch-icon.png","./icons/favicon.svg","./icons/icon-192.png","./icons/icon-512.png","./icons/maskable-512.png","./index.html","./manifest.webmanifest"];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS.map((u) => new Request(u, { cache: 'reload' }))))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('purehealth-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// L'utilisateur a accepté la mise à jour
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  event.respondWith(
    caches.open(CACHE)
      .then((cache) => cache.match(req, { ignoreSearch: true }))
      .then((hit) => hit || fetch(req).catch(() => caches.match('./index.html')))
  );
});
