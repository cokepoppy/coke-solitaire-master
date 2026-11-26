const CACHE = 'solitaire-master-v86';
const CACHE_PREFIX = 'solitaire-master-v';
const PRECACHE_BATCH_SIZE = 8;
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
const alternateFaceSamples = [3, 4, 5].flatMap((style) => ['10-of-diamonds', 'jack-of-clubs', 'queen-of-hearts', 'king-of-spades', 'ace-of-diamonds'].map((card) => `/assets/cards/face-style-${style}-${card}-reference.png`));
const referenceCardBacks = ['/assets/cards/back-blue-reference.png', '/assets/cards/back-teal-reference.png', '/assets/cards/back-lattice-reference.png', '/assets/cards/back-spade-reference.png', '/assets/cards/back-coral-reference.png', '/assets/cards/back-floral-reference.png', '/assets/cards/back-amber-reference.png'];
const actionIcons = ['/assets/ui/action-play-plus.png', '/assets/ui/action-magic.png', '/assets/ui/action-hint.png', '/assets/ui/action-undo.png'];
const actionRowReferences = ['/assets/ui/action-row-initial-reference.png', '/assets/ui/action-row-used-reference.png'];
const settingsSourceAssets = ['/assets/ui/settings-switch-on-reference.png', '/assets/ui/settings-switch-off-reference.png', '/assets/ui/settings-draw-mode-1-reference.png'];
const themeGalleryAssets = ['/assets/ui/theme-gallery-header-reference.png', '/assets/ui/theme-gallery-tabs-backgrounds-reference.png', '/assets/ui/theme-gallery-tabs-faces-reference.png', '/assets/ui/theme-gallery-tabs-backs-reference.png'];
const themeBackgroundGalleryAssets = ['lagoon', 'emerald', 'mountain', 'felt', 'midnight', 'plum', 'forest', 'violet', 'green-9', 'green-10', 'green-11'].map((theme) => `/assets/themes/theme-background-${theme}-reference.png`);
const themeFaceGalleryAssets = [1, 2, 3, 4, 5].map((style) => `/assets/ui/theme-face-style-${style}-reference.png`);
const foundationSlots = ['/assets/ui/foundation-empty-1.png', '/assets/ui/foundation-empty-2.png', '/assets/ui/foundation-empty-3.png', '/assets/ui/foundation-empty-4.png'];
const statusBarIcons = ['/assets/ui/menu-source.png', '/assets/ui/stat-crown.png', '/assets/ui/stat-moves.png'];
const sourceTimerFrame = ['/assets/ui/timer-frame-source.png'];
const tutorialTipAssets = ['/assets/ui/tutorial-tip-reference.png'];
const winResultAssets = ['/assets/ui/win-result-crown-intro-reference.png', '/assets/ui/win-result-title-intro-reference.png', '/assets/ui/win-banner-reference.png', '/assets/ui/win-result-background-reference.png', '/assets/ui/win-result-score-digit-5-reference.png', '/assets/ui/win-result-score-digit-2-a-reference.png', '/assets/ui/win-result-score-digit-2-b-reference.png', '/assets/ui/win-result-score-digit-3-reference.png', '/assets/ui/win-best-reference.png', '/assets/ui/win-trophy-reference.png', '/assets/ui/win-streak-trophy-reference.png', '/assets/ui/win-streak-title-reference.png', '/assets/ui/win-streak-thumb-reference.png', '/assets/ui/win-new-deal-reference.png', '/assets/ui/win-result-score-label-reference.png', '/assets/ui/win-result-percent-reference.png', '/assets/ui/win-result-time-label-reference.png', '/assets/ui/win-result-moves-label-reference.png'];
const timerGlyphs = [...Array.from({ length: 10 }, (_, index) => `/assets/ui/timer-digit-${index}.png`), '/assets/ui/timer-colon.png'];
const dailyCalendarAssets = ['daily-reward-crown-reference.png', 'daily-reward-bronze-reference.png', 'daily-reward-silver-reference.png', 'daily-reward-gold-reference.png', 'daily-calendar-completed-crown-reference.png', 'daily-calendar-play-reference.png', 'daily-calendar-rewards-button-reference.png'].map((name) => `/assets/ui/${name}`);
const SHELL = ['/', '/index.html', '/src/styles.css', '/src/game.js', '/src/audio.js', '/src/app.js', '/manifest.webmanifest', '/assets/icon.svg', '/assets/themes/mountain-valley-reference-guided.jpg', '/assets/audio/card-move-reference.wav', '/assets/audio/combo-good-reference.wav', '/assets/audio/combo-amazing-reference.wav', '/assets/audio/combo-great-reference.wav', '/assets/audio/foundation-reference.wav', '/assets/audio/win-reference.wav', '/assets/audio/auto-collect-reference.wav', '/assets/audio/stock-recycle-reference.wav', '/assets/audio/draw-after-recycle-reference.wav', '/assets/audio/ui-tap-reference.wav', '/assets/audio/theme-gallery-select-reference.wav', '/assets/feedback/combo-good.webp', '/assets/feedback/combo-great.webp', '/assets/feedback/combo-amazing.webp', '/assets/cards/back-red.svg', '/assets/cards/back-solitaire-master.svg', '/assets/cards/back-solitaire-master-reference.png', '/assets/cards/back-solitaire-master-source.png', '/assets/cards/back-solitaire-master-source-20s.png', ...referenceCardBacks, ...referenceCourtCards, ...referencePipCards, ...alternateFaceSamples, ...cardFaces, ...actionIcons, ...actionRowReferences, ...settingsSourceAssets, ...themeGalleryAssets, ...themeBackgroundGalleryAssets, ...themeFaceGalleryAssets, ...foundationSlots, ...statusBarIcons, ...sourceTimerFrame, ...tutorialTipAssets, ...winResultAssets, ...timerGlyphs, ...dailyCalendarAssets];
const CORE_SHELL = new Set(['/', '/index.html',
  '/src/styles.css', '/src/game.js', '/src/audio.js', '/src/app.js', '/manifest.webmanifest', '/assets/icon.svg',
  '/assets/themes/mountain-valley-reference-guided.jpg',
  '/assets/audio/card-move-reference.wav', '/assets/audio/combo-good-reference.wav', '/assets/audio/combo-amazing-reference.wav',
  '/assets/audio/combo-great-reference.wav', '/assets/audio/foundation-reference.wav', '/assets/audio/win-reference.wav',
  '/assets/audio/auto-collect-reference.wav', '/assets/audio/stock-recycle-reference.wav', '/assets/audio/draw-after-recycle-reference.wav',
  '/assets/audio/ui-tap-reference.wav', '/assets/audio/theme-gallery-select-reference.wav',
]);
const OPTIONAL_SHELL = SHELL.filter((url) => !CORE_SHELL.has(url));
let optionalPrecachePromise;

