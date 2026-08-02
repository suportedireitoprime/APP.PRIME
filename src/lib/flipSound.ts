// Som curto de "virar carta" (WebAudio, sem assets).
let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
  if (!AC) return null;
  if (!ctx) ctx = new AC();
  if (ctx && ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

/** Ruído filtrado curto — imita o "swish" de uma carta virando. */
export function playFlipSound(volume = 0.28) {
  try {
    const ac = getCtx();
    if (!ac) return;

    const dur = 0.16;
    const frames = Math.floor(ac.sampleRate * dur);
    const buffer = ac.createBuffer(1, frames, ac.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < frames; i++) {
      const t = i / frames;
      // envelope rápido de ataque e decaimento
      const env = Math.sin(Math.PI * Math.min(1, t * 1.05)) ** 2;
      data[i] = (Math.random() * 2 - 1) * env;
    }

    const src = ac.createBufferSource();
    src.buffer = buffer;

    const band = ac.createBiquadFilter();
    band.type = 'bandpass';
    band.frequency.setValueAtTime(1100, ac.currentTime);
    band.frequency.exponentialRampToValueAtTime(3200, ac.currentTime + dur);
    band.Q.value = 0.9;

    const gain = ac.createGain();
    gain.gain.setValueAtTime(volume, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + dur);

    src.connect(band).connect(gain).connect(ac.destination);
    src.start();
    src.stop(ac.currentTime + dur);
  } catch {
    /* silencioso */
  }
}
