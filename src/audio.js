export class GameAudio {
  constructor() {
    this.context = null;
    this.unlocked = false;
    this.unlockPromise = null;
    this.musicTimer = null;
    this.musicOn = false;
    this.soundOn = true;
    this.musicStep = 0;
    this.pending = [];
    this.master = null;
  }

  getContext() {
    if (!this.context) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return null;
      this.context = new AudioContextClass();
      this.master = this.context.createGain();
      this.master.gain.value = 0.18;
      this.master.connect(this.context.destination);
    }
    return this.context;
  }

  async unlock() {
    const context = this.getContext();
    if (!context) return false;
    if (context.state === 'running') {
      this.unlocked = true;
      return true;
    }
    if (!this.unlockPromise) {
      this.unlockPromise = context.resume().then(() => {
        this.unlocked = context.state === 'running';
        const queued = this.pending.splice(0);
        for (const cue of queued) this.playCue(cue);
        return this.unlocked;
      }).catch(() => false).finally(() => { this.unlockPromise = null; });
    }
    return this.unlockPromise;
  }

  async play(cue = 'tap') {
    if (!this.soundOn) return;
    const unlocked = await this.unlock();
    if (!unlocked) {
      this.pending.push(cue);
      return;
    }
    this.playCue(cue);
  }

  playCue(cue) {
    const context = this.getContext();
    if (!context || context.state !== 'running') return;
    const now = context.currentTime;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const filter = context.createBiquadFilter();
    const soundMap = {
      tap: [560, 0.055, 'sine'],
      draw: [430, 0.11, 'triangle'],
      move: [660, 0.1, 'sine'],
      flip: [790, 0.12, 'triangle'],
      foundation: [990, 0.19, 'sine'],
      invalid: [190, 0.09, 'triangle'],
      win: [880, 0.4, 'sine'],
    };
    const [frequency, duration, type] = soundMap[cue] ?? soundMap.tap;
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, now);
    oscillator.frequency.exponentialRampToValueAtTime(frequency * (cue === 'invalid' ? 0.72 : 1.2), now + duration);
    filter.type = 'lowpass';
    filter.frequency.value = cue === 'draw' ? 1450 : 2400;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(cue === 'invalid' ? 0.12 : 0.2, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.02);
    if (cue === 'win') {
      setTimeout(() => this.playCue('foundation'), 120);
      setTimeout(() => this.playCue('move'), 250);
    }
  }

  setSound(enabled) {
    this.soundOn = enabled;
    if (enabled) this.unlock();
  }

  setMusic(enabled) {
    this.musicOn = enabled;
    if (!enabled) {
      clearTimeout(this.musicTimer);
      this.musicTimer = null;
      if (this.master && this.context) this.master.gain.setTargetAtTime(0.18, this.context.currentTime, 0.16);
      return;
    }
    this.unlock().then((ok) => { if (ok && this.musicOn) this.scheduleMusic(); });
  }

  scheduleMusic() {
    if (!this.musicOn || !this.context || this.context.state !== 'running') return;
    const melody = [523.25, 659.25, 783.99, 659.25, 587.33, 698.46, 880, 698.46, 493.88, 587.33, 739.99, 587.33];
    const frequency = melody[this.musicStep % melody.length];
    this.musicStep += 1;
    const now = this.context.currentTime;
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    const filter = this.context.createBiquadFilter();
    osc.type = 'sine';
    osc.frequency.value = frequency;
    filter.type = 'lowpass';
    filter.frequency.value = 1200;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.035, now + 0.2);
    gain.gain.setTargetAtTime(0.0001, now + 0.22, 0.55);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    osc.start(now);
    osc.stop(now + 2.3);
    this.musicTimer = setTimeout(() => this.scheduleMusic(), 1900);
  }
}
