import { create } from 'zustand';
import { registrarMidia, clearMediaSession } from '@/lib/mediaSession';
import { telaAcesa } from '@/lib/nativo/telaAcordada';

interface PlayerState {
  currentUrl: string | null;
  isPlaying: boolean;
  progress: number;
  artigoNumero: string | null;
  leiNome: string | null;
  audio: HTMLAudioElement | null;
  play: (url: string, artigoNumero: string, leiNome: string) => void;
  pause: () => void;
  toggle: () => void;
  stop: () => void;
  setProgress: (p: number) => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentUrl: null,
  isPlaying: false,
  progress: 0,
  artigoNumero: null,
  leiNome: null,
  audio: null,

  play: (url, artigoNumero, leiNome) => {
    const prev = get().audio;
    if (prev) { prev.pause(); prev.src = ''; }

    const audio = new Audio(url);
    audio.onended = () => {
      clearMediaSession(audio);
      void telaAcesa('narracao', false);
      set({ isPlaying: false, progress: 0, audio: null });
    };
    audio.ontimeupdate = () => {
      if (audio.duration > 0) set({ progress: (audio.currentTime / audio.duration) * 100 });
    };
    audio.play();
    void telaAcesa('narracao', true);
    registrarMidia({
      titulo: `Art. ${artigoNumero}`,
      subtitulo: leiNome,
      album: 'Narração',
      audio,
      onStop: () => get().stop(),
    });
    set({ currentUrl: url, isPlaying: true, progress: 0, artigoNumero, leiNome, audio });
  },

  pause: () => {
    get().audio?.pause();
    void telaAcesa('narracao', false);
    set({ isPlaying: false });
  },

  toggle: () => {
    const { audio, isPlaying } = get();
    if (!audio) return;
    if (isPlaying) { audio.pause(); void telaAcesa('narracao', false); set({ isPlaying: false }); }
    else { audio.play(); void telaAcesa('narracao', true); set({ isPlaying: true }); }
  },

  stop: () => {
    const a = get().audio;
    if (a) { a.pause(); a.src = ''; }
    clearMediaSession(a);
    void telaAcesa('narracao', false);
    set({ currentUrl: null, isPlaying: false, progress: 0, artigoNumero: null, leiNome: null, audio: null });
  },

  setProgress: (p) => set({ progress: p }),
}));
