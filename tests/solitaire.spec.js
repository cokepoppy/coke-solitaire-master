import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';

const sourceArtSrgbHashes = JSON.parse(readFileSync(new URL('./fixtures/source-art-srgb-hashes.json', import.meta.url), 'utf8'));

test('color-profiled source artwork keeps its recorded PNG files', async ({ page }) => {
  await page.goto('/');
  const actual = await page.evaluate(async (artwork) => Promise.all(Object.keys(artwork).map(async (name) => {
    const response = await fetch(`/assets/${name}`);
    if (!response.ok) throw new Error(`Source artwork request failed: ${name} (${response.status})`);
    const digest = await crypto.subtle.digest('SHA-256', await response.arrayBuffer());
    return [name, [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('')];
  })), sourceArtSrgbHashes);
  expect(actual).toEqual(Object.entries(sourceArtSrgbHashes));
});

test('mobile deal, stock draw, undo, and a legal hinted move', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));

  await page.addInitScript(() => {
    window.initialDealStarts = [];
    window.initialDealFaceFlips = [];
    document.addEventListener('animationstart', (event) => {
      const card = event.target.closest?.('.playing-card');
      if (card && event.animationName === 'card-deal') {
        window.initialDealStarts.push({
          delay: Number.parseFloat(card.style.getPropertyValue('--deal-delay')),
          x: Number.parseFloat(card.style.getPropertyValue('--deal-x')),
          y: Number.parseFloat(card.style.getPropertyValue('--deal-y')),
        });
      }
      if (event.animationName === 'deal-face-reveal') window.initialDealFaceFlips.push(event.animationName);
    }, true);
  });
  await page.goto('/');
  await expect.poll(() => page.evaluate(() => window.initialDealStarts.length)).toBe(28);
  await expect.poll(() => page.evaluate(() => window.initialDealFaceFlips.length)).toBe(7);
  const dealMotion = await page.evaluate(() => {
    const cards = [...window.initialDealStarts].sort((first, last) => first.delay - last.delay);
    return {
      count: cards.length,
      firstDelay: cards[0].delay,
      lastDelay: cards.at(-1).delay,
      firstX: cards[0].x,
      lastY: cards.at(-1).y,
      faceFlip: window.initialDealFaceFlips[0],
    };
  });
  expect(dealMotion.count).toBe(28);
  expect(dealMotion.firstDelay).toBe(0);
  expect(dealMotion.lastDelay).toBe(1080);
  expect(dealMotion.firstX).toBeGreaterThan(180);
  expect(dealMotion.lastY).toBeLessThan(-100);
  expect(dealMotion.faceFlip).toBe('deal-face-reveal');

  await expect(page).toHaveTitle('Solitaire Master');
  await expect(page.locator('#tableau .pile-column')).toHaveCount(7);
  await expect(page.locator('#tableau .card-face')).toHaveCount(7);
  await expect(page.locator('#tableau .card-back')).toHaveCount(21);
  await expect(page.locator('.stock-slot .card-back-art')).toHaveAttribute('src', /back-solitaire-master-source\.png$/);
  await expect.poll(() => page.locator('.stock-slot .card-back-underlay').evaluate((image) => image.complete && image.naturalWidth > 0)).toBe(true);
  await expect(page.locator('.stock-count')).toHaveText('24');
  await expect(page.locator('#time-value')).toHaveText(/^00:\d{2}$/);
  await expect(page.locator('.time-stat')).toHaveAttribute('aria-label', 'Time');
  await expect(page.locator('.timer-frame-source')).toBeVisible();
  await expect(page.locator('.timer-frame-vector')).toHaveCSS('display', 'none');
  await expect.poll(() => page.locator('.timer-frame-source').evaluate((image) => [image.complete, image.naturalWidth, image.naturalHeight])).toEqual([true, 286, 100]);
  await expect.poll(() => page.locator('.stat-digit').evaluateAll((images) => images.every((image) => image.complete && image.naturalWidth === 21 && image.naturalHeight === 31))).toBe(true);
  const timerDigitHashes = await page.evaluate(async () => Promise.all(Array.from({ length: 10 }, async (_, digit) => {
    const response = await fetch(`/assets/ui/timer-digit-${digit}.png`);
    const bytes = await response.arrayBuffer();
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
  })));
  expect(new Set(timerDigitHashes).size).toBe(10);
  const timerFrameBounds = await page.evaluate(() => {
    const timer = document.querySelector('.time-stat').getBoundingClientRect();
    const frame = document.querySelector('.timer-frame').getBoundingClientRect();
    return { wider: frame.width > timer.width, taller: frame.height > timer.height, left: frame.left < timer.left, right: frame.right > timer.right };
  });
  expect(timerFrameBounds).toEqual({ wider: true, taller: true, left: true, right: true });
  await expect(page.locator('#moves-value')).toHaveText('0');
  await expect(page.getByRole('button', { name: 'Game menu' })).toBeVisible();
  await expect(page.locator('.menu-source-art')).toHaveCSS('display', 'block');
  await expect(page.locator('.metric-source-icon')).toHaveCount(2);
  await expect.poll(() => page.locator('.metric-source-icon').evaluateAll((images) => images.every((image) => image.complete && image.naturalWidth > 0))).toBe(true);
  await expect(page.locator('.foundation-slot')).toHaveCount(4);
  await expect(page.locator('.action-button')).toHaveCount(4);
  await expect(page.locator('.action-source-icon')).toHaveCount(4);
  await expect.poll(() => page.locator('.action-source-icon').evaluateAll((images) => images.every((image) => image.complete && image.naturalWidth > 0))).toBe(true);
  await expect(page.locator('.foundation-source-art')).toHaveCount(4);
  await expect.poll(() => page.locator('.foundation-source-art').evaluateAll((images) => images.every((image) => image.complete && image.naturalWidth === 118 && image.naturalHeight === 177))).toBe(true);
  await expect(page.locator('body')).toHaveAttribute('data-theme', 'felt');
  await expect(page.locator('body')).toHaveAttribute('data-card-back', 'ruby');
  await expect(page.locator('.card-back-art').first()).toHaveAttribute('src', '/assets/cards/back-solitaire-master-source.png');
  const stockCountPosition = await page.evaluate(() => {
    const card = document.querySelector('.stock-slot .card-back').getBoundingClientRect();
    const count = document.querySelector('.stock-count').getBoundingClientRect();
    return { topInset: count.top - card.top, bottomInset: card.bottom - count.bottom };
  });
  expect(stockCountPosition.bottomInset).toBeLessThan(stockCountPosition.topInset);
  await expect.poll(() => page.locator('.card-face-art').first().evaluate((image) => image.complete && image.naturalWidth > 0)).toBe(true);
  await expect.poll(() => page.locator('.card-back-art').first().evaluate((image) => image.complete && image.naturalWidth > 0)).toBe(true);
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
  expect(tableauLayout.newLabel).toBe('Play');
  const deckIntegrity = await page.evaluate(() => {
    const state = window.solitaireGame.state;
    const cards = [...state.stock, ...state.waste, ...state.foundations.flat(), ...state.tableau.flat()];
    return {
      total: cards.length,
      unique: new Set(cards.map((card) => card.id)).size,
      tableauLengths: state.tableau.map((pile) => pile.length),
      topCards: state.tableau.map((pile) => `${pile.at(-1).rank}${pile.at(-1).suit}`),
      firstStockDraw: state.stock.at(-1).id,
    };
  });
  expect(deckIntegrity).toEqual({
    total: 52,
    unique: 52,
    tableauLengths: [1, 2, 3, 4, 5, 6, 7],
    topCards: ['5♦', '12♠', '2♣', '13♦', '11♦', '4♣', '9♦'],
    firstStockDraw: '♥-6',
  });
  await page.waitForTimeout(1700);
  await page.screenshot({ path: 'test-results/mobile-home.png', fullPage: true });

  const stockTapBox = await page.locator('[data-action="stock"]').boundingBox();
  await page.touchscreen.tap(stockTapBox.x + stockTapBox.width / 2, stockTapBox.y + stockTapBox.height / 2);
  const stockDrawMotion = await page.locator('.waste-slot .card-face').first().evaluate((card) => ({
    active: card.classList.contains('card-stock-draw') && card.classList.contains('card-arrive'),
    animation: getComputedStyle(card).animationName,
    duration: getComputedStyle(card).animationDuration,
    faceReveal: card.classList.contains('card-reveal'),
  }));
  expect(stockDrawMotion).toEqual({ active: true, animation: 'card-land', duration: '0.133333s', faceReveal: false });
  await expect(page.locator('.stock-count')).toHaveText('23');
  await expect(page.locator('.stock-slot .card-back-art')).toHaveAttribute('src', /back-solitaire-master-reference\.png$/);
  await expect(page.locator('.waste-slot .card-face-art')).toHaveAttribute('src', /6-of-hearts-reference\.png$/);
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

test('the first tableau move shows the one-time source rules tip', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    const game = window.solitaireGame;
    const cards = [...game.state.stock, ...game.state.waste, ...game.state.foundations.flat(), ...game.state.tableau.flat()];
    const used = new Set();
    const take = (suit, rank) => {
      const card = cards.find((candidate) => candidate.suit === suit && candidate.rank === rank);
      if (!card) throw new Error(`Missing ${rank}${suit}`);
      used.add(card.id);
      return { ...card, faceUp: true };
    };
    const five = take('♦', 5);
    const four = take('♣', 4);
    const three = take('♦', 3);
    game.state.stock = cards.filter((card) => !used.has(card.id)).map((card) => ({ ...card, faceUp: false }));
    game.state.waste = [];
    game.state.foundations = [[], [], [], []];
    game.state.tableau = [[five], [four], [three], [], [], [], []];
    game.state.moves = 0;
    game.state.score = 0;
    game.state.comboCount = 0;
    game.state.comboLastMoveAt = 0;
    game.state.history = [];
    game.state.selected = null;
    game.state.won = false;
    localStorage.removeItem('solitaire-master-tableau-tutorial-v1');
    game.save();
  });
  await page.reload();
  const tip = page.locator('#tableau-tutorial');
  await expect(tip).toBeHidden();
  await page.waitForTimeout(1400);
  await page.locator('.pile-column[data-pile="1"] .playing-card[data-index="0"]').click();
  await page.locator('.pile-column[data-pile="0"] .playing-card[data-index="0"]').click();
  await expect(page.locator('#moves-value')).toHaveText('1');
  await expect(tip).toBeHidden();
  await expect(tip).toHaveAttribute('aria-label', 'Build tableau piles in descending order, alternating between red and black cards');
  await expect(tip).toBeVisible({ timeout: 1500 });
  const tipBox = await tip.boundingBox();
  expect(tipBox.width).toBeCloseTo(312, 0);
  expect(Math.abs(tipBox.y + tipBox.height - 709)).toBeLessThan(8);
  await page.screenshot({ path: 'test-results/first-move-tutorial.png' });
  await page.waitForTimeout(3900);
  await expect(tip).toBeVisible();
  await page.waitForTimeout(800);
  await expect(tip).toBeHidden();
  await expect.poll(() => page.evaluate(() => localStorage.getItem('solitaire-master-tableau-tutorial-v1'))).toBe('shown');
  await page.locator('.pile-column[data-pile="2"] .playing-card[data-index="0"]').click();
  await page.locator('.pile-column[data-pile="0"] .playing-card[data-index="1"]').click();
  await expect(page.locator('#moves-value')).toHaveText('2');
  await expect(tip).toBeHidden();
});

