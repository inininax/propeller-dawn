import { hzFor, MUSIC_SPECS, type MusicTrack, type SfxName } from './music';

export class AudioEngine {
  private ctx: AudioContext | null = null;

  private masterGain: GainNode | null = null;

  private musicGain: GainNode | null = null;

  private sfxGain: GainNode | null = null;

  private noiseBuffer: AudioBuffer | null = null;

  private currentTrack: MusicTrack | null = null;

  private schedulerId: number | null = null;

  private nextNoteTime = 0;

  private stepIndex = 0;

  private lastShootAt = 0;

  private muted = false;

  private userSuspended = false;

  private musicVolume = 0.6;

  private sfxVolume = 0.8;

  get initialized(): boolean {
    return this.ctx !== null;
  }

  get isUserSuspended(): boolean {
    return this.userSuspended;
  }

  unlock(): void {
    if (!this.ctx) {
      try {
        const Ctor =
          window.AudioContext ??
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!Ctor) return;
        this.ctx = new Ctor();
        this.masterGain = this.ctx.createGain();
        this.musicGain = this.ctx.createGain();
        this.sfxGain = this.ctx.createGain();
        this.musicGain.connect(this.masterGain);
        this.sfxGain.connect(this.masterGain);
        this.masterGain.connect(this.ctx.destination);
        this.applyVolumes();
        try {
          this.noiseBuffer = this.createNoiseBuffer();
        } catch {
          this.noiseBuffer = null;
        }
      } catch {
        this.ctx = null;
        return;
      }
    }
    this.userSuspended = false;
    void Promise.resolve(this.ctx.resume()).catch(() => undefined);
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    this.applyVolumes();
  }

  setMusicVolume(v: number): void {
    this.musicVolume = Math.min(1, Math.max(0, v));
    this.applyVolumes();
  }

  setSfxVolume(v: number): void {
    this.sfxVolume = Math.min(1, Math.max(0, v));
    this.applyVolumes();
  }

  suspend(user = false): void {
    if (user) {
      this.userSuspended = true;
    }
    void this.ctx?.suspend().catch(() => undefined);
  }

  resume(user = false): void {
    if (user) {
      this.userSuspended = false;
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      void Promise.resolve(this.ctx.resume()).catch(() => undefined);
    }
  }

  play(name: SfxName): void {
    const ctx = this.ctx;
    if (!ctx || !this.sfxGain || this.muted || this.sfxVolume === 0) return;
    const now = ctx.currentTime;
    switch (name) {
      case 'shoot': {
        if (now - this.lastShootAt < 0.045) return;
        this.lastShootAt = now;
        this.blip(this.sfxGain, 880, now, 0.05, 'square', 0.06, 320);
        break;
      }
      case 'enemyHit':
        this.blip(this.sfxGain, 220 + Math.random() * 80, now, 0.03, 'square', 0.04);
        break;
      case 'explodeSmall':
        this.noiseBurst(this.sfxGain, 0.22, 0.35, 900);
        break;
      case 'explodeBig':
        this.noiseBurst(this.sfxGain, 0.65, 0.6, 400);
        this.blip(this.sfxGain, 70, now, 0.5, 'sine', 0.4, 30);
        break;
      case 'playerHit':
        this.blip(this.sfxGain, 200, now, 0.3, 'sawtooth', 0.35, 60);
        this.noiseBurst(this.sfxGain, 0.3, 0.4, 1200);
        break;
      case 'bomb':
        this.noiseBurst(this.sfxGain, 1.1, 0.55, 300);
        this.blip(this.sfxGain, 50, now, 0.9, 'sine', 0.5, 24);
        break;
      case 'pickupPower':
        this.arpeggio([523, 659, 784], 0.05, 'square', 0.12);
        break;
      case 'pickupMedal':
        this.blip(this.sfxGain, 1318, now, 0.07, 'triangle', 0.12, 1568);
        break;
      case 'pickupUtility':
        this.arpeggio([392, 523, 659], 0.06, 'triangle', 0.14);
        break;
      case 'graze':
        this.blip(this.sfxGain, 2400, now, 0.02, 'sine', 0.03, 2800);
        break;
      case 'uiMove':
        this.blip(this.sfxGain, 660, now, 0.04, 'square', 0.08);
        break;
      case 'uiConfirm':
        this.arpeggio([523, 784], 0.05, 'square', 0.1);
        break;
      case 'uiBack':
        this.blip(this.sfxGain, 330, now, 0.06, 'square', 0.08, 240);
        break;
      case 'bossWarn':
        this.blip(this.sfxGain, 98, now, 0.45, 'sawtooth', 0.3, 92);
        this.blip(this.sfxGain, 196, now + 0.5, 0.45, 'sawtooth', 0.3, 185);
        break;
      case 'extend':
        this.arpeggio([523, 659, 784, 1046], 0.09, 'square', 0.16);
        break;
      case 'shieldBreak':
        this.noiseBurst(this.sfxGain, 0.25, 0.25, 2600);
        break;
    }
  }

  startMusic(track: MusicTrack): void {
    const ctx = this.ctx;
    if (!ctx) return;
    if (this.currentTrack === track && this.schedulerId !== null) return;
    this.stopMusic();
    this.currentTrack = track;
    this.stepIndex = 0;
    this.nextNoteTime = ctx.currentTime + 0.1;
    this.schedulerId = window.setInterval(() => this.scheduleAhead(), 80);
  }

  stopMusic(): void {
    if (this.schedulerId !== null) {
      window.clearInterval(this.schedulerId);
      this.schedulerId = null;
    }
    this.currentTrack = null;
  }

  private applyVolumes(): void {
    if (!this.masterGain || !this.musicGain || !this.sfxGain || !this.ctx) return;
    const t = this.ctx.currentTime;
    const muteFactor = this.muted ? 0 : 1;
    this.masterGain.gain.setTargetAtTime(muteFactor, t, 0.03);
    this.musicGain.gain.setTargetAtTime(this.musicVolume * 0.5, t, 0.03);
    this.sfxGain.gain.setTargetAtTime(this.sfxVolume * 0.9, t, 0.03);
  }

  private createNoiseBuffer(): AudioBuffer {
    const ctx = this.ctx!;
    const length = ctx.sampleRate * 1.2;
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  private blip(
    dest: AudioNode,
    freq: number,
    at: number,
    dur: number,
    type: OscillatorType,
    vol: number,
    endFreq?: number,
  ): void {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, at);
    if (endFreq !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), at + dur);
    }
    gain.gain.setValueAtTime(vol, at);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    osc.connect(gain);
    gain.connect(dest);
    osc.start(at);
    osc.stop(at + dur + 0.02);
  }

  private arpeggio(freqs: number[], stepDur: number, type: OscillatorType, vol: number): void {
    const base = this.ctx!.currentTime;
    freqs.forEach((f, i) => {
      this.blip(this.sfxGain!, f, base + i * stepDur, stepDur * 1.6, type, vol);
    });
  }

  private noiseBurst(dest: AudioNode, dur: number, vol: number, filterHz: number): void {
    const ctx = this.ctx!;
    if (!this.noiseBuffer) return;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(filterHz, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + dur);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(dest);
    src.start();
    src.stop(ctx.currentTime + dur + 0.05);
  }

  private scheduleAhead(): void {
    const ctx = this.ctx;
    if (!ctx || !this.currentTrack || !this.musicGain || !this.masterGain) return;
    if (this.muted || this.musicVolume === 0) {
      this.nextNoteTime = Math.max(this.nextNoteTime, ctx.currentTime + 0.06);
      return;
    }
    const spec = MUSIC_SPECS[this.currentTrack];
    const stepDur = 60 / spec.bpm / 4;
    while (this.nextNoteTime < ctx.currentTime + 0.25) {
      const step = this.stepIndex % 16;
      const bar = Math.floor(this.stepIndex / 16);
      const bassDegree = spec.bassPattern[step % spec.bassPattern.length];
      if (step % 2 === 0) {
        this.tone(
          hzFor(spec.rootHz / 2, spec.scale, bassDegree),
          this.nextNoteTime,
          stepDur * 1.8,
          'triangle',
          0.16,
        );
      }
      const lead = spec.leadPattern[step];
      if (lead >= 0 && bar % 4 !== 3) {
        this.tone(
          hzFor(spec.rootHz, spec.scale, lead),
          this.nextNoteTime,
          stepDur * 0.9,
          spec.wave,
          0.07,
        );
      }
      if (step % 8 === 4) {
        this.hatTick(this.nextNoteTime);
      }
      if (bar % 4 === 0 && step === 0) {
        this.padChord(spec.rootHz, spec.scale, bassDegree, this.nextNoteTime, stepDur * 14);
      }
      this.stepIndex += 1;
      this.nextNoteTime += stepDur;
    }
  }

  private tone(freq: number, at: number, dur: number, type: OscillatorType, vol: number): void {
    const ctx = this.ctx!;
    const dest = this.musicGain!;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, at);
    gain.gain.setValueAtTime(vol, at);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    osc.connect(gain);
    gain.connect(dest);
    osc.start(at);
    osc.stop(at + dur + 0.02);
  }

  private padChord(rootHz: number, scale: number[], degree: number, at: number, dur: number): void {
    const ctx = this.ctx!;
    const dest = this.musicGain!;
    const gains = [0, 2, 4].map((offset) => hzFor(rootHz, scale, degree + offset));
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(0.05, at + dur * 0.3);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    gain.connect(dest);
    for (const f of gains) {
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = f;
      osc.connect(gain);
      osc.start(at);
      osc.stop(at + dur + 0.05);
    }
  }

  private hatTick(at: number): void {
    const ctx = this.ctx!;
    const dest = this.musicGain!;
    if (!this.noiseBuffer) return;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 6000;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.05, at);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.06);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(dest);
    src.start(at);
    src.stop(at + 0.08);
  }
}