async function cacheInBatches(cache, urls) {
  for (let offset = 0; offset < urls.length; offset += PRECACHE_BATCH_SIZE) {
    const batch = urls.slice(offset, offset + PRECACHE_BATCH_SIZE);
    const present = await Promise.all(batch.map((url) => cache.match(url)));
    const missing = batch.filter((_, index) => !present[index]);
    if (missing.length) await cache.addAll(missing);
  }
}

function precacheOptionalShell() {
  if (!optionalPrecachePromise) {
    optionalPrecachePromise = caches.open(CACHE)
      .then((cache) => cacheInBatches(cache, OPTIONAL_SHELL))
      .catch((error) => {
        optionalPrecachePromise = null;
        throw error;
      });
  }
  return optionalPrecachePromise;
}

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cacheInBatches(cache, [...CORE_SHELL])));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE).map((key) => caches.delete(key)))));
  self.clients.claim();
});

self.addEventListener('message', (event) => {
  if (event.data?.type !== 'PRECACHE_OPTIONAL_SHELL') return;
  const completion = precacheOptionalShell().then(() => event.ports[0]?.postMessage({ complete: true }));
  event.waitUntil(completion);
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(caches.open(CACHE).then((cache) => cache.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
    if (response.ok && new URL(event.request.url).origin === self.location.origin) {
      const copy = response.clone();
      cache.put(event.request, copy);
    }
    return response;
  }).catch(() => cache.match('/index.html')))));
});
