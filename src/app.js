import { SolitaireGame } from './game.js';
import { GameAudio } from './audio.js';

const game = new SolitaireGame({ autoStart: false });
function createFirstDealDeck() {
  const suits = ['♠', '♥', '♦', '♣'];
  const deck = suits.flatMap((suit) => Array.from({ length: 13 }, (_, index) => ({
    id: `${suit}-${index + 1}`,
    suit,
    rank: index + 1,
    faceUp: false,
  })));
  const remaining = new Map(deck.map((card) => [card.id, card]));
  const take = (suit, rank, faceUp) => {
    const card = remaining.get(`${suit}-${rank}`);
    if (!card) throw new Error(`Missing card ${rank}${suit} in the first deal.`);
    remaining.delete(card.id);
    return { ...card, faceUp };
  };
  const hidden = () => {
    const card = [...remaining.values()].find((candidate) => candidate.id !== '♥-6');
    if (!card) throw new Error('The first deal ran out of hidden cards.');
    remaining.delete(card.id);
    return { ...card, faceUp: false };
  };
  const tableau = [
    [take('♦', 5, true)],
    [take('♣', 6, false), take('♠', 12, true)],
    [hidden(), hidden(), take('♣', 2, true)],
    [hidden(), hidden(), hidden(), take('♦', 13, true)],
    [hidden(), hidden(), hidden(), take('♣', 3, false), take('♦', 11, true)],
    [hidden(), hidden(), hidden(), hidden(), take('♣', 12, false), take('♣', 4, true)],
    [hidden(), hidden(), hidden(), hidden(), hidden(), hidden(), take('♦', 9, true)],
  ];
  const stock = [...remaining.values()];
  const firstDrawIndex = stock.findIndex((card) => card.id === '♥-6');
  if (firstDrawIndex < 0) throw new Error('The source first draw is missing from the stock.');
  stock.push(stock.splice(firstDrawIndex, 1)[0]);
  return [...stock, ...tableau.flat().reverse()];
}

if (!game.restore()) game.newGame(createFirstDealDeck());
const audio = new GameAudio();
audio.setSound(game.state.sound);
audio.setMusic(game.state.music);

const $ = (selector) => document.querySelector(selector);
const board = $('.board-wrap');
const topRow = $('#top-row');
const tableauRoot = $('#tableau');
const modalBackdrop = $('#modal-backdrop');
const modalTitle = $('#modal-title');
const modalKicker = $('#modal-kicker');
const modalContent = $('#modal-content');
const toast = $('#toast');
let firstDeal = true;
let tableauTutorialShowTimer = null;
let tableauTutorialHideTimer = null;
board.addEventListener('animationend', (event) => {
  if (event.animationName === 'deal-face-reveal') {
    event.target.closest('.card-reveal')?.classList.remove('card-reveal');
    event.target.closest('.card-enter')?.classList.remove('card-enter');
  } else if (event.animationName === 'card-deal' && !event.target.classList.contains('card-face')) {
    event.target.classList.remove('card-enter');
  } else if (event.animationName === 'card-land') {
    event.target.classList.remove('card-arrive');
  }
});
let toastTimer = null;
let previousTap = null;
let drag = null;
let animatedCardIds = new Set();
let revealedCardIds = new Set();
let cardMoveIds = new Set();
let cardFlight = null;
let winShown = false;
let comboFeedbackTimer = null;
let dealSettlementTimer = null;
let winStreakTimer = null;
let winNewBest = false;
let winResultSoundPlayed = false;
let autoHintTimer = null;
let autoCollectTimer = null;
let autoCollectRunning = false;

const CARD_RANK_FILES = ['', 'ace', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'jack', 'queen', 'king'];
const CARD_SUIT_FILES = { '♠': 'spades', '♥': 'hearts', '♦': 'diamonds', '♣': 'clubs' };
const CARD_BACK_FILES = {
  ruby: 'back-solitaire-master-reference.png', blue: 'back-blue.svg', teal: 'back-teal-reference.png',
  lattice: 'back-lattice-reference.png', spade: 'back-spade-reference.png', coral: 'back-coral-reference.png',
  floral: 'back-floral-reference.png', amber: 'back-amber-reference.png',
};
const REFERENCE_CARD_ART = new Set([
  'queen-of-spades', 'king-of-diamonds', 'jack-of-diamonds',
  'queen-of-clubs', 'queen-of-diamonds', 'queen-of-hearts',
  'king-of-clubs', 'king-of-hearts', 'king-of-spades',
  'jack-of-clubs', 'jack-of-hearts', 'jack-of-spades',
  '6-of-hearts', '9-of-spades', '2-of-diamonds', 'ace-of-spades', '5-of-diamonds',
  '6-of-diamonds', '4-of-hearts', 'ace-of-clubs', '5-of-hearts',
  '6-of-spades', '7-of-hearts', '2-of-spades', '8-of-clubs',
  '10-of-hearts', '8-of-hearts',
  '9-of-diamonds',
  '2-of-hearts',
  '7-of-diamonds',
  '4-of-clubs',
  'ace-of-hearts', '7-of-clubs', '3-of-diamonds', '4-of-spades',
  '8-of-spades', '3-of-hearts', '6-of-clubs', '2-of-clubs', '10-of-clubs',
  'ace-of-diamonds', '10-of-diamonds', '3-of-spades',
  '3-of-clubs', '5-of-clubs', '8-of-diamonds', '10-of-spades',
  '5-of-spades', '7-of-spades', '4-of-diamonds', '9-of-clubs', '9-of-hearts',
]);
const STORAGE_PROFILE = 'solitaire-master-profile-v1';
const STORAGE_TABLEAU_TUTORIAL = 'solitaire-master-tableau-tutorial-v1';

function showTableauTutorial() {
  if (localStorage.getItem(STORAGE_TABLEAU_TUTORIAL) === 'shown') return;
  const tip = $('#tableau-tutorial');
  if (!tip || tableauTutorialShowTimer || !tip.hidden) return;
  tableauTutorialShowTimer = setTimeout(() => {
    tableauTutorialShowTimer = null;
    tip.hidden = false;
    requestAnimationFrame(() => tip.classList.add('visible'));
    localStorage.setItem(STORAGE_TABLEAU_TUTORIAL, 'shown');
    tableauTutorialHideTimer = setTimeout(() => {
      tip.classList.remove('visible');
      tableauTutorialHideTimer = setTimeout(() => {
        tip.hidden = true;
        tableauTutorialHideTimer = null;
      }, 180);
    }, 4350);
  }, 350);
}

function clearTableauTutorial() {
  clearTimeout(tableauTutorialShowTimer);
  clearTimeout(tableauTutorialHideTimer);
  tableauTutorialShowTimer = null;
  tableauTutorialHideTimer = null;
  const tip = $('#tableau-tutorial');
  if (tip) {
    tip.classList.remove('visible');
    tip.hidden = true;
  }
}

function cardBackFile() {
  return CARD_BACK_FILES[game.state.cardBack] ?? CARD_BACK_FILES.ruby;
}

function stockCardBackFile() {
  return game.state.cardBack === 'ruby' && game.state.stock.length === 24
    ? 'back-solitaire-master-source.png'
    : cardBackFile();
}

function cardBackTransitionFile() {
  return game.state.cardBack === 'ruby' ? 'back-solitaire-master.svg' : cardBackFile();
}

function cardBackImageMarkup({ deal = false } = {}) {
  if (!deal && game.state.cardBack === 'ruby') {
    return `<img class="card-back-underlay" src="/assets/cards/back-solitaire-master.svg" alt="" draggable="false"><img class="card-back-art" src="/assets/cards/back-solitaire-master-reference.png" alt="" draggable="false">`;
  }
  const asset = deal ? cardBackTransitionFile() : cardBackFile();
  return `<img class="card-back-art" src="/assets/cards/${asset}" alt="" draggable="false">`;
}

function stockCardBackMarkup() {
  if (game.state.cardBack === 'ruby') {
    return `<img class="card-back-underlay" src="/assets/cards/back-solitaire-master.svg" alt="" draggable="false"><img class="card-back-art" src="/assets/cards/${stockCardBackFile()}" alt="" draggable="false">`;
  }
  return `<img class="card-back-art" src="/assets/cards/${cardBackFile()}" alt="" draggable="false">`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}

