import { expect, test } from '@playwright/test';

test('mobile deal, stock draw, undo, and a legal hinted move', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));

  await page.goto('/');
  await expect(page).toHaveTitle('Solitaire Master');
  await expect(page.locator('#tableau .pile-column')).toHaveCount(7);
  await expect(page.locator('#tableau .card-face')).toHaveCount(7);
  await expect(page.locator('#tableau .card-back')).toHaveCount(21);
  await expect(page.locator('.stock-count')).toHaveText('24');
  await expect(page.locator('#moves-value')).toHaveText('0');
  await expect(page.getByRole('button', { name: 'Game menu' })).toBeVisible();
  await expect(page.locator('.foundation-slot')).toHaveCount(4);
  await expect(page.locator('.action-button')).toHaveCount(4);
  await expect(page.locator('body')).toHaveAttribute('data-theme', 'felt');
  await expect(page.locator('body')).toHaveAttribute('data-card-back', 'ruby');
  await expect.poll(() => page.locator('.card-face-art').first().evaluate((image) => image.complete && image.naturalWidth > 0)).toBe(true);
  await expect.poll(() => page.locator('.card-back-art').first().evaluate((image) => image.complete && image.naturalWidth > 0)).toBe(true);
  const dealMotion = await page.evaluate(() => {
    const first = document.querySelector('#tableau .pile-column[data-pile="0"] .playing-card');
    const last = document.querySelector('#tableau .pile-column[data-pile="6"] .playing-card[data-index="6"]');
    return {
      count: document.querySelectorAll('#tableau .playing-card.card-enter').length,
      firstDelay: Number.parseFloat(first.style.getPropertyValue('--deal-delay')),
      lastDelay: Number.parseFloat(last.style.getPropertyValue('--deal-delay')),
      firstX: Number.parseFloat(first.style.getPropertyValue('--deal-x')),
      lastY: Number.parseFloat(last.style.getPropertyValue('--deal-y')),
      faceFlip: getComputedStyle(document.querySelector('#tableau .card-face.card-enter .card-face-art')).animationName,
    };
  });
  expect(dealMotion.count).toBe(28);
  expect(dealMotion.firstDelay).toBe(0);
  expect(dealMotion.lastDelay).toBe(1080);
  expect(dealMotion.firstX).toBeGreaterThan(180);
  expect(dealMotion.lastY).toBeLessThan(-100);
  expect(dealMotion.faceFlip).toBe('deal-face-reveal');
  const tableauLayout = await page.evaluate(() => {
    const box = (selector) => document.querySelector(selector).getBoundingClientRect();
    return {
      foundation: box('.foundation-slot[data-pile="0"]').left,
      waste: box('.waste-slot').left,
      stock: box('.stock-slot').left,
      newLabel: document.querySelector('#new-game-button').innerText.trim(),
    };
  });
  expect(tableauLayout.foundation).toBeLessThan(tableauLayout.waste);
  expect(tableauLayout.waste).toBeLessThan(tableauLayout.stock);
  expect(tableauLayout.newLabel).toBe('New Game');
  const deckIntegrity = await page.evaluate(() => {
    const state = window.solitaireGame.state;
    const cards = [...state.stock, ...state.waste, ...state.foundations.flat(), ...state.tableau.flat()];
    return { total: cards.length, unique: new Set(cards.map((card) => card.id)).size };
  });
  expect(deckIntegrity).toEqual({ total: 52, unique: 52 });
  await page.waitForTimeout(1700);
  await page.screenshot({ path: 'test-results/mobile-home.png', fullPage: true });

  const stockTapBox = await page.locator('[data-action="stock"]').boundingBox();
  await page.touchscreen.tap(stockTapBox.x + stockTapBox.width / 2, stockTapBox.y + stockTapBox.height / 2);
  await expect(page.locator('.stock-count')).toHaveText('23');
  await expect(page.locator('#moves-value')).toHaveText('1');
  await expect(page.locator('.waste-slot .card-face')).toHaveCount(1);
  const firstDrawFlight = await page.locator('.waste-slot .card-face').first().evaluate((card) => ({
    x: Number.parseFloat(card.style.getPropertyValue('--draw-x')),
    y: Number.parseFloat(card.style.getPropertyValue('--draw-y')),
    fan: Number.parseFloat(card.style.getPropertyValue('--waste-offset')),
  }));
  expect(firstDrawFlight.x).toBeCloseTo(tableauLayout.stock - tableauLayout.waste);
  expect(firstDrawFlight.y).toBe(0);
  expect(firstDrawFlight.fan).toBe(0);
  const drawFlip = await page.locator('.waste-slot .card-face').first().evaluate((card) => ({
    active: card.classList.contains('card-reveal'),
    animation: getComputedStyle(card.querySelector('.card-face-art')).animationName,
  }));
  expect(drawFlip).toEqual({ active: true, animation: 'draw-face-reveal' });

  await page.getByRole('button', { name: 'Undo move' }).click();
  await expect(page.locator('.stock-count')).toHaveText('24');
  await expect(page.locator('.waste-slot .card-face')).toHaveCount(0);
  await expect(page.locator('#moves-value')).toHaveText('0');

  await page.getByRole('button', { name: 'Show a hint' }).click();
  await expect(page.locator('.is-hint').first()).toBeVisible();
  const hint = await page.evaluate(() => window.solitaireGame.state.hint);
  if (!hint) throw new Error('The new deal did not produce a hint.');

  if (hint.source.zone === 'stock') {
    await page.locator('[data-action="stock"]').click();
  } else {
    let target = page.locator(`[data-drop-zone="${hint.target.zone}"][data-pile="${hint.target.pile}"]`);
    if (hint.target.zone === 'tableau') {
      const pileSize = await page.evaluate((pile) => window.solitaireGame.state.tableau[pile].length, hint.target.pile);
      if (pileSize) target = page.locator(`#tableau .pile-column[data-pile="${hint.target.pile}"] .playing-card[data-index="${pileSize - 1}"]`);
    } else {
      const pileSize = await page.evaluate((pile) => window.solitaireGame.state.foundations[pile].length, hint.target.pile);
      if (pileSize) target = page.locator(`.foundation-slot[data-pile="${hint.target.pile}"] .playing-card`);
    }
    await target.click();
  }
  await expect(page.locator('#moves-value')).toHaveText('1');
  await page.getByRole('button', { name: 'Undo move' }).click();
  await expect(page.locator('#moves-value')).toHaveText('0');
  expect(pageErrors).toEqual([]);
});

