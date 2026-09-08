import { supabase } from '@/integrations/supabase/client';
import type { GamificacaoJogo, NivelDificuldade, TipoJogo, GamificacaoCacaPalavras } from '@/types/gamificacao';

export const gamificacaoService = {
  /**
   * Busca jogos de uma disciplina e tipo, podendo filtrar por dificuldade e artigo
   */
  async getJogos(tipoJogo: TipoJogo, disciplina: string, dificuldade?: NivelDificuldade, artigo?: string): Promise<GamificacaoJogo[]> {
    let query = supabase
      .from('gamificacao_jogos')
      .select('*')
      .eq('tipo_jogo', tipoJogo)
      .eq('disciplina', disciplina);

    if (dificuldade) {
      query = query.eq('dificuldade', dificuldade);
    }
    
    if (artigo) {
      query = query.eq('artigo', artigo);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao buscar jogos da gamificação:', error);
      throw error;
    }

    return data as GamificacaoJogo[];
  },

  /**
   * Retorna os artigos únicos para formar a trilha
   */
  async getTrilha(tipoJogo: TipoJogo, disciplina: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('gamificacao_jogos')
      .select('artigo')
      .eq('tipo_jogo', tipoJogo)
      .eq('disciplina', disciplina);

    if (error) {
      console.error('Erro ao buscar trilha:', error);
      return [];
    }

    // Filtrar artigos únicos, removendo nulos
    const unique = Array.from(new Set(data.map(d => d.artigo).filter(Boolean))) as string[];
    
    // Sort logic like 'Artigo 1', 'Artigo 2', 'Artigo 10' correctly
    return unique.sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, '')) || 0;
      const numB = parseInt(b.replace(/\D/g, '')) || 0;
      return numA - numB;
    });
  },

  /**
   * Retorna um jogo aleatório para a Forca
   */
  async getRandomForca(disciplina: string = 'Código Penal', dificuldade?: NivelDificuldade, artigo?: string): Promise<GamificacaoJogo | null> {
    const jogos = await this.getJogos('forca', disciplina, dificuldade, artigo);
    
    if (!jogos || jogos.length === 0) {
      return null;
    }

    // Seleciona um aleatório
    const randomIndex = Math.floor(Math.random() * jogos.length);
    return jogos[randomIndex];
  },

  /**
   * Busca a trilha de níveis para o Caça-Palavras
   */
  async getTrilhaCacaPalavras(materia: string): Promise<GamificacaoCacaPalavras[]> {
    const { data, error } = await supabase
      .from('gamificacao_caca_palavras')
      .select('*')
      .eq('materia', materia)
      .order('nivel', { ascending: true });

    if (error) {
      console.error('Erro ao buscar trilha caça-palavras:', error);
      return [];
    }

    return (data || []) as GamificacaoCacaPalavras[];
  },

  /**
   * Busca um nível específico do Caça-Palavras
   */
  async getCacaPalavrasNivel(materia: string, nivel: string): Promise<GamificacaoCacaPalavras | null> {
    const { data, error } = await supabase
      .from('gamificacao_caca_palavras')
      .select('*')
      .eq('materia', materia)
      .eq('nivel', nivel)
      .single();

    if (error) {
      console.error('Erro ao buscar nível caça-palavras:', error);
      return null;
    }

    return data as GamificacaoCacaPalavras;
  }
};
