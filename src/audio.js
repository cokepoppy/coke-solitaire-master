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
    this.soundBus = null;
    this.musicBus = null;
    this.masterLevel = 0.82;
    this.soundLevel = 0.68;
    this.noiseBuffer = null;
    this.referenceMoveBuffer = null;
    this.referenceMoveLoadPromise = null;
    this.referenceGoodBuffer = null;
    this.referenceGoodLoadPromise = null;
    this.referenceAmazingBuffer = null;
    this.referenceAmazingLoadPromise = null;
    this.referenceGreatBuffer = null;
    this.referenceGreatLoadPromise = null;
    this.referenceFoundationBuffer = null;
    this.referenceFoundationLoadPromise = null;
    this.referenceWinBuffer = null;
    this.referenceWinLoadPromise = null;
  }

  getContext() {
    if (!this.context) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return null;
      this.context = new AudioContextClass();
      this.master = this.context.createGain();
      this.soundBus = this.context.createGain();
      this.musicBus = this.context.createGain();
      this.master.gain.value = this.masterLevel;
      this.soundBus.gain.value = this.soundOn ? this.soundLevel : 0;
      this.musicBus.gain.value = this.musicOn ? 0.42 : 0;
      this.soundBus.connect(this.master);
      this.musicBus.connect(this.master);
      this.master.connect(this.context.destination);
      this.noiseBuffer = this.createNoiseBuffer(this.context);
      this.loadReferenceMove();
      this.loadReferenceGood();
      this.loadReferenceAmazing();
      this.loadReferenceGreat();
      this.loadReferenceFoundation();
      this.loadReferenceWin();
    }
    return this.context;
  }

  createNoiseBuffer(context) {
    const sampleCount = Math.ceil(context.sampleRate * 0.5);
    const buffer = context.createBuffer(1, sampleCount, context.sampleRate);
    const samples = buffer.getChannelData(0);
    let previous = 0;
    for (let index = 0; index < sampleCount; index += 1) {
      const white = Math.random() * 2 - 1;
      previous = white * 0.72 + previous * 0.28;
      samples[index] = previous;
    }
    return buffer;
  }

  loadReferenceMove() {
    if (!this.context) return Promise.resolve(null);
    if (!this.referenceMoveLoadPromise) {
      this.referenceMoveLoadPromise = fetch('/assets/audio/card-move-reference.wav')
        .then((response) => {
          if (!response.ok) throw new Error(`Move sample request failed: ${response.status}`);
          return response.arrayBuffer();
        })
        .then((bytes) => this.context.decodeAudioData(bytes))
        .then((buffer) => {
          this.referenceMoveBuffer = buffer;
          return buffer;
        })
        .catch(() => null);
    }
    return this.referenceMoveLoadPromise;
  }

  loadReferenceGood() {
    if (!this.context) return Promise.resolve(null);
    if (!this.referenceGoodLoadPromise) {
      this.referenceGoodLoadPromise = fetch('/assets/audio/combo-good-reference.wav')
        .then((response) => {
          if (!response.ok) throw new Error(`Good sample request failed: ${response.status}`);
          return response.arrayBuffer();
        })
        .then((bytes) => this.context.decodeAudioData(bytes))
        .then((buffer) => {
          this.referenceGoodBuffer = buffer;
          return buffer;
        })
        .catch(() => null);
    }
    return this.referenceGoodLoadPromise;
  }

  loadReferenceAmazing() {
    if (!this.context) return Promise.resolve(null);
    if (!this.referenceAmazingLoadPromise) {
      this.referenceAmazingLoadPromise = fetch('/assets/audio/combo-amazing-reference.wav')
        .then((response) => {
          if (!response.ok) throw new Error(`Amazing sample request failed: ${response.status}`);
          return response.arrayBuffer();
        })
        .then((bytes) => this.context.decodeAudioData(bytes))
        .then((buffer) => {
          this.referenceAmazingBuffer = buffer;
          return buffer;
        })
        .catch(() => null);
    }
    return this.referenceAmazingLoadPromise;
  }

  loadReferenceGreat() {
    if (!this.context) return Promise.resolve(null);
    if (!this.referenceGreatLoadPromise) {
      this.referenceGreatLoadPromise = fetch('/assets/audio/combo-great-reference.wav')
        .then((response) => {
          if (!response.ok) throw new Error(`Great sample request failed: ${response.status}`);
          return response.arrayBuffer();
        })
        .then((bytes) => this.context.decodeAudioData(bytes))
        .then((buffer) => {
          this.referenceGreatBuffer = buffer;
          return buffer;
        })
        .catch(() => null);
    }
    return this.referenceGreatLoadPromise;
  }

  loadReferenceFoundation() {
    if (!this.context) return Promise.resolve(null);
    if (!this.referenceFoundationLoadPromise) {
      this.referenceFoundationLoadPromise = fetch('/assets/audio/foundation-reference.wav')
        .then((response) => {
          if (!response.ok) throw new Error(`Foundation sample request failed: ${response.status}`);
          return response.arrayBuffer();
        })
        .then((bytes) => this.context.decodeAudioData(bytes))
        .then((buffer) => {
          this.referenceFoundationBuffer = buffer;
          return buffer;
        })
        .catch(() => null);
    }
    return this.referenceFoundationLoadPromise;
  }

  loadReferenceWin() {
    if (!this.context) return Promise.resolve(null);
    if (!this.referenceWinLoadPromise) {
      this.referenceWinLoadPromise = fetch('/assets/audio/win-reference.wav')
        .then((response) => {
          if (!response.ok) throw new Error(`Win sample request failed: ${response.status}`);
          return response.arrayBuffer();
        })
        .then((bytes) => this.context.decodeAudioData(bytes))
        .then((buffer) => {
          this.referenceWinBuffer = buffer;
          return buffer;
        })
        .catch(() => null);
    }
    return this.referenceWinLoadPromise;
  }

  unlock() {
    const context = this.getContext();
    if (!context) return Promise.resolve(false);
    if (context.state === 'running') {
      this.unlocked = true;
      this.flushPending();
      this.scheduleMusic();
      return Promise.resolve(true);
    }
    if (!this.unlockPromise) {
      this.unlockPromise = context.resume().then(() => {
        this.unlocked = context.state === 'running';
        if (this.unlocked) {
          this.flushPending();
          this.scheduleMusic();
        }
        return this.unlocked;
      }).catch(() => false).finally(() => { this.unlockPromise = null; });
    }
    return this.unlockPromise;
  }

  flushPending() {
    const queued = this.pending.splice(0, 8);
    for (const cue of queued) this.playCue(cue);
  }

  async play(cue = 'tap') {
    if (!this.soundOn) return;
    if (!this.getContext()) return;
    const unlocked = await this.unlock();
    if (!unlocked) {
      if (this.pending.length < 8) this.pending.push(cue);
      return;
    }
    if (cue === 'move' || cue === 'draw') await this.referenceMoveLoadPromise;
    if (cue === 'good') await this.referenceGoodLoadPromise;
    if (cue === 'amazing') await this.referenceAmazingLoadPromise;
    if (cue === 'great') await this.referenceGreatLoadPromise;
    if (cue === 'foundation') await this.referenceFoundationLoadPromise;
    if (cue === 'win') await this.referenceWinLoadPromise;
    this.playCue(cue);
  }

  playSample(buffer, at = this.context.currentTime, amplitude = 1) {
    const source = this.context.createBufferSource();
    const envelope = this.context.createGain();
    source.buffer = buffer;
    envelope.gain.setValueAtTime(amplitude, at);
    source.connect(envelope);
    envelope.connect(this.soundBus);
    source.start(at);
    return source;
  }

  playCapturedSample(buffer, at = this.context.currentTime) {
    const outputGain = this.master.gain.value * (this.soundOn ? this.soundLevel : 0);
    const compensation = outputGain > 0 ? 1 / outputGain : 1;
    return this.playSample(buffer, at, compensation);
  }

  playNoise(startFrequency, endFrequency, duration, amplitude, at = this.context.currentTime, quality = 0.8) {
    const source = this.context.createBufferSource();
    const filter = this.context.createBiquadFilter();
    const envelope = this.context.createGain();
    source.buffer = this.noiseBuffer;
    filter.type = 'bandpass';
    filter.Q.value = quality;
    filter.frequency.setValueAtTime(startFrequency, at);
    filter.frequency.exponentialRampToValueAtTime(Math.max(80, endFrequency), at + duration);
    envelope.gain.setValueAtTime(0.0001, at);
    envelope.gain.exponentialRampToValueAtTime(amplitude, at + Math.min(0.006, duration * 0.2));
    envelope.gain.exponentialRampToValueAtTime(0.0001, at + duration);
    source.connect(filter);
    filter.connect(envelope);
    envelope.connect(this.soundBus);
    source.start(at);
    source.stop(at + duration + 0.02);
  }

  playTone(startFrequency, endFrequency, duration, amplitude, wave = 'sine', at = this.context.currentTime) {
    const oscillator = this.context.createOscillator();
    const filter = this.context.createBiquadFilter();
    const envelope = this.context.createGain();
    oscillator.type = wave;
    oscillator.frequency.setValueAtTime(startFrequency, at);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(50, endFrequency), at + duration);
    filter.type = 'lowpass';
    filter.frequency.value = wave === 'triangle' ? 2600 : 3800;
    envelope.gain.setValueAtTime(0.0001, at);
    envelope.gain.exponentialRampToValueAtTime(amplitude, at + Math.min(0.012, duration * 0.2));
    envelope.gain.exponentialRampToValueAtTime(0.0001, at + duration);
    oscillator.connect(filter);
    filter.connect(envelope);
    envelope.connect(this.soundBus);
    oscillator.start(at);
    oscillator.stop(at + duration + 0.02);
  }

  playCue(cue) {
    if (!this.soundOn || !this.context || this.context.state !== 'running') return;
    const now = this.context.currentTime;
    if (cue === 'tap') {
      this.playNoise(3000, 1000, 0.038, 0.09, now, 1.1);
      this.playTone(390, 310, 0.045, 0.035, 'triangle', now);
    } else if (cue === 'draw') {
      if (this.referenceMoveBuffer) this.playCapturedSample(this.referenceMoveBuffer, now);
      else {
        this.playNoise(3600, 480, 0.15, 0.17, now, 0.62);
        this.playTone(250, 150, 0.13, 0.045, 'sine', now);
      }
    } else if (cue === 'move') {
      if (this.referenceMoveBuffer) this.playCapturedSample(this.referenceMoveBuffer, now);
      else {
        this.playNoise(2500, 420, 0.105, 0.12, now, 0.9);
        this.playTone(340, 240, 0.09, 0.04, 'triangle', now);
      }
    } else if (cue === 'good') {
      if (this.referenceGoodBuffer) this.playCapturedSample(this.referenceGoodBuffer, now);
      else {
        this.playTone(523.25, 659.25, 0.2, 0.035, 'sine', now);
        this.playTone(783.99, 783.99, 0.24, 0.028, 'sine', now + 0.08);
        this.playNoise(3800, 1800, 0.12, 0.026, now + 0.04, 0.6);
      }
    } else if (cue === 'amazing') {
      if (this.referenceAmazingBuffer) this.playCapturedSample(this.referenceAmazingBuffer, now);
      else {
        [587.33, 880, 1174.66].forEach((frequency, index) => this.playTone(frequency, frequency * 1.01, 0.28, 0.045, 'sine', now + index * 0.09));
        this.playNoise(4600, 2100, 0.18, 0.035, now + 0.12, 0.55);
      }
    } else if (cue === 'great') {
      if (this.referenceGreatBuffer) this.playCapturedSample(this.referenceGreatBuffer, now);
      else {
        [659.25, 987.77].forEach((frequency, index) => this.playTone(frequency, frequency * 1.01, 0.22, 0.04, 'sine', now + index * 0.08));
        this.playNoise(4200, 2100, 0.14, 0.03, now + 0.07, 0.55);
      }
    } else if (cue === 'flip') {
      this.playNoise(6200, 1250, 0.09, 0.14, now, 0.72);
      this.playTone(680, 420, 0.11, 0.027, 'sine', now);
    } else if (cue === 'foundation') {
      if (this.referenceFoundationBuffer) this.playCapturedSample(this.referenceFoundationBuffer, now + 0.29);
      else {
        this.playNoise(4200, 1800, 0.075, 0.055, now, 1.2);
        this.playTone(587.33, 587.33, 0.24, 0.08, 'sine', now);
        this.playTone(880, 880, 0.32, 0.055, 'sine', now + 0.085);
      }
    } else if (cue === 'invalid') {
      this.playNoise(1450, 280, 0.075, 0.075, now, 0.75);
      this.playTone(205, 132, 0.09, 0.045, 'triangle', now);
    } else if (cue === 'win') {
      if (this.referenceWinBuffer) this.playCapturedSample(this.referenceWinBuffer, now);
      else {
        [587.33, 739.99, 880, 1174.66].forEach((frequency, index) => {
          this.playTone(frequency, frequency * 1.012, 0.42 + index * 0.08, 0.072 - index * 0.006, 'sine', now + index * 0.115);
        });
        this.playNoise(4400, 2100, 0.22, 0.035, now + 0.2, 0.5);
      }
    }
  }

  playMusicTone(frequency, at, duration, amplitude, wave = 'sine') {
    const oscillator = this.context.createOscillator();
    const filter = this.context.createBiquadFilter();
    const envelope = this.context.createGain();
    oscillator.type = wave;
    oscillator.frequency.value = frequency;
    oscillator.detune.value = wave === 'triangle' ? -3 : 0;
    filter.type = 'lowpass';
    filter.frequency.value = 1150;
    filter.Q.value = 0.55;
    envelope.gain.setValueAtTime(0.0001, at);
    envelope.gain.linearRampToValueAtTime(amplitude, at + Math.min(1.5, duration * 0.25));
    envelope.gain.setTargetAtTime(0.0001, at + duration * 0.72, Math.min(0.9, duration * 0.15));
    oscillator.connect(filter);
    filter.connect(envelope);
    envelope.connect(this.musicBus);
    oscillator.start(at);
    oscillator.stop(at + duration);
  }

  scheduleMusic() {
    if (!this.musicOn || !this.context || this.context.state !== 'running' || this.musicTimer) return;
    const chords = [
      [146.83, 196, 220, 293.66],
      [130.81, 174.61, 196, 261.63],
      [110, 146.83, 164.81, 220],
      [123.47, 164.81, 184.997, 246.94],
    ];
    const melody = [293.66, 392, 440, 392, 329.63, 392, 493.88, 392];
    const now = this.context.currentTime;
    const chord = chords[this.musicStep % chords.length];
    chord.forEach((frequency, index) => this.playMusicTone(frequency, now + index * 0.045, 7.7, index === 0 ? 0.026 : 0.014, index === 0 ? 'sine' : 'triangle'));
    this.playMusicTone(melody[(this.musicStep * 2) % melody.length], now + 1.25, 0.9, 0.008, 'sine');
    this.playMusicTone(melody[(this.musicStep * 2 + 2) % melody.length], now + 4.25, 0.9, 0.006, 'sine');
    this.musicStep += 1;
    this.musicTimer = setTimeout(() => {
      this.musicTimer = null;
      this.scheduleMusic();
    }, 7800);
  }

  setSound(enabled) {
    this.soundOn = Boolean(enabled);
    if (!this.soundOn) this.pending = [];
    if (this.soundBus && this.context) this.soundBus.gain.setTargetAtTime(this.soundOn ? this.soundLevel : 0, this.context.currentTime, 0.025);
  }

  setMusic(enabled) {
    this.musicOn = Boolean(enabled);
    if (this.musicBus && this.context) this.musicBus.gain.setTargetAtTime(this.musicOn ? 0.42 : 0, this.context.currentTime, 0.08);
    if (!this.musicOn) {
      clearTimeout(this.musicTimer);
      this.musicTimer = null;
      return;
    }
    this.unlock().then((ok) => { if (ok && this.musicOn) this.scheduleMusic(); });
  }
}
