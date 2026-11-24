const CACHE = 'solitaire-master-v30';
const cardRanks = ['ace', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'jack', 'queen', 'king'];
const cardSuits = ['spades', 'hearts', 'diamonds', 'clubs'];
const cardFaces = cardRanks.flatMap((rank) => cardSuits.map((suit) => `/assets/cards/${rank}-of-${suit}.svg`));
const referenceCourtCards = [
  '/assets/cards/queen-of-spades-reference.png',
  '/assets/cards/king-of-diamonds-reference.png',
  '/assets/cards/jack-of-diamonds-reference.png',
  '/assets/cards/queen-of-clubs-reference.png',
  '/assets/cards/queen-of-diamonds-reference.png',
  '/assets/cards/queen-of-hearts-reference.png',
  '/assets/cards/king-of-clubs-reference.png',
  '/assets/cards/king-of-hearts-reference.png',
  '/assets/cards/king-of-spades-reference.png',
  '/assets/cards/jack-of-clubs-reference.png',
  '/assets/cards/jack-of-hearts-reference.png',
  '/assets/cards/jack-of-spades-reference.png',
];
const referencePipCards = [
  '/assets/cards/6-of-hearts-reference.png',
  '/assets/cards/9-of-spades-reference.png',
  '/assets/cards/2-of-diamonds-reference.png',
  '/assets/cards/ace-of-spades-reference.png',
  '/assets/cards/6-of-diamonds-reference.png',
  '/assets/cards/4-of-hearts-reference.png',
  '/assets/cards/ace-of-clubs-reference.png',
  '/assets/cards/5-of-hearts-reference.png',
  '/assets/cards/6-of-spades-reference.png',
  '/assets/cards/7-of-hearts-reference.png',
  '/assets/cards/2-of-spades-reference.png',
  '/assets/cards/8-of-clubs-reference.png',
  '/assets/cards/10-of-hearts-reference.png',
  '/assets/cards/8-of-hearts-reference.png',
  '/assets/cards/9-of-diamonds-reference.png',
  '/assets/cards/9-of-hearts-reference.png',
  '/assets/cards/2-of-hearts-reference.png',
  '/assets/cards/7-of-diamonds-reference.png',
  '/assets/cards/4-of-clubs-reference.png',
  '/assets/cards/5-of-diamonds-reference.png',
  '/assets/cards/ace-of-hearts-reference.png',
  '/assets/cards/7-of-clubs-reference.png',
  '/assets/cards/3-of-diamonds-reference.png',
  '/assets/cards/4-of-spades-reference.png',
  '/assets/cards/8-of-spades-reference.png',
  '/assets/cards/3-of-spades-reference.png',
  '/assets/cards/3-of-hearts-reference.png',
  '/assets/cards/6-of-clubs-reference.png',
  '/assets/cards/2-of-clubs-reference.png',
  '/assets/cards/10-of-clubs-reference.png',
  '/assets/cards/ace-of-diamonds-reference.png',
  '/assets/cards/10-of-diamonds-reference.png',
  '/assets/cards/3-of-clubs-reference.png',
  '/assets/cards/5-of-clubs-reference.png',
  '/assets/cards/8-of-diamonds-reference.png',
  '/assets/cards/10-of-spades-reference.png',
  '/assets/cards/5-of-spades-reference.png',
  '/assets/cards/7-of-spades-reference.png',
  '/assets/cards/4-of-diamonds-reference.png',
  '/assets/cards/9-of-clubs-reference.png',
];
const referenceCardBacks = ['/assets/cards/back-teal-reference.png', '/assets/cards/back-lattice-reference.png', '/assets/cards/back-spade-reference.png', '/assets/cards/back-coral-reference.png', '/assets/cards/back-floral-reference.png', '/assets/cards/back-amber-reference.png'];
const actionIcons = ['/assets/ui/action-play-plus.png', '/assets/ui/action-magic.png', '/assets/ui/action-hint.png', '/assets/ui/action-undo.png'];
const foundationSlots = ['/assets/ui/foundation-empty-1.png', '/assets/ui/foundation-empty-2.png', '/assets/ui/foundation-empty-3.png', '/assets/ui/foundation-empty-4.png'];
const statusBarIcons = ['/assets/ui/menu-source.png', '/assets/ui/stat-crown.png', '/assets/ui/stat-moves.png'];
const sourceTimerFrame = ['/assets/ui/timer-frame-source.png'];
const timerGlyphs = [...Array.from({ length: 10 }, (_, index) => `/assets/ui/timer-digit-${index}.png`), '/assets/ui/timer-colon.png'];
const SHELL = ['/', '/index.html', '/src/styles.css', '/src/game.js', '/src/audio.js', '/src/app.js', '/manifest.webmanifest', '/assets/icon.svg', '/assets/themes/mountain-valley.jpg', '/assets/audio/card-move-reference.wav', '/assets/audio/combo-amazing-reference.wav', '/assets/audio/foundation-reference.wav', '/assets/cards/back-red.svg', '/assets/cards/back-blue.svg', '/assets/cards/back-solitaire-master.svg', ...referenceCardBacks, ...referenceCourtCards, ...referencePipCards, ...cardFaces, ...actionIcons, ...foundationSlots, ...statusBarIcons, ...sourceTimerFrame, ...timerGlyphs];

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
