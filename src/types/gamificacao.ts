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
