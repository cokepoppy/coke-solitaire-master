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
  const deckIntegrity = await page.evaluate(() => {
    const state = window.solitaireGame.state;
    const cards = [...state.stock, ...state.waste, ...state.foundations.flat(), ...state.tableau.flat()];
    return { total: cards.length, unique: new Set(cards.map((card) => card.id)).size };
  });
  expect(deckIntegrity).toEqual({ total: 52, unique: 52 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'test-results/mobile-home.png', fullPage: true });

  await page.locator('[data-action="stock"]').click();
  await expect(page.locator('.stock-count')).toHaveText('23');
  await expect(page.locator('#moves-value')).toHaveText('1');
  await expect(page.locator('.waste-slot .card-face')).toHaveCount(1);

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
  await page.getByRole('button', { name: 'Settings' }).click();
  await page.getByRole('button', { name: 'Draw 3' }).click();
  await page.getByRole('switch', { name: /Left-hand mode/ }).click();
  await expect(page.locator('body')).toHaveClass(/left-hand/);
  const stockBox = await page.locator('.stock-slot').boundingBox();
  const foundationBox = await page.locator('.foundation-slot[data-pile="0"]').boundingBox();
  expect(stockBox.x).toBeGreaterThan(foundationBox.x);
  await page.getByRole('button', { name: 'Ruby card back' }).click();
  await expect(page.locator('body')).toHaveAttribute('data-card-back', 'ruby');
  await page.getByRole('button', { name: 'Close dialog' }).click();

  await page.locator('[data-action="stock"]').click();
  await expect(page.locator('#moves-value')).toHaveText('1');
  await expect(page.locator('#tableau')).toHaveAttribute('aria-label', 'Seven tableau piles');
  await expect(page.locator('.stock-count')).toHaveText('21');

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
  await page.mouse.move(sourceBox.x + Math.min(11, sourceBox.width / 3), sourceBox.y + 8);
  await page.mouse.down();
  await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + 16, { steps: 3 });
  await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + 12, { steps: 12 });
  await page.mouse.up();
  await expect(page.locator('#moves-value')).toHaveText(String(movesBefore + 1));
});

test('the daily deal is repeatable and the game restores on reload', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'More game options' }).click();
  await page.getByRole('button', { name: /Daily challenge/ }).click();
  const dailyDate = await page.evaluate(() => window.solitaireGame.state.challenge);
  const firstCard = await page.evaluate(() => window.solitaireGame.state.tableau[0][0].id);
  expect(dailyDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);

  await page.locator('[data-action="stock"]').click();
  await expect(page.locator('#moves-value')).toHaveText('1');
  await page.reload();
  await expect(page.locator('#moves-value')).toHaveText('1');
  await expect(page.locator('.stock-count')).toHaveText('23');

  await page.getByRole('button', { name: 'More game options' }).click();
  await page.getByRole('button', { name: new RegExp(dailyDate) }).click();
  await expect(page.locator('#moves-value')).toHaveText('0');
  expect(await page.evaluate(() => window.solitaireGame.state.tableau[0][0].id)).toBe(firstCard);
});

test('the board fits a 320px phone and the installed shell loads offline', async ({ page, context }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto('/');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await page.evaluate(() => navigator.serviceWorker.ready);
  const screenWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(screenWidth).toBeLessThanOrEqual(320);
  await context.setOffline(true);
  await page.reload();
  await expect(page).toHaveTitle('Solitaire Master');
  await expect(page.locator('#tableau .pile-column')).toHaveCount(7);
  await context.setOffline(false);
});

test('an illegal tableau tap does not alter the deal', async ({ page }) => {
  await page.goto('/');
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