function cardName(card) {
  return `${['', 'Ace', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Jack', 'Queen', 'King'][card.rank]} of ${({ '♠': 'spades', '♥': 'hearts', '♦': 'diamonds', '♣': 'clubs' })[card.suit]}`;
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  return `${String(minutes).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

const timerGlyphLayout = [
  { left: 0, width: 21 },
  { left: 24, width: 21 },
  { left: 49, width: 4 },
  { left: 57, width: 21 },
  { left: 82, width: 21 },
];

function renderTimeDisplay(seconds) {
  const display = formatTime(seconds);
  const timer = $('#time-value');
  timer.setAttribute('aria-label', display);
  timer.replaceChildren();
  if (display.length !== 5) {
    timer.classList.add('timer-text-fallback');
    timer.textContent = display;
    return;
  }
  timer.classList.remove('timer-text-fallback');
  for (const [index, character] of [...display].entries()) {
    const glyph = document.createElement('img');
    glyph.className = 'timer-glyph';
    glyph.src = `/assets/ui/${character === ':' ? 'timer-colon' : `timer-digit-${character}`}.png`;
    glyph.alt = '';
    glyph.setAttribute('aria-hidden', 'true');
    glyph.style.left = `${(timerGlyphLayout[index].left / 103) * 100}%`;
    glyph.style.width = `${(timerGlyphLayout[index].width / 103) * 100}%`;
    timer.append(glyph);
  }
  const accessibleText = document.createElement('span');
  accessibleText.className = 'visually-hidden';
  accessibleText.textContent = display;
  timer.append(accessibleText);
}

function renderStatNumber(element, value) {
  const display = String(value);
  element.replaceChildren();
  for (const digit of display) {
    const glyph = document.createElement('img');
    glyph.className = 'stat-digit';
    glyph.src = `/assets/ui/timer-digit-${digit}.png`;
    glyph.alt = '';
    glyph.setAttribute('aria-hidden', 'true');
    glyph.draggable = false;
    element.append(glyph);
  }
  const accessibleText = document.createElement('span');
  accessibleText.className = 'visually-hidden';
  accessibleText.textContent = display;
  element.append(accessibleText);
}

function sourceMatches(source, selection) {
  return Boolean(source && selection && source.zone === selection.zone && source.pile === selection.pile && source.index >= selection.index);
}

function isHintSource(source) {
  return Boolean(source && game.state.hint?.source && sourceMatches(source, game.state.hint.source));
}

function renderCard(card, source, options = {}) {
  const { selectable = true, offset = 0, index = 0, deal = false, dealOrder = 0, wasteOffset = 0, drawOrder = 0 } = options;
  const sourceAttrs = `${selectable ? `data-zone="${source.zone}" data-pile="${source.pile}" data-index="${source.index}"` : ''} data-card-id="${escapeHtml(card.id)}"`;
  const flight = cardFlight?.ids.has(card.id) ? cardFlight : null;
  const selected = selectable && sourceMatches(source, game.state.selected);
  const hint = selectable && isHintSource(source);
  const classes = ['playing-card', card.faceUp ? 'card-face' : 'card-back'];
  if (!card.faceUp && game.state.cardBack === 'ruby' && !deal) classes.push('source-card-back');
  if (selected) classes.push('is-selected');
  if (hint) classes.push('is-hint');
  if (deal) classes.push('card-enter');
  else if (animatedCardIds.has(card.id)) classes.push('card-arrive');
  if (revealedCardIds.has(card.id)) classes.push('card-reveal');
  if (cardMoveIds.has(card.id)) classes.push('card-flight-pending');
  if (flight && card.faceUp) classes.push('card-stock-draw');
  const delay = deal ? dealOrder * 40 : Math.min(index * 16, 160);
  const drawX = flight ? flight.originX - flight.targetX : 0;
  const drawY = flight ? flight.originY - flight.targetY : -5;
  const flightOrder = flight ? (flight.order.get(card.id) ?? 0) : drawOrder;
  const drawDelay = flight ? flightOrder * 55 : 0;
  const style = `--card-offset:${offset}px;--stack-index:${index};--deal-delay:${delay}ms;--waste-offset:${wasteOffset};--draw-x:${drawX}px;--draw-y:${drawY}px;--draw-delay:${drawDelay}ms;--flip-back:url('/assets/cards/${cardBackTransitionFile()}')`;
  const aria = card.faceUp ? cardName(card) : 'Face-down card';
  if (!card.faceUp) {
    return `<button class="${classes.join(' ')}" type="button" ${sourceAttrs} style="${style}" aria-label="${aria}" tabindex="-1">${cardBackImageMarkup({ deal })}</button>`;
  }
  const color = ['♥', '♦'].includes(card.suit) ? 'red' : 'black';
  const artName = `${CARD_RANK_FILES[card.rank]}-of-${CARD_SUIT_FILES[card.suit]}`;
  const asset = REFERENCE_CARD_ART.has(artName) ? `${artName}-reference.png` : `${artName}.svg`;
  const faceAsset = game.state.cardFaceStyle === 'classic' ? `${artName}.svg` : asset;
  return `<button class="${classes.join(' ')} ${color}" type="button" ${sourceAttrs} style="${style}" aria-label="${aria}" tabindex="-1"><img class="card-face-art" src="/assets/cards/${faceAsset}" alt="" draggable="false"></button>`;
}

function renderTopRow() {
  const leftHand = game.state.leftHand;
  const stockCol = leftHand ? 1 : 7;
  const wasteCol = leftHand ? 2 : 5;
  const foundationStart = leftHand ? 4 : 1;
  const stock = game.state.stock;
  const stockHint = game.state.hint?.source?.zone === 'stock';
  const stockButton = `<div class="slot stock-slot drop-target${stockHint ? ' is-hint' : ''}" style="grid-column:${stockCol};grid-row:1" data-drop-zone="stock" data-pile="0">
      <button class="stock-button${stockHint ? ' is-hint' : ''}" type="button" data-action="stock" aria-label="${stock.length ? `Draw a card, ${stock.length} cards remaining` : game.state.waste.length ? 'Turn the waste pile over' : 'Stock pile is empty'}">
        ${stock.length ? `<span class="playing-card card-back${game.state.cardBack === 'ruby' ? ' source-card-back' : ''}">${stockCardBackMarkup()}</span>` : '<span class="empty-stock">↻</span>'}
      </button>
      ${stock.length ? `<span class="stock-count${game.state.cardBack === 'ruby' ? ` source-stock-count${stock.length === 24 ? ' source-stock-count-baked' : ''}` : ''}">${stock.length}</span>` : ''}
    </div>`;
  const wasteVisibleLimit = game.state.showThreeWasteCards ? 3 : 1;
  const wasteCards = game.state.waste.slice(-wasteVisibleLimit);
  const wasteStart = game.state.waste.length - wasteCards.length;
  const wasteHint = game.state.hint?.source?.zone === 'waste';
  const wasteMarkup = wasteCards.length
    ? wasteCards.map((card, visibleIndex) => {
      const actualIndex = wasteStart + visibleIndex;
      const top = actualIndex === game.state.waste.length - 1;
      return renderCard(card, { zone: 'waste', pile: 0, index: actualIndex }, { selectable: top, offset: 0, index: visibleIndex, wasteOffset: visibleIndex * 0.47, drawOrder: visibleIndex });
    }).join('')
    : '<span class="empty-slot-mark" aria-hidden="true"></span>';
  const wasteSlot = `<div class="slot waste-slot drop-target${wasteHint ? ' is-hint' : ''}" style="grid-column:${wasteCol};grid-row:1" data-drop-zone="waste" data-pile="0">${wasteMarkup}</div>`;
  const foundations = game.state.foundations.map((pile, index) => {
    const column = foundationStart + index;
    const top = pile.at(-1);
    const source = { zone: 'foundation', pile: index, index: pile.length - 1 };
    const isTarget = game.state.hint?.target?.zone === 'foundation' && game.state.hint.target.pile === index;
    const movableTarget = game.state.movableHighlight && game.state.selected && game.canMove(game.state.selected, { zone: 'foundation', pile: index });
    const card = top ? renderCard(top, source, { index }) : `<span class="foundation-mark" aria-hidden="true"><img class="foundation-source-art" src="/assets/ui/foundation-empty-${index + 1}.png" alt=""><span class="foundation-theme-mark">A</span></span>`;
    return `<div class="slot foundation-slot drop-target${isTarget ? ' is-hint' : ''}${movableTarget ? ' is-moveable' : ''}" style="grid-column:${column};grid-row:1" data-drop-zone="foundation" data-pile="${index}" aria-label="Foundation ${index + 1}">${card}</div>`;
  }).join('');
  topRow.innerHTML = `${stockButton}${wasteSlot}${foundations}`;
}

function renderTableau() {
  const animateDeal = firstDeal;
  const cardHeight = Math.min(64, window.innerWidth * 0.1337) * 1.5;
  const faceDownStep = cardHeight * 0.139;
  const faceUpStep = cardHeight * 0.484;
  tableauRoot.innerHTML = game.state.tableau.map((pile, column) => {
    const hintTarget = game.state.hint?.target?.zone === 'tableau' && game.state.hint.target.pile === column;
    const movableTarget = game.state.movableHighlight && game.state.selected && game.canMove(game.state.selected, { zone: 'tableau', pile: column });
    const cards = pile.map((card, index) => {
      const previousFaceDown = pile.slice(0, index).filter((item) => !item.faceUp).length;
      const previousFaceUp = pile.slice(0, index).filter((item) => item.faceUp).length;
      const offset = previousFaceDown * faceDownStep + previousFaceUp * faceUpStep;
      const dealOrder = index * 7 - (index * (index - 1)) / 2 + column - index;
      return renderCard(card, { zone: 'tableau', pile: column, index }, { offset, index: column * 2 + index, deal: animateDeal, dealOrder });
    }).join('');
    const empty = pile.length ? '' : '<span class="empty-tableau-mark" aria-hidden="true">K</span>';
    return `<div class="pile-column drop-target${hintTarget ? ' is-hint' : ''}${movableTarget ? ' is-moveable' : ''}" data-drop-zone="tableau" data-pile="${column}" aria-label="Tableau pile ${column + 1}">${empty}${cards}</div>`;
  }).join('');
  if (animateDeal) {
    const stock = document.querySelector('.stock-slot .playing-card')?.getBoundingClientRect();
    if (stock) {
      tableauRoot.querySelectorAll('.playing-card.card-enter').forEach((card) => {
        const pile = card.closest('.pile-column');
        const pileRect = pile.getBoundingClientRect();
        const targetLeft = pileRect.left + card.offsetLeft;
        const targetTop = pileRect.top + card.offsetTop;
        card.style.setProperty('--deal-x', `${stock.left - targetLeft}px`);
        card.style.setProperty('--deal-y', `${stock.top - targetTop}px`);
      });
    }
  }
  firstDeal = false;
}

function updateChrome() {
  renderStatNumber($('#score-value'), game.state.score);
  renderTimeDisplay(game.state.seconds);
  renderStatNumber($('#moves-value'), game.state.moves);
  $('#undo-button').disabled = game.state.history.length === 0;
  const magicBadge = $('#magic-badge');
  magicBadge.textContent = String(game.state.magicCharges);
  magicBadge.hidden = game.state.magicCharges < 1;
  magicBadge.setAttribute('aria-label', `${game.state.magicCharges} magic moves available`);
  document.body.dataset.theme = game.state.theme;
  document.body.dataset.cardBack = game.state.cardBack ?? 'ruby';
  document.body.dataset.cardFaceStyle = game.state.cardFaceStyle ?? 'master';
  document.body.classList.toggle('left-hand', game.state.leftHand);
}

function render() {
  const settlingDeal = firstDeal;
  if (settlingDeal) clearTimeout(dealSettlementTimer);
  renderTopRow();
  renderTableau();
  updateChrome();
  animatedCardIds = new Set();
  revealedCardIds = new Set();
  cardMoveIds = new Set();
  cardFlight = null;
  if (settlingDeal) dealSettlementTimer = setTimeout(() => {
    dealSettlementTimer = null;
    render();
  }, 1320);
  scheduleAutoHint();
}

function scheduleAutoHint() {
  clearTimeout(autoHintTimer);
  autoHintTimer = null;
  if (!game.state?.autoHints || game.state.won || game.state.hint || game.state.selected || drag || autoCollectRunning || !modalBackdrop.classList.contains('hidden')) return;
  autoHintTimer = setTimeout(() => {
    autoHintTimer = null;
    if (!game.state.autoHints || game.state.won || game.state.hint || game.state.selected || drag || autoCollectRunning || !modalBackdrop.classList.contains('hidden')) return;
    if (game.hintMove()) render();
  }, 5000);
}

function cancelAutoCollect() {
  clearTimeout(autoCollectTimer);
  autoCollectTimer = null;
  autoCollectRunning = false;
  $('.game-shell').classList.remove('auto-collecting');
  if (!game.state?.won) scheduleAutoHint();
}

function autoCollectReady() {
  return game.state.autoCollect && !game.state.won && game.state.stock.length === 0 && game.state.tableau.every((pile) => pile.every((card) => card.faceUp));
}

function findAutoCollectMove() {
  const sources = [];
  if (game.state.waste.length) sources.push({ zone: 'waste', pile: 0, index: game.state.waste.length - 1 });
  game.state.tableau.forEach((pile, index) => {
    if (pile.length) sources.push({ zone: 'tableau', pile: index, index: pile.length - 1 });
  });
  for (const source of sources) {
    for (let pile = 0; pile < 4; pile += 1) {
      const target = { zone: 'foundation', pile };
      if (game.canMove(source, target)) return { source, target, card: game.cardAt(source) };
    }
  }
  return null;
}

function runAutoCollectStep() {
  autoCollectTimer = null;
  if (!autoCollectRunning || !autoCollectReady()) {
    cancelAutoCollect();
    return;
  }
  const move = findAutoCollectMove();
  if (!move) {
    cancelAutoCollect();
    return;
  }
  const origins = captureCardOrigins([move.card.id]);
  game.select(move.source);
  if (!game.moveTo(move.target)) {
    cancelAutoCollect();
    return;
  }
  markCardMove([move.card.id], origins);
  render();
  startCardMoveFlight(origins);
  if (game.state.won) {
    cancelAutoCollect();
    completeWin();
    return;
  }
  autoCollectTimer = setTimeout(runAutoCollectStep, 100);
}

function scheduleAutoCollect() {
  clearTimeout(autoCollectTimer);
  autoCollectTimer = null;
  if (autoCollectRunning || !autoCollectReady()) return;
  autoCollectTimer = setTimeout(() => {
    autoCollectTimer = null;
    if (!autoCollectReady()) return;
    clearTimeout(autoHintTimer);
    autoHintTimer = null;
    autoCollectRunning = true;
    $('.game-shell').classList.add('auto-collecting');
    audio.play('autoCollect');
    runAutoCollectStep();
  }, 150);
}

function showComboFeedback(cardId, foundationMove = false) {
  board.querySelectorAll('.combo-feedback, .combo-good, .combo-great, .combo-amazing').forEach((effect) => effect.remove());
  clearTimeout(comboFeedbackTimer);
  if (game.state.comboCount < 1 || !cardId || game.state.won) return;
  const card = [...board.querySelectorAll('[data-card-id]')].find((element) => element.dataset.cardId === cardId);
  if (!card) return;
  const combo = game.state.comboCount;
  const label = document.createElement('div');
  label.className = 'combo-feedback';
  label.setAttribute('role', 'status');
  label.setAttribute('aria-label', `Combo ${combo}`);
  label.innerHTML = `<span>COMBO</span><b>${combo}</b>`;
  label.style.top = '-20px';
  label.style.left = '50%';
  board.append(label);
  const reward = foundationMove ? {
    1: { name: 'Good', cue: 'good', className: 'combo-good' },
    2: { name: 'Great', cue: 'great', className: 'combo-great' },
    4: { name: 'Amazing', cue: 'amazing', className: 'combo-amazing' },
  }[combo] : null;
  if (reward) {
    audio.play(reward.cue);
    const banner = document.createElement('div');
    banner.className = reward.className;
    banner.setAttribute('aria-hidden', 'true');
    banner.innerHTML = `<img class="combo-reward-art" src="/assets/feedback/combo-${reward.cue}.webp" alt=""><b>${reward.name}</b>`;
    banner.querySelector('.combo-reward-art')?.addEventListener('error', () => banner.classList.add('sprite-failed'), { once: true });
    board.append(banner);
  }
  const rewardDuration = reward ? 1080 : 920;
  comboFeedbackTimer = setTimeout(() => board.querySelectorAll('.combo-feedback, .combo-good, .combo-great, .combo-amazing').forEach((effect) => effect.remove()), rewardDuration);
}

function captureStockFlight() {
  const stock = document.querySelector('.stock-slot')?.getBoundingClientRect();
  const waste = document.querySelector('.waste-slot')?.getBoundingClientRect();
  if (!stock || !waste) return null;
  return { originX: stock.left, originY: stock.top, targetX: waste.left, targetY: waste.top };
}

function animateStockCards(origin, cards) {
  if (!origin || !cards.length) return;
  animatedCardIds = new Set(cards.map((card) => card.id));
  cardFlight = { ...origin, ids: animatedCardIds, order: new Map(cards.map((card, index) => [card.id, index])) };
}

function captureCardOrigins(cardIds) {
  const origins = new Map();
  const wanted = new Set(cardIds);
  board.querySelectorAll('.playing-card[data-card-id]').forEach((card) => {
    if (!wanted.has(card.dataset.cardId)) return;
    const rect = card.getBoundingClientRect();
    origins.set(card.dataset.cardId, { left: rect.left, top: rect.top });
  });
  return origins;
}

function startCardMoveFlight(origins) {
  if (!origins?.size) return;
  for (const [cardId, origin] of origins) {
    const card = [...board.querySelectorAll('.playing-card[data-card-id]')].find((element) => element.dataset.cardId === cardId);
    if (!card) continue;
    const target = card.getBoundingClientRect();
    card.style.setProperty('--draw-x', `${origin.left - target.left}px`);
    card.style.setProperty('--draw-y', `${origin.top - target.top}px`);
    card.dataset.motionTargetLeft = String(target.left);
    card.dataset.motionTargetTop = String(target.top);
    card.classList.add('card-tableau-move');
    card.classList.remove('card-flight-pending');
  }
}

function markCardMove(movingIds, origins, revealedCardId = null) {
  animatedCardIds = new Set(movingIds);
  revealedCardIds = new Set(revealedCardId ? [revealedCardId] : []);
  cardMoveIds = new Set(origins?.keys() ?? []);
}

function announce(message, duration = 2200) {
  toast.textContent = message;
  toast.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('visible'), duration);
}

function readProfile() {
  const defaults = { games: 0, wins: 0, bestScore: 0, dailyCompleted: [] };
  try {
    const profile = JSON.parse(localStorage.getItem(STORAGE_PROFILE));
    return { ...defaults, ...(profile ?? {}), dailyCompleted: Array.isArray(profile?.dailyCompleted) ? profile.dailyCompleted : [] };
  } catch { return defaults; }
}

function writeProfile(profile) {
  try { localStorage.setItem(STORAGE_PROFILE, JSON.stringify(profile)); } catch { /* optional statistics */ }
}

function setModal(title, kicker, html, variant = '') {
  $('#modal-backdrop').classList.remove('theme-gallery-backdrop');
  $('#modal-card').classList.remove('theme-gallery');
  $('#modal-title').classList.remove('theme-gallery-title');
  $('#modal-backdrop').classList.toggle('win-result-backdrop', variant === 'win-result');
  $('#modal-card').classList.toggle('win-result-card', variant === 'win-result');
  $('#modal-backdrop').classList.toggle('win-streak-backdrop', variant === 'win-streak');
  $('#modal-card').classList.toggle('win-streak-card', variant === 'win-streak');
  const settingsVariant = variant === 'settings';
  $('#modal-backdrop').classList.toggle('source-settings-backdrop', settingsVariant);
  $('#modal-card').classList.toggle('source-settings-card-shell', settingsVariant);
  modalTitle.textContent = title;
  modalKicker.textContent = kicker;
  modalContent.innerHTML = html;
  modalBackdrop.classList.remove('hidden');
  document.body.classList.add('modal-open');
  if (variant === 'win-result') modalContent.querySelector('[data-modal-action="new"]')?.focus();
  else if (variant === 'win-streak') modalContent.querySelector('[data-modal-action="continue"]')?.focus();
  else $('#modal-close').focus();
}

function closeModal() {
  if ($('#modal-card').classList.contains('win-streak-card')) {
    showWinResult(winNewBest);
    return;
  }
  modalBackdrop.classList.add('hidden');
  document.body.classList.remove('modal-open');
  scheduleAutoHint();
  scheduleAutoCollect();
}

function settingsSwitch(name, label, value) {
  return `<button class="source-switch${value ? ' on' : ''}" type="button" role="switch" aria-label="${label}" aria-checked="${value}" data-setting="${name}" data-value="${!value}"><span></span></button>`;
}

function showSettings() {
  const { drawCount, scoringMode, leftHand, vibration, quickPlay, autoCollect, autoHints, showThreeWasteCards, movableHighlight, sound } = game.state;
  setModal('Settings', '', `
    <div class="source-settings-list">
      <section class="source-settings-card source-settings-basic" aria-label="General settings">
        <div class="source-settings-row"><span>Audio</span>${settingsSwitch('sound', 'Audio', sound)}</div>
        <div class="source-settings-row"><span>Vibration</span>${settingsSwitch('vibration', 'Vibration', vibration)}</div>
        <button class="source-settings-row source-settings-link" type="button" data-settings-page="statistics"><span>Statistics</span><b aria-hidden="true">›</b></button>
        <button class="source-settings-row source-settings-link" type="button" data-theme-gallery><span>Themes</span><b aria-hidden="true">›</b></button>
      </section>
      <h2 class="source-settings-heading">Game Mode</h2>
      <section class="source-settings-card" aria-label="Game mode">
        <div class="source-settings-row source-draw-row"><span>Draw Mode</span><div class="source-draw-options" role="group" aria-label="Draw Mode">
          <button class="source-draw-choice${drawCount === 1 ? ' selected' : ''}" type="button" data-setting="drawCount" data-value="1" aria-label="Draw 1 card" aria-pressed="${drawCount === 1}"><b>1</b><i class="draw-card-icon one" aria-hidden="true">♥</i></button>
          <button class="source-draw-choice${drawCount === 3 ? ' selected' : ''}" type="button" data-setting="drawCount" data-value="3" aria-label="Draw 3 cards" aria-pressed="${drawCount === 3}"><b>3</b><i class="draw-card-icon three" aria-hidden="true">♠♥</i></button>
        </div></div>
        <button class="source-settings-row source-settings-link" type="button" data-settings-page="scoring"><span>Scoring Mode</span><span class="source-setting-value">${scoringMode === 'vegas' ? 'Vegas' : 'Standard'}</span><b aria-hidden="true">›</b></button>
      </section>
      <h2 class="source-settings-heading">Preferences</h2>
      <section class="source-settings-card" aria-label="Preferences">
        <div class="source-settings-row"><span>Left Hand</span>${settingsSwitch('leftHand', 'Left Hand', leftHand)}</div>
        <div class="source-settings-row"><span>Quick Play</span>${settingsSwitch('quickPlay', 'Quick Play', quickPlay)}</div>
        <div class="source-settings-row"><span>Auto Collect</span>${settingsSwitch('autoCollect', 'Auto Collect', autoCollect)}</div>
        <div class="source-settings-row"><span>Auto Hints</span>${settingsSwitch('autoHints', 'Auto Hints', autoHints)}</div>
        <div class="source-settings-row"><span>Show Three Waste Cards</span>${settingsSwitch('showThreeWasteCards', 'Show Three Waste Cards', showThreeWasteCards)}</div>
        <div class="source-settings-row"><span>Movable highlight</span>${settingsSwitch('movableHighlight', 'Movable highlight', movableHighlight)}</div>
      </section>
    </div>
  `, 'settings');
}

function showScoringModes() {
  const selected = game.state.scoringMode;
  setModal('Scoring Mode', '', `
    <div class="source-settings-list scoring-mode-list">
      <section class="source-settings-card" aria-label="Scoring mode">
        <button class="source-settings-row source-settings-link${selected === 'standard' ? ' scoring-selected' : ''}" type="button" data-setting="scoringMode" data-value="standard" aria-pressed="${selected === 'standard'}"><span>Standard</span><b aria-hidden="true">${selected === 'standard' ? '✓' : ''}</b></button>
        <button class="source-settings-row source-settings-link${selected === 'vegas' ? ' scoring-selected' : ''}" type="button" data-setting="scoringMode" data-value="vegas" aria-pressed="${selected === 'vegas'}"><span>Vegas</span><b aria-hidden="true">${selected === 'vegas' ? '✓' : ''}</b></button>
      </section>
    </div>
  `, 'settings');
}

const THEME_BACKS = [
  ['teal', 'Teal diamonds'], ['lattice', 'Blue lattice'], ['blue', 'Blue spade'],
  ['spade', 'Blue spade'], ['ruby', 'Ruby ornament'], ['coral', 'Coral geometric'],
  ['floral', 'Red floral'], ['amber', 'Amber diamonds'],
];
const TABLE_THEMES = [
  ['lagoon', 'Lagoon', 'linear-gradient(145deg,#07827e,#075d60)'],
  ['emerald', 'Emerald', 'radial-gradient(ellipse at 50% 30%,#119458,#07552f)'],
  ['mountain', 'Mountain', 'url(/assets/themes/mountain-valley.jpg) center / cover'],
  ['felt', 'Classic green', 'radial-gradient(ellipse at 50% 36%,#15824b,#066032 76%)'],
  ['dusk', 'Dusk', 'radial-gradient(ellipse at 50% 38%,#55517a,#162c3a 78%)'],
  ['midnight', 'Midnight teal', 'radial-gradient(ellipse at 50% 38%,#205562,#102f3c)'],
  ['plum', 'Plum', 'radial-gradient(ellipse at 50% 38%,#67465b,#302031)'],
  ['forest', 'Forest', 'radial-gradient(ellipse at 50% 38%,#14572c,#062f19)'],
  ['violet', 'Violet', 'radial-gradient(ellipse at 50% 38%,#514163,#251c36)'],
];

function showThemeGallery(tab = 'background') {
  const activeTab = ['background', 'back', 'face'].includes(tab) ? tab : 'background';
  const { theme, cardBack = 'ruby', cardFaceStyle = 'master' } = game.state;
  const backgroundTiles = TABLE_THEMES.map(([value, label, preview]) => `<button class="gallery-tile background-tile${theme === value ? ' chosen' : ''}" type="button" data-setting="theme" data-value="${value}" aria-label="${label} background" aria-pressed="${theme === value}"><span style="background:${preview}"></span>${theme === value ? '<i aria-hidden="true">✓</i>' : ''}</button>`).join('');
  const backTiles = THEME_BACKS.map(([value, label]) => {
    const artwork = value === 'ruby'
      ? '<span class="back-preview-source" aria-hidden="true"><img src="/assets/cards/back-solitaire-master.svg" alt=""><img src="/assets/cards/back-solitaire-master-reference.png" alt=""></span>'
      : `<img src="/assets/cards/${CARD_BACK_FILES[value]}" alt="">`;
    return `<button class="gallery-tile back-tile${cardBack === value ? ' chosen' : ''}" type="button" data-setting="cardBack" data-value="${value}" aria-label="${label}" aria-pressed="${cardBack === value}">${artwork}${cardBack === value ? '<i aria-hidden="true">✓</i>' : ''}</button>`;
  }).join('');
  const faceTiles = [['master', 'Solitaire Master', '5-of-hearts-reference.png'], ['classic', 'Classic', '5-of-hearts.svg']].map(([value, label, preview]) => `<button class="gallery-tile face-tile${cardFaceStyle === value ? ' chosen' : ''}" type="button" data-setting="cardFaceStyle" data-value="${value}" aria-label="${label} card faces" aria-pressed="${cardFaceStyle === value}"><img src="/assets/cards/${preview}" alt=""><span>${label}</span>${cardFaceStyle === value ? '<i aria-hidden="true">✓</i>' : ''}</button>`).join('');
  const tiles = activeTab === 'background' ? backgroundTiles : activeTab === 'back' ? backTiles : faceTiles;
  setModal('Themes', '', `<nav class="gallery-tabs" aria-label="Theme categories"><button type="button" data-theme-tab="background" aria-label="Backgrounds" class="${activeTab === 'background' ? 'active' : ''}"><span aria-hidden="true">▧</span></button><button type="button" data-theme-tab="back" aria-label="Card backs" class="${activeTab === 'back' ? 'active' : ''}"><span class="tab-card-back" aria-hidden="true">◆</span></button><button type="button" data-theme-tab="face" aria-label="Card faces" class="${activeTab === 'face' ? 'active' : ''}"><span aria-hidden="true">♥</span></button></nav><div class="gallery-grid ${activeTab === 'background' ? 'background-grid' : activeTab === 'face' ? 'face-grid' : 'back-grid'}">${tiles}</div>`);
  $('#modal-backdrop').classList.add('theme-gallery-backdrop');
  $('#modal-card').classList.add('theme-gallery');
  $('#modal-title').classList.add('theme-gallery-title');
}

function showNewGame() {
  setModal('New game', 'READY FOR ANOTHER DEAL?', `
    <p class="modal-description">Choose a fresh shuffle or replay the deal you are working on.</p>
    <div class="modal-actions">
      <button class="primary-action" type="button" data-modal-action="new">Deal a new game</button>
      <button class="secondary-action" type="button" data-modal-action="restart">Restart this deal</button>
      <button class="text-action" type="button" data-modal-action="close">Keep playing</button>
    </div>
  `);
}

function showHelp() {
  setModal('How to play', 'CLASSIC KLONDIKE', `
    <div class="help-list">
      <p><span>01</span><b>Build the foundations</b><small>Move each suit from Ace through King into the four foundation piles.</small></p>
      <p><span>02</span><b>Stack the tableau</b><small>Place cards in descending order, alternating red and black. Only a King can start an empty column.</small></p>
      <p><span>03</span><b>Reveal hidden cards</b><small>Move a face-up sequence together, then turn over the newly uncovered card.</small></p>
      <p><span>04</span><b>Tap or drag</b><small>Tap a card, then tap its destination. You can also drag a card or sequence. Draw from the stock when you need another option.</small></p>
    </div>
    <div class="modal-actions"><button class="primary-action" type="button" data-modal-action="close">Got it</button></div>
  `);
}

function showStats() {
  const profile = readProfile();
  setModal('Your statistics', 'A LITTLE PROGRESS EVERY DAY', `
    <div class="stats-grid">
      <div><strong>${profile.games}</strong><span>Games played</span></div>
      <div><strong>${profile.wins}</strong><span>Games won</span></div>
      <div><strong>${profile.bestScore}</strong><span>Best score</span></div>
      <div><strong>${game.state.moves}</strong><span>Moves this game</span></div>
    </div>
    <div class="modal-actions"><button class="primary-action" type="button" data-modal-action="close">Done</button></div>
  `);
}

function localDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function dateFromKey(key) {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function dateLabel(key, options = { month: 'long', day: 'numeric', year: 'numeric' }) {
  return new Intl.DateTimeFormat(undefined, options).format(dateFromKey(key));
}

function showDailyCalendar(selectedDate = game.state.challenge || localDateKey(new Date())) {
  const profile = readProfile();
  const selected = dateFromKey(selectedDate);
  const today = new Date();
  const month = new Date(selected.getFullYear(), selected.getMonth(), 1);
  const monthKey = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`;
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const firstWeekday = month.getDay();
  const completedThisMonth = profile.dailyCompleted.filter((day) => day.startsWith(`${monthKey}-`)).length;
  const milestones = [6, 10, 20, 30];
  const dayCells = [
    ...Array.from({ length: firstWeekday }, () => '<span class="calendar-empty" aria-hidden="true"></span>'),
    ...Array.from({ length: daysInMonth }, (_, index) => {
      const day = index + 1;
      const key = `${monthKey}-${String(day).padStart(2, '0')}`;
      const complete = profile.dailyCompleted.includes(key);
      const isSelected = key === selectedDate;
      const isToday = key === localDateKey(today);
      const future = dateFromKey(key) > new Date(today.getFullYear(), today.getMonth(), today.getDate());
      return `<button type="button" class="calendar-day${isSelected ? ' selected' : ''}${isToday ? ' today' : ''}${complete ? ' completed' : ''}" data-daily-date="${key}" aria-label="${dateLabel(key)}${complete ? ', completed' : ''}" aria-pressed="${isSelected}" ${future ? 'disabled' : ''}><span>${day}</span>${complete ? '<i aria-hidden="true">♛</i>' : ''}</button>`;
    }),
  ].join('');
  const rewardCells = milestones.map((target, index) => `<div class="daily-reward${completedThisMonth >= target ? ' earned' : ''}" aria-label="${target} daily wins reward${completedThisMonth >= target ? ', earned' : ''}"><span aria-hidden="true">${['♛', '♨', '✦', '♛'][index]}</span><small>${target}</small></div>`).join('');
  const nextMonth = new Date(month.getFullYear(), month.getMonth() + 1, 1);
  const nextDisabled = nextMonth > new Date(today.getFullYear(), today.getMonth(), 1);
  setModal('Daily Challenge', 'A NEW DEAL EVERY DAY', `
    <section class="daily-calendar" data-month="${monthKey}" data-selected-date="${selectedDate}" aria-label="Daily challenge calendar">
      <div class="calendar-heading">
        <button type="button" class="calendar-nav" data-calendar-month="-1" aria-label="Previous month">‹</button>
        <strong>${new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(month)}</strong>
        <button type="button" class="calendar-nav" data-calendar-month="1" aria-label="Next month" ${nextDisabled ? 'disabled' : ''}>›</button>
      </div>
      <div class="calendar-weekdays" aria-hidden="true">${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => `<span>${day}</span>`).join('')}</div>
      <div class="calendar-grid">${dayCells}</div>
      <div class="daily-progress" aria-label="${completedThisMonth} of ${daysInMonth} challenges completed this month">
        <div class="daily-progress-label"><span>Monthly progress</span><b>${completedThisMonth} / ${daysInMonth}</b></div>
        <div class="daily-progress-track"><span style="width:${Math.min(100, completedThisMonth / daysInMonth * 100)}%"></span></div>
        <div class="daily-rewards">${rewardCells}</div>
      </div>
      <p class="daily-selected-date">Selected challenge <b>${dateLabel(selectedDate)}</b></p>
      <div class="modal-actions"><button class="primary-action" type="button" data-modal-action="play-daily">Play</button></div>
    </section>
  `);
}

