const CACHE = 'solitaire-master-v48';
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
const actionRowReferences = ['/assets/ui/action-row-initial-reference.png', '/assets/ui/action-row-used-reference.png'];
const settingsSourceAssets = ['/assets/ui/settings-switch-on-reference.png', '/assets/ui/settings-switch-off-reference.png', '/assets/ui/settings-draw-mode-1-reference.png'];
const themeGalleryAssets = ['/assets/ui/theme-gallery-header-reference.png', '/assets/ui/theme-gallery-tabs-backgrounds-reference.png', '/assets/ui/theme-gallery-tabs-faces-reference.png', '/assets/ui/theme-gallery-tabs-backs-reference.png'];
const themeFaceGalleryAssets = [1, 2, 3, 4, 5].map((style) => `/assets/ui/theme-face-style-${style}-reference.png`);
const foundationSlots = ['/assets/ui/foundation-empty-1.png', '/assets/ui/foundation-empty-2.png', '/assets/ui/foundation-empty-3.png', '/assets/ui/foundation-empty-4.png'];
const statusBarIcons = ['/assets/ui/menu-source.png', '/assets/ui/stat-crown.png', '/assets/ui/stat-moves.png'];
const sourceTimerFrame = ['/assets/ui/timer-frame-source.png'];
const winResultAssets = ['/assets/ui/win-banner-reference.png', '/assets/ui/win-best-reference.png', '/assets/ui/win-trophy-reference.png', '/assets/ui/win-streak-trophy-reference.png', '/assets/ui/win-new-deal-reference.png'];
const timerGlyphs = [...Array.from({ length: 10 }, (_, index) => `/assets/ui/timer-digit-${index}.png`), '/assets/ui/timer-colon.png'];
const SHELL = ['/', '/index.html', '/src/styles.css', '/src/game.js', '/src/audio.js', '/src/app.js', '/manifest.webmanifest', '/assets/icon.svg', '/assets/themes/mountain-valley.jpg', '/assets/audio/card-move-reference.wav', '/assets/audio/combo-good-reference.wav', '/assets/audio/combo-amazing-reference.wav', '/assets/audio/combo-great-reference.wav', '/assets/audio/foundation-reference.wav', '/assets/audio/win-reference.wav', '/assets/audio/auto-collect-reference.wav', '/assets/feedback/combo-good.webp', '/assets/feedback/combo-great.webp', '/assets/feedback/combo-amazing.webp', '/assets/cards/back-red.svg', '/assets/cards/back-blue.svg', '/assets/cards/back-solitaire-master.svg', '/assets/cards/back-solitaire-master-reference.png', '/assets/cards/back-solitaire-master-source.png', ...referenceCardBacks, ...referenceCourtCards, ...referencePipCards, ...cardFaces, ...actionIcons, ...actionRowReferences, ...settingsSourceAssets, ...themeGalleryAssets, ...themeFaceGalleryAssets, ...foundationSlots, ...statusBarIcons, ...sourceTimerFrame, ...winResultAssets, ...timerGlyphs];

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
