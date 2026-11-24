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
let toastTimer = null;
let previousTap = null;
let drag = null;
let animatedCardIds = new Set();
let winShown = false;

const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const PIP_LAYOUT = {
  2: [[50, 25, 0], [50, 75, 180]],
  3: [[50, 22, 0], [50, 50, 0], [50, 78, 180]],
  4: [[34, 27, 0], [66, 27, 0], [34, 73, 180], [66, 73, 180]],
  5: [[34, 27, 0], [66, 27, 0], [50, 50, 0], [34, 73, 180], [66, 73, 180]],
  6: [[34, 23, 0], [66, 23, 0], [34, 50, 0], [66, 50, 180], [34, 77, 180], [66, 77, 180]],
  7: [[50, 20, 0], [34, 23, 0], [66, 23, 0], [34, 50, 0], [66, 50, 180], [34, 77, 180], [66, 77, 180]],
  8: [[34, 20, 0], [66, 20, 0], [34, 40, 0], [66, 40, 180], [34, 60, 0], [66, 60, 180], [34, 80, 180], [66, 80, 180]],
  9: [[34, 18, 0], [66, 18, 0], [34, 36, 0], [66, 36, 180], [50, 50, 0], [34, 64, 0], [66, 64, 180], [34, 82, 180], [66, 82, 180]],
  10: [[34, 17, 0], [66, 17, 0], [34, 33, 0], [66, 33, 180], [34, 50, 0], [66, 50, 180], [34, 67, 0], [66, 67, 180], [34, 83, 180], [66, 83, 180]],
};
const FOUNDATION_SUITS = ['♠', '♥', '♦', '♣'];
const STORAGE_PROFILE = 'solitaire-master-profile-v1';

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}

function cardName(card) {
  return `${['', 'Ace', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Jack', 'Queen', 'King'][card.rank]} of ${({ '♠': 'spades', '♥': 'hearts', '♦': 'diamonds', '♣': 'clubs' })[card.suit]}`;
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
}

function sourceMatches(source, selection) {
  return Boolean(source && selection && source.zone === selection.zone && source.pile === selection.pile && source.index >= selection.index);
}

function isHintSource(source) {
  return Boolean(source && game.state.hint?.source && sourceMatches(source, game.state.hint.source));
}

function renderCard(card, source, options = {}) {
  const { selectable = true, offset = 0, index = 0, deal = false } = options;
  const sourceAttrs = selectable ? `data-zone="${source.zone}" data-pile="${source.pile}" data-index="${source.index}" data-card-id="${escapeHtml(card.id)}"` : '';
  const selected = selectable && sourceMatches(source, game.state.selected);
  const hint = selectable && isHintSource(source);
  const classes = ['playing-card', card.faceUp ? 'card-face' : 'card-back'];
  if (selected) classes.push('is-selected');
  if (hint) classes.push('is-hint');
  if (deal) classes.push('card-enter');
  else if (animatedCardIds.has(card.id)) classes.push('card-arrive');
  const style = `--card-offset:${offset}px;--stack-index:${index};--deal-delay:${Math.min(index * 16, 160)}ms`;
  const aria = card.faceUp ? cardName(card) : 'Face-down card';
  if (!card.faceUp) {
    return `<button class="${classes.join(' ')}" type="button" ${sourceAttrs} style="${style}" aria-label="${aria}" tabindex="-1"><span class="card-back-pattern" aria-hidden="true"></span></button>`;
  }
  const color = ['♥', '♦'].includes(card.suit) ? 'red' : 'black';
  const rank = RANKS[card.rank - 1];
  let center;
  if (card.rank === 1) {
    center = `<span class="card-center ace" aria-hidden="true">${card.suit}</span>`;
  } else if (card.rank <= 10) {
    center = `<span class="pip-field" aria-hidden="true">${PIP_LAYOUT[card.rank].map(([x, y, rotation]) => `<i class="card-pip" style="left:${x}%;top:${y}%;transform:translate(-50%,-50%) rotate(${rotation}deg)">${card.suit}</i>`).join('')}</span>`;
  } else {
    const royal = card.rank === 13 ? '♚' : card.rank === 12 ? '♛' : '♞';
    center = `<span class="court-card" aria-hidden="true"><i>${rank}</i><b>${royal}</b><em>${card.suit}</em><b class="court-mirror">${royal}</b></span>`;
  }
  return `<button class="${classes.join(' ')} ${color}" type="button" ${sourceAttrs} style="${style}" aria-label="${aria}" tabindex="-1">
    <span class="corner corner-top"><b>${rank}</b><i>${card.suit}</i></span>
    ${center}
    <span class="corner corner-bottom"><b>${rank}</b><i>${card.suit}</i></span>
  </button>`;
}

