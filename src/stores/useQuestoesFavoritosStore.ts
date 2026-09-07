import { create } from 'zustand';

interface QuestoesFavoritosStore {
  favoritos: Record<string, boolean>;
  inicializado: boolean;
  setFavoritosIniciais: (favoritos: string[]) => void;
  adicionar: (id: string) => void;
  remover: (id: string) => void;
  isFavorito: (id: string) => boolean;
}

export const useQuestoesFavoritosStore = create<QuestoesFavoritosStore>((set, get) => ({
  favoritos: {},
  inicializado: false,
  setFavoritosIniciais: (ids) => {
    const map: Record<string, boolean> = {};
    ids.forEach((id) => {
      map[id] = true;
    });
    set({ favoritos: map, inicializado: true });
  },
  adicionar: (id) => {
    set((state) => ({
      favoritos: { ...state.favoritos, [id]: true }
    }));
  },
  remover: (id) => {
    set((state) => {
      const next = { ...state.favoritos };
      delete next[id];
      return { favoritos: next };
    });
  },
  isFavorito: (id) => {
    return !!get().favoritos[id];
  }
}));
