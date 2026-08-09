/**
 * useGameSounds - Hook de efeitos sonoros sintetizados para jogos
 * 
 * Usa a Web Audio API nativa para gerar sons em tempo real,
 * sem dependência de arquivos MP3 externos.
 * Inspirado nos packs de UI Audio do Kenney.nl (CC0).
 */

const audioCtxRef = { current: null as AudioContext | null };

function getAudioContext(): AudioContext {
  if (!audioCtxRef.current) {
    audioCtxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  }
  return audioCtxRef.current;
}

function playTone(frequency: number, duration: number, type: OscillatorType = 'sine', volume = 0.3) {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Silently fail if audio is not available
  }
}

export function useGameSounds() {
  /** Som de tecla clicada (click suave) */
  const playClick = () => {
    playTone(800, 0.06, 'square', 0.1);
  };

  /** Letra correta! (bleep agudo ascendente) */
  const playCorrect = () => {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(520, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(780, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.2);
  };

  /** Letra errada (buzzer grave) */
  const playWrong = () => {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.25);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);
  };

  /** Fase vencida (fanfarra 3 notas) */
  const playWin = () => {
    setTimeout(() => playTone(523, 0.15, 'sine', 0.25), 0);
    setTimeout(() => playTone(659, 0.15, 'sine', 0.25), 150);
    setTimeout(() => playTone(784, 0.3, 'sine', 0.3), 300);
  };

  /** Game over (descida triste) */
  const playLose = () => {
    setTimeout(() => playTone(400, 0.2, 'triangle', 0.25), 0);
    setTimeout(() => playTone(300, 0.2, 'triangle', 0.25), 200);
    setTimeout(() => playTone(200, 0.5, 'triangle', 0.3), 400);
  };

  /** Dica revelada (bleep de notificação) */
  const playHint = () => {
    playTone(880, 0.1, 'sine', 0.15);
    setTimeout(() => playTone(1100, 0.15, 'sine', 0.2), 100);
  };

  /** Artigo concluído (triunfo!) */
  const playTriumph = () => {
    setTimeout(() => playTone(523, 0.12, 'sine', 0.2), 0);
    setTimeout(() => playTone(659, 0.12, 'sine', 0.2), 120);
    setTimeout(() => playTone(784, 0.12, 'sine', 0.2), 240);
    setTimeout(() => playTone(1047, 0.4, 'sine', 0.3), 360);
  };

  return { playClick, playCorrect, playWrong, playWin, playLose, playHint, playTriumph };
}
