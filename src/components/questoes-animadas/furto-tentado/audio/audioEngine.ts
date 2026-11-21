import { CHARACTER_VOICE_CONFIGS, estDur, visemeFor } from '../narracao/narracaoData';

class AudioEngine {
  private ac: AudioContext | null = null;
  private ambientNodes: { o: OscillatorNode; o2: OscillatorNode; g: GainNode; g2: GainNode } | null = null;
  private soundEnabled: boolean = true;
  private voicePtBr: SpeechSynthesisVoice | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private safetyTimer: any = null;

  constructor() {
    this.initVoices();
  }

  private initVoices() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const findVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      if (!voices || voices.length === 0) return;

      // Prefer pt-BR natural / neural voices if available
      const ptBr = voices.find(
        (v) =>
          (v.lang.toLowerCase().includes('pt-br') || v.lang.toLowerCase().includes('pt_br')) &&
          (v.name.includes('Natural') || v.name.includes('Neural') || v.name.includes('Google') || v.name.includes('Luciana') || v.name.includes('Daniel') || v.name.includes('Maria'))
      ) || voices.find((v) => v.lang.toLowerCase().startsWith('pt')) || voices[0];

      this.voicePtBr = ptBr || null;
    };

    findVoice();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = findVoice;
    }
  }

  public getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ac) {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        this.ac = new AudioCtx();
      } catch (e) {
        console.warn('AudioContext not available:', e);
      }
    }
    if (this.ac && this.ac.state === 'suspended') {
      void this.ac.resume();
    }
    return this.ac;
  }

  public tone(freq: number, duration: number, type: OscillatorType = 'sine', gain: number = 0.06, slideTo?: number) {
    const ctx = this.getContext();
    if (!ctx || !this.soundEnabled) return;

    try {
      const osc = ctx.createOscillator();
      const gn = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      if (slideTo) {
        osc.frequency.exponentialRampToValueAtTime(slideTo, ctx.currentTime + duration);
      }

      gn.gain.setValueAtTime(gain, ctx.currentTime);
      gn.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

      osc.connect(gn);
      gn.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {}
  }

  public sfx = {
    ding: () => {
      this.tone(1180, 0.16, 'sine', 0.05);
      setTimeout(() => this.tone(1560, 0.22, 'sine', 0.045), 110);
    },
    beep: () => {
      this.tone(880, 0.09, 'square', 0.028);
    },
    pop: () => {
      this.tone(420, 0.08, 'sine', 0.06, 180);
    },
    thud: () => {
      this.tone(120, 0.16, 'sine', 0.12, 55);
    },
    alarm: () => {
      this.tone(660, 0.14, 'square', 0.035, 520);
      setTimeout(() => this.tone(660, 0.14, 'square', 0.03, 520), 180);
    },
    rewind: () => {
      this.tone(900, 0.7, 'sawtooth', 0.02, 180);
    },
    whoosh: () => {
      this.tone(300, 0.28, 'sine', 0.03, 900);
    },
    shhh: () => {
      this.tone(2400, 0.22, 'sawtooth', 0.012, 900);
    },
  };

  public ambientStart() {
    const ctx = this.getContext();
    if (!ctx || this.ambientNodes || !this.soundEnabled) return;

    try {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      const o2 = ctx.createOscillator();
      const g2 = ctx.createGain();

      o.type = 'triangle';
      o.frequency.value = 196;
      g.gain.value = 0.005;
      o.connect(g);
      g.connect(ctx.destination);
      o.start();

      o2.type = 'sine';
      o2.frequency.value = 294;
      g2.gain.value = 0.003;
      o2.connect(g2);
      g2.connect(ctx.destination);
      o2.start();

      this.ambientNodes = { o, o2, g, g2 };
    } catch {}
  }

  public ambientStop() {
    if (this.ambientNodes) {
      try {
        this.ambientNodes.o.stop();
        this.ambientNodes.o2.stop();
      } catch {}
      this.ambientNodes = null;
    }
  }

  public narrate({
    text,
    who,
    onBoundary,
    onEnd,
  }: {
    text: string;
    who: string;
    onBoundary?: (char: string, index: number) => void;
    onEnd?: () => void;
  }): { durationSec: number } {
    this.stopNarration();
    const duration = estDur(text);

    if (typeof window === 'undefined' || !('speechSynthesis' in window) || !this.soundEnabled) {
      // Fallback timer when speech synthesis isn't supported
      this.safetyTimer = setTimeout(() => {
        onEnd?.();
      }, duration * 1000);
      return { durationSec: duration };
    }

    try {
      if (!this.voicePtBr) {
        this.initVoices();
      }

      const utterance = new SpeechSynthesisUtterance(text);
      if (this.voicePtBr) {
        utterance.voice = this.voicePtBr;
      }
      utterance.lang = 'pt-BR';

      // Apply voice character profile
      const config = CHARACTER_VOICE_CONFIGS[who] || { pitch: 1.0, rate: 1.02 };
      utterance.pitch = config.pitch;
      utterance.rate = config.rate;

      let ended = false;
      const finish = () => {
        if (ended) return;
        ended = true;
        clearTimeout(this.safetyTimer);
        this.currentUtterance = null;
        onEnd?.();
      };

      utterance.onboundary = (e) => {
        if (e.charIndex !== undefined) {
          const char = text[e.charIndex] || '';
          onBoundary?.(char, e.charIndex);
        }
      };

      utterance.onend = finish;
      utterance.onerror = finish;

      this.currentUtterance = utterance;

      // Ensure audio context is running
      this.getContext();

      // Speak utterance
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);

      // Failsafe timer in case browser stalls
      this.safetyTimer = setTimeout(finish, Math.max(duration * 1200, 2500));
    } catch (e) {
      console.warn('Speech synthesis error, fallback timer active:', e);
      this.safetyTimer = setTimeout(() => onEnd?.(), duration * 1000);
    }

    return { durationSec: duration };
  }

  public stopNarration() {
    clearTimeout(this.safetyTimer);
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
    this.currentUtterance = null;
  }

  public pauseNarration() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.pause();
      } catch {}
    }
  }

  public resumeNarration() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.resume();
      } catch {}
    }
  }

  public toggleMute(): boolean {
    this.soundEnabled = !this.soundEnabled;
    if (!this.soundEnabled) {
      this.stopNarration();
      this.ambientStop();
    } else {
      this.ambientStart();
    }
    return this.soundEnabled;
  }

  public isMuted(): boolean {
    return !this.soundEnabled;
  }
}

export const audioEngine = new AudioEngine();