function showMoreOptions() {
  const dailyLabel = game.state.challenge ? `Daily challenge · ${game.state.challenge}` : 'Daily challenge';
  setModal('More options', 'YOUR GAME', `
    <div class="more-list">
      <button type="button" data-more="settings"><span>Settings and themes</span><b>›</b></button>
      <button type="button" data-more="daily"><span>${dailyLabel}</span><b>›</b></button>
      <button type="button" data-more="help"><span>How to play</span><b>›</b></button>
      <button type="button" data-more="stats"><span>Your statistics</span><b>›</b></button>
    </div>`);
}

function startDailyGame(day = localDateKey(new Date())) {
  clearTableauTutorial();
  const profile = readProfile();
  const options = {
    drawCount: game.state.drawCount,
    scoringMode: game.state.scoringMode,
    leftHand: game.state.leftHand,
    vibration: game.state.vibration,
    quickPlay: game.state.quickPlay,
    autoCollect: game.state.autoCollect,
    autoHints: game.state.autoHints,
    showThreeWasteCards: game.state.showThreeWasteCards,
    movableHighlight: game.state.movableHighlight,
    theme: game.state.theme,
    cardBack: game.state.cardBack ?? 'ruby',
    sound: game.state.sound,
    music: game.state.music,
  };
  game.newDailyGame(day);
  Object.assign(game.state, options);
  game.save();
  profile.games += 1;
  writeProfile(profile);
  firstDeal = true;
  winShown = false;
  $('.game-shell').classList.remove('won');
  closeModal();
  render();
  showComboFeedback();
  announce(`Daily challenge · ${dateLabel(day)}`);
}

