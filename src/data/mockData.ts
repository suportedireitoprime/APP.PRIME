export interface Lei {
  id: string;
  nome: string;
  sigla: string;
  categoria: string;
  tipo: 'constituicao' | 'codigo' | 'estatuto' | 'lei-ordinaria' | 'decreto' | 'sumula';
  descricao: string;
  dataPublicacao: string;
  artigos: ArtigoLei[];
}

export interface ArtigoLei {
  id: string;
  numero: string;
  caput: string;
  paragrafos?: string[];
  incisos?: string[];
  capitulo?: string;
  titulo?: string;
  nomen_juris?: string;
  epigrafe?: string;
  parte?: string;
  livro?: string;
  secao?: string;
  subsecao?: string;
  /** Sort order from DB. Values > 10000 indicate ADCT / Disposições Transitórias in CF88. */
  ordem?: number;
  explicacao_resumido?: string;
  exemplo?: string;
  termos?: string;
}

export interface Explicacao {
  id: string;
  titulo: string;
  resumo: string;
  conteudo: string;
  autor: string;
  dataPublicacao: string;
  categoria: string;
  leisRelacionadas: string[];
  tags: string[];
}

export interface Atualizacao {
  id: string;
  titulo: string;
  resumo: string;
  conteudo: string;
  dataPublicacao: string;
  categoria: string;
  tipo: 'nova_lei' | 'alteracao' | 'noticia' | 'jurisprudencia';
  destaque: boolean;
}

export const CATEGORIAS: string[] = [
  'Constitucional', 'Civil', 'Penal', 'Trabalho', 'Administrativo',
  'Tributário', 'Processual Civil', 'Processual Penal', 'Ambiental', 'Consumidor',
  'Empresarial', 'Eleitoral', 'Previdenciário', 'Criança e Adolescente',
];

export const LEIS: Lei[] = [];
export const EXPLICATIVAS: Explicacao[] = [];
export const ATUALIZACOES: Atualizacao[] = [];
