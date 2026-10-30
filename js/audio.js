/* ---- js/audio.js ---- */
/**
 * Arrow Escape - Procedural Audio Engine
 * Uses Web Audio API for zero-dependency, ultra-low latency sound effects
 */
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.volume = 0.7;
    this.initOnFirstInteraction = this.initOnFirstInteraction.bind(this);
    
    // Register audio unlock listener for mobile browsers
    window.addEventListener('click', this.initOnFirstInteraction, { once: true });
    window.addEventListener('touchstart', this.initOnFirstInteraction, { once: true });
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  initOnFirstInteraction() {
    this.init();
  }

  setMuted(mute) {
    this.muted = mute;
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
  }

  // Arrout tone helper: volume 0.7 (default slider) reproduces Arrout's exact loudness
  _tone(freq, dur, type, vol, freq2, delay) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const t = this.ctx.currentTime + (delay || 0);
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type || 'sine';
      osc.frequency.setValueAtTime(freq, t);
      if (freq2) osc.frequency.exponentialRampToValueAtTime(freq2, t + dur);
      gain.gain.setValueAtTime((vol || 0.15) * (this.volume / 0.7), t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + dur);
    } catch (e) {}
  }

  vibrate(pattern) {
    if (window.arroutSettings && window.arroutSettings.vibration === false) return;
    try { if (navigator.vibrate) navigator.vibrate(pattern); } catch (e) {}
  }

  // Arrow taps and flies out: rising blip
  playEscape() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const c = this.ctx, t0 = c.currentTime, v = this.volume / 0.7;
      const bloop = (t, f1, f2, dur, peak) => {
        const o = c.createOscillator(), g = c.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(f1, t);
        o.frequency.exponentialRampToValueAtTime(f2, t + dur * 0.65);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(peak * v, t + 0.012);
        g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
        o.connect(g); g.connect(c.destination);
        o.start(t); o.stop(t + dur + 0.03);
      };
      bloop(t0, 360, 1250, 0.18, 0.55);          // main drop
      bloop(t0 + 0.075, 520, 1650, 0.14, 0.3);   // little echo drop
    } catch (e) {}
  }

  playBlocked() {
    this._tone(330, 0.2, 'square', 0.07, 250);
    this._tone(250, 0.4, 'square', 0.07, 120, 0.22);
  }

  // 25% / 50% / 75% cheer
  playMilestone() {
    this._tone(660, 0.12, 'triangle', 0.15);
    this._tone(990, 0.2, 'triangle', 0.15, 0, 0.1);
  }

  playCoin() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    [987.77, 1318.51].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const startT = t + idx * 0.08;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startT);

      gain.gain.setValueAtTime(this.volume * 0.3, startT);
      gain.gain.exponentialRampToValueAtTime(0.001, startT + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(startT);
      osc.stop(startT + 0.25);
    });
  }

  // Level cleared: rising four-note arpeggio
  playVictory() {
    [523, 659, 784, 1047].forEach((f, i) => this._tone(f, 0.3, 'triangle', 0.16, 0, i * 0.12));
  }

  playBeep(isGo = false) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(isGo ? 880 : 440, t);

    gain.gain.setValueAtTime(this.volume * 0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + (isGo ? 0.35 : 0.15));

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + (isGo ? 0.35 : 0.15));
  }

  playClick() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.exponentialRampToValueAtTime(300, t + 0.04);

    gain.gain.setValueAtTime(this.volume * 0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.04);
  }

  playPowerup() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(400, t);
    osc.frequency.exponentialRampToValueAtTime(1200, t + 0.25);

    gain.gain.setValueAtTime(this.volume * 0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.28);
  }
}

window.soundEngine = new SoundEngine();
