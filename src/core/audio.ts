import { getMuted, setMuted } from './storage';

type Track = 'house' | 'boss' | null;

/** Tiny Web Audio synth: blip SFX + a looping two-voice music sequencer. No audio files. */
export class Audio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private muted = getMuted();
  private track: Track = null;
  private seqTimer: number | null = null;
  private step = 0;
  private chompHi = false;

  get isMuted(): boolean {
    return this.muted;
  }

  /** Must be called from a user gesture (iOS). Safe to call repeatedly. */
  unlock(): void {
    if (!this.ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.6;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
  }

  toggleMute(): void {
    this.muted = !this.muted;
    setMuted(this.muted);
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.6;
  }

  private blip(freq: number, dur: number, type: OscillatorType = 'square', vol = 0.3, when = 0): void {
    if (!this.ctx || !this.master) return;
    const t = this.ctx.currentTime + when;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(this.master);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  private sweep(from: number, to: number, dur: number): void {
    if (!this.ctx || !this.master) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(from, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(1, to), t + dur);
    g.gain.setValueAtTime(0.3, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(this.master);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  private noise(dur: number): void {
    if (!this.ctx || !this.master) return;
    const n = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const g = this.ctx.createGain();
    g.gain.value = 0.3;
    src.connect(g);
    g.connect(this.master);
    src.start();
  }

  sfx(name: 'chomp' | 'bone' | 'eatVac' | 'toy' | 'death' | 'bossHit' | 'win'): void {
    if (!this.ctx) return;
    switch (name) {
      case 'chomp':
        this.blip(this.chompHi ? 520 : 430, 0.06, 'square', 0.16);
        this.chompHi = !this.chompHi;
        break;
      case 'bone':
        this.blip(440, 0.08, 'square', 0.22);
        this.blip(660, 0.1, 'square', 0.22, 0.06);
        this.blip(880, 0.14, 'square', 0.22, 0.13);
        break;
      case 'eatVac':
        this.blip(900, 0.08, 'sawtooth', 0.22);
        this.blip(520, 0.12, 'sawtooth', 0.22, 0.06);
        break;
      case 'toy':
        this.blip(784, 0.1, 'triangle', 0.28);
        this.blip(1047, 0.16, 'triangle', 0.28, 0.08);
        break;
      case 'death':
        this.sweep(420, 70, 0.7);
        break;
      case 'bossHit':
        this.noise(0.18);
        this.blip(150, 0.25, 'square', 0.32);
        break;
      case 'win':
        [523, 659, 784, 1047].forEach((f, i) => this.blip(f, 0.18, 'triangle', 0.3, i * 0.12));
        break;
    }
  }

  music(track: Track): void {
    // Skip only if this track is already actually playing (or we're already silent).
    if (track === this.track && (track === null || this.seqTimer !== null)) return;
    this.track = track;
    this.step = 0;
    if (this.seqTimer !== null) {
      clearInterval(this.seqTimer);
      this.seqTimer = null;
    }
    if (!track || !this.ctx) return;
    const bass = track === 'boss' ? [98, 98, 110, 123] : [131, 131, 165, 196];
    const mel = track === 'boss' ? [466, 440, 392, 349] : [523, 659, 587, 494];
    const tempo = track === 'boss' ? 180 : 138;
    const interval = 60000 / tempo / 2; // eighth notes
    this.seqTimer = window.setInterval(() => {
      if (!this.ctx) return;
      this.blip(bass[this.step % bass.length], 0.18, 'triangle', 0.12);
      if (this.step % 2 === 0) this.blip(mel[Math.floor(this.step / 2) % mel.length], 0.16, 'square', 0.08);
      this.step++;
    }, interval);
  }
}
