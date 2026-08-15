import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface QuestoesTrilha {
  id: string;
  nome: string; // Ex: "Direito Penal - 20 questões"
  materia: string;
  metaDiaria: number;
  dias: string[]; // Ex: ['seg', 'ter']
  horario: string; // Ex: '20:00'
  dataCriacao: string;
}

interface QuestoesTrilhaState {
  trilhas: QuestoesTrilha[];
  adicionarTrilha: (trilha: QuestoesTrilha) => void;
  removerTrilha: (id: string) => void;
  limparTodas: () => void;
}

export const useQuestoesTrilhaStore = create<QuestoesTrilhaState>()(
  persist(
    (set) => ({
      trilhas: [],
      adicionarTrilha: (trilha) => set((state) => ({ trilhas: [...state.trilhas, trilha] })),
      removerTrilha: (id) => set((state) => ({ trilhas: state.trilhas.filter((t) => t.id !== id) })),
      limparTodas: () => set({ trilhas: [] }),
    }),
    {
      name: 'questoes-multi-trilha-storage',
    }
  )
);