function completeWin() {
  if (winShown) return;
  winShown = true;
  winResultSoundPlayed = false;
  clearTableauTutorial();
  const profile = readProfile();
  const previousBest = profile.bestScore;
  profile.wins += 1;
  profile.bestScore = Math.max(profile.bestScore, game.state.score);
  if (game.state.challenge) profile.dailyCompleted = [...new Set([...profile.dailyCompleted, game.state.challenge])].sort();
  writeProfile(profile);
  winNewBest = game.state.score > previousBest;
  const cascade = game.state.foundations.flatMap((pile, suitIndex) => pile.map((card, rankIndex) => {
    const artName = `${CARD_RANK_FILES[card.rank]}-of-${CARD_SUIT_FILES[card.suit]}`;
    const asset = REFERENCE_CARD_ART.has(artName) && game.state.cardFaceStyle !== 'classic' ? `${artName}-reference.png` : `${artName}.svg`;
    const rankProgress = rankIndex / 12;
    const fromX = 8 + suitIndex * 20;
    const toX = [-7, 5, 17, 29][suitIndex] + rankProgress * 65;
    const toY = 38 + suitIndex * 5 + Math.sin(rankProgress * Math.PI) * 18 - rankProgress * 13;
    const rotation = ((rankIndex % 5) - 2) * 2.2 + (suitIndex - 1.5) * 2;
    const delay = rankIndex * 42 + suitIndex * 100;
    const order = suitIndex * 13 + rankIndex;
    return `<img class="win-cascade-card" src="/assets/cards/${asset}" alt="" style="--cascade-from-x:${fromX}%;--cascade-to-x:${toX}%;--cascade-to-y:${toY}%;--cascade-rotation:${rotation}deg;--cascade-delay:${delay}ms;z-index:${order}">`;
  })).join('');
  setModal('Winning streak', '', `
    <div class="win-streak-screen" aria-label="Winning streak">
      <div class="win-streak-cascade" aria-hidden="true">${cascade}</div>
      <div class="win-streak-message">
        <h2 class="win-streak-title">winning streak</h2>
        <div class="win-streak-reward"><img src="/assets/ui/win-streak-trophy-reference.png" alt=""><strong>${profile.wins}</strong><span aria-hidden="true">👍</span></div>
      </div>
      <button class="win-streak-continue" type="button" data-modal-action="continue">Tap to Continue</button>
    </div>
  `, 'win-streak');
  $('.game-shell').classList.add('won');
  clearTimeout(winStreakTimer);
  winStreakTimer = setTimeout(() => showWinResult(winNewBest), 4700);
}

