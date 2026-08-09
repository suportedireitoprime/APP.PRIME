import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface TrilhaAtiva {
  editalId: string;
  diasMeta: number;
  diasConcluidos: number[]; // Array de índices de dias que já foram concluídos
  dataInicio: string;
}

interface TrilhaState {
  trilhaAtiva: TrilhaAtiva | null;
  setTrilhaAtiva: (trilha: TrilhaAtiva) => void;
  limparTrilha: () => void;
  marcarDiaConcluido: (dia: number) => void;
  desmarcarDiaConcluido: (dia: number) => void;
}

export const useTrilhaStore = create<TrilhaState>()(
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
      desmarcarDiaConcluido: (dia) =>
        set((state) => {
          if (!state.trilhaAtiva) return state;
          const novosDias = state.trilhaAtiva.diasConcluidos.filter((d) => d !== dia);
          return { trilhaAtiva: { ...state.trilhaAtiva, diasConcluidos: novosDias } };
        }),
    }),
    {
      name: 'videoaulas-trilha-storage',
    }
  )
);