async function runSourceOpeningReplay(page) {
  await page.setViewportSize({ width: 442, height: 960 });
  await page.goto('/');
  const sourceMenuArt = await page.locator('.menu-source-art').boundingBox();
  expect(sourceMenuArt.x).toBeCloseTo(12.5, 0);
  expect(sourceMenuArt.y).toBeCloseTo(151.5, 0);
  expect(sourceMenuArt.width).toBe(36);
  expect(sourceMenuArt.height).toBe(37);
  await page.evaluate(() => {
    const game = window.solitaireGame;
    const suits = ['♠', '♥', '♦', '♣'];
    const deck = suits.flatMap((suit) => Array.from({ length: 13 }, (_, index) => ({
      id: `${suit}-${index + 1}`,
      suit,
      rank: index + 1,
      faceUp: false,
    })));
    game.newGame(deck);
    const remaining = new Map(deck.map((card) => [card.id, { ...card, faceUp: false }]));
    const take = (suit, rank, faceUp) => {
      const id = `${suit}-${rank}`;
      const card = remaining.get(id);
      if (!card) throw new Error(`Duplicate reference card ${id}`);
      remaining.delete(id);
      return { ...card, faceUp };
    };
    const hidden = () => {
      const card = remaining.values().next().value;
      if (!card) throw new Error('The reference deal exhausted the deck.');
      remaining.delete(card.id);
      return card;
    };
    game.state.tableau = [
      [take('♦', 5, true)],
      [take('♣', 6, false), take('♠', 12, true)],
      [hidden(), hidden(), take('♣', 2, true)],
      [hidden(), hidden(), hidden(), take('♦', 13, true)],
      [hidden(), hidden(), hidden(), take('♣', 3, false), take('♦', 11, true)],
      [hidden(), hidden(), hidden(), hidden(), take('♣', 12, false), take('♣', 4, true)],
      [hidden(), hidden(), hidden(), hidden(), hidden(), hidden(), take('♦', 9, true)],
    ];
    game.state.stock = [...remaining.values()];
    game.state.moves = 0;
    game.state.score = 0;
    game.state.seconds = 0;
    game.state.history = [];
    localStorage.setItem('solitaire-master-tableau-tutorial-v1', 'shown');
    game.save();
  });
  await page.reload();
  await page.waitForTimeout(1450);
  expect(await page.locator('body').evaluate((body) => getComputedStyle(body).backgroundImage.includes('rgb(14, 116, 65)'))).toBe(true);
  const sourceColumnOrigins = await page.locator('.pile-column').evaluateAll((columns) => columns.map((column) => Math.round(column.getBoundingClientRect().left * devicePixelRatio)));
  expect(sourceColumnOrigins).toEqual([8, 133, 258, 383, 508, 633, 758]);
  const sourceFoundationOrigins = await page.locator('.foundation-slot').evaluateAll((slots) => slots.map((slot) => [Math.round(slot.getBoundingClientRect().left * devicePixelRatio), Math.round(slot.getBoundingClientRect().top * devicePixelRatio)]));
  expect(sourceFoundationOrigins).toEqual([[8, 429], [133, 429], [258, 429], [383, 429]]);
  const foundationTop = await page.locator('.foundation-slot').first().evaluate((slot) => slot.getBoundingClientRect().top);
  expect(foundationTop).toBeLessThan(214.75);
  const sourceActionRow = page.locator('.action-row-reference-art');
  await expect(sourceActionRow).toHaveCSS('display', 'block');
  await expect(sourceActionRow).toHaveAttribute('src', '/assets/ui/action-row-initial-reference.png');
  await expect.poll(() => sourceActionRow.evaluate((image) => image.complete && image.naturalWidth)).toBe(844);
  const sourceActionRowBounds = await sourceActionRow.boundingBox();
  expect(sourceActionRowBounds.x).toBeCloseTo(10, 0);
  expect(sourceActionRowBounds.y).toBeCloseTo(830, 0);
  expect(sourceActionRowBounds.width).toBeCloseTo(422, 0);
  expect(sourceActionRowBounds.height).toBeCloseTo(112, 0);
  await expect(page.locator('#tableau .card-back-art').first()).toHaveAttribute('src', /back-solitaire-master-reference\.png$/);
  await expect(page.locator('.waste-slot .empty-slot-mark')).toHaveCSS('display', 'none');
  const initialStackSpacing = await page.locator('.pile-column[data-pile="6"] .card-back').evaluateAll((cards) => cards.slice(1).map((card, index) => card.getBoundingClientRect().top - cards[index].getBoundingClientRect().top));
  expect(initialStackSpacing).toHaveLength(5);
  for (const spacing of initialStackSpacing) expect(spacing).toBeCloseTo(12.33, 1);
  await page.evaluate(() => {
    window.audioCues = [];
    const audio = window.solitaireAudio;
    const play = audio.play.bind(audio);
    audio.play = (cue) => { window.audioCues.push(cue); return play(cue); };
  });
  const sourceTimerFrame = await page.locator('.timer-frame-source').boundingBox();
  expect(sourceTimerFrame.x).toBeCloseTo(169.5, 1);
  expect(sourceTimerFrame.y).toBeCloseTo(145.2, 1);
  expect(sourceTimerFrame.width).toBe(143);
  expect(sourceTimerFrame.height).toBe(50);

  const dragMove = async (sourcePile, sourceIndex, targetPile, targetIndex) => {
    const sourceBox = await page.locator(`.pile-column[data-pile="${sourcePile}"] .playing-card[data-index="${sourceIndex}"]`).boundingBox();
    const targetBox = await page.locator(`.pile-column[data-pile="${targetPile}"] .playing-card[data-index="${targetIndex}"]`).boundingBox();
    const touch = await page.context().newCDPSession(page);
    const startX = sourceBox.x + Math.min(11, sourceBox.width / 3);
    const startY = sourceBox.y + 8;
    const endX = targetBox.x + targetBox.width / 2;
    const endY = targetBox.y + 12;
    await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: startX, y: startY, id: 1, radiusX: 2, radiusY: 2, force: 1 }] });
    for (let step = 1; step <= 12; step += 1) {
      const progress = step / 12;
      await touch.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{
        x: startX + (endX - startX) * progress,
        y: startY + (endY - startY) * progress,
        id: 1, radiusX: 2, radiusY: 2, force: 1,
      }] });
      await page.waitForTimeout(8);
    }
    await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await touch.detach();
  };
  const move = async (sourcePile, sourceIndex, targetPile, targetIndex) => {
    await page.locator(`.pile-column[data-pile="${sourcePile}"] .playing-card[data-index="${sourceIndex}"]`).click();
    await page.locator(`.pile-column[data-pile="${targetPile}"] .playing-card[data-index="${targetIndex}"]`).click();
  };

  // In the reference opening, the 4♣, Q♠, and J♦ join the 5♦/K♦ sequence;
  // each move also uncovers one card, matching the observed +10 score steps.
  await dragMove(5, 5, 0, 0);
  await expect(page.locator('#score-value')).toHaveText('10');
  await expect(page.locator('#moves-value')).toHaveText('1');
  expect(await page.evaluate(() => window.audioCues)).toContain('move');
  expect(await page.evaluate(() => window.audioCues)).not.toContain('flip');
  await expect(page.locator('.pile-column[data-pile="5"] .card-face-art')).toHaveAttribute('src', /queen-of-clubs-reference\.png$/);

  await page.evaluate(() => {
    window.sourceMoveAnimations = [];
    document.querySelector('#tableau').addEventListener('animationstart', (event) => {
      const card = event.target.closest('.playing-card');
      if (card?.classList.contains('card-tableau-move')) {
        window.sourceMoveAnimations.push({ id: card.dataset.cardId, name: event.animationName, duration: getComputedStyle(card).animationDuration, offset: card.style.getPropertyValue('--draw-x') });
      }
      if (event.animationName === 'deal-face-reveal' && event.target.closest('.card-reveal')) {
        window.sourceMoveAnimations.push({ id: event.target.closest('.card-reveal').dataset.cardId, name: event.animationName, duration: getComputedStyle(event.target).animationDuration });
      }
    }, true);
  });
  await move(1, 1, 3, 3);
  await expect(page.locator('#score-value')).toHaveText('20');
  await expect(page.locator('#moves-value')).toHaveText('2');
  await expect(page.locator('.pile-column[data-pile="1"] .card-face-art')).toHaveAttribute('src', /6-of-clubs-reference\.png$/);
  await expect.poll(() => page.evaluate(() => window.sourceMoveAnimations)).toEqual(expect.arrayContaining([
    expect.objectContaining({ id: '♠-12', name: 'card-land', duration: '0.05s' }),
    expect.objectContaining({ id: '♣-6', name: 'deal-face-reveal', duration: '0.05s' }),
  ]));
  const tableauFlight = await page.locator('.pile-column[data-pile="3"] .playing-card[data-card-id="♠-12"]').evaluate((card) => ({
    hasFlightClass: card.classList.contains('card-tableau-move'),
    x: Number.parseFloat(card.style.getPropertyValue('--draw-x')),
  }));
  expect(tableauFlight.hasFlightClass).toBe(true);
  expect(Math.abs(tableauFlight.x)).toBeGreaterThan(40);

  await move(4, 4, 3, 4);
  await expect(page.locator('#score-value')).toHaveText('30');
  await expect(page.locator('#moves-value')).toHaveText('3');
  await page.waitForTimeout(200);
  const faceUpStackSpacing = await page.locator('.pile-column[data-pile="3"] .card-face').evaluateAll((cards) => cards.slice(1).map((card, index) => card.getBoundingClientRect().top - cards[index].getBoundingClientRect().top));
  expect(faceUpStackSpacing).toHaveLength(2);
  for (const spacing of faceUpStackSpacing) expect(spacing).toBeCloseTo(42.94, 1);
  const finalBoard = await page.evaluate(() => ({
    score: window.solitaireGame.state.score,
    moves: window.solitaireGame.state.moves,
    stock: window.solitaireGame.state.stock.length,
    topCards: window.solitaireGame.state.tableau.map((pile) => {
      const card = pile.at(-1);
      return `${card.rank}${card.suit}`;
    }),
  }));
  expect(finalBoard).toEqual({ score: 30, moves: 3, stock: 24, topCards: ['4♣', '6♣', '2♣', '11♦', '3♣', '12♣', '9♦'] });
  await expect(page.locator('.pile-column[data-pile="0"] .card-face-art[src$="4-of-clubs-reference.png"]')).toHaveCount(1);
  await expect(page.locator('.pile-column[data-pile="1"] .card-face-art')).toHaveAttribute('src', /6-of-clubs-reference\.png$/);
  await expect(page.locator('.pile-column[data-pile="2"] .card-face-art')).toHaveAttribute('src', /2-of-clubs-reference\.png$/);
  await expect(page.locator('.pile-column[data-pile="4"] .card-face-art')).toHaveAttribute('src', /3-of-clubs-reference\.png$/);
  await expect(page.locator('.pile-column[data-pile="5"] .card-face-art')).toHaveAttribute('src', /queen-of-clubs-reference\.png$/);
  await expect(page.locator('.pile-column[data-pile="6"] .card-face-art')).toHaveAttribute('src', /9-of-diamonds-reference\.png$/);
  const sourceOpeningArtHashes = await page.evaluate(async () => Promise.all([
    '4-of-clubs-reference.png', '6-of-clubs-reference.png', '2-of-clubs-reference.png',
    '3-of-clubs-reference.png', 'queen-of-clubs-reference.png', '9-of-diamonds-reference.png',
    '5-of-diamonds-reference.png', 'queen-of-spades-reference.png',
    'king-of-diamonds-reference.png', 'jack-of-diamonds-reference.png',
  ].map(async (name) => {
    const response = await fetch(`/assets/cards/${name}`);
    const digest = await crypto.subtle.digest('SHA-256', await response.arrayBuffer());
    return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
  })));
  expect(sourceOpeningArtHashes).toEqual([
    '320165c9c9f2c125e8f57adc812a4625a12c0728070c56a0aacb3513131ec421',
    '1ced65cb8d34fa2c09de38f05bd6a34a9ad7d73879a043cf5515d4e3912b53e5',
    '197f38a607e628ae91a9695ef6c74801e2196179a61b361af5de7a0e14ff7132',
    'a54a4aedea42aea3e038b65517b4e0dd2584ab1eb035945d49d44a1da5539c5e',
    '5713c1e95398cfef3c997cc4aa6b59a8a2781ecbf96e65730f929a58745019f1',
    'b4fd3c038e2079f1c870bf1f44149441a08586e2e1a3cc140e7aaccb53adf641',
    '67985e657e216dd656d95b0858caf7d8b612b3f6705d175653eddca14a835bb4',
    'b8cd93f39439f2f482c1fc2e4f3f457659197ad2c75c852d6b131933f5f4d745',
    '89e59ecf6e1b61cf7c7d16ac877d4f0e0127be927cd76287dd6fc1c6aa23dbbc',
    'd63420ba5a2354a81cb77ca639d6bc196fb60aeb535ed8e255f88e227795b9e9',
  ]);
  await page.waitForTimeout(1000);
  await page.evaluate(() => {
    window.solitaireGame.state.seconds = 6;
    window.solitaireGame.save();
  });
  const sourceStatGlyphs = await page.evaluate(() => ({
    score: [...document.querySelectorAll('#score-value .stat-digit')].map((image) => image.getAttribute('src').split('/').at(-1)),
    moves: [...document.querySelectorAll('#moves-value .stat-digit')].map((image) => image.getAttribute('src').split('/').at(-1)),
  }));
  expect(sourceStatGlyphs).toEqual({ score: ['timer-digit-3.png', 'timer-digit-0.png'], moves: ['timer-digit-3.png'] });
  const sourceStatBounds = await page.evaluate(() => {
    const bounds = (selector) => {
      const { x, y, width, height } = document.querySelector(selector).getBoundingClientRect();
      return { x, y, width, height };
    };
    return { score: bounds('#score-value'), moves: bounds('#moves-value') };
  });
  expect(sourceStatBounds.score.x).toBeCloseTo(112.7, 0);
  expect(sourceStatBounds.score.y).toBeCloseTo(162.5, 0);
  expect(sourceStatBounds.score.width).toBeCloseTo(20.9, 1);
  expect(sourceStatBounds.moves.x).toBeCloseTo(387.1, 0);
  expect(sourceStatBounds.moves.y).toBeCloseTo(162.5, 0);
  expect(sourceStatBounds.moves.width).toBeCloseTo(10.5, 1);
  await expect(page.locator('.combo-feedback, .combo-good, .combo-great, .combo-amazing')).toHaveCount(0);
  const timeDisplay = page.locator('#time-value');
  await expect(timeDisplay).toHaveText('00:07');
  await expect(timeDisplay.locator('.timer-glyph')).toHaveCount(5);
  const timerTextBox = await timeDisplay.boundingBox();
  expect(timerTextBox.width).toBeCloseTo(51.5, 1);
  expect(timerTextBox.height).toBeCloseTo(15.5, 1);
  const sourceGlyphs = await timeDisplay.locator('.timer-glyph').evaluateAll((images) => images.map((image) => ({
    file: image.getAttribute('src').split('/').at(-1),
    size: [image.naturalWidth, image.naturalHeight],
  })));
  expect(sourceGlyphs).toEqual([
    { file: 'timer-digit-0.png', size: [21, 31] },
    { file: 'timer-digit-0.png', size: [21, 31] },
    { file: 'timer-colon.png', size: [4, 31] },
    { file: 'timer-digit-0.png', size: [21, 31] },
    { file: 'timer-digit-7.png', size: [21, 31] },
  ]);
  await expect(page.locator('#undo-button')).toBeEnabled();
  await expect(sourceActionRow).toHaveAttribute('src', '/assets/ui/action-row-used-reference.png');
  await page.screenshot({ path: 'test-results/source-opening-replay.png', fullPage: true });
}