function showWinResult(newBest) {
  clearTimeout(winStreakTimer);
  winStreakTimer = null;
  if (!winResultSoundPlayed) {
    winResultSoundPlayed = true;
    audio.play('win');
  }
  setModal('You win!', '', `
    <div class="win-result" aria-label="You win">
      <img class="win-result-banner" src="/assets/ui/win-banner-reference.png" alt="">
      <div class="win-result-score"><span>Score</span><strong>${game.state.score}</strong></div>
      ${newBest ? '<img class="win-result-best" src="/assets/ui/win-best-reference.png" alt="Best">' : ''}
      <p class="win-result-percent">You defeated <b>86%</b> of players!</p>
      <div class="win-result-stats"><p><span>Time</span><b>${formatTime(game.state.seconds)}</b></p><p><span>Moves</span><b>${game.state.moves}</b></p></div>
      <div class="win-result-trophy"><img src="/assets/ui/win-trophy-reference.png" alt=""><span>${readProfile().wins}</span></div>
      <button class="win-result-new" type="button" data-modal-action="new" aria-label="New Deal"><img src="/assets/ui/win-new-deal-reference.png" alt=""></button>
      <span class="win-result-home-indicator" aria-hidden="true"></span>
    </div>
  `, 'win-result');
  $('.game-shell').classList.add('won');
}