test('settings change draw count and hand layout; a new deal resets the board', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Game menu' }).click();
  await page.getByRole('button', { name: 'Settings and themes' }).click();
  await page.getByRole('button', { name: 'Draw 3' }).click();
  await page.getByRole('switch', { name: /Left-hand mode/ }).click();
  await expect(page.locator('body')).toHaveClass(/left-hand/);
  const stockBox = await page.locator('.stock-slot').boundingBox();
  const wasteBox = await page.locator('.waste-slot').boundingBox();
  const foundationBox = await page.locator('.foundation-slot[data-pile="0"]').boundingBox();
  expect(stockBox.x).toBeLessThan(foundationBox.x);
  expect(stockBox.x).toBeLessThan(wasteBox.x);
  expect(wasteBox.x).toBeLessThan(foundationBox.x);
  await page.getByRole('button', { name: 'Ruby card back' }).click();
  await expect(page.locator('body')).toHaveAttribute('data-card-back', 'ruby');
  await page.getByRole('button', { name: 'Mountain background' }).click();
  await expect(page.locator('body')).toHaveAttribute('data-theme', 'mountain');
  expect(await page.locator('body').evaluate((body) => getComputedStyle(body).backgroundImage)).toContain('/assets/themes/mountain-valley.jpg');
  expect((await page.request.get('/assets/themes/mountain-valley.jpg')).ok()).toBe(true);
  await page.getByRole('button', { name: 'Close dialog' }).click();
  await page.reload();
  await expect(page.locator('body')).toHaveAttribute('data-theme', 'mountain');
  await page.evaluate(() => window.solitaireGame.setOption('theme', 'woodland'));
  await page.reload();
  await expect(page.locator('body')).toHaveAttribute('data-theme', 'mountain');

  await page.locator('[data-action="stock"]').click();
  await expect(page.locator('#moves-value')).toHaveText('1');
  await expect(page.locator('#tableau')).toHaveAttribute('aria-label', 'Seven tableau piles');
  await expect(page.locator('.stock-count')).toHaveText('21');
  await expect(page.locator('.waste-slot .card-face')).toHaveCount(3);
  const threeCardFan = await page.locator('.waste-slot .card-face').evaluateAll((cards) => cards.map((card) => ({
    offset: Number.parseFloat(card.style.getPropertyValue('--waste-offset')),
    delay: Number.parseFloat(card.style.getPropertyValue('--draw-delay')),
  })));
  expect(threeCardFan).toEqual([{ offset: 0, delay: 0 }, { offset: 0.47, delay: 55 }, { offset: 0.94, delay: 110 }]);
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'test-results/mobile-draw3-left-hand.png', fullPage: true });

  await page.getByRole('button', { name: 'Start a new game' }).click();
  await page.getByRole('button', { name: 'Deal a new game' }).click();
  await expect(page.locator('#moves-value')).toHaveText('0');
  await expect(page.locator('.stock-count')).toHaveText('24');
  await expect(page.locator('.modal-backdrop')).toBeHidden();
  await expect(page.locator('body')).toHaveClass(/left-hand/);
  await expect(page.locator('body')).toHaveAttribute('data-card-back', 'ruby');
  await page.reload();
  await expect(page.locator('#moves-value')).toHaveText('0');
  await expect(page.locator('body')).toHaveClass(/left-hand/);
  await expect(page.locator('body')).toHaveAttribute('data-card-back', 'ruby');
});

