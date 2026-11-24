const CACHE = 'solitaire-master-v5';
const cardRanks = ['ace', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'jack', 'queen', 'king'];
const cardSuits = ['spades', 'hearts', 'diamonds', 'clubs'];
const cardFaces = cardRanks.flatMap((rank) => cardSuits.map((suit) => `/assets/cards/${rank}-of-${suit}.svg`));
const SHELL = ['/', '/index.html', '/src/styles.css', '/src/game.js', '/src/audio.js', '/src/app.js', '/manifest.webmanifest', '/assets/icon.svg', '/assets/themes/mountain-valley.jpg', '/assets/cards/back-red.svg', '/assets/cards/back-blue.svg', '/assets/cards/back-solitaire-master.svg', ...cardFaces];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))));
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
    if (response.ok && new URL(event.request.url).origin === self.location.origin) {
      const copy = response.clone();
      caches.open(CACHE).then((cache) => cache.put(event.request, copy));
    }
    return response;
  }).catch(() => caches.match('/index.html'))));
});
