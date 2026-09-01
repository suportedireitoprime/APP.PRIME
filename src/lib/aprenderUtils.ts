import {
  BookOpen, Lightbulb, Flag, HelpCircle, Layers, Link2, Quote, Scale,
  List, Sparkles, CheckCircle2, Trophy
} from 'lucide-react';

export type TipoBloco =
  | 'texto' | 'leitura' | 'intro' | 'conceito' | 'exemplo' | 'conclusao'
  | 'pergunta' | 'flashcard' | 'conexao'
  | 'citacao' | 'artigo_lei' | 'tabela' | 'mapa_mental' | 'mapa_conceitual'
  | 'infografico' | 'linha_tempo' | 'destaque' | 'fluxograma'
  | 'ordenacao' | 'cena_animada' | 'checkpoint' | 'recapitulacao';

export type Bloco = {
  id: string;
  ordem: number;
  tipo: TipoBloco;
  payload: any;
  resposta_correta: any;
};

export type Aula = {
  id: string;
  titulo: string;
  objetivo: string | null;
  duracao_est_min: number;
  previa?: any;
};

const TIPOS_TEXTO = new Set<TipoBloco>(['texto', 'leitura', 'intro', 'conceito', 'exemplo', 'conclusao']);
export const isBlocoTexto = (tipo: TipoBloco) => TIPOS_TEXTO.has(tipo);

export const iconePorTipo = (tipo: TipoBloco) => {
  switch (tipo) {
    case 'intro': return BookOpen;
    case 'conceito': return Lightbulb;
    case 'exemplo': return BookOpen;
    case 'conclusao': return Flag;
    case 'leitura':
    case 'texto': return BookOpen;
    case 'pergunta': return HelpCircle;
    case 'flashcard': return Layers;
    case 'conexao': return Link2;
    case 'citacao': return Quote;
    case 'artigo_lei': return Scale;
    case 'tabela': return Layers;
    case 'mapa_mental': return Link2;
    case 'mapa_conceitual': return Link2;
    case 'ordenacao': return List;
    case 'cena_animada': return Sparkles;
    case 'infografico': return Sparkles;
    case 'linha_tempo': return Flag;
    case 'destaque': return Lightbulb;
    case 'fluxograma': return Flag;
    case 'checkpoint': return CheckCircle2;
    case 'recapitulacao': return Trophy;
    default: return BookOpen;
  }
};

export const rotuloPorTipo = (tipo: TipoBloco) => {
  switch (tipo) {
    case 'intro': return 'Introdução';
    case 'conceito': return 'Conceito';
    case 'exemplo': return 'Exemplo';
    case 'conclusao': return 'Conclusão';
    case 'leitura':
    case 'texto': return 'Leitura';
    case 'pergunta': return 'Pergunta';
    case 'flashcard': return 'Flashcard';
    case 'conexao': return 'Conexões';
    case 'citacao': return 'Citação';
    case 'artigo_lei': return 'Artigo de Lei';
    case 'tabela': return 'Tabela';
    case 'mapa_mental': return 'Mapa mental';
    case 'mapa_conceitual': return 'Mapa conceitual';
    case 'ordenacao': return 'Coloque em ordem';
    case 'cena_animada': return 'Cena animada';
    case 'infografico': return 'Infográfico';
    case 'linha_tempo': return 'Linha do tempo';
    case 'destaque': return 'Destaque';
    case 'fluxograma': return 'Fluxograma';
    case 'checkpoint': return 'Checkpoint';
    case 'recapitulacao': return 'Recapitulando';
    default: return 'Bloco';
  }
};

export const ROTULO_ATO: Record<string, string> = {
  fundamentos: 'Fundamentos',
  aprofundamento: 'Aprofundamento',
  fixacao: 'Fixação',
};

export const atoDoBloco = (b: { payload?: any }) => {
  const a = String(b?.payload?.ato ?? '').toLowerCase();
  return ROTULO_ATO[a] ? a : '';
};

export const interleaveBlocos = (blocos: Bloco[]) => {
  const normalBlocos = blocos.filter(b => b.tipo !== 'pergunta' && b.tipo !== 'flashcard');
  const questionBlocos = blocos.filter(b => b.tipo === 'pergunta' || b.tipo === 'flashcard');
  
  if (normalBlocos.length === 0 || questionBlocos.length === 0) return blocos;
  
  const interleaved: Bloco[] = [];
  const step = normalBlocos.length / questionBlocos.length;
  let qIdx = 0;
  
  for (let i = 0; i < normalBlocos.length; i++) {
    interleaved.push(normalBlocos[i]);
    const expectedQs = Math.floor((i + 1) / step);
    while (qIdx < expectedQs && qIdx < questionBlocos.length) {
      interleaved.push(questionBlocos[qIdx]);
      qIdx++;
    }
  }
  
  while (qIdx < questionBlocos.length) {
    interleaved.push(questionBlocos[qIdx]);
    qIdx++;
  }
  
  return interleaved;
};