function handleStock() {
  const origin = captureStockFlight();
  const action = game.drawFromStock();
  if (action === 'empty') return;
  if (action === 'draw') animateStockCards(origin, game.state.waste.slice(-game.state.drawCount));
  audio.play(action === 'recycle' ? 'flip' : 'draw');
  render();
  showComboFeedback();
  scheduleAutoCollect();
}

function doNewGame(restart = false) {
  cancelAutoCollect();
  clearTimeout(autoHintTimer);
  autoHintTimer = null;
  clearTableauTutorial();
  const profile = readProfile();
  const previous = game.state;
  const options = {
    drawCount: previous.drawCount,
    scoringMode: previous.scoringMode,
    leftHand: previous.leftHand,
    vibration: previous.vibration,
    quickPlay: previous.quickPlay,
    autoCollect: previous.autoCollect,
    autoHints: previous.autoHints,
    showThreeWasteCards: previous.showThreeWasteCards,
    movableHighlight: previous.movableHighlight,
    theme: previous.theme,
    cardBack: previous.cardBack ?? 'ruby',
    sound: previous.sound,
    music: previous.music,
  };
  const deck = restart ? previous.seedDeck : undefined;
  game.newGame(deck, restart ? previous.challenge : null);
  Object.assign(game.state, options);
  game.save();
  if (!restart) {
    profile.games += 1;
    writeProfile(profile);
  }
  audio.setSound(options.sound);
  audio.setMusic(options.music);
  $('.game-shell').classList.remove('won');
  winShown = false;
  firstDeal = true;
  closeModal();
  render();
  showComboFeedback();
  announce(restart ? 'Deal restarted' : 'New game dealt');
}