test.describe('source-sized visual comparison', () => {
  test.use({ deviceScaleFactor: 2 });

  test('source opening replay matches the 20-second score, move count, and exposed cards', async ({ page }) => {
    await runSourceOpeningReplay(page);
  });

  test('source Settings controls, support links, and scroll match the captured page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Game menu' }).click();
    await page.getByRole('button', { name: 'Settings and themes' }).click();
    await expect(page.getByRole('heading', { name: 'Convention' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Game Mode' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Preferences' })).toBeVisible();

    const audioSwitch = page.getByRole('switch', { name: 'Audio' });
    const initialChecked = await audioSwitch.getAttribute('aria-checked');
    const initialSprite = await audioSwitch.locator('img').getAttribute('src');
    await expect(audioSwitch.locator('img')).toHaveJSProperty('naturalWidth', 123);
    await audioSwitch.click();
    await expect(audioSwitch).toHaveAttribute('aria-checked', initialChecked === 'true' ? 'false' : 'true');
    await expect(audioSwitch.locator('img')).not.toHaveAttribute('src', initialSprite);

    const drawOne = page.getByRole('button', { name: 'Draw 1 card' });
    await drawOne.click();
    await expect(page.locator('body')).toHaveClass(/source-settings-draw-mode/);
    await expect(page.locator('.source-draw-mode-reference')).toBeVisible();
    await expect(page.locator('.source-draw-mode-reference')).toHaveJSProperty('naturalWidth', 787);
    await page.getByRole('button', { name: 'Draw 3 cards' }).click();
    await expect(page.locator('.source-draw-mode-reference')).toBeHidden();

    const content = page.locator('#modal-content');
    expect(await content.evaluate((element) => element.scrollHeight)).toBeGreaterThan(await content.evaluate((element) => element.clientHeight));
    await page.getByRole('heading', { name: 'Support' }).scrollIntoViewIfNeeded();
    await expect(page.getByRole('button', { name: 'How to play' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Rate Us' })).toHaveAttribute('href', 'https://apps.apple.com/us/app/solitaire-master/id6464113198?platform=ipad');
    await expect(page.getByRole('link', { name: 'Contact Us' })).toHaveAttribute('href', 'mailto:solitaire-support@hungrystudio.com');
    await expect(page.getByRole('link', { name: 'Terms of services' })).toHaveAttribute('href', 'https://www.hungrystudio.com/serviceus.html');
    await expect(page.getByRole('link', { name: 'Privacy Policy' })).toHaveAttribute('href', 'https://www.hungrystudio.com/privacyus.html');
    await expect(page.getByText('44-250625f152')).toBeVisible();
    await page.getByRole('button', { name: 'How to play' }).click();
    await expect(page.locator('#modal-title')).toHaveText('How to play');
    await expect(page.getByText('Build the foundations')).toBeVisible();
  });

});

test.describe('source-sized face gallery', () => {
  test.use({ viewport: { width: 442, height: 960 }, deviceScaleFactor: 2 });

  test('source-observed samples use the selected face style on the table', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      const cards = [
        { id: 'sample-10d', rank: 10, suit: '♦', faceUp: true },
        { id: 'sample-jc', rank: 11, suit: '♣', faceUp: true },
        { id: 'sample-qh', rank: 12, suit: '♥', faceUp: true },
        { id: 'sample-ks', rank: 13, suit: '♠', faceUp: true },
        { id: 'sample-ad', rank: 1, suit: '♦', faceUp: true },
        { id: 'fallback-8c', rank: 8, suit: '♣', faceUp: true },
      ];
      window.solitaireGame.state.tableau = [...cards.map((card) => [card]), []];
    });
    await page.getByRole('button', { name: 'Game menu' }).click();
    await page.getByRole('button', { name: 'Settings and themes' }).click();
    await page.getByRole('button', { name: 'Themes' }).click();
    await page.getByRole('button', { name: 'Card faces' }).click();

    for (const style of [3, 4, 5]) {
      await page.locator(`.face-tile[data-value="style-${style}"]`).click();
      const cards = ['10-of-diamonds', 'jack-of-clubs', 'queen-of-hearts', 'king-of-spades', 'ace-of-diamonds'];
      for (const [index, name] of cards.entries()) {
        await expect(page.locator('.card-face-art').nth(index)).toHaveAttribute('src', `/assets/cards/face-style-${style}-${name}-reference.png`);
      }
      await expect(page.locator('.card-face-art').nth(5)).toHaveAttribute('src', '/assets/cards/8-of-clubs-reference.png');
      await expect.poll(() => page.locator('.card-face-art').evaluateAll((images) => images.length === 6 && images.every((image) => image.complete && image.naturalWidth === 118 && image.naturalHeight === 177))).toBe(true);
    }
  });

  test('five face-style preview strips align to the 325-second source frame', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Game menu' }).click();
    await page.getByRole('button', { name: 'Settings and themes' }).click();
    await page.getByRole('button', { name: 'Themes' }).click();
    await page.getByRole('button', { name: 'Card faces' }).click();
    await page.locator('.theme-gallery').evaluate(async (element) => {
      await Promise.all(element.getAnimations({ subtree: true }).map((animation) => animation.finished.catch(() => {})));
    });
    await expect.poll(() => page.locator('.face-tile img').evaluateAll((images) => images.length === 5 && images.every((image) => image.complete && image.naturalWidth === 607 && image.naturalHeight === 197))).toBe(true);
    const sourcePixelRects = await page.locator('.face-tile img').evaluateAll((images) => images.map((image) => {
      const rect = image.getBoundingClientRect();
      return [rect.x * devicePixelRatio, rect.y * devicePixelRatio, rect.width * devicePixelRatio, rect.height * devicePixelRatio];
    }));
    expect(sourcePixelRects).toEqual([
      [139, 554, 607, 197],
      [139, 809, 607, 197],
      [139, 1063, 607, 197],
      [139, 1318, 607, 197],
      [139, 1574, 607, 197],
    ]);
    await page.screenshot({ path: 'test-results/theme-face-gallery-source.png' });
  });
});

test.describe('source-sized card-back gallery', () => {
  test.use({ viewport: { width: 442, height: 960 }, deviceScaleFactor: 2 });

  test('eight card-back previews align to the 327-second source frame', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Game menu' }).click();
    await page.getByRole('button', { name: 'Settings and themes' }).click();
    await page.getByRole('button', { name: 'Themes' }).click();
    await page.getByRole('button', { name: 'Card backs' }).click();
    await page.locator('.theme-gallery').evaluate(async (element) => {
      await Promise.all(element.getAnimations({ subtree: true }).map((animation) => animation.finished.catch(() => {})));
    });
    await expect(page.locator('.back-tile')).toHaveCount(8);
    await expect.poll(() => page.locator('.back-tile img').evaluateAll((images) => images.length === 8 && images.every((image) => image.complete && image.naturalWidth > 0))).toBe(true);
    const sourcePixelRects = await page.locator('.back-tile').evaluateAll((tiles) => tiles.map((tile) => {
      const rect = tile.getBoundingClientRect();
      return [rect.x, rect.y, rect.width, rect.height].map((value) => Math.round(value * devicePixelRatio));
    }));
    const expectedRects = [
      [100, 513, 200, 300], [342, 513, 200, 300], [583, 513, 200, 300],
      [100, 869, 200, 300], [342, 869, 200, 300], [583, 869, 200, 300],
      [100, 1224, 200, 300], [342, 1224, 200, 300],
    ];
    sourcePixelRects.forEach((actual, index) => actual.forEach((value, axis) => {
      expect(Math.abs(value - expectedRects[index][axis])).toBeLessThanOrEqual(1);
    }));
    await expect(page.locator('.back-tile[data-value="ruby"]')).toHaveAttribute('aria-pressed', 'true');
    await page.screenshot({ path: 'test-results/theme-back-gallery-source.png' });
  });
});

test.describe('source-sized background gallery', () => {
  test.use({ viewport: { width: 442, height: 960 }, deviceScaleFactor: 2 });

  test('source preview art and two-row shapes align to the 323-second frame', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Game menu' }).click();
    await page.getByRole('button', { name: 'Settings and themes' }).click();
    await page.getByRole('button', { name: 'Themes' }).click();
    await page.locator('.theme-gallery').evaluate(async (element) => {
      await Promise.all(element.getAnimations({ subtree: true }).map((animation) => animation.finished.catch(() => {})));
    });
    await expect.poll(() => page.locator('.background-tile img').evaluateAll((images) => images.length === 11 && images.every((image) => image.complete && image.naturalWidth > 0))).toBe(true);

    const sourcePixelRects = await page.locator('.background-tile').evaluateAll((tiles) => tiles.slice(0, 8).map((tile) => {
      const rect = tile.getBoundingClientRect();
      return [rect.x * devicePixelRatio, rect.y * devicePixelRatio, rect.width * devicePixelRatio, rect.height * devicePixelRatio].map((value) => Math.round(value));
    }));
    const expected = [
      [108, 489, 306, 125], [469, 489, 306, 125],
      [108, 676, 306, 306], [469, 676, 306, 306],
      [108, 1043, 306, 306], [469, 1043, 306, 306],
      [108, 1412, 306, 306], [469, 1412, 306, 306],
    ];
    sourcePixelRects.forEach((actual, index) => actual.forEach((value, axis) => {
      expect(Math.abs(value - expected[index][axis])).toBeLessThanOrEqual(axis === 0 && index % 2 === 1 ? 2 : 2);
    }));
    await page.screenshot({ path: 'test-results/theme-background-gallery-source.png' });

    const lowerGallery = await page.locator('#modal-content').evaluate((content) => {
      content.scrollTop = content.scrollHeight;
      const title = document.querySelector('.theme-gallery-title').getBoundingClientRect();
      const tabs = document.querySelector('.gallery-tabs').getBoundingClientRect();
      const lowerTiles = ['green-9', 'green-10', 'green-11'].map((theme) => {
        const rect = document.querySelector(`[data-value="${theme}"]`).getBoundingClientRect();
        return [Math.round(rect.x * devicePixelRatio), Math.round(rect.y * devicePixelRatio), Math.round(rect.width * devicePixelRatio), Math.round(rect.height * devicePixelRatio)];
      });
      return {
        titleBottom: Math.round(title.bottom),
        tabsTop: Math.round(tabs.top),
        tiles: lowerTiles,
        scrollTop: content.scrollTop,
      };
    });
    expect(lowerGallery.tabsTop).toBe(lowerGallery.titleBottom);
    expect(lowerGallery.scrollTop).toBeGreaterThan(0);
    const expectedLowerRects = [[108, 1083, 306, 306], [469, 1083, 306, 306], [108, 1452, 306, 306]];
    lowerGallery.tiles.forEach((actual, index) => actual.forEach((value, axis) => {
      expect(Math.abs(value - expectedLowerRects[index][axis])).toBeLessThanOrEqual(2);
    }));
    await page.getByRole('button', { name: 'Green 11 background' }).click();
    await expect(page.locator('body')).toHaveAttribute('data-theme', 'green-11');
    await expect(page.locator('[data-value="green-11"]')).toHaveAttribute('aria-pressed', 'true');
  });
});

