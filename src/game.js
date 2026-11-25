const SUITS = ['♠', '♥', '♦', '♣'];
const RED_SUITS = new Set(['♥', '♦']);
const STORAGE_KEY = 'solitaire-master-game-v1';

const clone = (value) => JSON.parse(JSON.stringify(value));

function shuffledDeck(random = Math.random) {
  const cards = SUITS.flatMap((suit) => Array.from({ length: 13 }, (_, index) => ({
    id: `${suit}-${index + 1}`,
    suit,
    rank: index + 1,
    faceUp: false,
  })));
  for (let i = cards.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}

function seededRandom(seedText) {
  let seed = 2166136261;
  for (const char of String(seedText)) {
    seed ^= char.charCodeAt(0);
    seed = Math.imul(seed, 16777619);
  }
  return () => {
    seed += 0x6d2b79f5;
    let value = seed;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export class SolitaireGame {
  constructor({ autoStart = true } = {}) {
    this.state = null;
    if (autoStart) this.newGame();
  }

  newGame(deck = shuffledDeck(), challenge = null) {
    const cards = clone(deck);
    const tableau = Array.from({ length: 7 }, () => []);
    for (let column = 0; column < 7; column += 1) {
      for (let row = 0; row <= column; row += 1) {
        const card = cards.pop();
        card.faceUp = row === column;
        tableau[column].push(card);
      }
    }
    this.state = {
      stock: cards,
      waste: [],
      foundations: Array.from({ length: 4 }, () => []),
      tableau,
      moves: 0,
      score: 0,
      comboCount: 0,
      comboLastMoveAt: 0,
      seconds: 0,
      history: [],
      selected: null,
      hint: null,
      drawCount: 1,
      scoringMode: 'standard',
      magicCharges: 1,
      leftHand: false,
      vibration: true,
      quickPlay: true,
      autoCollect: true,
      autoHints: true,
      showThreeWasteCards: true,
      movableHighlight: false,
      theme: 'felt',
      cardBack: 'ruby',
      cardFaceStyle: 'master',
      challenge,
      sound: true,
      music: false,
      won: false,
      recycledStockPendingDraw: false,
    };
    this.state.seedDeck = clone(deck);
    this.save();
    return this.state;
  }

  newDailyGame(day) {
    return this.newGame(shuffledDeck(seededRandom(day)), day);
  }

  restore() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return false;
      const saved = JSON.parse(stored);
      if (saved?.version !== 1 || !saved.state?.tableau?.length) return false;
      this.state = { ...saved.state, history: [], selected: null, hint: null };
      this.state.cardBack ??= 'ruby';
      this.state.cardFaceStyle ??= 'master';
      if (!['master', 'classic', 'style-3', 'style-4', 'style-5'].includes(this.state.cardFaceStyle)) this.state.cardFaceStyle = 'master';
      if (this.state.cardBack === 'emerald' || this.state.cardBack === 'midnight') {
        this.state.cardBack = 'blue';
        this.save();
      }
      this.state.magicCharges ??= 1;
      this.state.recycledStockPendingDraw ??= false;
      this.state.challenge ??= null;
      this.state.scoringMode ??= 'standard';
      if (!['standard', 'vegas'].includes(this.state.scoringMode)) this.state.scoringMode = 'standard';
      this.state.vibration ??= true;
      this.state.quickPlay ??= true;
      this.state.autoCollect ??= true;
      this.state.autoHints ??= true;
      this.state.showThreeWasteCards ??= true;
      this.state.movableHighlight ??= false;
      this.state.comboCount = 0;
      this.state.comboLastMoveAt = 0;
      if (this.state.theme === 'woodland') this.state.theme = 'mountain';
      if (this.state.theme === 'dusk') this.state.theme = 'felt';
      if (!['felt', 'mountain', 'lagoon', 'emerald', 'midnight', 'plum', 'forest', 'violet', 'green-9', 'green-10', 'green-11'].includes(this.state.theme)) this.state.theme = 'felt';
      return true;
    } catch {
      return false;
    }
  }

  save() {
    try {
      const persisted = clone(this.state);
      persisted.history = [];
      persisted.selected = null;
      persisted.hint = null;
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, state: persisted }));
    } catch {
      // Private browsing or a full storage quota must not interrupt a game.
    }
  }

  setOption(name, value) {
    if (['drawCount', 'scoringMode', 'leftHand', 'vibration', 'quickPlay', 'autoCollect', 'autoHints', 'showThreeWasteCards', 'movableHighlight', 'theme', 'cardBack', 'cardFaceStyle', 'sound', 'music'].includes(name)) {
      this.state[name] = value;
      this.save();
    }
  }

  tick() {
    if (!this.state.won) this.state.seconds += 1;
  }

  snapshot() {
    const saved = clone(this.state);
    saved.history = [];
    saved.selected = null;
    saved.hint = null;
    this.state.history.push(saved);
    if (this.state.history.length > 120) this.state.history.shift();
  }

  undo() {
    const previous = this.state.history.pop();
    if (!previous) return false;
    this.state = { ...previous, history: this.state.history, selected: null, hint: null };
    this.save();
    return true;
  }

  drawFromStock() {
    this.state.selected = null;
    this.state.hint = null;
    if (this.state.stock.length) {
      this.snapshot();
      this.state.comboCount = 0;
      this.state.comboLastMoveAt = 0;
      const amount = Math.min(this.state.drawCount, this.state.stock.length);
      for (let i = 0; i < amount; i += 1) {
        const card = this.state.stock.pop();
        card.faceUp = true;
        this.state.waste.push(card);
      }
      this.state.moves += 1;
      this.state.recycledStockPendingDraw = false;
      this.save();
      return 'draw';
    }
    if (this.state.waste.length) {
      this.snapshot();
      this.state.comboCount = 0;
      this.state.comboLastMoveAt = 0;
      // Restore the original draw order so the first card drawn after recycling
      // is the same card that was on top when this stock cycle began.
      this.state.stock = [...this.state.waste].reverse();
      this.state.stock.forEach((card) => { card.faceUp = false; });
      this.state.waste = [];
      this.state.moves += 1;
      this.state.recycledStockPendingDraw = true;
      if (this.state.scoringMode === 'vegas') this.state.score -= 100;
      this.save();
      return 'recycle';
    }
    return 'empty';
  }

  cardAt(source) {
    if (!source) return null;
    if (source.zone === 'waste') return this.state.waste.at(-1) ?? null;
    if (source.zone === 'tableau') return this.state.tableau[source.pile]?.[source.index] ?? null;
    if (source.zone === 'foundation') return this.state.foundations[source.pile]?.at(-1) ?? null;
    return null;
  }

  sequenceAt(source) {
    if (!source) return [];
    if (source.zone === 'waste') return this.state.waste.length ? [this.state.waste.at(-1)] : [];
    if (source.zone === 'foundation') {
      const pile = this.state.foundations[source.pile];
      return pile.length ? [pile.at(-1)] : [];
    }
    if (source.zone !== 'tableau') return [];
    const pile = this.state.tableau[source.pile] ?? [];
    const sequence = pile.slice(source.index);
    if (!sequence.length || sequence.some((card) => !card.faceUp)) return [];
    for (let i = 1; i < sequence.length; i += 1) {
      if (!this.follows(sequence[i - 1], sequence[i])) return [];
    }
    return sequence;
  }

  follows(lower, upper) {
    return lower.rank === upper.rank + 1 && RED_SUITS.has(lower.suit) !== RED_SUITS.has(upper.suit);
  }

  canMove(source, target) {
    if (!source || !target || (source.zone === target.zone && source.pile === target.pile)) return false;
    const moving = this.sequenceAt(source);
    if (!moving.length) return false;
    const card = moving[0];
    if (target.zone === 'foundation') {
      if (moving.length !== 1) return false;
      const pile = this.state.foundations[target.pile];
      return pile.length ? pile.at(-1).suit === card.suit && card.rank === pile.at(-1).rank + 1 : card.rank === 1;
    }
    if (target.zone === 'tableau') {
      const pile = this.state.tableau[target.pile];
      return pile.length ? this.follows(pile.at(-1), card) : card.rank === 13;
    }
    return false;
  }

  removeSequence(source) {
    let moving;
    if (source.zone === 'waste') moving = [this.state.waste.pop()];
    else if (source.zone === 'foundation') moving = [this.state.foundations[source.pile].pop()];
    else {
      const pile = this.state.tableau[source.pile];
      moving = pile.splice(source.index);
      const newlyExposed = pile.at(-1);
      if (newlyExposed && !newlyExposed.faceUp) {
        newlyExposed.faceUp = true;
        if (this.state.scoringMode === 'standard') this.state.score += 5;
      }
    }
    return moving;
  }

  moveTo(target) {
    const source = this.state.selected;
    if (!this.canMove(source, target)) return false;
    this.snapshot();
    const moving = this.removeSequence(source);
    if (target.zone === 'foundation') {
      this.state.foundations[target.pile].push(moving[0]);
      if (source.zone !== 'foundation') this.state.score += this.state.scoringMode === 'vegas' ? 5 : 10;
    } else {
      this.state.tableau[target.pile].push(...moving);
      if (this.state.scoringMode === 'standard') {
        if (source.zone === 'foundation') this.state.score = Math.max(0, this.state.score - 15);
        else this.state.score += 5;
      }
    }
    this.state.moves += 1;
    const now = Date.now();
    this.state.comboCount = this.state.comboLastMoveAt && now - this.state.comboLastMoveAt <= 5500
      ? this.state.comboCount + 1
      : 0;
    this.state.comboLastMoveAt = now;
    this.state.selected = null;
    this.state.hint = null;
    this.state.won = this.state.foundations.reduce((sum, pile) => sum + pile.length, 0) === 52;
    this.save();
    return true;
  }

  select(source) {
    if (!this.sequenceAt(source).length) return false;
    this.state.selected = { ...source };
    this.state.hint = null;
    return true;
  }

  tapCard(source) {
    const card = this.cardAt(source);
    if (!card || !card.faceUp) return { action: 'none' };
    const selected = this.state.selected;
    if (selected) {
      if (selected.zone === source.zone && selected.pile === source.pile && selected.index === source.index) {
        if (source.zone === 'tableau' || source.zone === 'waste') {
          const foundation = this.state.foundations.findIndex((_, pile) => this.canMove(selected, { zone: 'foundation', pile }));
          if (foundation >= 0 && this.moveTo({ zone: 'foundation', pile: foundation })) return { action: 'foundation' };
        }
        this.state.selected = null;
        return { action: 'deselect' };
      }
      if (source.zone === 'tableau' && this.moveTo({ zone: 'tableau', pile: source.pile })) return { action: 'move' };
      if (source.zone === 'foundation' && this.moveTo({ zone: 'foundation', pile: source.pile })) return { action: 'move' };
    }
    if (this.select(source)) return { action: 'select' };
    return { action: 'none' };
  }

  tapEmptyTableau(pile) {
    if (this.state.selected && this.moveTo({ zone: 'tableau', pile })) return true;
    return false;
  }

  autoMove(source) {
    for (let pile = 0; pile < 4; pile += 1) {
      if (this.canMove(source, { zone: 'foundation', pile })) {
        this.state.selected = { ...source };
        return this.moveTo({ zone: 'foundation', pile });
      }
    }
    return false;
  }

  hintMove() {
    const candidates = [];
    const add = (source, target, priority) => {
      if (this.canMove(source, target)) candidates.push({ source, target, priority });
    };
    for (let column = 0; column < 7; column += 1) {
      const pile = this.state.tableau[column];
      if (!pile.length) continue;
      const top = { zone: 'tableau', pile: column, index: pile.length - 1 };
      for (let foundation = 0; foundation < 4; foundation += 1) add(top, { zone: 'foundation', pile: foundation }, 5);
      for (let target = 0; target < 7; target += 1) {
        if (target !== column) add(top, { zone: 'tableau', pile: target }, pile.length > 1 && !pile.at(-2).faceUp ? 1 : 3);
      }
      for (let index = 0; index < pile.length - 1; index += 1) {
        const source = { zone: 'tableau', pile: column, index };
        for (let target = 0; target < 7; target += 1) if (target !== column) add(source, { zone: 'tableau', pile: target }, !pile.at(-1).faceUp ? 0 : 2);
      }
    }
    if (this.state.waste.length) {
      const source = { zone: 'waste', pile: 0, index: this.state.waste.length - 1 };
      for (let foundation = 0; foundation < 4; foundation += 1) add(source, { zone: 'foundation', pile: foundation }, 4);
      for (let column = 0; column < 7; column += 1) add(source, { zone: 'tableau', pile: column }, 2);
    }
    candidates.sort((a, b) => a.priority - b.priority);
    const hint = candidates[0] ?? (this.state.stock.length || this.state.waste.length ? { source: { zone: 'stock', pile: 0 }, target: null } : null);
    this.state.hint = hint;
    if (hint?.source.zone !== 'stock') this.state.selected = { ...hint.source };
    return hint;
  }
}

export { RED_SUITS, STORAGE_KEY, SUITS };