function handleHint() {
  const hint = game.hintMove();
  render();
  if (!hint) announce('No more moves are available');
  else if (hint.source.zone === 'stock') announce('Try drawing from the stock');
  else announce('A helpful move is highlighted');
  audio.play('tap');
}

function handleMagic() {
  if (game.state.magicCharges < 1) {
    announce('No magic moves remain in this deal');
    return;
  }
  const hint = game.hintMove();
  if (!hint) {
    render();
    announce('No more moves are available');
    return;
  }
  if (hint.source.zone === 'stock') {
    const origin = captureStockFlight();
    const action = game.drawFromStock();
    if (action === 'empty') {
      game.state.hint = null;
      render();
      announce('No magic move is available');
      return;
    }
    if (action === 'draw') animateStockCards(origin, game.state.waste.slice(-game.state.drawCount));
    game.state.magicCharges -= 1;
    game.save();
    audio.play(action === 'recycle' ? 'flip' : 'draw');
    render();
    announce('Magic revealed a new card');
    scheduleAutoCollect();
    return;
  }
  const movingIds = game.sequenceAt(hint.source).map((card) => card.id);
  const exposed = hint.source.zone === 'tableau' ? game.state.tableau[hint.source.pile]?.[hint.source.index - 1] : null;
  const revealedCardId = exposed && !exposed.faceUp ? exposed.id : null;
  const origins = captureCardOrigins(movingIds);
  game.select(hint.source);
  if (!game.moveTo(hint.target)) {
    game.state.hint = null;
    render();
    announce('No magic move is available');
    return;
  }
  game.state.magicCharges -= 1;
  game.save();
  markCardMove(movingIds, origins, revealedCardId);
  audio.play(hint.target.zone === 'foundation' ? 'foundation' : 'move');
  render();
  startCardMoveFlight(origins);
  showComboFeedback(movingIds[0], hint.target.zone === 'foundation');
  if (game.state.won) completeWin();
  else scheduleAutoCollect();
  announce('Magic move played');
}

function parseSource(element) {
  const zone = element.dataset.zone;
  if (!zone) return null;
  return { zone, pile: Number(element.dataset.pile), index: Number(element.dataset.index) };
}

function commitMove(target) {
  if (!target) return false;
  const source = game.state.selected;
  const movingIds = game.sequenceAt(source).map((card) => card.id);
  const exposed = source?.zone === 'tableau' ? game.state.tableau[source.pile]?.[source.index - 1] : null;
  const revealedCardId = exposed && !exposed.faceUp ? exposed.id : null;
  const origins = drag?.moved ? new Map() : captureCardOrigins(movingIds);
  const moved = game.moveTo({ zone: target.dataset.dropZone, pile: Number(target.dataset.pile) });
  if (moved) {
    vibrateGame(12);
    markCardMove(movingIds, origins, revealedCardId);
    const foundationMove = target.dataset.dropZone === 'foundation';
    audio.play(foundationMove ? 'foundation' : 'move');
    render();
    startCardMoveFlight(origins);
    showComboFeedback(movingIds[0], foundationMove);
    if (!foundationMove) showTableauTutorial();
    if (game.state.won) completeWin();
    else scheduleAutoCollect();
  } else {
    vibrateGame(24);
    game.state.selected = null;
    game.state.hint = null;
    audio.play('invalid');
    render();
  }
  return moved;
}

function vibrateGame(duration = 12) {
  if (game.state.vibration && 'vibrate' in navigator) navigator.vibrate(duration);
}

function createDragGhost(current, pointerX, pointerY) {
  const ghost = document.createElement('div');
  ghost.className = 'drag-ghost';
  ghost.style.setProperty('--card-width', getComputedStyle(board).getPropertyValue('--card-width'));
  ghost.style.setProperty('--card-height', getComputedStyle(board).getPropertyValue('--card-height'));
  ghost.style.left = `${pointerX - current.offsetX}px`;
  ghost.style.top = `${pointerY - current.offsetY}px`;
  const nodes = current.source.zone === 'tableau'
    ? [...document.querySelectorAll(`#tableau .pile-column[data-pile="${current.source.pile}"] .playing-card[data-zone="tableau"]`)].filter((node) => Number(node.dataset.index) >= current.source.index)
    : [current.card];
  nodes.forEach((node, index) => {
    const copy = node.cloneNode(true);
    copy.classList.remove('is-selected', 'is-hint', 'dragging');
    copy.style.top = `${index * 22}px`;
    copy.style.left = '0';
    copy.style.zIndex = String(index + 1);
    ghost.append(copy);
  });
  document.body.append(ghost);
  return ghost;
}

board.addEventListener('pointerdown', (event) => {
  const element = event.target.closest('.playing-card[data-zone]');
  if (!element || element.classList.contains('card-back')) return;
  const source = parseSource(element);
  if (!source || !game.sequenceAt(source).length) return;
  const rect = element.getBoundingClientRect();
  drag = { source, startX: event.clientX, startY: event.clientY, offsetX: event.clientX - rect.left, offsetY: event.clientY - rect.top, moved: false, card: element, ghost: null };
  try { element.setPointerCapture(event.pointerId); } catch { /* pointer capture is optional */ }
});

board.addEventListener('pointermove', (event) => {
  if (!drag) return;
  if (Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) > 9) {
    drag.moved = true;
    drag.card.classList.add('dragging');
    if (!drag.ghost) drag.ghost = createDragGhost(drag, event.clientX, event.clientY);
    drag.ghost.style.left = `${event.clientX - drag.offsetX}px`;
    drag.ghost.style.top = `${event.clientY - drag.offsetY}px`;
  }
});

