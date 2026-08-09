import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface FlashcardTrilhaAtiva {
  id: string; // Unique ID (e.g., timestamp)
  area: string; // Ex: "Direito Penal" ou "Todas as Áreas"
  tema: string; // Ex: "Crimes contra o Patrimônio" ou "Todos os Temas"
  diasMeta: number; // Ex: 7 dias
  cardsPorDia: number; // Ex: 20 cards
  diasConcluidos: number[]; // Array of completed day indices (1-indexed)
  dataInicio: string; // ISO date string
}

interface FlashcardTrilhaState {
  trilhasAtivas: Record<string, FlashcardTrilhaAtiva>;
  setTrilhaAtiva: (trilha: FlashcardTrilhaAtiva) => void;
  limparTrilha: (id: string) => void;
  marcarDiaConcluido: (id: string, dia: number) => void;
  desmarcarDiaConcluido: (id: string, dia: number) => void;
  atualizarTrilha: (id: string, updates: Partial<FlashcardTrilhaAtiva>) => void;
}

export const useFlashcardsTrilhasStore = create<FlashcardTrilhaState>()(
  persist(
    (set) => ({
      trilhasAtivas: {},
      setTrilhaAtiva: (trilha) =>
        set((state) => ({
          trilhasAtivas: { ...state.trilhasAtivas, [trilha.id]: trilha },
        })),
      limparTrilha: (id) =>
        set((state) => {
          const newTrilhas = { ...state.trilhasAtivas };
          delete newTrilhas[id];
          return { trilhasAtivas: newTrilhas };
        }),
      marcarDiaConcluido: (id, dia) =>
        set((state) => {
          const trilha = state.trilhasAtivas[id];
          if (!trilha) return state;
          const novosDias = [...trilha.diasConcluidos];
          if (!novosDias.includes(dia)) novosDias.push(dia);
          return {
            trilhasAtivas: {
              ...state.trilhasAtivas,
              [id]: { ...trilha, diasConcluidos: novosDias },
            },
          };
        }),
      desmarcarDiaConcluido: (id, dia) =>
        set((state) => {
          const trilha = state.trilhasAtivas[id];
          if (!trilha) return state;
          const novosDias = trilha.diasConcluidos.filter((d) => d !== dia);
          return {
            trilhasAtivas: {
              ...state.trilhasAtivas,
              [id]: { ...trilha, diasConcluidos: novosDias },
            },
          };
        }),
      atualizarTrilha: (id, updates) =>
        set((state) => {
          const trilha = state.trilhasAtivas[id];
          if (!trilha) return state;
          return {
            trilhasAtivas: {
              ...state.trilhasAtivas,
              [id]: { ...trilha, ...updates },
            },
          };
        }),
    }),
    {
      name: 'flashcards-trilhas-storage',
    }
  )
);
