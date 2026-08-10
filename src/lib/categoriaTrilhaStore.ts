import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CategoriaTrilhaAtiva {
  catalogoId: string;
  diasMeta: number;
  diasConcluidos: number[]; // Array of completed day indices (e.g. 1, 2, 3)
  dataInicio: string;
}

interface CategoriaTrilhaState {
  trilhasAtivas: Record<string, CategoriaTrilhaAtiva>; // Keyed by catalogoId
  setCategoriaTrilhaAtiva: (catalogoId: string, trilha: CategoriaTrilhaAtiva) => void;
  limparCategoriaTrilha: (catalogoId: string) => void;
  marcarDiaConcluido: (catalogoId: string, dia: number) => void;
  desmarcarDiaConcluido: (catalogoId: string, dia: number) => void;
}

export const useCategoriaTrilhaStore = create<CategoriaTrilhaState>()(
  persist(
    (set) => ({
      trilhasAtivas: {},
      
      setCategoriaTrilhaAtiva: (catalogoId, trilha) => 
        set((state) => ({ 
          trilhasAtivas: { ...state.trilhasAtivas, [catalogoId]: trilha } 
        })),
        
      limparCategoriaTrilha: (catalogoId) => 
        set((state) => {
          const novas = { ...state.trilhasAtivas };
          delete novas[catalogoId];
          return { trilhasAtivas: novas };
        }),
        
      marcarDiaConcluido: (catalogoId, dia) =>
        set((state) => {
          const trilha = state.trilhasAtivas[catalogoId];
          if (!trilha) return state;
          const novosDias = [...trilha.diasConcluidos];
          if (!novosDias.includes(dia)) novosDias.push(dia);
          return {
            trilhasAtivas: {
              ...state.trilhasAtivas,
              [catalogoId]: { ...trilha, diasConcluidos: novosDias }
            }
          };
        }),
        
      desmarcarDiaConcluido: (catalogoId, dia) =>
        set((state) => {
          const trilha = state.trilhasAtivas[catalogoId];
          if (!trilha) return state;
          const novosDias = trilha.diasConcluidos.filter((d) => d !== dia);
          return {
            trilhasAtivas: {
              ...state.trilhasAtivas,
              [catalogoId]: { ...trilha, diasConcluidos: novosDias }
            }
          };
        }),
    }),
    {
      name: 'videoaulas-categoria-trilha-storage',
    }
  )
);
