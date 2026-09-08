import { supabase } from '@/integrations/supabase/client';
import type { GamificacaoJogo, NivelDificuldade, TipoJogo } from '@/types/gamificacao';

export const gamificacaoService = {
  /**
   * Busca jogos de uma disciplina e tipo, podendo filtrar por dificuldade
   */
  async getJogos(tipoJogo: TipoJogo, disciplina: string, dificuldade?: NivelDificuldade): Promise<GamificacaoJogo[]> {
    let query = supabase
      .from('gamificacao_jogos')
      .select('*')
      .eq('tipo_jogo', tipoJogo)
      .eq('disciplina', disciplina);

    if (dificuldade) {
      query = query.eq('dificuldade', dificuldade);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao buscar jogos da gamificação:', error);
      throw error;
    }

    return data as GamificacaoJogo[];
  },

  /**
   * Retorna um jogo aleatório para a Forca
   */
  async getRandomForca(disciplina: string = 'Código Penal', dificuldade?: NivelDificuldade): Promise<GamificacaoJogo | null> {
    const jogos = await this.getJogos('forca', disciplina, dificuldade);
    
    if (!jogos || jogos.length === 0) {
      return null;
    }

    // Seleciona um aleatório
    const randomIndex = Math.floor(Math.random() * jogos.length);
    return jogos[randomIndex];
  }
};