board.addEventListener('pointerup', (event) => {
  if (!drag) return;
  const current = drag;
  current.card.classList.remove('dragging');
  current.ghost?.remove();
  if (current.moved) {
    game.select(current.source);
    const target = document.elementFromPoint(event.clientX, event.clientY)?.closest('[data-drop-zone]');
    if (target) commitMove(target);
    else {
      game.state.selected = null;
      render();
    }
  } else {
    const now = Date.now();
    const repeated = previousTap && previousTap.id === current.card.dataset.cardId && now - previousTap.time < 420;
    let result;
    const moveSource = repeated ? current.source : game.state.selected;
    const movingIds = moveSource ? game.sequenceAt(moveSource).map((card) => card.id) : [];
    const exposed = moveSource?.zone === 'tableau' ? game.state.tableau[moveSource.pile]?.[moveSource.index - 1] : null;
    const revealedCardId = exposed && !exposed.faceUp ? exposed.id : null;
    const origins = captureCardOrigins(movingIds);
    if (game.state.quickPlay && repeated && game.autoMove(current.source)) result = { action: 'foundation' };
    else result = game.tapCard(current.source);
    if (result.action === 'move' || result.action === 'foundation') markCardMove(movingIds, origins, revealedCardId);
    previousTap = { id: current.card.dataset.cardId, time: now };
    if (result.action === 'move' || result.action === 'foundation') audio.play(result.action === 'foundation' ? 'foundation' : 'move');
    else if (result.action === 'select') audio.play('tap');
    render();
    if (result.action === 'move' || result.action === 'foundation') startCardMoveFlight(origins);
    if (result.action === 'move' || result.action === 'foundation') showComboFeedback(movingIds[0] ?? current.card.dataset.cardId, result.action === 'foundation');
    if (result.action === 'move') showTableauTutorial();
    if (game.state.won) completeWin();
    else if (result.action === 'move' || result.action === 'foundation') scheduleAutoCollect();
  }
  drag = null;
});

board.addEventListener('pointercancel', () => {
  if (!drag) return;
  drag.card.classList.remove('dragging');
  drag.ghost?.remove();
  drag = null;
});

board.addEventListener('click', (event) => {
  const stockButton = event.target.closest('[data-action="stock"]');
  if (stockButton) {
    handleStock();
    return;
  }
  const target = event.target.closest('[data-drop-zone]');
  if (!target) return;
  if (target.dataset.dropZone === 'tableau' && !target.querySelector('.playing-card') && game.state.selected) {
    const source = game.state.selected;
    const movingIds = game.sequenceAt(source).map((card) => card.id);
    const exposed = source.zone === 'tableau' ? game.state.tableau[source.pile]?.[source.index - 1] : null;
    const revealedCardId = exposed && !exposed.faceUp ? exposed.id : null;
    const origins = captureCardOrigins(movingIds);
    if (game.tapEmptyTableau(Number(target.dataset.pile))) {
      markCardMove(movingIds, origins, revealedCardId);
      audio.play('move');
      render();
      startCardMoveFlight(origins);
      showComboFeedback(movingIds[0]);
      showTableauTutorial();
      scheduleAutoCollect();
    } else audio.play('invalid');
  } else if (target.dataset.dropZone === 'foundation' && game.state.selected) {
    commitMove(target);
  } else if (target.dataset.dropZone === 'waste' && game.state.selected) {
    game.state.selected = null;
    render();
  }
});

$('#undo-button').addEventListener('click', () => {
  cancelAutoCollect();
  if (!game.undo()) return;
  if (!game.state.won) winShown = false;
  audio.play('tap');
  $('.game-shell').classList.remove('won');
  render();
  showComboFeedback(null);
  announce('Last move undone');
});
$('#hint-button').addEventListener('click', handleHint);
$('#new-game-button').addEventListener('click', showNewGame);
$('#menu-button').addEventListener('click', showMoreOptions);
$('#magic-button').addEventListener('click', handleMagic);
$('#modal-close').addEventListener('click', closeModal);
modalBackdrop.addEventListener('click', (event) => { if (event.target === modalBackdrop) closeModal(); });
modalContent.addEventListener('click', (event) => {
  const settingsPage = event.target.closest('[data-settings-page]')?.dataset.settingsPage;
  if (settingsPage === 'statistics') { showStats(); return; }
  if (settingsPage === 'scoring') { showScoringModes(); return; }
  const themeTab = event.target.closest('[data-theme-tab]')?.dataset.themeTab;
  if (themeTab) {
    showThemeGallery(themeTab);
    return;
  }
  if (event.target.closest('[data-theme-gallery]')) {
    showThemeGallery('background');
    return;
  }
  const action = event.target.closest('[data-modal-action]')?.dataset.modalAction;
  if (action === 'close') closeModal();
  if (action === 'new') doNewGame(false);
  if (action === 'restart') doNewGame(true);
  if (action === 'continue') showWinResult(winNewBest);
  if (action === 'play-daily') {
    const selectedDate = modalContent.querySelector('.daily-calendar')?.dataset.selectedDate;
    if (selectedDate) startDailyGame(selectedDate);
    return;
  }
  const dailyDate = event.target.closest('[data-daily-date]')?.dataset.dailyDate;
  if (dailyDate) {
    showDailyCalendar(dailyDate);
    return;
  }
  const monthOffset = Number(event.target.closest('[data-calendar-month]')?.dataset.calendarMonth);
  if (monthOffset) {
    const currentMonth = modalContent.querySelector('.daily-calendar')?.dataset.month;
    if (!currentMonth) return;
    const [year, month] = currentMonth.split('-').map(Number);
    const target = new Date(year, month - 1 + monthOffset, 1);
    const now = new Date();
    if (target > new Date(now.getFullYear(), now.getMonth(), 1)) return;
    const targetKey = `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, '0')}`;
    const day = target.getFullYear() === now.getFullYear() && target.getMonth() === now.getMonth() ? now.getDate() : 1;
    showDailyCalendar(`${targetKey}-${String(day).padStart(2, '0')}`);
    return;
  }
  const control = event.target.closest('[data-setting]');
  if (!control) return;
  const galleryTab = $('#modal-card').classList.contains('theme-gallery')
    ? (modalContent.querySelector('[data-theme-tab].active')?.dataset.themeTab ?? 'background')
    : null;
  const setting = control.dataset.setting;
  let value = control.dataset.value;
  if (setting === 'drawCount') value = Number(value);
  if (['leftHand', 'vibration', 'quickPlay', 'autoCollect', 'autoHints', 'showThreeWasteCards', 'movableHighlight', 'sound', 'music'].includes(setting)) value = value === 'true';
  if (setting === 'autoHints' && !value) {
    clearTimeout(autoHintTimer);
    autoHintTimer = null;
    game.state.hint = null;
    game.state.selected = null;
  }
  if (setting === 'autoCollect' && !value) cancelAutoCollect();
  game.setOption(setting, value);
  if (setting === 'sound') audio.setSound(value);
  if (setting === 'music') audio.setMusic(value);
  render();
  if (!modalBackdrop.classList.contains('hidden')) {
    if (galleryTab) showThemeGallery(galleryTab);
    else showSettings();
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !modalBackdrop.classList.contains('hidden')) closeModal();
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z') {
    event.preventDefault();
    cancelAutoCollect();
    if (game.undo()) {
      if (!game.state.won) winShown = false;
      render();
      showComboFeedback(null);
    }
  }
});

$('#help-button')?.addEventListener('click', showHelp);
$('#stats-button')?.addEventListener('click', showStats);

setInterval(() => {
  if (document.hidden) return;
  game.tick();
  renderTimeDisplay(game.state.seconds);
  if (game.state.seconds % 10 === 0) game.save();
}, 1000);

render();
  let hasProfile = false;
  try { hasProfile = Boolean(localStorage.getItem(STORAGE_PROFILE)); } catch { /* storage is optional */ }
if (!hasProfile) writeProfile({ games: 1, wins: 0, bestScore: 0, dailyCompleted: [] });
if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});

modalContent.addEventListener('click', (event) => {
  const more = event.target.closest('[data-more]')?.dataset.more;
  if (more === 'settings') showSettings();
  if (more === 'help') showHelp();
  if (more === 'stats') showStats();
  if (more === 'daily') showDailyCalendar();
});

window.solitaireGame = game;
window.solitaireAudio = audio;