test('a legal hinted card can be dragged to its destination', async ({ page }) => {
  await page.goto('/');
  let hint = null;
  for (let attempt = 0; attempt < 28; attempt += 1) {
    await page.getByRole('button', { name: 'Show a hint' }).click();
    hint = await page.evaluate(() => window.solitaireGame.state.hint);
    if (hint && hint.source.zone !== 'stock') break;
    await page.locator('[data-action="stock"]').click();
  }
  if (!hint || hint.source.zone === 'stock') throw new Error('Could not find a card move to drag.');

  const sourceSelector = hint.source.zone === 'waste'
    ? '.waste-slot .playing-card[data-zone="waste"]'
    : `#tableau .pile-column[data-pile="${hint.source.pile}"] .playing-card[data-index="${hint.source.index}"]`;
  let targetSelector = `[data-drop-zone="${hint.target.zone}"][data-pile="${hint.target.pile}"]`;
  if (hint.target.zone === 'tableau') {
    const length = await page.evaluate((pile) => window.solitaireGame.state.tableau[pile].length, hint.target.pile);
    if (length) targetSelector = `#tableau .pile-column[data-pile="${hint.target.pile}"] .playing-card[data-index="${length - 1}"]`;
  } else {
    const length = await page.evaluate((pile) => window.solitaireGame.state.foundations[pile].length, hint.target.pile);
    if (length) targetSelector = `.foundation-slot[data-pile="${hint.target.pile}"] .playing-card`;
  }

  const sourceBox = await page.locator(sourceSelector).boundingBox();
  const targetBox = await page.locator(targetSelector).boundingBox();
  if (!sourceBox || !targetBox) throw new Error('The hinted source or destination was not visible.');
  const movesBefore = Number(await page.locator('#moves-value').innerText());
  const touch = await page.context().newCDPSession(page);
  const startX = sourceBox.x + Math.min(11, sourceBox.width / 3);
  const startY = sourceBox.y + 8;
  const endX = targetBox.x + targetBox.width / 2;
  const endY = targetBox.y + 12;
  await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: startX, y: startY, id: 1, radiusX: 2, radiusY: 2, force: 1 }] });
  for (let step = 1; step <= 12; step += 1) {
    const progress = step / 12;
    await touch.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{
        x: startX + (endX - startX) * progress,
        y: startY + (endY - startY) * progress,
        id: 1,
        radiusX: 2,
        radiusY: 2,
        force: 1,
      }],
    });
    await page.waitForTimeout(8);
  }
  await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await touch.detach();
  await expect(page.locator('#moves-value')).toHaveText(String(movesBefore + 1));
});

test('the daily deal is repeatable and the game restores on reload', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Game menu' }).click();
  await page.getByRole('button', { name: /Daily challenge/ }).click();
  await expect(page.getByRole('heading', { name: 'Daily Challenge' })).toBeVisible();
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  const dailyDate = await page.evaluate(() => window.solitaireGame.state.challenge);
  const firstCard = await page.evaluate(() => window.solitaireGame.state.tableau[0][0].id);
  expect(dailyDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);

  await page.locator('[data-action="stock"]').click();
  await expect(page.locator('#moves-value')).toHaveText('1');
  await page.reload();
  await expect(page.locator('#moves-value')).toHaveText('1');
  await expect(page.locator('.stock-count')).toHaveText('23');

  await page.getByRole('button', { name: 'Game menu' }).click();
  await page.getByRole('button', { name: new RegExp(dailyDate) }).click();
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await expect(page.locator('#moves-value')).toHaveText('0');
  expect(await page.evaluate(() => window.solitaireGame.state.tableau[0][0].id)).toBe(firstCard);
});