function renderTopRow() {
  const leftHand = game.state.leftHand;
  const stockCol = leftHand ? 6 : 1;
  const wasteCol = leftHand ? 7 : 2;
  const foundationStart = leftHand ? 1 : 4;
  const stock = game.state.stock;
  const stockHint = game.state.hint?.source?.zone === 'stock';
  const stockButton = `<div class="slot stock-slot drop-target${stockHint ? ' is-hint' : ''}" style="grid-column:${stockCol}" data-drop-zone="stock" data-pile="0">
      <button class="stock-button${stockHint ? ' is-hint' : ''}" type="button" data-action="stock" aria-label="${stock.length ? `Draw a card, ${stock.length} cards remaining` : game.state.waste.length ? 'Turn the waste pile over' : 'Stock pile is empty'}">
        ${stock.length ? '<span class="playing-card card-back"><span class="card-back-pattern" aria-hidden="true"></span></span>' : '<span class="empty-stock">↻</span>'}
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
      return renderCard(card, { zone: 'waste', pile: 0, index: actualIndex }, { selectable: top, offset: 0, index: visibleIndex });
    }).join('')
    : '<span class="empty-slot-mark">♧</span>';
  const wasteSlot = `<div class="slot waste-slot drop-target${wasteHint ? ' is-hint' : ''}" style="grid-column:${wasteCol}" data-drop-zone="waste" data-pile="0">${wasteMarkup}</div>`;
  const foundations = game.state.foundations.map((pile, index) => {
    const column = foundationStart + index;
    const top = pile.at(-1);
    const source = { zone: 'foundation', pile: index, index: pile.length - 1 };
    const isTarget = game.state.hint?.target?.zone === 'foundation' && game.state.hint.target.pile === index;
    const card = top ? renderCard(top, source, { index }) : `<span class="foundation-mark" aria-hidden="true">${FOUNDATION_SUITS[index]}</span>`;
    return `<div class="slot foundation-slot drop-target${isTarget ? ' is-hint' : ''}" style="grid-column:${column}" data-drop-zone="foundation" data-pile="${index}" aria-label="Foundation ${index + 1}">${card}</div>`;
  }).join('');
  topRow.innerHTML = `${stockButton}${wasteSlot}${foundations}`;
}

function renderTableau() {
  tableauRoot.innerHTML = game.state.tableau.map((pile, column) => {
    const hintTarget = game.state.hint?.target?.zone === 'tableau' && game.state.hint.target.pile === column;
    const cards = pile.map((card, index) => {
      const previousFaceDown = pile.slice(0, index).filter((item) => !item.faceUp).length;
      const previousFaceUp = pile.slice(0, index).filter((item) => item.faceUp).length;
      const offset = previousFaceDown * 13 + previousFaceUp * 22;
      return renderCard(card, { zone: 'tableau', pile: column, index }, { offset, index: column * 2 + index, deal: firstDeal });
    }).join('');
    const empty = pile.length ? '' : '<span class="empty-tableau-mark" aria-hidden="true">K</span>';
    return `<div class="pile-column drop-target${hintTarget ? ' is-hint' : ''}" data-drop-zone="tableau" data-pile="${column}" aria-label="Tableau pile ${column + 1}">${empty}${cards}</div>`;
  }).join('');
  firstDeal = false;
}

function updateChrome() {
  $('#score-value').textContent = String(game.state.score);
  $('#time-value').textContent = formatTime(game.state.seconds);
  $('#moves-value').textContent = String(game.state.moves);
  $('#undo-button').disabled = game.state.history.length === 0;
  $('#sound-icon').textContent = game.state.sound ? '♫' : '♪';
  $('#sound-button').setAttribute('aria-label', game.state.sound ? 'Turn sound off' : 'Turn sound on');
  document.body.dataset.theme = game.state.theme;
  document.body.dataset.cardBack = game.state.cardBack ?? 'emerald';
  document.body.classList.toggle('left-hand', game.state.leftHand);
}

function render() {
  renderTopRow();
  renderTableau();
  updateChrome();
  animatedCardIds = new Set();
}

function announce(message, duration = 2200) {
  toast.textContent = message;
  toast.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('visible'), duration);
}

function readProfile() {
  try { return JSON.parse(localStorage.getItem(STORAGE_PROFILE)) ?? { games: 0, wins: 0, bestScore: 0 }; }
  catch { return { games: 0, wins: 0, bestScore: 0 }; }
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
  const { drawCount, leftHand, music, sound, theme, cardBack = 'emerald' } = game.state;
  setModal('Settings', 'MAKE IT YOURS', `
    <div class="settings-group">
      <div class="settings-heading">Draw style</div>
      <div class="segmented-control" role="group" aria-label="Draw style">
        <button type="button" class="segment${drawCount === 1 ? ' active' : ''}" data-setting="drawCount" data-value="1" aria-pressed="${drawCount === 1}">Draw 1</button>
        <button type="button" class="segment${drawCount === 3 ? ' active' : ''}" data-setting="drawCount" data-value="3" aria-pressed="${drawCount === 3}">Draw 3</button>
      </div>
    </div>
    <div class="settings-row"><div><b>Left-hand mode</b><small>Move the stock to the right</small></div><button class="switch${leftHand ? ' on' : ''}" type="button" role="switch" aria-label="Left-hand mode" aria-checked="${leftHand}" data-setting="leftHand" data-value="${!leftHand}"><span></span></button></div>
    <div class="settings-row"><div><b>Sound effects</b><small>Card taps, flips, and moves</small></div><button class="switch${sound ? ' on' : ''}" type="button" role="switch" aria-label="Sound effects" aria-checked="${sound}" data-setting="sound" data-value="${!sound}"><span></span></button></div>
    <div class="settings-row"><div><b>Background music</b><small>A soft original ambient loop</small></div><button class="switch${music ? ' on' : ''}" type="button" role="switch" aria-label="Background music" aria-checked="${music}" data-setting="music" data-value="${!music}"><span></span></button></div>
    <div class="settings-group theme-group"><div class="settings-heading">Table background</div><div class="theme-options">
      <button type="button" class="theme-choice woodland${theme === 'woodland' ? ' chosen' : ''}" data-setting="theme" data-value="woodland" aria-label="Woodland background" aria-pressed="${theme === 'woodland'}"><span>Woodland</span></button>
      <button type="button" class="theme-choice felt${theme === 'felt' ? ' chosen' : ''}" data-setting="theme" data-value="felt" aria-label="Classic felt background" aria-pressed="${theme === 'felt'}"><span>Felt</span></button>
      <button type="button" class="theme-choice dusk${theme === 'dusk' ? ' chosen' : ''}" data-setting="theme" data-value="dusk" aria-label="Dusk background" aria-pressed="${theme === 'dusk'}"><span>Dusk</span></button>
    </div></div>
    <div class="settings-group theme-group"><div class="settings-heading">Card back</div><div class="back-options" role="group" aria-label="Card back">
      <button type="button" class="back-choice emerald${cardBack === 'emerald' ? ' chosen' : ''}" data-setting="cardBack" data-value="emerald" aria-label="Emerald card back" aria-pressed="${cardBack === 'emerald'}"><span class="card-back-pattern"></span></button>
      <button type="button" class="back-choice ruby${cardBack === 'ruby' ? ' chosen' : ''}" data-setting="cardBack" data-value="ruby" aria-label="Ruby card back" aria-pressed="${cardBack === 'ruby'}"><span class="card-back-pattern"></span></button>
      <button type="button" class="back-choice midnight${cardBack === 'midnight' ? ' chosen' : ''}" data-setting="cardBack" data-value="midnight" aria-label="Midnight card back" aria-pressed="${cardBack === 'midnight'}"><span class="card-back-pattern"></span></button>
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

function showMoreOptions() {
  const dailyLabel = game.state.challenge ? `Daily challenge · ${game.state.challenge}` : 'Daily challenge';
  setModal('More options', 'YOUR GAME', `
    <div class="more-list">
      <button type="button" data-more="daily"><span>${dailyLabel}</span><b>›</b></button>
      <button type="button" data-more="help"><span>How to play</span><b>›</b></button>
      <button type="button" data-more="stats"><span>Your statistics</span><b>›</b></button>
    </div>`);
}

function startDailyGame() {
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const profile = readProfile();
  const options = {
    drawCount: game.state.drawCount,
    leftHand: game.state.leftHand,
    theme: game.state.theme,
    cardBack: game.state.cardBack ?? 'emerald',
    sound: game.state.sound,
    music: game.state.music,
  };
  game.newDailyGame(today);
  Object.assign(game.state, options);
  game.save();
  profile.games += 1;
  writeProfile(profile);
  firstDeal = true;
  winShown = false;
  $('.game-shell').classList.remove('won');
  closeModal();
  render();
  announce(`Today's daily deal · ${today}`);
}

function completeWin() {
  if (winShown) return;
  winShown = true;
  const profile = readProfile();
  profile.wins += 1;
  profile.bestScore = Math.max(profile.bestScore, game.state.score);
  writeProfile(profile);
  setModal('You did it!', 'WELL PLAYED', `
    <div class="win-emblem" aria-hidden="true">✦</div>
    <p class="win-copy">All 52 cards are home.</p>
    <div class="win-summary"><span>Score <b>${game.state.score}</b></span><span>Time <b>${formatTime(game.state.seconds)}</b></span><span>Moves <b>${game.state.moves}</b></span></div>
    <div class="modal-actions"><button class="primary-action" type="button" data-modal-action="new">Play again</button></div>
  `);
  $('.game-shell').classList.add('won');
}

function handleStock() {
  const action = game.drawFromStock();
  if (action === 'empty') return;
  if (action === 'draw') animatedCardIds = new Set(game.state.waste.slice(-game.state.drawCount).map((card) => card.id));
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
    cardBack: previous.cardBack ?? 'emerald',
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
$('#settings-button').addEventListener('click', showSettings);
$('#sound-button').addEventListener('click', () => {
  const enabled = !game.state.sound;
  game.setOption('sound', enabled);
  audio.setSound(enabled);
  render();
  announce(enabled ? 'Sound effects on' : 'Sound effects off');
  if (enabled) audio.play('tap');
});
$('#modal-close').addEventListener('click', closeModal);
modalBackdrop.addEventListener('click', (event) => { if (event.target === modalBackdrop) closeModal(); });
modalContent.addEventListener('click', (event) => {
  const action = event.target.closest('[data-modal-action]')?.dataset.modalAction;
  if (action === 'close') closeModal();
  if (action === 'new') doNewGame(false);
  if (action === 'restart') doNewGame(true);
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
  if (!hasProfile) writeProfile({ games: 1, wins: 0, bestScore: 0 });
if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});

// These controls live in the settings modal but are useful as quick-access labels in the app shell.
const actionBar = $('.action-bar');
const quickMore = document.createElement('button');
quickMore.className = 'action-button more-button';
quickMore.type = 'button';
quickMore.setAttribute('aria-label', 'More game options');
quickMore.innerHTML = '<span class="action-icon" aria-hidden="true">⋯</span><span>More</span>';
quickMore.addEventListener('click', showMoreOptions);
actionBar.append(quickMore);
modalContent.addEventListener('click', (event) => {
  const more = event.target.closest('[data-more]')?.dataset.more;
  if (more === 'help') showHelp();
  if (more === 'stats') showStats();
  if (more === 'daily') startDailyGame();
});

window.solitaireGame = game;
