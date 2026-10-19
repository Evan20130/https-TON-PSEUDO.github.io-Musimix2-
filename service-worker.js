const CACHE_NAME = 'musimix-shell-v3';
const APP_SHELL = [
  './', './index.html', './manifest.json', './assets/logo.png',
  './assets/icons/app-192.png', './assets/icons/app-512.png', './assets/icons/app-maskable-512.png',
  './css/style.css', './css/player.css', './css/rgb.css', './css/mobile.css',
  './js/app.js', './js/player.js', './js/search.js', './js/indexeddb.js',
  './js/favorites.js', './js/playlist.js', './js/offline.js', './js/ai.js', './js/settings.js',
  './api/spotify.js', './api/deezer.js', './api/jamendo.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(
    keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
  )));
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)));
});