import { expect, test } from '@playwright/test';

test('mobile deal, stock draw, undo, and a legal hinted move', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));

  await page.goto('/');
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

  await expect(page).toHaveTitle('Solitaire Master');
  await expect(page.locator('#tableau .pile-column')).toHaveCount(7);
  await expect(page.locator('#tableau .card-face')).toHaveCount(7);
  await expect(page.locator('#tableau .card-back')).toHaveCount(21);
  await expect(page.locator('.stock-count')).toHaveText('24');
  await expect(page.locator('#time-value')).toHaveText(/^00:\d{2}$/);
  await expect(page.locator('.time-stat')).toHaveAttribute('aria-label', 'Time');
  const timerFrameBounds = await page.evaluate(() => {
    const timer = document.querySelector('.time-stat').getBoundingClientRect();
    const frame = document.querySelector('.timer-frame').getBoundingClientRect();
    return { wider: frame.width > timer.width, taller: frame.height > timer.height, left: frame.left < timer.left, right: frame.right > timer.right };
  });
  expect(timerFrameBounds).toEqual({ wider: true, taller: true, left: true, right: true });
  await expect(page.locator('#moves-value')).toHaveText('0');
  await expect(page.getByRole('button', { name: 'Game menu' })).toBeVisible();
  await expect(page.locator('.foundation-slot')).toHaveCount(4);
  await expect(page.locator('.action-button')).toHaveCount(4);
  await expect(page.locator('.action-source-icon')).toHaveCount(4);
  await expect.poll(() => page.locator('.action-source-icon').evaluateAll((images) => images.every((image) => image.complete && image.naturalWidth > 0))).toBe(true);
  await expect(page.locator('body')).toHaveAttribute('data-theme', 'felt');
  await expect(page.locator('body')).toHaveAttribute('data-card-back', 'ruby');
  await expect(page.locator('.card-back-art').first()).toHaveAttribute('src', '/assets/cards/back-solitaire-master.svg');
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