test('reference card illustrations render on matching cards', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    const suits = ['♠', '♥', '♦', '♣'];
    const cards = suits.flatMap((suit) => Array.from({ length: 13 }, (_, index) => ({
      id: `${suit}-${index + 1}`,
      suit,
      rank: index + 1,
      faceUp: false,
    })));
    const dealOrder = Array(28).fill(null);
    const referenceFaces = [
      [0, '♦', 5],
      [1, '♦', 1],
      [2, '♣', 7],
      [3, '♦', 10],
      [4, '♥', 8],
      [5, '♦', 3],
      [6, '♠', 3],
      [7, '♦', 9],
      [8, '♥', 2],
      [10, '♦', 7],
      [11, '♣', 4],
      [9, '♠', 4],
      [14, '♠', 8],
      [20, '♥', 3],
      [27, '♣', 6],
      [12, '♣', 3],
      [13, '♣', 5],
      [15, '♦', 8],
      [16, '♠', 10],
      [17, '♠', 5],
      [18, '♠', 7],
      [19, '♦', 4],
      [21, '♣', 9],
      [22, '♥', 9],
      [24, '♣', 10],
    ];
    const used = new Set();
    for (const [position, suit, rank] of referenceFaces) {
      const card = cards.find((candidate) => candidate.suit === suit && candidate.rank === rank);
      dealOrder[position] = card;
      used.add(card.id);
    }
    const remaining = cards.filter((card) => !used.has(card.id));
    for (let position = 0; position < dealOrder.length; position += 1) {
      if (!dealOrder[position]) dealOrder[position] = remaining.shift();
    }
    const stock = cards.filter((card) => !dealOrder.some((dealt) => dealt.id === card.id));
    window.solitaireGame.newGame([...stock, ...dealOrder.reverse()]);
    window.solitaireGame.state.tableau[1][0].faceUp = true;
    window.solitaireGame.state.tableau[2][0].faceUp = true;
    window.solitaireGame.state.tableau[3][0].faceUp = true;
    const eightHearts = window.solitaireGame.state.tableau.flat().find((card) => card.suit === '♥' && card.rank === 8);
    if (!eightHearts) throw new Error('The test deal did not place the eight of hearts in the tableau.');
    eightHearts.faceUp = true;
    const nineDiamonds = window.solitaireGame.state.tableau.flat().find((card) => card.suit === '♦' && card.rank === 9);
    if (!nineDiamonds) throw new Error('The test deal did not place the nine of diamonds in the tableau.');
    nineDiamonds.faceUp = true;
    const nineHearts = window.solitaireGame.state.tableau.flat().find((card) => card.suit === '♥' && card.rank === 9);
    if (!nineHearts) throw new Error('The test deal did not place the nine of hearts in the tableau.');
    nineHearts.faceUp = true;
    const twoHearts = window.solitaireGame.state.tableau.flat().find((card) => card.suit === '♥' && card.rank === 2);
    if (!twoHearts) throw new Error('The test deal did not place the two of hearts in the tableau.');
    twoHearts.faceUp = true;
    const sevenDiamonds = window.solitaireGame.state.tableau.flat().find((card) => card.suit === '♦' && card.rank === 7);
    if (!sevenDiamonds) throw new Error('The test deal did not place the seven of diamonds in the tableau.');
    sevenDiamonds.faceUp = true;
    const fourClubs = window.solitaireGame.state.tableau.flat().find((card) => card.suit === '♣' && card.rank === 4);
    if (!fourClubs) throw new Error('The test deal did not place the four of clubs in the tableau.');
    fourClubs.faceUp = true;
    const tenClubs = window.solitaireGame.state.tableau.flat().find((card) => card.suit === '♣' && card.rank === 10);
    if (!tenClubs) throw new Error('The test deal did not place the ten of clubs in the tableau.');
    tenClubs.faceUp = true;
    for (const [suit, rank] of [['♣', 3], ['♣', 5], ['♦', 8], ['♠', 10], ['♠', 5], ['♠', 7], ['♦', 4], ['♣', 9]]) {
      const card = window.solitaireGame.state.tableau.flat().find((candidate) => candidate.suit === suit && candidate.rank === rank);
      if (!card) throw new Error(`The test deal did not place ${rank}${suit} in the tableau.`);
      card.faceUp = true;
    }
    window.solitaireGame.save();
  });
  await page.reload();
  await page.waitForTimeout(1600);
  const referenceArt = [
    '5-of-diamonds-reference.png',
    '7-of-clubs-reference.png',
    '3-of-diamonds-reference.png',
    '4-of-spades-reference.png',
    '8-of-spades-reference.png',
    '3-of-hearts-reference.png',
    '6-of-clubs-reference.png',
    'ace-of-diamonds-reference.png',
    '10-of-diamonds-reference.png',
    '3-of-spades-reference.png',
    '3-of-clubs-reference.png',
    '5-of-clubs-reference.png',
    '8-of-diamonds-reference.png',
    '10-of-spades-reference.png',
    '5-of-spades-reference.png',
    '7-of-spades-reference.png',
    '4-of-diamonds-reference.png',
    '9-of-clubs-reference.png',
    '8-of-hearts-reference.png',
    '9-of-diamonds-reference.png',
    '9-of-hearts-reference.png',
    '2-of-hearts-reference.png',
    '7-of-diamonds-reference.png',
    '4-of-clubs-reference.png',
    '10-of-clubs-reference.png',
  ];
  for (const filename of referenceArt) {
    const image = page.locator(`.card-face-art[src$="${filename}"]`);
    await expect(image).toHaveCount(1);
    await expect.poll(() => image.evaluate((element) => element.complete && element.naturalWidth === 118 && element.naturalHeight === 177)).toBe(true);
  }
  const tenClubsAssetHash = await page.evaluate(async () => {
    const response = await fetch('/assets/cards/10-of-clubs-reference.png');
    const bytes = await response.arrayBuffer();
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
  });
  expect(tenClubsAssetHash).toBe(sourceArtSrgbHashes['cards/10-of-clubs-reference.png']);
  const nineHeartsAssetHash = await page.evaluate(async () => {
    const response = await fetch('/assets/cards/9-of-hearts-reference.png');
    const bytes = await response.arrayBuffer();
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
  });
  expect(nineHeartsAssetHash).toBe(sourceArtSrgbHashes['cards/9-of-hearts-reference.png']);
  const bluePixelsInEightHeartsCorner = await page.evaluate(async () => {
    const response = await fetch('/assets/cards/8-of-hearts-reference.png');
    const image = new Image();
    image.src = URL.createObjectURL(await response.blob());
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext('2d');
    context.drawImage(image, 0, 0);
    const pixels = context.getImageData(80, 70, 38, 107).data;
    let count = 0;
    for (let index = 0; index < pixels.length; index += 4) {
      const [red, green, blue] = pixels.slice(index, index + 3);
      if (blue > red * 1.15 && blue > green * 1.02 && blue > 75) count += 1;
    }
    return count;
  });
  expect(bluePixelsInEightHeartsCorner).toBe(0);
});

test('settings change draw count and hand layout; a new deal resets the board', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Game menu' }).click();
  await page.getByRole('button', { name: 'Settings and themes' }).click();
  await expect(page.locator('.source-settings-card-shell')).toBeVisible();
  await expect(page.locator('.source-settings-card-shell')).toHaveCSS('background-color', 'rgb(238, 237, 241)');
  await page.getByRole('button', { name: 'Draw 3 cards' }).click();
  await page.getByRole('switch', { name: 'Left Hand' }).click();
  await expect(page.locator('body')).toHaveClass(/left-hand/);
  const stockBox = await page.locator('.stock-slot').boundingBox();
  const wasteBox = await page.locator('.waste-slot').boundingBox();
  const foundationBox = await page.locator('.foundation-slot[data-pile="0"]').boundingBox();
  expect(stockBox.x).toBeLessThan(foundationBox.x);
  expect(stockBox.x).toBeLessThan(wasteBox.x);
  expect(wasteBox.x).toBeLessThan(foundationBox.x);
  await page.getByRole('button', { name: 'Themes' }).click();
  await page.getByRole('button', { name: 'Card backs' }).click();
  await expect(page.locator('.back-tile')).toHaveCount(8);
  await page.locator('.back-tile[data-value="blue"]').click();
  await expect(page.locator('body')).toHaveAttribute('data-card-back', 'blue');
  await expect(page.locator('.card-back-art').first()).toHaveAttribute('src', '/assets/cards/back-blue-reference.png');
  await page.locator('.back-tile[data-value="ruby"]').click();
  await expect(page.locator('body')).toHaveAttribute('data-card-back', 'ruby');
  await expect(page.locator('.card-back-art').first()).toHaveAttribute('src', '/assets/cards/back-solitaire-master-source.png');
  await page.getByRole('button', { name: 'Backgrounds' }).click();
  await page.getByRole('button', { name: 'Mountain background' }).click();
  await expect(page.locator('body')).toHaveAttribute('data-theme', 'mountain');
  await expect(page.locator('.waste-slot .empty-slot-mark')).toHaveCSS('display', 'block');
  await expect(page.locator('.timer-frame-source')).toHaveCSS('display', 'none');
  await expect(page.locator('.timer-frame-vector')).toBeVisible();
  expect(await page.locator('body').evaluate((body) => getComputedStyle(body).backgroundImage)).toContain('/assets/themes/mountain-valley.jpg');
  expect((await page.request.get('/assets/themes/mountain-valley.jpg')).ok()).toBe(true);
  await page.getByRole('button', { name: 'Close dialog' }).click();
  await page.reload();
  await expect(page.locator('body')).toHaveAttribute('data-theme', 'mountain');
  for (const oldBack of ['emerald', 'midnight']) {
    await page.evaluate((cardBack) => {
      const save = JSON.parse(localStorage.getItem('solitaire-master-game-v1'));
      save.state.cardBack = cardBack;
      localStorage.setItem('solitaire-master-game-v1', JSON.stringify(save));
    }, oldBack);
    await page.reload();
    await expect(page.locator('body')).toHaveAttribute('data-card-back', 'blue');
    await expect(page.locator('.card-back-art').first()).toHaveAttribute('src', '/assets/cards/back-blue-reference.png');
    await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('solitaire-master-game-v1')).state.cardBack)).toBe('blue');
  }
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
  await expect(page.locator('body')).toHaveAttribute('data-card-back', 'blue');
  await page.reload();
  await expect(page.locator('#moves-value')).toHaveText('0');
  await expect(page.locator('body')).toHaveClass(/left-hand/);
  await expect(page.locator('body')).toHaveAttribute('data-card-back', 'blue');
});