test('daily calendar browses past months and starts the selected deterministic deal', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Game menu' }).click();
  await page.getByRole('button', { name: /Daily challenge/ }).click();
  const calendarBox = await page.locator('.modal-card').boundingBox();
  expect(calendarBox.x).toBeGreaterThanOrEqual(0);
  expect(calendarBox.x + calendarBox.width).toBeLessThanOrEqual(320);
  expect(calendarBox.y + calendarBox.height).toBeLessThanOrEqual(640);
  await expect(page.getByRole('button', { name: 'Play', exact: true })).toBeVisible();
  const currentMonth = await page.locator('.daily-calendar').getAttribute('data-month');
  await page.getByRole('button', { name: 'Previous month' }).click();
  const previousMonth = await page.locator('.daily-calendar').getAttribute('data-month');
  expect(previousMonth).not.toBe(currentMonth);
  const firstDay = `${previousMonth}-01`;
  await page.locator(`[data-daily-date="${firstDay}"]`).click();
  await expect(page.locator(`[data-daily-date="${firstDay}"]`)).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.solitaireGame.state.challenge)).toBe(firstDay);
  const firstCard = await page.evaluate(() => window.solitaireGame.state.tableau[0][0].id);
  await page.reload();
  expect(await page.evaluate(() => window.solitaireGame.state.tableau[0][0].id)).toBe(firstCard);
});

test('winning shows a result card and records a completed daily challenge', async ({ page }) => {
  await page.goto('/');
  const challengeDate = await page.evaluate(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  });
  await page.evaluate((day) => {
    const game = window.solitaireGame;
    const cards = game.state.seedDeck.map((card) => ({ ...card, faceUp: true }));
    const suits = ['♠', '♥', '♦', '♣'];
    game.state.stock = [];
    game.state.waste = [];
    game.state.foundations = suits.map((suit) => cards.filter((card) => card.suit === suit && card.rank < 13).sort((a, b) => a.rank - b.rank));
    game.state.tableau = [...suits.map((suit) => [cards.find((card) => card.suit === suit && card.rank === 13)]), [], [], []];
    game.state.moves = 184;
    game.state.score = 350;
    game.state.seconds = 184;
    game.state.challenge = day;
    game.state.won = false;
    game.save();
  }, challengeDate);
  await page.reload();

  for (let pile = 0; pile < 4; pile += 1) {
    await page.locator(`#tableau .pile-column[data-pile="${pile}"] .playing-card`).click();
    await page.locator(`.foundation-slot[data-pile="${pile}"]`).click();
  }

  await expect(page.locator('.win-ribbon')).toContainText('YOU WIN');
  await expect(page.locator('.win-score-line strong')).toHaveText('390');
  await expect(page.locator('.win-copy')).toContainText('Daily challenge completed');
  await expect(page.locator('.win-summary')).toContainText(/Time\s+\d+:\d{2}/);
  await expect(page.locator('.win-summary')).toContainText('188');
  await page.getByRole('button', { name: 'Close dialog' }).click();
  await page.getByRole('button', { name: 'Game menu' }).click();
  await page.getByRole('button', { name: new RegExp(challengeDate) }).click();
  await expect(page.locator(`[data-daily-date="${challengeDate}"]`)).toHaveClass(/completed/);
  await expect(page.locator('.daily-progress')).toHaveAttribute('aria-label', /1 of .* challenges completed this month/);
});

test('the Magic control plays one legal suggestion and undo reverses it', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#magic-badge')).toHaveText('1');
  await page.getByRole('button', { name: 'Use magic move' }).click();
  await expect(page.locator('#moves-value')).toHaveText('1');
  await expect(page.locator('#magic-badge')).toBeHidden();
  await page.getByRole('button', { name: 'Undo move' }).click();
  await expect(page.locator('#moves-value')).toHaveText('0');
  await expect(page.locator('#magic-badge')).toHaveText('1');
});

