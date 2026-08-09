import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface TrilhaLeituraAtiva {
  id: string; // Unique ID for the trail
  livroId: string;
  livroTitulo: string;
  livroCapa?: string;
  formato: 'pdf' | 'nativo';
  diasMeta: number;
  diasConcluidos: number[]; // Array of completed day indices (1-indexed)
  dataInicio: string;
  paginasTotais?: number;
  // If paginasTotais is available, we can compute paginasPorDia. Otherwise, we just say "X% per day" or "1 Chapter"
}

interface BibliotecaTrilhaState {
  trilhasAtivas: Record<string, TrilhaLeituraAtiva>; // key is trail id (usually livroId + timestamp)
  setTrilhaAtiva: (trilha: TrilhaLeituraAtiva) => void;
  limparTrilha: (id: string) => void;
  marcarDiaConcluido: (id: string, dia: number) => void;
  desmarcarDiaConcluido: (id: string, dia: number) => void;
}

export const useBibliotecaTrilhasStore = create<BibliotecaTrilhaState>()(
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
    }),
    {
      name: 'biblioteca-trilhas-storage',
    }
  )
);
