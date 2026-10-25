/**
 * Audio and FX "Juice" Layer for Word Battler
 * Uses Web Audio API and Speech Synthesis (Zero external audio files needed)
 */

class JuiceFX {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  /**
   * Reads text aloud using browser SpeechSynthesis
   */
  speak(text) {
    if (this.muted || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel(); // Interrupt existing speech
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9; // Slightly slower for elementary comprehension
    utterance.pitch = 1.1; // Friendly pitch
    window.speechSynthesis.speak(utterance);
  }

  /**
   * Sound FX: Success / Combo Ding
   */
  ding(freq = 660, ms = 150) {
    if (this.muted) return;
    this.init();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + ms / 1000);
    
    osc.start();
    osc.stop(this.ctx.currentTime + ms / 1000);
  }

  /**
   * Sound FX: Cartoon Boing for Fizzles / Errors
   */
  boing() {
    if (this.muted) return;
    this.init();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "triangle";
    
    osc.frequency.setValueAtTime(150, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(300, this.ctx.currentTime + 0.15);
    osc.frequency.linearRampToValueAtTime(120, this.ctx.currentTime + 0.3);

    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.3);
  }

  /**
   * Sound FX: Victory Chime
   */
  fanfare() {
    if (this.muted) return;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      setTimeout(() => this.ding(freq, 200), idx * 120);
    });
  }

  /**
   * Play events sequentially emitted from combat engine
   */
  async playEvents(events, onUpdateUI) {
    for (const evt of events) {
      if (evt.type === "speak") {
        this.speak(evt.text);
      } else if (evt.type === "damage") {
        this.ding(440, 100);
      } else if (evt.type === "shield") {
        this.ding(880, 150);
      } else if (evt.type === "fizzle") {
        this.boing();
      } else if (evt.type === "victory") {
        this.fanfare();
      }
      
      if (onUpdateUI) onUpdateUI(evt);
      await new Promise((res) => setTimeout(res, 400));
    }
  }
}

export const juice = new JuiceFX();