test('theme gallery switches backgrounds, card backs, and face styles on mobile', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('body')).toHaveClass(/source-action-row/);
  await page.getByRole('button', { name: 'Game menu' }).click();
  await page.getByRole('button', { name: 'Settings and themes' }).click();
  await page.getByRole('button', { name: 'Themes' }).click();
  await expect(page.getByRole('dialog', { name: 'Themes' })).toBeVisible();
  await expect(page.locator('.background-tile')).toHaveCount(11);
  await expect(page.locator('.background-tile img')).toHaveCount(11);
  await expect.poll(() => page.locator('.background-tile img').evaluateAll((images) => images.every((image) => image.complete && image.naturalWidth > 0))).toBe(true);
  await expect(page.locator('.theme-gallery')).toHaveCSS('height', `${await page.evaluate(() => window.innerHeight)}px`);
  await expect(page.locator('.theme-gallery-title')).toHaveCSS('background-image', /theme-gallery-header-reference\.png/);
  await expect(page.locator('.gallery-tabs-reference')).toHaveAttribute('src', '/assets/ui/theme-gallery-tabs-backgrounds-reference.png');
  await page.getByRole('button', { name: 'Mountain background' }).click();
  await expect(page.locator('body')).toHaveAttribute('data-theme', 'mountain');
  await expect(page.locator('body')).not.toHaveClass(/source-action-row/);
  await expect(page.locator('.background-tile.chosen')).toHaveCount(1);
  await expect(page.locator('.menu-source-art')).toHaveCSS('display', 'none');
  await expect(page.locator('.menu-theme-icon')).toBeVisible();
  await expect(page.locator('.foundation-source-art').first()).toHaveCSS('display', 'none');
  await expect(page.locator('.foundation-theme-mark').first()).toBeVisible();

  await page.getByRole('button', { name: 'Card backs' }).click();
  await expect(page.locator('.gallery-tabs-reference')).toHaveAttribute('src', '/assets/ui/theme-gallery-tabs-backs-reference.png');
  await expect(page.locator('.back-tile')).toHaveCount(8);
  await expect.poll(() => page.locator('.back-tile img').evaluateAll((images) => images.every((image) => image.complete && image.naturalWidth > 0))).toBe(true);
  await expect(page.locator('.back-tile[data-value="blue"] img')).toHaveAttribute('src', '/assets/cards/back-blue-gallery-reference.png');
  await expect.poll(() => page.locator('.back-tile[data-value="blue"] img').evaluate((image) => image.naturalWidth === 200 && image.naturalHeight === 300)).toBe(true);
  await expect(page.locator('.back-tile[data-value="ruby"] .back-selected-source-art')).toHaveAttribute('src', '/assets/cards/back-ruby-gallery-selected-reference.png');
  await expect(page.locator('.back-tile[data-value="ruby"] .back-preview-source img')).toHaveCount(0);
  await page.screenshot({ path: 'test-results/theme-gallery-mobile.png' });
  for (const [name, value] of [
    ['Teal diamonds', 'teal'], ['Blue lattice', 'lattice'], ['Blue diamonds', 'blue'],
    ['Blue spade', 'spade'], ['Coral geometric', 'coral'], ['Red floral', 'floral'],
    ['Amber diamonds', 'amber'],
  ]) {
    await page.getByRole('button', { name }).click();
    await expect(page.locator('body')).toHaveAttribute('data-card-back', value);
    await expect(page.locator('.stock-slot .card-back-art')).toHaveAttribute('src', `/assets/cards/back-${value}-reference.png`);
    await expect.poll(() => page.locator('.stock-slot .card-back-art').evaluate((image) => image.complete && image.naturalWidth === 118 && image.naturalHeight === 177)).toBe(true);
  }

  await page.getByRole('button', { name: 'Card faces' }).click();
  await expect(page.locator('.gallery-tabs-reference')).toHaveAttribute('src', '/assets/ui/theme-gallery-tabs-faces-reference.png');
  await expect(page.locator('.face-tile')).toHaveCount(5);
  await expect.poll(() => page.locator('.face-tile img').evaluateAll((images) => images.length === 5 && images.every((image) => image.complete && image.naturalWidth === 607 && image.naturalHeight === 197))).toBe(true);
  await page.locator('.face-tile[data-value="style-3"]').click();
  await expect(page.locator('body')).toHaveAttribute('data-card-face-style', 'style-3');
  await expect(page.locator('.face-tile[data-value="style-3"]')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('.face-tile[data-value="style-5"]').click();
  await expect(page.locator('body')).toHaveAttribute('data-card-face-style', 'style-5');
  await expect(page.locator('.face-tile[data-value="style-5"]')).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Classic card faces' }).click();
  await expect(page.locator('body')).toHaveAttribute('data-card-face-style', 'classic');
  await expect(page.locator('.card-face-art').first()).toHaveAttribute('src', /\.svg$/);
  await page.getByRole('button', { name: 'Solitaire Master card faces' }).click();
  await expect(page.locator('body')).toHaveAttribute('data-card-face-style', 'master');
  await page.getByRole('button', { name: 'Close dialog' }).click();
  await page.reload();
  await expect(page.locator('body')).toHaveAttribute('data-card-back', 'amber');
  await expect(page.locator('body')).toHaveAttribute('data-card-face-style', 'master');
  await expect(page.locator('body')).not.toHaveClass(/source-action-row/);
});

test('source-matched combo feedback appears on quick consecutive moves and resets after a pause', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    const deck = ['♠', '♥', '♦', '♣'].flatMap((suit) => Array.from({ length: 13 }, (_, index) => ({ id: `${suit}-${index + 1}`, suit, rank: index + 1, faceUp: false })));
    const tops = [[51, '♠', 5], [49, '♥', 6], [46, '♦', 7], [42, '♣', 8], [37, '♣', 9], [31, '♥', 10], [24, '♠', 13], [25, '♥', 12], [26, '♣', 11]];
    for (const [index, suit, rank] of tops) {
      const cardIndex = deck.findIndex((card) => card.id === `${suit}-${rank}`);
      [deck[index], deck[cardIndex]] = [deck[cardIndex], deck[index]];
    }
    window.solitaireGame.newGame(deck);
  });
  await page.reload();
  await page.waitForTimeout(1200);
  await page.evaluate(() => {
    window.comboAudioCues = [];
    window.solitaireAudio.play = async (cue) => { window.comboAudioCues.push(cue); };
  });
  const move = async (card, target) => {
    await page.locator(`[data-card-id="${card}"]`).click();
    await page.locator(`[data-card-id="${target}"]`).click();
  };
  await move('♠-5', '♥-6');
  await expect(page.locator('#moves-value')).toHaveText('1');
  await expect(page.locator('.combo-feedback')).toHaveCount(0);
  await move('♦-7', '♣-8');
  await expect(page.locator('#moves-value')).toHaveText('2');
  await expect(page.locator('.combo-feedback')).toHaveText('COMBO1');
  await expect(page.locator('.combo-feedback')).toHaveAttribute('aria-label', 'Combo 1');
  await page.waitForTimeout(150);
  await page.screenshot({ path: 'test-results/mobile-combo-1.png' });
  await move('♣-9', '♥-10');
  await expect(page.locator('#moves-value')).toHaveText('3');
  await expect(page.locator('.combo-feedback')).toHaveText('COMBO2');
  await expect(page.locator('.combo-good, .combo-great, .combo-amazing')).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => window.comboAudioCues.includes('great'))).toBe(false);
  await page.waitForTimeout(150);
  await page.screenshot({ path: 'test-results/mobile-combo-2-tableau.png' });
  await page.locator('.pile-column[data-pile="6"] [data-card-id="♠-13"]').click();
  await page.locator('.pile-column[data-pile="0"]').click();
  await expect(page.locator('#moves-value')).toHaveText('4');
  await expect(page.locator('.combo-feedback')).toHaveText('COMBO3');
  await move('♥-12', '♠-13');
  await expect(page.locator('#moves-value')).toHaveText('5');
  await expect(page.locator('.combo-feedback')).toHaveText('COMBO4');
  await expect(page.locator('.combo-good, .combo-great, .combo-amazing')).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => window.comboAudioCues.includes('amazing'))).toBe(false);
  const comboBounds = await page.locator('.combo-feedback').evaluate((label) => {
    const labelRect = label.getBoundingClientRect();
    const boardRect = label.parentElement.getBoundingClientRect();
    return { centerX: labelRect.left + labelRect.width / 2, centerY: labelRect.top + labelRect.height / 2, boardCenterX: boardRect.left + boardRect.width / 2, boardTop: boardRect.top };
  });
  expect(comboBounds.centerX).toBeCloseTo(comboBounds.boardCenterX, 0);
  expect(comboBounds.centerY - comboBounds.boardTop).toBeGreaterThan(-5);
  expect(comboBounds.centerY - comboBounds.boardTop).toBeLessThan(40);
  await page.waitForTimeout(150);
  await page.screenshot({ path: 'test-results/mobile-combo-4-tableau.png' });
  await page.evaluate(() => {
    const state = window.solitaireGame.state;
    state.comboLastMoveAt = Date.now() - 5501;
    window.solitaireGame.save();
  });
  await move('♣-11', '♥-12');
  await expect(page.locator('#moves-value')).toHaveText('6');
  await expect(page.locator('.combo-feedback')).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => window.solitaireGame.state.comboCount)).toBe(0);
});