test('mobile sound unlocks on a gesture and ambient music follows its switch', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await page.goto('/');
  await page.evaluate(() => {
    window.audioCues = [];
    const audio = window.solitaireAudio;
    const playCue = audio.playCue.bind(audio);
    audio.playCue = (cue) => { window.audioCues.push(cue); return playCue(cue); };
  });

  await page.locator('[data-action="stock"]').click();
  await expect.poll(() => page.evaluate(() => window.solitaireAudio.context?.state)).toBe('running');
  await expect.poll(() => page.evaluate(() => window.audioCues.includes('draw'))).toBe(true);
  expect(await page.evaluate(() => window.solitaireAudio.noiseBuffer.length)).toBeGreaterThan(0);

  await page.getByRole('button', { name: 'Game menu' }).click();
  await page.getByRole('button', { name: 'Settings and themes' }).click();
  await page.getByRole('switch', { name: 'Sound effects' }).click();
  await expect.poll(() => page.evaluate(() => window.solitaireAudio.soundOn)).toBe(false);
  await page.getByRole('switch', { name: 'Background music' }).click();
  await expect.poll(() => page.evaluate(() => window.solitaireAudio.musicStep)).toBeGreaterThan(0);
  await expect.poll(() => page.evaluate(() => Boolean(window.solitaireAudio.musicTimer))).toBe(true);
  await page.getByRole('switch', { name: 'Background music' }).click();
  await expect.poll(() => page.evaluate(() => window.solitaireAudio.musicOn)).toBe(false);
  expect(await page.evaluate(() => window.solitaireAudio.musicTimer)).toBeNull();
  await page.getByRole('button', { name: 'Close dialog' }).click();

  const cuesBeforeMutedDraw = await page.evaluate(() => window.audioCues.length);
  await page.locator('[data-action="stock"]').click();
  await expect(page.locator('#moves-value')).toHaveText('2');
  await page.waitForTimeout(50);
  expect(await page.evaluate(() => window.audioCues.length)).toBe(cuesBeforeMutedDraw);
  expect(pageErrors).toEqual([]);
});

test('the board fits a 320px phone and the installed shell loads offline', async ({ page, context }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto('/');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.evaluate(() => window.solitaireGame.setOption('theme', 'mountain'));
  await page.reload();
  await page.evaluate(() => navigator.serviceWorker.ready);
  await expect(page.locator('body')).toHaveAttribute('data-theme', 'mountain');
  const screenWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(screenWidth).toBeLessThanOrEqual(320);
  await context.setOffline(true);
  await page.reload();
  await expect(page).toHaveTitle('Solitaire Master');
  await expect(page.locator('body')).toHaveAttribute('data-theme', 'mountain');
  await expect(page.locator('#tableau .pile-column')).toHaveCount(7);
  await expect.poll(() => page.locator('.card-face-art').first().evaluate((image) => image.complete && image.naturalWidth > 0)).toBe(true);
  const offlineThemeImage = await page.evaluate(async () => {
    const response = await fetch('/assets/themes/mountain-valley.jpg');
    return { ok: response.ok, type: response.headers.get('content-type') };
  });
  expect(offlineThemeImage).toEqual({ ok: true, type: 'image/jpeg' });
  await context.setOffline(false);
});

test('an illegal tableau tap does not alter the deal', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => document.querySelectorAll('#tableau .card-enter').length === 0);
  const pair = await page.evaluate(() => {
    const game = window.solitaireGame;
    for (let sourcePile = 0; sourcePile < 7; sourcePile += 1) {
      const sourceIndex = game.state.tableau[sourcePile].length - 1;
      const source = { zone: 'tableau', pile: sourcePile, index: sourceIndex };
      for (let targetPile = 0; targetPile < 7; targetPile += 1) {
        if (targetPile === sourcePile) continue;
        const target = { zone: 'tableau', pile: targetPile };
        if (!game.canMove(source, target)) return { sourcePile, sourceIndex, targetPile };
      }
    }
    return null;
  });
  if (!pair) throw new Error('No illegal tableau pair found in the new deal.');

  await page.locator(`#tableau .pile-column[data-pile="${pair.sourcePile}"] .playing-card[data-index="${pair.sourceIndex}"]`).click({ position: { x: 8, y: 8 } });
  await page.locator(`#tableau .pile-column[data-pile="${pair.targetPile}"] .playing-card:last-child`).click({ position: { x: 8, y: 8 } });
  await expect(page.locator('#moves-value')).toHaveText('0');
  await expect(page.locator('#tableau .playing-card')).toHaveCount(28);
});
