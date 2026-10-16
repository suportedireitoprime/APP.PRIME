export type BlogTema =
  | 'Leis'
  | 'Conceitos Fundamentais'
  | 'Iniciantes'
  | 'Filosofia'
  | 'STF'
  | 'Curiosidades'
  | 'Clássicos'
  | 'Direito Penal'
  | 'Direito Civil'
  | 'Direito Constitucional'
  | 'Direito Administrativo'
  | 'Direito do Trabalho'
  | 'Direito Processual'
  | 'Direito Tributário'
  | 'Carreiras Jurídicas'
  | 'Atualidades Jurídicas'
  | 'Jurisprudência';

export interface BlogPost {
  id: string;
  titulo: string;
  resumo: string;
  conteudo_md: string;
  imagem_url: string;
  tema: BlogTema;
  autor: string;
  data_publicacao: string; // ISO
  tempo_leitura_min: number;
}

/**
 * Os artigos do blog são servidos 100% diretamente do Supabase (`blog_edicao_posts`),
 * com os 50 novos artigos da série oficial Leis & Conceitos Fundamentais.
 */
export const BLOG_POSTS: BlogPost[] = [];

export const TEMAS: BlogTema[] = [
  'Leis',
  'Conceitos Fundamentais',
  'Iniciantes',
  'Filosofia',
  'Clássicos',
  'STF',
  'Curiosidades',
  'Direito Constitucional',
  'Direito Penal',
  'Direito Civil',
  'Direito Administrativo',
  'Direito do Trabalho',
  'Direito Processual',
  'Direito Tributário',
  'Carreiras Jurídicas',
  'Atualidades Jurídicas',
  'Jurisprudência',
];

// Cada tema tem sua própria paleta — usada no card do blog e no carrossel da home
export const TEMA_COLORS: Record<BlogTema, { bg: string; chip: string; chipText: string; accent: string }> = {
  Leis:                     { bg: 'linear-gradient(135deg, #1c2e14 0%, #2f4a1f 60%, #4a6741 100%)', chip: '#a3b18a', chipText: '#1c2e14', accent: '#c9d5b8' },
  'Conceitos Fundamentais': { bg: 'linear-gradient(135deg, #162a1b 0%, #22432b 60%, #3d6a47 100%)', chip: '#86efac', chipText: '#14331b', accent: '#bbf7d0' },
  Filosofia:                { bg: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #4c1d95 100%)', chip: '#a78bfa', chipText: '#1e1b4b', accent: '#c4b5fd' },
  STF:                      { bg: 'linear-gradient(135deg, #0c1e3d 0%, #14315e 60%, #1e40af 100%)', chip: '#60a5fa', chipText: '#0c1e3d', accent: '#93c5fd' },
  Curiosidades:             { bg: 'linear-gradient(135deg, #0f2e2a 0%, #134e48 60%, #0d9488 100%)', chip: '#5eead4', chipText: '#0f2e2a', accent: '#99f6e4' },
  'Clássicos':              { bg: 'linear-gradient(135deg, #2b0a0e 0%, #5c1a20 60%, #7f1d1d 100%)', chip: '#fca5a5', chipText: '#2b0a0e', accent: '#fecaca' },
  Iniciantes:               { bg: 'linear-gradient(135deg, #1a1408 0%, #3b2a12 60%, #6b3f1d 100%)', chip: '#f5c76a', chipText: '#1a1408', accent: '#efe0c4' },
  'Direito Constitucional': { bg: 'linear-gradient(135deg, #0a1a3d 0%, #12295c 60%, #1e3a8a 100%)', chip: '#93c5fd', chipText: '#0a1a3d', accent: '#bfdbfe' },
  'Direito Penal':          { bg: 'linear-gradient(135deg, #2b0a0a 0%, #5c1616 60%, #6b1428 100%)', chip: '#f87171', chipText: '#2b0a0a', accent: '#fecaca' },
  'Direito Civil':          { bg: 'linear-gradient(135deg, #0f1e3a 0%, #1e3a5f 60%, #1d4ed8 100%)', chip: '#93c5fd', chipText: '#0f1e3a', accent: '#c7d2fe' },
  'Direito Administrativo': { bg: 'linear-gradient(135deg, #1a1a1a 0%, #2f2f2f 60%, #52525b 100%)', chip: '#d4d4d8', chipText: '#1a1a1a', accent: '#e4e4e7' },
  'Direito do Trabalho':    { bg: 'linear-gradient(135deg, #2a1a05 0%, #57370e 60%, #b45309 100%)', chip: '#c2274a', chipText: '#2a1a05', accent: '#fde68a' },
  'Direito Processual':     { bg: 'linear-gradient(135deg, #1a0e2e 0%, #3b1e5c 60%, #6d28d9 100%)', chip: '#c4b5fd', chipText: '#1a0e2e', accent: '#ddd6fe' },
  'Direito Tributário':     { bg: 'linear-gradient(135deg, #0e2a1f 0%, #1c5c42 60%, #059669 100%)', chip: '#6ee7b7', chipText: '#0e2a1f', accent: '#a7f3d0' },
  'Carreiras Jurídicas':    { bg: 'linear-gradient(135deg, #2a1a0a 0%, #5c3a1a 60%, #92400e 100%)', chip: '#f87171', chipText: '#2a1a0a', accent: '#fde68a' },
  'Atualidades Jurídicas':  { bg: 'linear-gradient(135deg, #0e1e2a 0%, #1e3a52 60%, #0369a1 100%)', chip: '#7dd3fc', chipText: '#0e1e2a', accent: '#bae6fd' },
  'Jurisprudência':         { bg: 'linear-gradient(135deg, #052e2b 0%, #064e3b 55%, #047857 100%)', chip: '#6ee7b7', chipText: '#052e2b', accent: '#a7f3d0' },
};
