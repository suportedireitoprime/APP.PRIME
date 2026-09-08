export type TipoJogo = 'forca' | 'lacuna' | 'certo_errado' | 'quem_sou_eu' | 'caca_palavras' | 'cruzadas';
export type NivelDificuldade = 'facil' | 'medio' | 'dificil';

export interface GamificacaoJogo {
  id: string;
  tipo_jogo: TipoJogo;
  disciplina: string | null;
  pergunta: string;
  resposta: string;
  artigo: string | null;
  dificuldade: NivelDificuldade;
  created_at: string;
}

export interface JogoForcaState {
  palavraOculta: string;
  letrasCorretas: string[];
  letrasErradas: string[];
  chancesRestantes: number;
  status: 'jogando' | 'venceu' | 'perdeu';
}

export interface GamificacaoCacaPalavras {
  id: string;
  materia: string;
  nivel: string;
  titulo_nivel: string;
  qtd_palavras: number;
  dimensoes_grade: string;
  foco_tematico: string | null;
  palavras: string[];
  dicas: Record<string, string>;
  created_at: string;
}