test('foundation placements show source feedback and sound only at observed combo tiers', async ({ page }) => {
  await page.goto('/');
  const tiers = [
    { combo: 1, name: 'Good', selector: '.combo-good', cue: 'good', width: 244, actionCues: [{ cue: 'good', delaySeconds: 0 }] },
    { combo: 2, name: 'Great', selector: '.combo-great', cue: 'great', width: 244, actionCues: [{ cue: 'foundation', delaySeconds: 0 }, { cue: 'great', delaySeconds: 0.7 }] },
    { combo: 4, name: 'Amazing', selector: '.combo-amazing', cue: 'amazing', width: 520, actionCues: [{ cue: 'foundation', delaySeconds: 0 }, { cue: 'amazing', delaySeconds: 0.5 }] },
  ];
  for (const tier of tiers) {
    await page.evaluate((targetCombo) => {
      const game = window.solitaireGame;
      const state = game.state;
      const ace = [...state.stock, ...state.waste, ...state.tableau.flat(), ...state.foundations.flat()]
        .find((card) => card.suit === '♥' && card.rank === 1);
      if (!ace) throw new Error('The test deal is missing the ace of hearts.');
      const removeAce = (pile) => {
        for (let index = pile.length - 1; index >= 0; index -= 1) if (pile[index].id === ace.id) pile.splice(index, 1);
      };
      removeAce(state.stock);
      removeAce(state.waste);
      state.tableau.forEach(removeAce);
      state.foundations.forEach(removeAce);
      ace.id = 'test-ace-hearts';
      ace.faceUp = true;
      state.tableau[0] = [ace];
      state.foundations = [[], [], [], []];
      state.comboCount = 0;
      state.comboLastMoveAt = 0;
      state.moves = targetCombo - 1;
      state.score = 0;
      state.history = [];
      state.selected = null;
      state.hint = null;
      state.won = false;
      game.save();
    }, tier.combo);
    await page.reload();
    await page.waitForTimeout(1200);
    await page.evaluate((targetCombo) => {
      window.solitaireGame.state.comboCount = targetCombo - 1;
      window.solitaireGame.state.comboLastMoveAt = Date.now() - 1000;
      window.solitaireGame.save();
      window.rewardCues = [];
      window.solitaireAudio.play = async (cue, delaySeconds = 0) => { window.rewardCues.push({ cue, delaySeconds }); };
    }, tier.combo);
    await page.locator('[data-card-id="test-ace-hearts"]').click();
    await page.evaluate(() => { window.rewardCues = []; });
    await page.locator('.foundation-slot[data-pile="0"]').click();
    await expect(page.locator('.combo-feedback')).toHaveAttribute('aria-label', `Combo ${tier.combo}`);
    await expect(page.locator(tier.selector)).toContainText(tier.name);
    await expect.poll(() => page.evaluate((cue) => window.rewardCues.some((event) => event.cue === cue), tier.cue)).toBe(true);
    await expect.poll(() => page.evaluate(() => window.rewardCues)).toEqual(tier.actionCues);
    await expect(page.locator('.combo-good, .combo-great, .combo-amazing')).toHaveCount(1);
    const art = page.locator(`${tier.selector} .combo-reward-art`);
    await expect(art).toHaveAttribute('src', `/assets/feedback/combo-${tier.cue}.webp`);
    await expect.poll(() => art.evaluate((image) => image.complete && image.naturalWidth)).toBe(tier.width);
    await page.waitForTimeout(350);
    await page.screenshot({ path: `test-results/foundation-reward-${tier.name.toLowerCase()}.png` });
  }
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
  await expect.poll(() => page.locator('.modal-card').evaluate((modal) => modal.getAnimations().every((animation) => animation.playState === 'finished'))).toBe(true);
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
    game.state.autoCollect = false;
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
  await page.evaluate(() => {
    window.gameAudioCues = [];
    const audio = window.solitaireAudio;
    const play = audio.play.bind(audio);
    audio.play = (cue) => { window.gameAudioCues.push(cue); return play(cue); };
  });

  for (let pile = 0; pile < 4; pile += 1) {
    await page.locator(`#tableau .pile-column[data-pile="${pile}"] .playing-card`).click();
    await page.locator(`.foundation-slot[data-pile="${pile}"]`).click();
  }

  await expect(page.locator('.win-streak-backdrop')).toBeVisible();
  await expect(page.locator('.win-streak-title')).toHaveText('winning streak');
  await expect(page.locator('.win-streak-reward img')).toHaveAttribute('src', '/assets/ui/win-streak-trophy-reference.png');
  await expect(page.locator('.win-streak-reward img')).toHaveJSProperty('naturalWidth', 78);
  await expect(page.locator('.win-cascade-card')).toHaveCount(52);
  await page.waitForTimeout(3000);
  const sourceOverlayBounds = await page.evaluate(() => {
    const textBounds = (element) => {
      const range = document.createRange();
      range.selectNodeContents(element);
      const { left, top, width, height } = range.getBoundingClientRect();
      return { left, top, width, height };
    };
    return {
      title: textBounds(document.querySelector('.win-streak-title')),
      rewardTop: document.querySelector('.win-streak-reward').getBoundingClientRect().top,
      continue: textBounds(document.querySelector('.win-streak-continue')),
    };
  });
  expect(sourceOverlayBounds.title.width).toBeGreaterThan(285);
  expect(sourceOverlayBounds.title.width).toBeLessThan(305);
  expect(sourceOverlayBounds.rewardTop).toBeGreaterThan(320);
  expect(sourceOverlayBounds.rewardTop).toBeLessThan(331);
  expect(sourceOverlayBounds.continue.top).toBeGreaterThan(680);
  expect(sourceOverlayBounds.continue.top).toBeLessThan(701);
  const fan = await page.locator('.win-cascade-card').evaluateAll((cards) => ({
    unfinishedAnimations: cards.filter((card) => card.getAnimations().some((animation) => animation.playState !== 'finished')).length,
    firstCard: cards[0].getBoundingClientRect().toJSON(),
    lastCard: cards.at(-1).getBoundingClientRect().toJSON(),
  }));
  expect(fan.unfinishedAnimations).toBe(0);
  expect(fan.firstCard.left).toBeLessThan(fan.lastCard.left);
  expect(fan.firstCard.top).toBeGreaterThan(fan.lastCard.top);
  await page.screenshot({ path: 'test-results/mobile-win-streak.png' });
  await page.getByRole('button', { name: 'Tap to Continue' }).click();
  await expect(page.locator('.win-result-backdrop')).toBeVisible();
  expect(await page.evaluate(() => window.gameAudioCues.at(-1))).toBe('win');
  await expect(page.locator('.win-result-banner')).toHaveAttribute('src', '/assets/ui/win-banner-reference.png');
  await expect(page.locator('.win-result-score')).toContainText('390');
  await expect(page.locator('.win-result-percent')).toHaveText('You defeated 86% of players!');
  const displayedWinTime = await page.evaluate(() => {
    const seconds = window.solitaireGame.state.seconds;
    return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  });
  await expect(page.locator('.win-result-stats')).toContainText(displayedWinTime);
  await expect(page.locator('.win-result-stats')).toContainText('188');
  await expect(page.locator('.win-result-trophy')).toContainText('1');
  await expect(page.getByRole('button', { name: 'New Deal' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Close dialog' })).toBeHidden();
  await expect.poll(() => page.locator('.win-result img').evaluateAll((images) => images.every((image) => image.complete && image.naturalWidth > 0))).toBe(true);
  await page.screenshot({ path: 'test-results/mobile-win-result.png', fullPage: true });
  const winLayout = await page.locator('.win-result').evaluate((element) => {
    const box = element.getBoundingClientRect();
    const button = element.querySelector('.win-result-new').getBoundingClientRect();
    return { width: box.width, height: box.height, buttonBottom: button.bottom, viewportHeight: innerHeight };
  });
  expect(winLayout.width / winLayout.height).toBeCloseTo(442 / 960, 2);
  expect(winLayout.buttonBottom).toBeLessThanOrEqual(winLayout.viewportHeight);
  await page.getByRole('button', { name: 'New Deal' }).click();
  await expect(page.locator('.modal-backdrop')).toBeHidden();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('solitaire-master-profile-v1')).dailyCompleted)).toContain(challengeDate);
  await page.getByRole('button', { name: 'Game menu' }).click();
  await page.locator('[data-more="daily"]').click();
  await expect(page.locator(`[data-daily-date="${challengeDate}"]`)).toHaveClass(/completed/);
  await expect(page.locator('.daily-progress')).toHaveAttribute('aria-label', /1 of .* challenges completed this month/);
});

test('win clear sequence advances to the result without input', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    const game = window.solitaireGame;
    const cards = game.state.seedDeck.map((card) => ({ ...card, faceUp: true }));
    const suits = ['♠', '♥', '♦', '♣'];
    game.state.stock = [];
    game.state.waste = [];
    game.state.autoCollect = false;
    game.state.foundations = suits.map((suit) => cards.filter((card) => card.suit === suit && card.rank < 13).sort((a, b) => a.rank - b.rank));
    game.state.tableau = [...suits.map((suit) => [cards.find((card) => card.suit === suit && card.rank === 13)]), [], [], []];
    game.state.moves = 0;
    game.state.score = 0;
    game.state.seconds = 0;
    game.state.challenge = null;
    game.state.won = false;
    game.save();
  });
  await page.reload();
  for (let pile = 0; pile < 4; pile += 1) {
    await page.locator(`#tableau .pile-column[data-pile="${pile}"] .playing-card`).click();
    await page.locator(`.foundation-slot[data-pile="${pile}"]`).click();
  }
  await expect(page.locator('.win-streak-backdrop')).toBeVisible();
  await expect(page.locator('.win-result-backdrop')).toBeVisible({ timeout: 6000 });
});

test('auto collect sweeps visible cards into foundations after the final move', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    const game = window.solitaireGame;
    const cards = game.state.seedDeck.map((card) => ({ ...card, faceUp: true }));
    const suits = ['♠', '♥', '♦', '♣'];
    game.state.stock = [];
    game.state.waste = [];
    game.state.foundations = suits.map((suit) => cards.filter((card) => card.suit === suit && card.rank < 12).sort((a, b) => a.rank - b.rank));
    game.state.tableau = suits.map((suit) => [cards.find((card) => card.suit === suit && card.rank === 13), cards.find((card) => card.suit === suit && card.rank === 12)]);
    game.state.autoCollect = true;
    game.state.autoHints = false;
    game.state.won = false;
    game.state.moves = 0;
    game.state.score = 0;
    game.state.seconds = 0;
    game.save();
  });
  await page.reload();
  await page.evaluate(() => {
    window.autoActionCues = [];
    const audio = window.solitaireAudio;
    const play = audio.play.bind(audio);
    audio.play = (cue) => { window.autoActionCues.push(cue); return play(cue); };
  });
  const queen = page.locator('#tableau .pile-column[data-pile="0"] .playing-card[data-index="1"]');
  await queen.click();
  await queen.click();
  await expect(page.locator('.win-streak-backdrop')).toBeVisible({ timeout: 4000 });
  await expect.poll(() => page.evaluate(() => window.solitaireGame.state.foundations.reduce((sum, pile) => sum + pile.length, 0))).toBe(52);
  await expect(page.locator('#tableau .playing-card')).toHaveCount(0);
  expect(await page.evaluate(() => window.autoActionCues.filter((cue) => cue === 'autoCollect'))).toHaveLength(1);
  await expect.poll(() => page.evaluate(() => window.solitaireAudio.referenceAutoCollectBuffer?.duration)).toBeGreaterThan(2.19);
  await page.getByRole('button', { name: 'Tap to Continue' }).click();
  expect(await page.evaluate(() => window.autoActionCues.at(-1))).toBe('win');
});

test('source-bounded auto hints wait through a long idle; manual hints remain available when disabled', async ({ page }) => {
  await page.clock.install();
  await page.goto('/');
  await page.evaluate(() => {
    const game = window.solitaireGame;
    const ace = { ...game.state.seedDeck.find((card) => card.id === '♠-1'), faceUp: true };
    game.state.stock = [];
    game.state.waste = [];
    game.state.foundations = Array.from({ length: 4 }, () => []);
    game.state.tableau = [[ace], [], [], [], [], [], []];
    game.state.autoCollect = false;
    game.state.autoHints = true;
    game.state.won = false;
    game.save();
  });
  await page.reload();
  await page.clock.fastForward(2_000);
  await page.clock.fastForward(11_500);
  await expect(page.locator('.card-face.is-hint')).toHaveCount(0);
  await page.clock.fastForward(600);
  await expect(page.locator('.card-face.is-hint')).toHaveCount(1);
  await page.getByRole('button', { name: 'Game menu' }).click();
  await page.getByRole('button', { name: 'Settings and themes' }).click();
  await page.getByRole('switch', { name: 'Auto Hints' }).click();
  await expect(page.getByRole('switch', { name: 'Auto Hints' })).toHaveAttribute('aria-checked', 'false');
  await page.getByRole('button', { name: 'Close dialog' }).click();
  await expect(page.locator('.card-face.is-hint')).toHaveCount(0);
  await page.getByRole('button', { name: 'Hint' }).click();
  await expect(page.locator('.card-face.is-hint')).toHaveCount(1);
});

test('the Magic control plays one legal suggestion and undo reverses it', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('body')).toHaveClass(/source-action-row/);
  await expect(page.locator('.action-row-reference-art')).toHaveAttribute('src', '/assets/ui/action-row-initial-reference.png');
  await expect(page.locator('#magic-badge')).toHaveText('1');
  await page.getByRole('button', { name: 'Use magic move' }).click();
  await expect(page.locator('#moves-value')).toHaveText('1');
  await expect(page.locator('#magic-badge')).toBeHidden();
  await expect(page.locator('body')).not.toHaveClass(/source-action-row/);
  await page.getByRole('button', { name: 'Undo move' }).click();
  await expect(page.locator('#moves-value')).toHaveText('0');
  await expect(page.locator('#magic-badge')).toHaveText('1');
  await expect(page.locator('body')).toHaveClass(/source-action-row/);
  await expect(page.locator('.action-row-reference-art')).toHaveAttribute('src', '/assets/ui/action-row-initial-reference.png');
});

