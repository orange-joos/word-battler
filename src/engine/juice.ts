/**
 * Audio and Speech Synthesis "Juice" Layer for Word Battler (Priority #7)
 * Uses Web Audio API and Speech Synthesis (zero external audio files needed)
 * - Ascending pitch tones for each letter/tile placed
 * - Satisfying low-end thud + harmonic chord on valid word submit
 * - Adaptive procedural combat music pulse
 */

const PENTATONIC_SCALE_HZ = [
  523.25, // C5
  587.33, // D5
  659.25, // E5
  783.99, // G5
  880.0,  // A5
  1046.5, // C6
  1174.66,// D6
  1318.51,// E6
];

class JuiceFX {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private musicTimer: ReturnType<typeof setInterval> | null = null;
  private musicStep: number = 0;
  private lowHpTempo: boolean = false;

  constructor() {
    // AudioContext will be initialized on user interaction
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted) {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      this.stopCombatMusic();
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  private init() {
    if (typeof window === 'undefined') return;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  /**
   * Reads text aloud using browser SpeechSynthesis with child-friendly pace
   */
  public speak(text: string) {
    if (this.isMuted || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.88;
      utterance.pitch = 1.05;
      window.speechSynthesis.speak(utterance);
    } catch {
      // Speech synthesis error handling
    }
  }

  public speakWord(text: string) {
    this.speak(text);
  }

  public speakSlow(text: string) {
    if (this.isMuted || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.58;
      utterance.pitch = 1.02;
      window.speechSynthesis.speak(utterance);
    } catch {
      // Speech synthesis error handling
    }
  }

  public splitIntoSyllables(word: string): string {
    const clean = word.trim().toLowerCase();
    if (clean.length <= 4) return clean;
    const parts = clean
      .replace(/([aeiouy]+[^aeiouy]+)(?=[aeiouy])/g, '$1·')
      .split('·')
      .filter(Boolean);
    return parts.length > 1 ? parts.join(' · ') : clean;
  }

  public click() {
    this.ding(580, 60);
  }

  /**
   * Priority #7: Ascending pitch tone for each letter or word tile placed (stepIndex 0..7+)
   */
  public playLetterPitch(stepIndex: number) {
    const clampedIdx = Math.max(0, Math.min(PENTATONIC_SCALE_HZ.length - 1, stepIndex));
    const freq = PENTATONIC_SCALE_HZ[clampedIdx];
    this.ding(freq, 95);
  }

  /**
   * Priority #7: Satisfying low-end tactile thud + harmonic lock when submitting a valid word/sentence
   */
  public playSubmitThud(isCrit = false) {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // Low-end sub thud
      const subOsc = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(125, now);
      subOsc.frequency.exponentialRampToValueAtTime(42, now + 0.18);
      subGain.gain.setValueAtTime(0.24, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.19);
      subOsc.connect(subGain);
      subGain.connect(this.ctx.destination);
      subOsc.start(now);
      subOsc.stop(now + 0.19);

      // Tactile transient click + chord
      this.ding(isCrit ? 880 : 659.25, isCrit ? 220 : 140);
      if (isCrit) {
        setTimeout(() => this.ding(1174.66, 240), 55);
      }
    } catch {
      // Ignore WebAudio errors
    }
  }

  /**
   * Priority #7: Adaptive procedural combat music pulse
   */
  public setCombatMusicIntensity(isLowHpOrBossPhase: boolean) {
    this.lowHpTempo = isLowHpOrBossPhase;
  }

  public isCombatMusicPlaying(): boolean {
    return this.musicTimer !== null;
  }

  public stopCombatMusic() {
    if (this.musicTimer) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }

  public toggleCombatMusic(forceActive?: boolean): boolean {
    const shouldPlay = forceActive !== undefined ? forceActive : !this.isCombatMusicPlaying();
    if (!shouldPlay || this.isMuted) {
      this.stopCombatMusic();
      return false;
    }
    this.init();
    if (this.musicTimer) clearInterval(this.musicTimer);
    const bassNotes = [130.81, 146.83, 164.81, 196.0, 146.83, 164.81, 220.0, 196.0];
    this.musicStep = 0;
    this.musicTimer = setInterval(() => {
      if (this.isMuted || !this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = this.lowHpTempo ? 'sawtooth' : 'triangle';
        const baseFreq = bassNotes[this.musicStep % bassNotes.length];
        osc.frequency.setValueAtTime(this.lowHpTempo ? baseFreq * 1.122 : baseFreq, now);
        gain.gain.setValueAtTime(0.035, now);
        gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.28);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.29);
        this.musicStep++;
      } catch {
        // Ignore audio scheduling errors
      }
    }, 360);
    return true;
  }

  /**
   * Sound FX: Success / Combo / Selection Ding
   */
  public ding(freq = 660, ms = 150) {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      osc.connect(gain);
      gain.connect(this.ctx.destination);

      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + ms / 1000);

      osc.start();
      osc.stop(this.ctx.currentTime + ms / 1000);
    } catch {
      // Audio error handling
    }
  }

  /**
   * Sound FX: Strike hit impact
   */
  public hit() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.15);
    } catch {
      // Audio error handling
    }
  }

  /**
   * Sound FX: Cartoon Boing / Fizzle for invalid combos or failed fusions
   */
  public boing() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';

      osc.frequency.setValueAtTime(160, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(320, this.ctx.currentTime + 0.14);
      osc.frequency.linearRampToValueAtTime(110, this.ctx.currentTime + 0.32);

      gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.32);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.32);
    } catch {
      // Audio error handling
    }
  }

  /**
   * Sound FX: Victory Fanfare
   */
  public fanfare() {
    if (this.isMuted) return;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      setTimeout(() => this.ding(freq, 220), idx * 120);
    });
  }

  /**
   * Sound FX: Fusion anvil strike (metallic shimmer + ding)
   */
  public forgeChime() {
    if (this.isMuted) return;
    this.ding(440, 100);
    setTimeout(() => this.ding(880, 250), 80);
    setTimeout(() => this.fanfare(), 250);
  }
}

export const juice = new JuiceFX();
