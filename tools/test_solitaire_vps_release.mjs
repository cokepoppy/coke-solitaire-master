import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createReadStream, existsSync, mkdtempSync, rmSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { once } from 'node:events';
import os from 'node:os';
import path from 'node:path';
import { chromium } from '@playwright/test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const work = mkdtempSync(path.join(os.tmpdir(), 'solitaire-vps-release-'));
const release = path.join(work, 'solitaire');
const mime = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.wav': 'audio/x-wav',
};

let server;
let browser;
try {
  execFileSync(process.execPath, [path.join(root, 'tools/build_solitaire_vps_release.mjs'), release], { stdio: 'inherit' });
  server = createServer((request, response) => {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    if (pathname === '/solitaire') {
      response.writeHead(301, { location: '/solitaire/' }).end();
      return;
    }
    if (!pathname.startsWith('/solitaire/')) {
      response.writeHead(404).end('Not found');
      return;
    }

    const relative = pathname.slice('/solitaire/'.length) || 'index.html';
    const file = path.resolve(release, relative);
    if (!file.startsWith(`${release}${path.sep}`) || !existsSync(file) || !statSync(file).isFile()) {
      response.writeHead(404).end('Not found');
      return;
    }

    response.writeHead(200, {
      'content-type': mime[path.extname(file)] ?? 'application/octet-stream',
      'cache-control': 'no-store',
    });
    createReadStream(file).pipe(response);
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const { port } = server.address();

  browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const badResponses = [];
  const pageErrors = [];
  const unscopedRequests = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('response', (response) => {
    const pathname = new URL(response.url()).pathname;
    if (pathname.startsWith('/solitaire/') && response.status() >= 400) badResponses.push(`${response.status()} ${pathname}`);
  });
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.origin === `http://127.0.0.1:${port}` && /^\/(?:assets|src|sw\.js|manifest\.webmanifest)(?:\/|$)/.test(url.pathname)) {
      unscopedRequests.push(url.pathname);
    }
  });
  await page.addInitScript(async () => {
    const otherGame = await caches.open('another-game-cache');
    await otherGame.put(new Request(`${location.origin}/another-game-shell`), new Response('keep'));
    const existingRootApp = await caches.open('solitaire-master-v50');
    await existingRootApp.put(new Request(`${location.origin}/existing-root-game-shell`), new Response('keep'));
  });

  await page.goto(`http://127.0.0.1:${port}/solitaire/`, { waitUntil: 'domcontentloaded' });
  assert.equal(await page.title(), 'Solitaire Master');
  await page.waitForFunction(() => document.querySelectorAll('#tableau .card-face').length === 7);
  assert.match(await page.locator('.stock-slot .card-back-art').getAttribute('src'), /^\/solitaire\/assets\//);
  await page.locator('[data-action="stock"]').click();
  await page.waitForFunction(() => document.querySelector('.stock-count')?.textContent?.trim() === '23');

  await page.getByRole('button', { name: 'Game menu' }).click();
  await page.getByRole('button', { name: 'Settings and themes' }).click();
  await page.getByRole('button', { name: 'Themes' }).click();
  await page.getByRole('button', { name: 'Mountain background' }).click();
  await page.waitForFunction(() => document.body.dataset.theme === 'mountain');
  await page.locator('#modal-content').evaluate((content) => { content.scrollTop = content.scrollHeight; });
  await page.getByRole('button', { name: 'Green 11 background' }).click();
  await page.waitForFunction(() => document.body.dataset.theme === 'green-11');
  assert.equal(await page.locator('[data-value="green-11"] img').getAttribute('src'), '/solitaire/assets/themes/theme-background-green-11-reference.png');
  await page.waitForFunction(() => {
    const image = document.querySelector('[data-value="green-11"] img');
    return image?.complete && image.naturalWidth === 298 && image.naturalHeight === 298;
  });
  await page.getByRole('button', { name: 'Card faces' }).click();
  await page.evaluate(() => {
    window.solitaireGame.state.tableau = [[{ id: 'subpath-sample-10d', rank: 10, suit: '♦', faceUp: true }], [], [], [], [], [], []];
  });
  await page.locator('.face-tile[data-value="style-3"]').click();
  assert.equal(await page.locator('body').getAttribute('data-card-face-style'), 'style-3');
  assert.equal(await page.locator('#tableau .card-face-art').first().getAttribute('src'), '/solitaire/assets/cards/face-style-3-10-of-diamonds-reference.png');
  await page.waitForFunction(() => {
    const image = document.querySelector('#tableau .card-face-art');
    return image?.complete && image.naturalWidth === 118 && image.naturalHeight === 177;
  });
  await page.getByRole('button', { name: 'Card backs' }).click();
  await page.getByRole('button', { name: 'Teal diamonds' }).click();
  assert.equal(await page.locator('.stock-slot .card-back-art').getAttribute('src'), '/solitaire/assets/cards/back-teal-reference.png');
  await page.waitForFunction(() => {
    const image = document.querySelector('.stock-slot .card-back-art');
    return image?.complete && image.naturalWidth === 118 && image.naturalHeight === 177;
  });

  const worker = await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.ready;
    const cachesAfterInstall = await caches.keys();
    const shell = await caches.open('solitaire-master-solitaire-v75');
    const shellPage = await shell.match(`${location.origin}/solitaire/index.html`);
    const recycleSample = await shell.match(`${location.origin}/solitaire/assets/audio/stock-recycle-reference.wav`);
    const recycledDrawSample = await shell.match(`${location.origin}/solitaire/assets/audio/draw-after-recycle-reference.wav`);
    const themeGalleryOpenSample = await shell.match(`${location.origin}/solitaire/assets/audio/theme-gallery-open-reference.wav`);
    const themeGallerySelectSample = await shell.match(`${location.origin}/solitaire/assets/audio/theme-gallery-select-reference.wav`);
    const winBackground = await shell.match(`${location.origin}/solitaire/assets/ui/win-result-background-reference.png`);
    const winScoreDigit = await shell.match(`${location.origin}/solitaire/assets/ui/win-result-score-digit-2-a-reference.png`);
    const sourceStockBack = await shell.match(`${location.origin}/solitaire/assets/cards/back-solitaire-master-source-20s.png`);
    const protectedCache = await caches.open('another-game-cache');
    const protectedEntry = await protectedCache.match(`${location.origin}/another-game-shell`);
    const existingRootCache = await caches.open('solitaire-master-v50');
    const existingRootEntry = await existingRootCache.match(`${location.origin}/existing-root-game-shell`);
    return {
      scope: registration.scope,
      script: registration.active?.scriptURL,
      cachesAfterInstall,
      shellPageCached: Boolean(shellPage),
      recycleSamplesCached: Boolean(recycleSample) && Boolean(recycledDrawSample),
      themeGallerySamplesCached: Boolean(themeGalleryOpenSample) && Boolean(themeGallerySelectSample),
      winBackgroundCached: Boolean(winBackground),
      winScoreDigitCached: Boolean(winScoreDigit),
      sourceStockBackCached: Boolean(sourceStockBack),
      otherGameCachePreserved: Boolean(protectedEntry),
      existingRootGameCachePreserved: Boolean(existingRootEntry),
    };
  });
  assert.equal(worker.scope, `http://127.0.0.1:${port}/solitaire/`);
  assert.equal(worker.script, `http://127.0.0.1:${port}/solitaire/sw.js`);
  assert.equal(worker.shellPageCached, true);
  assert.equal(worker.recycleSamplesCached, true);
  assert.equal(worker.themeGallerySamplesCached, true);
  assert.equal(worker.winBackgroundCached, true);
  assert.equal(worker.winScoreDigitCached, true);
  assert.equal(worker.sourceStockBackCached, true);
  assert.equal(worker.otherGameCachePreserved, true);
  assert.equal(worker.existingRootGameCachePreserved, true);
  assert.ok(worker.cachesAfterInstall.includes('solitaire-master-solitaire-v75'));
  assert.deepEqual(unscopedRequests, []);
  assert.deepEqual(badResponses, []);
  assert.deepEqual(pageErrors, []);
  console.log(`Subpath smoke test passed at http://127.0.0.1:${port}/solitaire/`);
} finally {
  await browser?.close();
  if (server?.listening) {
    server.close();
    await once(server, 'close');
  }
  rmSync(work, { recursive: true, force: true });
}