test('mobile sound unlocks, captured cues retain source level, and ambient music follows its switch', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await page.goto('/');
  await page.evaluate(() => {
    window.audioCues = [];
    window.referenceSampleCalls = [];
    const audio = window.solitaireAudio;
    const playCue = audio.playCue.bind(audio);
    window.audioCueEvents = [];
    audio.playCue = (cue, delaySeconds = 0) => {
      window.audioCues.push(cue);
      window.audioCueEvents.push({ cue, delaySeconds });
      return playCue(cue, delaySeconds);
    };
    const playSample = audio.playSample.bind(audio);
    audio.playSample = (buffer, ...args) => {
      if (buffer === audio.referenceMoveBuffer) {
        window.referenceSampleCalls.push({ cue: window.audioCues.at(-1), gain: args[1] });
      }
      if (buffer === audio.referenceGoodBuffer) {
        window.referenceGoodSamplePlayed = true;
        window.referenceGoodSampleGain = args[1];
      }
      if (buffer === audio.referenceAmazingBuffer) {
        window.referenceAmazingSamplePlayed = true;
        window.referenceAmazingSampleGain = args[1];
        window.referenceAmazingSampleOffset = args[0] - audio.context.currentTime;
      }
      if (buffer === audio.referenceGreatBuffer) {
        window.referenceGreatSamplePlayed = true;
        window.referenceGreatSampleGain = args[1];
        window.referenceGreatSampleOffset = args[0] - audio.context.currentTime;
      }
      if (buffer === audio.referenceFoundationBuffer) {
        window.referenceFoundationSampleCall = { gain: args[1], offset: args[0] - audio.context.currentTime };
      }
      if (buffer === audio.referenceWinBuffer) {
        window.referenceWinSamplePlayed = true;
        window.referenceWinSampleGain = args[1];
      }
      return playSample(buffer, ...args);
    };
  });

  await page.locator('[data-action="stock"]').click();
  await expect.poll(() => page.evaluate(() => window.solitaireAudio.context?.state)).toBe('running');
  await expect.poll(() => page.evaluate(() => window.audioCues.includes('draw'))).toBe(true);
  expect(await page.evaluate(() => window.solitaireAudio.noiseBuffer.length)).toBeGreaterThan(0);
  await expect.poll(() => page.evaluate(() => window.solitaireAudio.referenceMoveBuffer?.duration)).toBeGreaterThan(0.37);
  await expect.poll(() => page.evaluate(() => window.referenceSampleCalls.some((call) => call.cue === 'draw'))).toBe(true);
  const drawOutputGain = await page.evaluate(() => {
    const call = window.referenceSampleCalls.find((sample) => sample.cue === 'draw');
    return call.gain * window.solitaireAudio.masterLevel * window.solitaireAudio.soundLevel;
  });
  expect(drawOutputGain).toBeCloseTo(1, 5);
  await page.evaluate(() => window.solitaireAudio.play('move'));
  await expect.poll(() => page.evaluate(() => window.referenceSampleCalls.some((call) => call.cue === 'move'))).toBe(true);
  const moveOutputGain = await page.evaluate(() => {
    const call = window.referenceSampleCalls.find((sample) => sample.cue === 'move');
    return call.gain * window.solitaireAudio.masterLevel * window.solitaireAudio.soundLevel;
  });
  expect(moveOutputGain).toBeCloseTo(1, 5);
  await expect.poll(() => page.evaluate(() => window.solitaireAudio.referenceGoodBuffer?.duration)).toBeGreaterThan(0.75);
  await page.evaluate(() => window.solitaireAudio.play('good'));
  await expect.poll(() => page.evaluate(() => window.referenceGoodSamplePlayed)).toBe(true);
  const goodOutputGain = await page.evaluate(() => window.referenceGoodSampleGain * window.solitaireAudio.masterLevel * window.solitaireAudio.soundLevel);
  expect(goodOutputGain).toBeCloseTo(1, 5);
  await expect.poll(() => page.evaluate(() => window.solitaireAudio.referenceAmazingBuffer?.duration)).toBeGreaterThan(0.95);
  await page.evaluate(() => window.solitaireAudio.play('amazing', 0.5));
  await expect.poll(() => page.evaluate(() => window.referenceAmazingSamplePlayed)).toBe(true);
  const amazingOutputGain = await page.evaluate(() => window.referenceAmazingSampleGain * window.solitaireAudio.masterLevel * window.solitaireAudio.soundLevel);
  expect(amazingOutputGain).toBeCloseTo(1, 5);
  const amazingOffset = await page.evaluate(() => window.referenceAmazingSampleOffset);
  expect(amazingOffset).toBeCloseTo(0.5, 1);
  await expect.poll(() => page.evaluate(() => window.solitaireAudio.referenceGreatBuffer?.duration)).toBeCloseTo(0.5, 2);
  await page.evaluate(() => window.solitaireAudio.play('great', 0.7));
  await expect.poll(() => page.evaluate(() => window.referenceGreatSamplePlayed)).toBe(true);
  const greatAudio = await page.evaluate(() => ({
    gain: window.referenceGreatSampleGain * window.solitaireAudio.masterLevel * window.solitaireAudio.soundLevel,
    offset: window.referenceGreatSampleOffset,
  }));
  const greatOutputGain = greatAudio.gain;
  expect(greatOutputGain).toBeCloseTo(1, 5);
  expect(greatAudio.offset).toBeCloseTo(0.7, 1);
  await expect.poll(() => page.evaluate(() => window.solitaireAudio.referenceFoundationBuffer?.duration)).toBeGreaterThan(0.8);
  await page.evaluate(() => window.solitaireAudio.play('foundation'));
  await expect.poll(() => page.evaluate(() => window.referenceFoundationSampleCall?.gain)).toBeGreaterThan(0);
  const foundationAudio = await page.evaluate(() => ({
    gain: window.referenceFoundationSampleCall.gain * window.solitaireAudio.masterLevel * window.solitaireAudio.soundLevel,
    offset: window.referenceFoundationSampleCall.offset,
  }));
  expect(foundationAudio.gain).toBeCloseTo(1, 5);
  expect(foundationAudio.offset).toBeCloseTo(0.29, 1);
  await expect.poll(() => page.evaluate(() => window.solitaireAudio.referenceWinBuffer?.duration)).toBeCloseTo(2.14, 2);
  await page.evaluate(() => window.solitaireAudio.play('win'));
  await expect.poll(() => page.evaluate(() => window.referenceWinSamplePlayed)).toBe(true);
  const winOutputGain = await page.evaluate(() => window.referenceWinSampleGain * window.solitaireAudio.masterLevel * window.solitaireAudio.soundLevel);
  expect(winOutputGain).toBeCloseTo(1, 5);

  await page.evaluate(() => window.solitaireAudio.setMusic(true));
  await expect.poll(() => page.evaluate(() => window.solitaireAudio.musicStep)).toBeGreaterThan(0);
  await expect.poll(() => page.evaluate(() => Boolean(window.solitaireAudio.musicTimer))).toBe(true);
  await page.getByRole('button', { name: 'Game menu' }).click();
  await page.getByRole('button', { name: 'Settings and themes' }).click();
  await page.getByRole('switch', { name: 'Audio' }).click();
  await expect.poll(() => page.evaluate(() => window.solitaireAudio.soundOn)).toBe(false);
  expect(await page.evaluate(() => window.solitaireAudio.musicTimer)).toBeNull();
  await page.getByRole('switch', { name: 'Audio' }).click();
  await expect.poll(() => page.evaluate(() => window.solitaireAudio.soundOn)).toBe(true);
  await expect.poll(() => page.evaluate(() => Boolean(window.solitaireAudio.musicTimer))).toBe(true);
  await page.evaluate(() => window.solitaireAudio.setMusic(false));
  await expect.poll(() => page.evaluate(() => window.solitaireAudio.musicOn)).toBe(false);
  expect(await page.evaluate(() => window.solitaireAudio.musicTimer)).toBeNull();
  await page.getByRole('switch', { name: 'Audio' }).click();
  await expect.poll(() => page.evaluate(() => window.solitaireAudio.soundOn)).toBe(false);
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
  const cacheNames = await page.evaluate(() => caches.keys());
  expect(cacheNames).toContain('solitaire-master-v54');
  await expect.poll(() => page.evaluate(async () => {
    const response = await fetch('/assets/audio/auto-collect-reference.wav');
    return response.ok && response.headers.get('content-type') === 'audio/x-wav';
  })).toBe(true);
  expect(cacheNames).not.toContain('solitaire-master-v19');
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
  await expect.poll(() => page.locator('.card-back-art').first().evaluate((image) => image.complete && image.naturalWidth > 0)).toBe(true);
  const offlineThemeImage = await page.evaluate(async () => {
    const response = await fetch('/assets/themes/mountain-valley.jpg');
    return { ok: response.ok, type: response.headers.get('content-type') };
  });
  expect(offlineThemeImage).toEqual({ ok: true, type: 'image/jpeg' });
  const offlineLowerThemeImage = await page.evaluate(async () => {
    const response = await fetch('/assets/themes/theme-background-green-11-reference.png');
    const image = await createImageBitmap(await response.blob());
    return { ok: response.ok, type: response.headers.get('content-type'), width: image.width, height: image.height };
  });
  expect(offlineLowerThemeImage).toEqual({ ok: true, type: 'image/png', width: 298, height: 298 });
  const offlineWinImage = await page.evaluate(async () => {
    const response = await fetch('/assets/ui/win-banner-reference.png');
    return { ok: response.ok, type: response.headers.get('content-type') };
  });
  expect(offlineWinImage).toEqual({ ok: true, type: 'image/png' });
  const offlineWinSound = await page.evaluate(async () => {
    const response = await fetch('/assets/audio/win-reference.wav');
    return { ok: response.ok, type: response.headers.get('content-type') };
  });
  expect(offlineWinSound).toEqual({ ok: true, type: 'audio/x-wav' });
  const offlineCardBack = await page.evaluate(async () => {
    const response = await fetch('/assets/cards/back-solitaire-master-reference.png');
    return { ok: response.ok, type: response.headers.get('content-type'), bytes: (await response.arrayBuffer()).byteLength };
  });
  expect(offlineCardBack.ok).toBe(true);
  expect(offlineCardBack.type).toBe('image/png');
  expect(offlineCardBack.bytes).toBeGreaterThan(5_000);
  const offlineCardBackSource = await page.evaluate(async () => {
    const response = await fetch('/assets/cards/back-solitaire-master-source.png');
    return { ok: response.ok, type: response.headers.get('content-type'), bytes: (await response.arrayBuffer()).byteLength };
  });
  expect(offlineCardBackSource.ok).toBe(true);
  expect(offlineCardBackSource.type).toBe('image/png');
  expect(offlineCardBackSource.bytes).toBeGreaterThan(5_000);
  const offlineCardBackTransition = await page.evaluate(async () => {
    const response = await fetch('/assets/cards/back-solitaire-master.svg');
    return { ok: response.ok, type: response.headers.get('content-type') };
  });
  expect(offlineCardBackTransition).toEqual({ ok: true, type: 'image/svg+xml' });
  const offlineThemeBacks = await page.evaluate(async () => Promise.all(['teal', 'lattice', 'blue', 'spade', 'coral', 'floral', 'amber'].map(async (name) => {
    const response = await fetch(`/assets/cards/back-${name}-reference.png`);
    const image = await createImageBitmap(await response.blob());
    return { ok: response.ok, type: response.headers.get('content-type'), width: image.width, height: image.height };
  })));
  expect(offlineThemeBacks).toEqual(Array(7).fill({ ok: true, type: 'image/png', width: 118, height: 177 }));
  const offlineAmazingCue = await page.evaluate(async () => {
    const response = await fetch('/assets/audio/combo-amazing-reference.wav');
    return { ok: response.ok, audioType: response.headers.get('content-type')?.startsWith('audio/'), bytes: (await response.arrayBuffer()).byteLength };
  });
  expect(offlineAmazingCue.ok).toBe(true);
  expect(offlineAmazingCue.audioType).toBe(true);
  expect(offlineAmazingCue.bytes).toBeGreaterThan(160_000);
  const offlineGoodCue = await page.evaluate(async () => {
    const response = await fetch('/assets/audio/combo-good-reference.wav');
    return { ok: response.ok, audioType: response.headers.get('content-type')?.startsWith('audio/'), bytes: (await response.arrayBuffer()).byteLength };
  });
  expect(offlineGoodCue.ok).toBe(true);
  expect(offlineGoodCue.audioType).toBe(true);
  expect(offlineGoodCue.bytes).toBeGreaterThan(130_000);
  const offlineGreatCue = await page.evaluate(async () => {
    const response = await fetch('/assets/audio/combo-great-reference.wav');
    return { ok: response.ok, audioType: response.headers.get('content-type')?.startsWith('audio/'), bytes: (await response.arrayBuffer()).byteLength };
  });
  expect(offlineGreatCue.ok).toBe(true);
  expect(offlineGreatCue.audioType).toBe(true);
  expect(offlineGreatCue.bytes).toBeGreaterThan(80_000);
  const offlineRewardSprites = await page.evaluate(async () => Promise.all(['good', 'great', 'amazing'].map(async (name) => {
    const response = await fetch(`/assets/feedback/combo-${name}.webp`);
    const bytes = (await response.arrayBuffer()).byteLength;
    return { ok: response.ok, type: response.headers.get('content-type'), bytes };
  })));
  expect(offlineRewardSprites.map(({ ok, type, bytes }) => [ok, type, bytes > 500_000])).toEqual([
    [true, 'image/webp', true],
    [true, 'image/webp', true],
    [true, 'image/webp', true],
  ]);
  const offlineFoundationCue = await page.evaluate(async () => {
    const response = await fetch('/assets/audio/foundation-reference.wav');
    return { ok: response.ok, audioType: response.headers.get('content-type')?.startsWith('audio/'), bytes: (await response.arrayBuffer()).byteLength };
  });
  expect(offlineFoundationCue.ok).toBe(true);
  expect(offlineFoundationCue.audioType).toBe(true);
  expect(offlineFoundationCue.bytes).toBeGreaterThan(100_000);
  const offlineActionIcons = await page.evaluate(async () => Promise.all(['action-play-plus', 'action-magic', 'action-hint', 'action-undo'].map(async (name) => {
    const response = await fetch(`/assets/ui/${name}.png`);
    return response.ok && response.headers.get('content-type') === 'image/png';
  })));
  expect(offlineActionIcons).toEqual(Array(4).fill(true));
  const offlineActionRows = await page.evaluate(async () => Promise.all(['initial', 'used'].map(async (state) => {
    const response = await fetch(`/assets/ui/action-row-${state}-reference.png`);
    return { ok: response.ok, width: (await createImageBitmap(await response.blob())).width };
  })));
  expect(offlineActionRows).toEqual([{ ok: true, width: 844 }, { ok: true, width: 844 }]);
  const offlineSettingsArt = await page.evaluate(async () => Promise.all([
    'settings-switch-on-reference.png',
    'settings-switch-off-reference.png',
    'settings-draw-mode-1-reference.png',
  ].map(async (name) => {
    const response = await fetch(`/assets/ui/${name}`);
    const image = await createImageBitmap(await response.blob());
    return { ok: response.ok, width: image.width, height: image.height };
  })));
  expect(offlineSettingsArt).toEqual([
    { ok: true, width: 123, height: 58 },
    { ok: true, width: 123, height: 58 },
    { ok: true, width: 787, height: 104 },
  ]);
  const offlineThemeGalleryArt = await page.evaluate(async () => Promise.all([
    ['theme-gallery-header-reference.png', 884, 306],
    ['theme-gallery-tabs-backgrounds-reference.png', 884, 156],
    ['theme-gallery-tabs-faces-reference.png', 884, 156],
    ['theme-gallery-tabs-backs-reference.png', 884, 156],
  ].map(async ([name, width, height]) => {
    const response = await fetch(`/assets/ui/${name}`);
    const image = await createImageBitmap(await response.blob());
    return { ok: response.ok, width: image.width, height: image.height, expectedWidth: width, expectedHeight: height };
  })));
  expect(offlineThemeGalleryArt).toEqual([
    { ok: true, width: 884, height: 306, expectedWidth: 884, expectedHeight: 306 },
    { ok: true, width: 884, height: 156, expectedWidth: 884, expectedHeight: 156 },
    { ok: true, width: 884, height: 156, expectedWidth: 884, expectedHeight: 156 },
    { ok: true, width: 884, height: 156, expectedWidth: 884, expectedHeight: 156 },
  ]);
  const offlineBackgroundGalleryArt = await page.evaluate(async () => Promise.all([
    ['lagoon', 298, 117], ['emerald', 304, 117], ['mountain', 298, 298], ['felt', 298, 293],
    ['midnight', 298, 298], ['plum', 304, 298], ['forest', 298, 298], ['violet', 304, 298],
    ['green-9', 298, 298], ['green-10', 304, 298], ['green-11', 298, 298],
  ].map(async ([theme, width, height]) => {
    const response = await fetch(`/assets/themes/theme-background-${theme}-reference.png`);
    const image = await createImageBitmap(await response.blob());
    return { ok: response.ok, width: image.width, height: image.height, expectedWidth: width, expectedHeight: height };
  })));
  expect(offlineBackgroundGalleryArt).toEqual([
    { ok: true, width: 298, height: 117, expectedWidth: 298, expectedHeight: 117 },
    { ok: true, width: 304, height: 117, expectedWidth: 304, expectedHeight: 117 },
    { ok: true, width: 298, height: 298, expectedWidth: 298, expectedHeight: 298 },
    { ok: true, width: 298, height: 293, expectedWidth: 298, expectedHeight: 293 },
    { ok: true, width: 298, height: 298, expectedWidth: 298, expectedHeight: 298 },
    { ok: true, width: 304, height: 298, expectedWidth: 304, expectedHeight: 298 },
    { ok: true, width: 298, height: 298, expectedWidth: 298, expectedHeight: 298 },
    { ok: true, width: 304, height: 298, expectedWidth: 304, expectedHeight: 298 },
    { ok: true, width: 298, height: 298, expectedWidth: 298, expectedHeight: 298 },
    { ok: true, width: 304, height: 298, expectedWidth: 304, expectedHeight: 298 },
    { ok: true, width: 298, height: 298, expectedWidth: 298, expectedHeight: 298 },
  ]);
  const offlineFaceGalleryArt = await page.evaluate(async () => Promise.all([1, 2, 3, 4, 5].map(async (style) => {
    const response = await fetch(`/assets/ui/theme-face-style-${style}-reference.png`);
    const image = await createImageBitmap(await response.blob());
    return { ok: response.ok, width: image.width, height: image.height };
  })));
  expect(offlineFaceGalleryArt).toEqual(Array(5).fill({ ok: true, width: 607, height: 197 }));
  const offlineAlternateFaceSamples = await page.evaluate(async () => {
    const names = [3, 4, 5].flatMap((style) => ['10-of-diamonds', 'jack-of-clubs', 'queen-of-hearts', 'king-of-spades', 'ace-of-diamonds'].map((card) => `face-style-${style}-${card}-reference.png`));
    return Promise.all(names.map(async (name) => {
      const response = await fetch(`/assets/cards/${name}`);
      const image = await createImageBitmap(await response.blob());
      return { ok: response.ok, width: image.width, height: image.height };
    }));
  });
  expect(offlineAlternateFaceSamples).toEqual(Array(15).fill({ ok: true, width: 118, height: 177 }));
  const offlineFoundationSlots = await page.evaluate(async () => Promise.all([1, 2, 3, 4].map(async (index) => {
    const response = await fetch(`/assets/ui/foundation-empty-${index}.png`);
    return response.ok && response.headers.get('content-type') === 'image/png';
  })));
  expect(offlineFoundationSlots).toEqual(Array(4).fill(true));
  const offlineStatusIcons = await page.evaluate(async () => Promise.all(['menu-source', 'stat-crown', 'stat-moves', 'timer-frame-source'].map(async (name) => {
    const response = await fetch(`/assets/ui/${name}.png`);
    return response.ok && response.headers.get('content-type') === 'image/png';
  })));
  expect(offlineStatusIcons).toEqual(Array(4).fill(true));
  const offlineTimerGlyphs = await page.evaluate(async () => Promise.all([
    ...Array.from({ length: 10 }, (_, index) => `timer-digit-${index}`),
    'timer-colon',
  ].map(async (name) => {
    const response = await fetch(`/assets/ui/${name}.png`);
    return response.ok && response.headers.get('content-type') === 'image/png';
  })));
  expect(offlineTimerGlyphs).toEqual(Array(11).fill(true));
  const offlineReferenceCards = await page.evaluate(async () => {
    const names = [
      'queen-of-spades', 'king-of-diamonds', 'jack-of-diamonds',
      'queen-of-clubs', 'queen-of-diamonds', 'queen-of-hearts',
      'king-of-clubs', 'king-of-hearts', 'king-of-spades',
      'jack-of-clubs', 'jack-of-hearts', 'jack-of-spades',
      '6-of-hearts', '9-of-spades', '2-of-diamonds', 'ace-of-spades',
      '6-of-diamonds', '4-of-hearts', 'ace-of-clubs', '5-of-hearts',
      '6-of-spades', '7-of-hearts', '2-of-spades', '8-of-clubs',
      '10-of-hearts', '8-of-hearts',
      '9-of-diamonds', '9-of-hearts',
      '2-of-hearts',
      '7-of-diamonds',
      '4-of-clubs',
      '5-of-diamonds',
      'ace-of-hearts', '7-of-clubs', '3-of-diamonds', '4-of-spades',
      '8-of-spades', '3-of-hearts', '6-of-clubs', '2-of-clubs', '10-of-clubs',
      'ace-of-diamonds', '10-of-diamonds', '3-of-spades',
      '3-of-clubs', '5-of-clubs', '8-of-diamonds', '10-of-spades',
      '5-of-spades', '7-of-spades', '4-of-diamonds', '9-of-clubs',
    ];
    return Promise.all(names.map(async (name) => {
      const response = await fetch(`/assets/cards/${name}-reference.png`);
      return response.ok && response.headers.get('content-type') === 'image/png';
    }));
  });
  expect(offlineReferenceCards).toEqual(Array(52).fill(true));
  const offlineMoveSample = await page.evaluate(async () => {
    const response = await fetch('/assets/audio/card-move-reference.wav');
    return response.ok && (await response.arrayBuffer()).byteLength > 0;
  });
  expect(offlineMoveSample).toBe(true);
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

test('source settings switch between Standard and Vegas scoring', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => document.querySelectorAll('#tableau .card-enter').length === 0);
  await page.getByRole('button', { name: 'Game menu' }).click();
  await page.getByRole('button', { name: 'Settings and themes' }).click();
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Scoring Mode Standard/ })).toBeVisible();
  await page.getByRole('button', { name: /Scoring Mode Standard/ }).click();
  await page.getByRole('button', { name: 'Vegas' }).click();
  await expect(page.getByRole('button', { name: /Scoring Mode Vegas/ })).toBeVisible();
  await page.getByRole('button', { name: 'Close dialog' }).click();

  const recycle = async (score) => {
    await page.evaluate((startingScore) => {
      const game = window.solitaireGame;
      game.state.stock = [];
      game.state.waste = Array.from({ length: 24 }, (_, index) => ({ id: `fixture-${index}`, suit: index % 2 ? '♥' : '♠', rank: (index % 13) + 1, faceUp: true }));
      game.state.score = startingScore;
      game.save();
    }, score);
    await page.locator('[data-action="stock"]').click();
    return Number(await page.locator('#score-value').textContent());
  };

  expect(await recycle(200)).toBe(100);
  await page.getByRole('button', { name: 'Game menu' }).click();
  await page.getByRole('button', { name: 'Settings and themes' }).click();
  await page.getByRole('button', { name: /Scoring Mode Vegas/ }).click();
  await page.getByRole('button', { name: 'Standard' }).click();
  await expect(page.getByRole('button', { name: /Scoring Mode Standard/ })).toBeVisible();
  await page.getByRole('button', { name: 'Close dialog' }).click();
  expect(await recycle(200)).toBe(200);
});

