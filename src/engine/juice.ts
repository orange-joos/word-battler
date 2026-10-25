/**
 * Audio and Speech Synthesis "Juice" Layer for Word Battler
 * Uses Web Audio API and Speech Synthesis (zero external audio files needed)
 */

class JuiceFX {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  constructor() {
    // AudioContext will be initialized on user interaction
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  private init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
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
    if (this.isMuted || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel(); // Interrupt existing speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.88; // Slightly slower for clear educational comprehension
      utterance.pitch = 1.05; // Pleasant, friendly tone
      window.speechSynthesis.speak(utterance);
    } catch {
      // Speech synthesis error handling
    }
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
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
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
