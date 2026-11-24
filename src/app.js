import { SolitaireGame } from './game.js';
import { GameAudio } from './audio.js';

const game = new SolitaireGame({ autoStart: false });
if (!game.restore()) game.newGame();
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
board.addEventListener('animationend', (event) => {
  if (event.animationName === 'deal-face-reveal') {
    event.target.closest('.card-enter')?.classList.remove('card-enter');
  } else if (event.animationName === 'draw-face-reveal') {
    event.target.closest('.card-reveal')?.classList.remove('card-reveal', 'card-arrive');
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
let cardFlight = null;
let winShown = false;

const CARD_RANK_FILES = ['', 'ace', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'jack', 'queen', 'king'];
const CARD_SUIT_FILES = { '♠': 'spades', '♥': 'hearts', '♦': 'diamonds', '♣': 'clubs' };
const CARD_BACK_FILES = { ruby: 'back-solitaire-master.svg', emerald: 'back-blue.svg', midnight: 'back-blue.svg' };
const REFERENCE_COURT_CARDS = new Set([
  'queen-of-spades', 'king-of-diamonds', 'jack-of-diamonds',
  'queen-of-clubs', 'queen-of-diamonds', 'queen-of-hearts',
  'king-of-hearts', 'king-of-spades',
  'jack-of-clubs', 'jack-of-hearts', 'jack-of-spades',
]);
const STORAGE_PROFILE = 'solitaire-master-profile-v1';

function cardBackFile() {
  return CARD_BACK_FILES[game.state.cardBack] ?? CARD_BACK_FILES.ruby;
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
  if (selected) classes.push('is-selected');
  if (hint) classes.push('is-hint');
  if (deal) classes.push('card-enter');
  else if (animatedCardIds.has(card.id)) classes.push('card-arrive');
  if (flight && card.faceUp) classes.push('card-reveal');
  const delay = deal ? dealOrder * 40 : Math.min(index * 16, 160);
  const drawX = flight ? flight.originX - flight.targetX : 0;
  const drawY = flight ? flight.originY - flight.targetY : -5;
  const flightOrder = flight ? (flight.order.get(card.id) ?? 0) : drawOrder;
  const drawDelay = flight ? flightOrder * 55 : 0;
  const style = `--card-offset:${offset}px;--stack-index:${index};--deal-delay:${delay}ms;--waste-offset:${wasteOffset};--draw-x:${drawX}px;--draw-y:${drawY}px;--draw-delay:${drawDelay}ms;--flip-back:url('/assets/cards/${cardBackFile()}')`;
  const aria = card.faceUp ? cardName(card) : 'Face-down card';
  if (!card.faceUp) {
    return `<button class="${classes.join(' ')}" type="button" ${sourceAttrs} style="${style}" aria-label="${aria}" tabindex="-1"><img class="card-back-art" src="/assets/cards/${cardBackFile()}" alt="" draggable="false"></button>`;
  }
  const color = ['♥', '♦'].includes(card.suit) ? 'red' : 'black';
  const artName = `${CARD_RANK_FILES[card.rank]}-of-${CARD_SUIT_FILES[card.suit]}`;
  const asset = REFERENCE_COURT_CARDS.has(artName) ? `${artName}-reference.png` : `${artName}.svg`;
  return `<button class="${classes.join(' ')} ${color}" type="button" ${sourceAttrs} style="${style}" aria-label="${aria}" tabindex="-1"><img class="card-face-art" src="/assets/cards/${asset}" alt="" draggable="false"></button>`;
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
        ${stock.length ? `<span class="playing-card card-back"><img class="card-back-art" src="/assets/cards/${cardBackFile()}" alt="" draggable="false"></span>` : '<span class="empty-stock">↻</span>'}
      </button>
      ${stock.length ? `<span class="stock-count">${stock.length}</span>` : ''}
    </div>`;
  const wasteCards = game.state.waste.slice(-3);
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
    const card = top ? renderCard(top, source, { index }) : '<span class="foundation-mark" aria-hidden="true">A</span>';
    return `<div class="slot foundation-slot drop-target${isTarget ? ' is-hint' : ''}" style="grid-column:${column};grid-row:1" data-drop-zone="foundation" data-pile="${index}" aria-label="Foundation ${index + 1}">${card}</div>`;
  }).join('');
  topRow.innerHTML = `${stockButton}${wasteSlot}${foundations}`;
}

function renderTableau() {
  const animateDeal = firstDeal;
  tableauRoot.innerHTML = game.state.tableau.map((pile, column) => {
    const hintTarget = game.state.hint?.target?.zone === 'tableau' && game.state.hint.target.pile === column;
    const cards = pile.map((card, index) => {
      const previousFaceDown = pile.slice(0, index).filter((item) => !item.faceUp).length;
      const previousFaceUp = pile.slice(0, index).filter((item) => item.faceUp).length;
      const offset = previousFaceDown * 13 + previousFaceUp * 22;
      const dealOrder = index * 7 - (index * (index - 1)) / 2 + column - index;
      return renderCard(card, { zone: 'tableau', pile: column, index }, { offset, index: column * 2 + index, deal: animateDeal, dealOrder });
    }).join('');
    const empty = pile.length ? '' : '<span class="empty-tableau-mark" aria-hidden="true">K</span>';
    return `<div class="pile-column drop-target${hintTarget ? ' is-hint' : ''}" data-drop-zone="tableau" data-pile="${column}" aria-label="Tableau pile ${column + 1}">${empty}${cards}</div>`;
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
  $('#score-value').textContent = String(game.state.score);
  $('#time-value').textContent = formatTime(game.state.seconds);
  $('#moves-value').textContent = String(game.state.moves);
  $('#undo-button').disabled = game.state.history.length === 0;
  const magicBadge = $('#magic-badge');
  magicBadge.textContent = String(game.state.magicCharges);
  magicBadge.hidden = game.state.magicCharges < 1;
  magicBadge.setAttribute('aria-label', `${game.state.magicCharges} magic moves available`);
  document.body.dataset.theme = game.state.theme;
  document.body.dataset.cardBack = game.state.cardBack ?? 'ruby';
  document.body.classList.toggle('left-hand', game.state.leftHand);
}

function render() {
  renderTopRow();
  renderTableau();
  updateChrome();
  animatedCardIds = new Set();
  cardFlight = null;
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

function setModal(title, kicker, html) {
  modalTitle.textContent = title;
  modalKicker.textContent = kicker;
  modalContent.innerHTML = html;
  modalBackdrop.classList.remove('hidden');
  document.body.classList.add('modal-open');
  $('#modal-close').focus();
}

function closeModal() {
  modalBackdrop.classList.add('hidden');
  document.body.classList.remove('modal-open');
}

function showSettings() {
  const { drawCount, leftHand, music, sound, theme, cardBack = 'ruby' } = game.state;
  setModal('Settings', 'MAKE IT YOURS', `
    <div class="settings-group">
      <div class="settings-heading">Draw style</div>
      <div class="segmented-control" role="group" aria-label="Draw style">
        <button type="button" class="segment${drawCount === 1 ? ' active' : ''}" data-setting="drawCount" data-value="1" aria-pressed="${drawCount === 1}">Draw 1</button>
        <button type="button" class="segment${drawCount === 3 ? ' active' : ''}" data-setting="drawCount" data-value="3" aria-pressed="${drawCount === 3}">Draw 3</button>
      </div>
    </div>
    <div class="settings-row"><div><b>Left-hand mode</b><small>Move the stock to the left</small></div><button class="switch${leftHand ? ' on' : ''}" type="button" role="switch" aria-label="Left-hand mode" aria-checked="${leftHand}" data-setting="leftHand" data-value="${!leftHand}"><span></span></button></div>
    <div class="settings-row"><div><b>Sound effects</b><small>Card taps, flips, and moves</small></div><button class="switch${sound ? ' on' : ''}" type="button" role="switch" aria-label="Sound effects" aria-checked="${sound}" data-setting="sound" data-value="${!sound}"><span></span></button></div>
    <div class="settings-row"><div><b>Background music</b><small>A soft original ambient loop</small></div><button class="switch${music ? ' on' : ''}" type="button" role="switch" aria-label="Background music" aria-checked="${music}" data-setting="music" data-value="${!music}"><span></span></button></div>
    <div class="settings-group theme-group"><div class="settings-heading">Table background</div><div class="theme-options">
      <button type="button" class="theme-choice mountain${theme === 'mountain' ? ' chosen' : ''}" data-setting="theme" data-value="mountain" aria-label="Mountain background" aria-pressed="${theme === 'mountain'}"><span>Mountain</span></button>
      <button type="button" class="theme-choice felt${theme === 'felt' ? ' chosen' : ''}" data-setting="theme" data-value="felt" aria-label="Classic felt background" aria-pressed="${theme === 'felt'}"><span>Felt</span></button>
      <button type="button" class="theme-choice dusk${theme === 'dusk' ? ' chosen' : ''}" data-setting="theme" data-value="dusk" aria-label="Dusk background" aria-pressed="${theme === 'dusk'}"><span>Dusk</span></button>
    </div></div>
    <div class="settings-group theme-group"><div class="settings-heading">Card back</div><div class="back-options" role="group" aria-label="Card back">
      <button type="button" class="back-choice emerald${cardBack === 'emerald' ? ' chosen' : ''}" data-setting="cardBack" data-value="emerald" aria-label="Emerald card back" aria-pressed="${cardBack === 'emerald'}"><img src="/assets/cards/back-blue.svg" alt=""></button>
      <button type="button" class="back-choice ruby${cardBack === 'ruby' ? ' chosen' : ''}" data-setting="cardBack" data-value="ruby" aria-label="Ruby card back" aria-pressed="${cardBack === 'ruby'}"><img src="/assets/cards/back-solitaire-master.svg" alt=""></button>
      <button type="button" class="back-choice midnight${cardBack === 'midnight' ? ' chosen' : ''}" data-setting="cardBack" data-value="midnight" aria-label="Midnight card back" aria-pressed="${cardBack === 'midnight'}"><img src="/assets/cards/back-blue.svg" alt=""></button>
    </div></div>
    <div class="modal-footnote">Your game and preferences stay on this device.</div>
  `);
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
  const profile = readProfile();
  const options = {
    drawCount: game.state.drawCount,
    leftHand: game.state.leftHand,
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
  announce(`Daily challenge · ${dateLabel(day)}`);
}

function completeWin() {
  if (winShown) return;
  winShown = true;
  const profile = readProfile();
  const previousBest = profile.bestScore;
  profile.wins += 1;
  profile.bestScore = Math.max(profile.bestScore, game.state.score);
  if (game.state.challenge) profile.dailyCompleted = [...new Set([...profile.dailyCompleted, game.state.challenge])].sort();
  writeProfile(profile);
  const newBest = game.state.score > previousBest;
  const challengeCopy = game.state.challenge ? `Daily challenge completed · ${dateLabel(game.state.challenge)}` : 'All 52 cards are home.';
  setModal('You win!', 'WELL PLAYED', `
    <div class="win-celebration" aria-label="You win"><div class="win-rays" aria-hidden="true"></div><div class="win-ribbon"><span aria-hidden="true">♛</span><b>YOU WIN</b><span aria-hidden="true">♛</span></div></div>
    <div class="win-score-line"><span>Score</span><strong>${game.state.score}</strong>${newBest ? '<b class="win-best">Best!</b>' : ''}</div>
    <p class="win-copy">${challengeCopy}</p>
    <div class="win-summary"><span>Time <b>${formatTime(game.state.seconds)}</b></span><span>Moves <b>${game.state.moves}</b></span></div>
    <div class="modal-actions"><button class="primary-action" type="button" data-modal-action="new">New Deal</button></div>
  `);
  $('.game-shell').classList.add('won');
}

function handleStock() {
  const origin = captureStockFlight();
  const action = game.drawFromStock();
  if (action === 'empty') return;
  if (action === 'draw') animateStockCards(origin, game.state.waste.slice(-game.state.drawCount));
  audio.play(action === 'recycle' ? 'flip' : 'draw');
  render();
}

function doNewGame(restart = false) {
  const profile = readProfile();
  const previous = game.state;
  const options = {
    drawCount: previous.drawCount,
    leftHand: previous.leftHand,
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
    return;
  }
  const movingIds = game.sequenceAt(hint.source).map((card) => card.id);
  const exposed = hint.source.zone === 'tableau' ? game.state.tableau[hint.source.pile]?.[hint.source.index - 1] : null;
  game.select(hint.source);
  if (!game.moveTo(hint.target)) {
    game.state.hint = null;
    render();
    announce('No magic move is available');
    return;
  }
  game.state.magicCharges -= 1;
  game.save();
  animatedCardIds = new Set([...movingIds, ...(exposed && !exposed.faceUp ? [exposed.id] : [])]);
  audio.play(game.state.won ? 'win' : hint.target.zone === 'foundation' ? 'foundation' : 'move');
  render();
  if (game.state.won) completeWin();
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
  const moved = game.moveTo({ zone: target.dataset.dropZone, pile: Number(target.dataset.pile) });
  if (moved) {
    animatedCardIds = new Set([...movingIds, ...(exposed && !exposed.faceUp ? [exposed.id] : [])]);
    const foundationMove = target.dataset.dropZone === 'foundation';
    const revealed = game.state.score > (drag?.score ?? game.state.score);
    audio.play(game.state.won ? 'win' : foundationMove ? 'foundation' : revealed ? 'flip' : 'move');
    render();
    if (game.state.won) completeWin();
  } else {
    game.state.selected = null;
    game.state.hint = null;
    audio.play('invalid');
    render();
  }
  return moved;
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
  drag = { source, startX: event.clientX, startY: event.clientY, offsetX: event.clientX - rect.left, offsetY: event.clientY - rect.top, moved: false, score: game.state.score, card: element, ghost: null };
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
    const movingIds = game.state.selected ? game.sequenceAt(game.state.selected).map((card) => card.id) : [];
    const exposed = game.state.selected?.zone === 'tableau' ? game.state.tableau[game.state.selected.pile]?.[game.state.selected.index - 1] : null;
    if (repeated && game.autoMove(current.source)) result = { action: 'foundation' };
    else result = game.tapCard(current.source);
    if (result.action === 'move' || result.action === 'foundation') animatedCardIds = new Set([...movingIds, ...(exposed && !exposed.faceUp ? [exposed.id] : [])]);
    previousTap = { id: current.card.dataset.cardId, time: now };
    if (result.action === 'move' || result.action === 'foundation') audio.play(game.state.won ? 'win' : result.action === 'foundation' ? 'foundation' : 'move');
    else if (result.action === 'select') audio.play('tap');
    render();
    if (game.state.won) completeWin();
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
    const movingIds = game.sequenceAt(game.state.selected).map((card) => card.id);
    const exposed = game.state.selected.zone === 'tableau' ? game.state.tableau[game.state.selected.pile]?.[game.state.selected.index - 1] : null;
    if (game.tapEmptyTableau(Number(target.dataset.pile))) {
      animatedCardIds = new Set([...movingIds, ...(exposed && !exposed.faceUp ? [exposed.id] : [])]);
      audio.play('move');
      render();
    } else audio.play('invalid');
  } else if (target.dataset.dropZone === 'foundation' && game.state.selected) {
    commitMove(target);
  } else if (target.dataset.dropZone === 'waste' && game.state.selected) {
    game.state.selected = null;
    render();
  }
});

$('#undo-button').addEventListener('click', () => {
  if (!game.undo()) return;
  if (!game.state.won) winShown = false;
  audio.play('tap');
  $('.game-shell').classList.remove('won');
  render();
  announce('Last move undone');
});
$('#hint-button').addEventListener('click', handleHint);
$('#new-game-button').addEventListener('click', showNewGame);
$('#menu-button').addEventListener('click', showMoreOptions);
$('#magic-button').addEventListener('click', handleMagic);
$('#modal-close').addEventListener('click', closeModal);
modalBackdrop.addEventListener('click', (event) => { if (event.target === modalBackdrop) closeModal(); });
modalContent.addEventListener('click', (event) => {
  const action = event.target.closest('[data-modal-action]')?.dataset.modalAction;
  if (action === 'close') closeModal();
  if (action === 'new') doNewGame(false);
  if (action === 'restart') doNewGame(true);
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
  const setting = control.dataset.setting;
  let value = control.dataset.value;
  if (setting === 'drawCount') value = Number(value);
  if (setting === 'leftHand' || setting === 'sound' || setting === 'music') value = value === 'true';
  game.setOption(setting, value);
  if (setting === 'sound') audio.setSound(value);
  if (setting === 'music') audio.setMusic(value);
  render();
  if (!modalBackdrop.classList.contains('hidden')) showSettings();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !modalBackdrop.classList.contains('hidden')) closeModal();
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z') {
    event.preventDefault();
    if (game.undo()) {
      if (!game.state.won) winShown = false;
      render();
    }
  }
});

$('#help-button')?.addEventListener('click', showHelp);
$('#stats-button')?.addEventListener('click', showStats);

setInterval(() => {
  if (document.hidden) return;
  game.tick();
  $('#time-value').textContent = formatTime(game.state.seconds);
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