test('mobile stock recycle restores draw order and undo', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => document.querySelectorAll('#tableau .card-enter').length === 0);
  await page.evaluate(() => {
    window.stockAudioCues = [];
    const audio = window.solitaireAudio;
    const play = audio.play.bind(audio);
    audio.play = (cue) => { window.stockAudioCues.push(cue); return play(cue); };
  });
  const firstDrawnCardId = await page.evaluate(() => {
    const game = window.solitaireGame;
    game.state.score = 200;
    game.save();
    return game.state.stock.at(-1).id;
  });

  for (let draw = 1; draw <= 24; draw += 1) {
    await page.locator('[data-action="stock"]').click();
    if (draw < 24) await expect(page.locator('.stock-count')).toHaveText(String(24 - draw));
  }
  await expect(page.getByRole('button', { name: 'Turn the waste pile over' })).toBeVisible();
  await expect(page.locator('.waste-slot .card-face')).toHaveCount(3);
  expect(await page.evaluate(() => window.solitaireGame.state.waste.length)).toBe(24);

  const stockBox = await page.locator('[data-action="stock"]').boundingBox();
  await page.touchscreen.tap(stockBox.x + stockBox.width / 2, stockBox.y + stockBox.height / 2);
  expect(await page.evaluate(() => window.stockAudioCues.at(-1))).toBe('recycle');
  await expect(page.locator('.stock-count')).toHaveText('24');
  const recycled = await page.evaluate(() => ({
    stock: window.solitaireGame.state.stock.length,
    waste: window.solitaireGame.state.waste.length,
    allFaceDown: window.solitaireGame.state.stock.every((card) => !card.faceUp),
    score: window.solitaireGame.state.score,
    moves: window.solitaireGame.state.moves,
  }));
  expect(recycled).toEqual({ stock: 24, waste: 0, allFaceDown: true, score: 200, moves: 25 });

  await page.locator('[data-action="stock"]').click();
  await expect(page.locator('.stock-count')).toHaveText('23');
  expect(await page.evaluate(() => window.solitaireGame.state.waste.at(-1).id)).toBe(firstDrawnCardId);
  await page.getByRole('button', { name: 'Undo move' }).click();
  await expect(page.locator('.stock-count')).toHaveText('24');
  await page.getByRole('button', { name: 'Undo move' }).click();
  const restored = await page.evaluate(() => ({
    stock: window.solitaireGame.state.stock.length,
    waste: window.solitaireGame.state.waste.length,
    score: window.solitaireGame.state.score,
    moves: window.solitaireGame.state.moves,
  }));
  expect(restored).toEqual({ stock: 0, waste: 24, score: 200, moves: 24 });
});
