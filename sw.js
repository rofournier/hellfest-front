const CACHE_VERSION = 'v1';
const CACHE_NAME = `hellfest-${CACHE_VERSION}`;
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './index.css',
  './index.js',
  './apero.html',
  './apero.css',
  './apero.js',
  './tabs.js',
  './modal.js',
  './modal.css',
  './yt.png',
  './sptf.png',
  './favicon.ico',
  './icons/icon-192x192.png',
  './icons/icon-512x512.png',
  'https://fonts.googleapis.com/css2?family=Metal+Mania&display=swap',
  'https://cdn.jsdelivr.net/npm/lodash@4.17.21/lodash.min.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
  // Force le service worker à s'activer immédiatement
  self.skipWaiting();
});

// Activation - prend le contrôle immédiatement
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      // Prend le contrôle immédiatement
      clients.claim(),
      
      // Nettoie les anciens caches si nécessaire
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => cacheName.startsWith('hellfest-'))
            .filter(cacheName => cacheName !== CACHE_NAME)
            .map(cacheName => caches.delete(cacheName))
        );
      })
    ])
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          // Si on trouve dans le cache, on retourne directement
          return response;
        }

        // Sinon on essaie de faire la requête réseau
        return fetch(event.request)
          .then(response => {
            // On ne met en cache que les requêtes réussies et non-API
            if (!response || response.status !== 200 || response.type !== 'basic' || event.request.url.includes('/api/')) {
              return response;
            }

            // On clone la réponse car elle ne peut être utilisée qu'une fois
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // Si la requête échoue et que c'est une API, on retourne une erreur
            if (event.request.url.includes('/api/')) {
              return new Response(JSON.stringify({ error: 'Vous êtes hors ligne' }), {
                headers: { 'Content-Type': 'application/json' }
              });
            }
            
            // Pour les autres ressources, on vérifie une dernière fois le cache
            // Cela peut arriver si la ressource a été mise en cache après le premier check
            return caches.match(event.request);
          });
      })
  );
}); 