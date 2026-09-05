import { ColecaoConfig, LivroNormalizado } from '@/lib/bibliotecaColecoes';

export interface LivroComColecao {
  colecao: ColecaoConfig;
  livro: LivroNormalizado;
}

export interface ArtigoCP {
  id: string;
  numero: string;
  audio_pilula_url: string | null;
  audio_transcricao?: string | null;
  audio_grafo?: any;
  lei_slug?: string;
  lei_nome?: string;
}

export interface Ministro {
  id: string;
  nome: string;
  nome_completo?: string;
  foto_url?: string;
  diversos?: any;
}

export type SelectedItemType = 
  | { type: 'livro'; data: LivroComColecao }
  | { type: 'artigo'; data: ArtigoCP }
  | { type: 'ministro'; data: Ministro };

export type ScreenState = 'menu' | 'classicos' | 'rapidas' | 'cp' | 'cf' | 'cc' | 'cpp' | 'clt' | 'ministros';

export const LEI_NOMES_MAP: Record<string, string> = {
  cp: 'Código Penal',
  cf: 'Constituição Federal',
  cc: 'Código Civil',
  cpp: 'Código de Processo Penal',
  clt: 'CLT'
};
