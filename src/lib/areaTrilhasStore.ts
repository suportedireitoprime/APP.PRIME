import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AreaTrilhaAtiva {
  areaSlug: string;
  areaName: string;
  catalogoId: string;
  diasMeta: number;
  diasConcluidos: number[]; // Array de índices de dias que já foram concluídos
  dataInicio: string;
}

interface AreaTrilhaState {
  trilhasAtivas: Record<string, AreaTrilhaAtiva>; // Mapeado por areaSlug
  setAreaTrilhaAtiva: (areaSlug: string, trilha: AreaTrilhaAtiva) => void;
  limparAreaTrilha: (areaSlug: string) => void;
  marcarDiaConcluido: (areaSlug: string, dia: number) => void;
  desmarcarDiaConcluido: (areaSlug: string, dia: number) => void;
}

export const useAreaTrilhaStore = create<AreaTrilhaState>()(
  persist(
    (set) => ({
      trilhasAtivas: {},
      
      setAreaTrilhaAtiva: (areaSlug, trilha) => 
        set((state) => ({ 
          trilhasAtivas: { ...state.trilhasAtivas, [areaSlug]: trilha } 
        })),
        
      limparAreaTrilha: (areaSlug) => 
        set((state) => {
          const novas = { ...state.trilhasAtivas };
          delete novas[areaSlug];
          return { trilhasAtivas: novas };
        }),
        
      marcarDiaConcluido: (areaSlug, dia) =>
        set((state) => {
          const trilha = state.trilhasAtivas[areaSlug];
          if (!trilha) return state;
          const novosDias = [...trilha.diasConcluidos];
          if (!novosDias.includes(dia)) novosDias.push(dia);
          return {
            trilhasAtivas: {
              ...state.trilhasAtivas,
              [areaSlug]: { ...trilha, diasConcluidos: novosDias }
            }
          };
        }),
        
      desmarcarDiaConcluido: (areaSlug, dia) =>
        set((state) => {
          const trilha = state.trilhasAtivas[areaSlug];
          if (!trilha) return state;
          const novosDias = trilha.diasConcluidos.filter((d) => d !== dia);
          return {
            trilhasAtivas: {
              ...state.trilhasAtivas,
              [areaSlug]: { ...trilha, diasConcluidos: novosDias }
            }
          };
        }),
    }),
    {
      name: 'videoaulas-area-trilha-storage',
    }
  )
);