test('source opening replay matches the 20-second score, move count, and exposed cards', async ({ page }) => {
  await page.setViewportSize({ width: 442, height: 960 });
  await page.goto('/');
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
    game.save();
  });
  await page.reload();
  await page.waitForTimeout(1450);

  const move = async (sourcePile, sourceIndex, targetPile, targetIndex) => {
    await page.locator(`.pile-column[data-pile="${sourcePile}"] .playing-card[data-index="${sourceIndex}"]`).click();
    await page.locator(`.pile-column[data-pile="${targetPile}"] .playing-card[data-index="${targetIndex}"]`).click();
  };

  // In the reference opening, the 4♣, Q♠, and J♦ join the 5♦/K♦ sequence;
  // each move also uncovers one card, matching the observed +10 score steps.
  await move(5, 5, 0, 0);
  await expect(page.locator('#score-value')).toHaveText('10');
  await expect(page.locator('#moves-value')).toHaveText('1');
  await expect(page.locator('.pile-column[data-pile="5"] .card-face-art')).toHaveAttribute('src', /queen-of-clubs-reference\.png$/);

  await move(1, 1, 3, 3);
  await expect(page.locator('#score-value')).toHaveText('20');
  await expect(page.locator('#moves-value')).toHaveText('2');
  await expect(page.locator('.pile-column[data-pile="1"] .card-face-art')).toHaveAttribute('src', /6-of-clubs-reference\.png$/);

  await move(4, 4, 3, 4);
  await expect(page.locator('#score-value')).toHaveText('30');
  await expect(page.locator('#moves-value')).toHaveText('3');
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
  await page.waitForTimeout(1000);
  await page.evaluate(() => {
    window.solitaireGame.state.seconds = 7;
    window.solitaireGame.save();
    document.querySelector('#time-value').textContent = '00:07';
  });
  await expect(page.locator('.combo-feedback, .combo-amazing')).toHaveCount(0);
  await expect(page.locator('#time-value')).toHaveText('00:07');
  await page.screenshot({ path: 'test-results/source-opening-replay.png', fullPage: true });
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
  ];
  for (const filename of referenceArt) {
    const image = page.locator(`.card-face-art[src$="${filename}"]`);
    await expect(image).toHaveCount(1);
    await expect.poll(() => image.evaluate((element) => element.complete && element.naturalWidth === 118 && element.naturalHeight === 177)).toBe(true);
  }
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
  await page.getByRole('button', { name: 'Draw 3' }).click();
  await page.getByRole('switch', { name: /Left-hand mode/ }).click();
  await expect(page.locator('body')).toHaveClass(/left-hand/);
  const stockBox = await page.locator('.stock-slot').boundingBox();
  const wasteBox = await page.locator('.waste-slot').boundingBox();
  const foundationBox = await page.locator('.foundation-slot[data-pile="0"]').boundingBox();
  expect(stockBox.x).toBeLessThan(foundationBox.x);
  expect(stockBox.x).toBeLessThan(wasteBox.x);
  expect(wasteBox.x).toBeLessThan(foundationBox.x);
  await expect(page.locator('.back-choice')).toHaveCount(2);
  await page.getByRole('button', { name: 'Blue diamond card back' }).click();
  await expect(page.locator('body')).toHaveAttribute('data-card-back', 'blue');
  await expect(page.locator('.card-back-art').first()).toHaveAttribute('src', '/assets/cards/back-blue.svg');
  await page.getByRole('button', { name: 'Ruby card back' }).click();
  await expect(page.locator('body')).toHaveAttribute('data-card-back', 'ruby');
  await expect(page.locator('.card-back-art').first()).toHaveAttribute('src', '/assets/cards/back-solitaire-master.svg');
  await page.getByRole('button', { name: 'Mountain background' }).click();
  await expect(page.locator('body')).toHaveAttribute('data-theme', 'mountain');
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
    await expect(page.locator('.card-back-art').first()).toHaveAttribute('src', '/assets/cards/back-blue.svg');
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
  await page.getByRole('button', { name: 'Game menu' }).click();
  await page.getByRole('button', { name: 'Settings and themes' }).click();
  await page.getByRole('button', { name: 'Open Themes' }).click();
  await expect(page.getByRole('dialog', { name: 'Themes' })).toBeVisible();
  await expect(page.locator('.background-tile')).toHaveCount(9);
  await expect(page.locator('.theme-gallery')).toHaveCSS('height', `${await page.evaluate(() => window.innerHeight)}px`);
  await page.getByRole('button', { name: 'Mountain background' }).click();
  await expect(page.locator('body')).toHaveAttribute('data-theme', 'mountain');
  await expect(page.locator('.background-tile.chosen')).toHaveCount(1);

  await page.getByRole('button', { name: 'Card backs' }).click();
  await expect(page.locator('.back-tile')).toHaveCount(8);
  await expect.poll(() => page.locator('.back-tile img').evaluateAll((images) => images.every((image) => image.complete && image.naturalWidth > 0))).toBe(true);
  await page.screenshot({ path: 'test-results/theme-gallery-mobile.png' });
  await page.getByRole('button', { name: 'Teal diamonds' }).click();
  await expect(page.locator('body')).toHaveAttribute('data-card-back', 'teal');
  await expect(page.locator('.stock-slot .card-back-art')).toHaveAttribute('src', '/assets/cards/back-teal-reference.png');

  await page.getByRole('button', { name: 'Card faces' }).click();
  await expect(page.locator('.face-tile')).toHaveCount(2);
  await page.getByRole('button', { name: 'Classic card faces' }).click();
  await expect(page.locator('body')).toHaveAttribute('data-card-face-style', 'classic');
  await expect(page.locator('.card-face-art').first()).toHaveAttribute('src', /\.svg$/);
  await page.getByRole('button', { name: 'Solitaire Master card faces' }).click();
  await expect(page.locator('body')).toHaveAttribute('data-card-face-style', 'master');
  await page.getByRole('button', { name: 'Close dialog' }).click();
  await page.reload();
  await expect(page.locator('body')).toHaveAttribute('data-card-back', 'teal');
  await expect(page.locator('body')).toHaveAttribute('data-card-face-style', 'master');
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
  await page.locator('.pile-column[data-pile="6"] [data-card-id="♠-13"]').click();
  await page.locator('.pile-column[data-pile="0"]').click();
  await expect(page.locator('#moves-value')).toHaveText('4');
  await expect(page.locator('.combo-feedback')).toHaveText('COMBO3');
  await move('♥-12', '♠-13');
  await expect(page.locator('#moves-value')).toHaveText('5');
  await expect(page.locator('.combo-feedback')).toHaveText('COMBO4');
  await expect(page.locator('.combo-amazing')).toContainText('Amazing');
  const comboBounds = await page.locator('.combo-feedback').evaluate((label) => ({ left: label.offsetLeft, right: label.offsetLeft + label.offsetWidth, width: label.parentElement.clientWidth }));
  expect(comboBounds.left).toBeGreaterThanOrEqual(0);
  expect(comboBounds.right).toBeLessThanOrEqual(comboBounds.width);
  await page.waitForTimeout(150);
  await page.screenshot({ path: 'test-results/mobile-combo-amazing.png' });
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
    const playSample = audio.playSample.bind(audio);
    audio.playSample = (buffer, ...args) => {
      window.referenceMoveSamplePlayed = buffer === audio.referenceMoveBuffer;
      window.referenceAmazingSamplePlayed = buffer === audio.referenceAmazingBuffer;
      return playSample(buffer, ...args);
    };
  });

  await page.locator('[data-action="stock"]').click();
  await expect.poll(() => page.evaluate(() => window.solitaireAudio.context?.state)).toBe('running');
  await expect.poll(() => page.evaluate(() => window.audioCues.includes('draw'))).toBe(true);
  expect(await page.evaluate(() => window.solitaireAudio.noiseBuffer.length)).toBeGreaterThan(0);
  await expect.poll(() => page.evaluate(() => window.solitaireAudio.referenceMoveBuffer?.duration)).toBeGreaterThan(0.37);
  await page.evaluate(() => window.solitaireAudio.play('move'));
  await expect.poll(() => page.evaluate(() => window.referenceMoveSamplePlayed)).toBe(true);
  await expect.poll(() => page.evaluate(() => window.solitaireAudio.referenceAmazingBuffer?.duration)).toBeGreaterThan(0.95);
  await page.evaluate(() => window.solitaireAudio.play('amazing'));
  await expect.poll(() => page.evaluate(() => window.referenceAmazingSamplePlayed)).toBe(true);

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
  const cacheNames = await page.evaluate(() => caches.keys());
  expect(cacheNames).toContain('solitaire-master-v25');
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
  const offlineCardBack = await page.evaluate(async () => {
    const response = await fetch('/assets/cards/back-solitaire-master.svg');
    return { ok: response.ok, type: response.headers.get('content-type') };
  });
  expect(offlineCardBack).toEqual({ ok: true, type: 'image/svg+xml' });
  const offlineThemeBack = await page.evaluate(async () => {
    const response = await fetch('/assets/cards/back-teal-reference.png');
    return { ok: response.ok, type: response.headers.get('content-type') };
  });
  expect(offlineThemeBack).toEqual({ ok: true, type: 'image/png' });
  const offlineAmazingCue = await page.evaluate(async () => {
    const response = await fetch('/assets/audio/combo-amazing-reference.wav');
    return { ok: response.ok, audioType: response.headers.get('content-type')?.startsWith('audio/'), bytes: (await response.arrayBuffer()).byteLength };
  });
  expect(offlineAmazingCue.ok).toBe(true);
  expect(offlineAmazingCue.audioType).toBe(true);
  expect(offlineAmazingCue.bytes).toBeGreaterThan(160_000);
  const offlineActionIcons = await page.evaluate(async () => Promise.all(['action-play-plus', 'action-magic', 'action-hint', 'action-undo'].map(async (name) => {
    const response = await fetch(`/assets/ui/${name}.png`);
    return response.ok && response.headers.get('content-type') === 'image/png';
  })));
  expect(offlineActionIcons).toEqual(Array(4).fill(true));
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
