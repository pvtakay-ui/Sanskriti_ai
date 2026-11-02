// Sanskriti AI Service Worker v1.2
const CACHE_NAME = 'sanskriti-ai-v1.2';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './css/style.css',
  './js/app.js',
  './js/voice.js',
  './js/speech_synthesis.js',
  './js/conversation.js',
  './manifest.json',
  './assets/icons/lotus.svg',
  './assets/images/sanskriti_avatar.jpg',
  './assets/images/sanskriti_er_diagram.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Never cache POST/PUT/DELETE requests or dynamic API endpoints
  if (event.request.method !== 'GET' || event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).catch(() => {
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
