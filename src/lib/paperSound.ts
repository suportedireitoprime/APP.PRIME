// Efeito sonoro de passar página / folhear no Aprender (mixkit-paper-slide-1530.wav)

let paperAudio: HTMLAudioElement | null = null;

export function playPaperSlideSound(volume = 0.55) {
  if (typeof window === 'undefined') return;
  try {
    if (!paperAudio) {
      paperAudio = new Audio('/sounds/mixkit-paper-slide-1530.wav');
      paperAudio.preload = 'auto';
    }
    paperAudio.volume = volume;
    paperAudio.currentTime = 0;
    void paperAudio.play().catch(() => {});
  } catch {
    // silencioso em caso de bloqueio de autoplay
  }
}
