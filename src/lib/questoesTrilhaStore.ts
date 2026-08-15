import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface QuestoesTrilhaAtiva {
  metaDiaria: number;
  materias: string[];
  assuntos: string[];
  diasConcluidos: number[]; // Array de índices de dias (0 a 29)
  dataInicio: string; // ISO string
}

interface QuestoesTrilhaState {
  trilhaAtiva: QuestoesTrilhaAtiva | null;
  setTrilhaAtiva: (trilha: QuestoesTrilhaAtiva) => void;
  limparTrilha: () => void;
  marcarDiaConcluido: (dia: number) => void;
}

export const useQuestoesTrilhaStore = create<QuestoesTrilhaState>()(
  persist(
    (set) => ({
      trilhaAtiva: null,
      setTrilhaAtiva: (trilha) => set({ trilhaAtiva: trilha }),
      limparTrilha: () => set({ trilhaAtiva: null }),
      marcarDiaConcluido: (dia) =>
        set((state) => {
          if (!state.trilhaAtiva) return state;
          const novosDias = [...state.trilhaAtiva.diasConcluidos];
          if (!novosDias.includes(dia)) novosDias.push(dia);
          return { trilhaAtiva: { ...state.trilhaAtiva, diasConcluidos: novosDias } };
        }),
    }),
    {
      name: 'questoes-trilha-storage',
    }
  )
);
