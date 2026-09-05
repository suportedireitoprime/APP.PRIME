import { LEIS_CATALOG } from '@/data/leisCatalog';
import { getPopularLeiIds } from '@/lib/leisRecentes';

export type UnifiedTab = 'tudo' | 'leis' | 'videoaula' | 'livro' | 'jurisprudencia' | 'blog' | 'resumo' | 'noticia' | 'obra' | 'dicionario' | 'sumula' | 'tese' | 'informativo' | 'pesquisa';

export const TAB_LABELS: Record<UnifiedTab, string> = {
  tudo: 'Tudo',
  leis: 'Leis',
  videoaula: 'Videoaulas',
  livro: 'Livros',
  jurisprudencia: 'Jurisprudência',
  blog: 'Blog',
  resumo: 'Resumos',
  noticia: 'Notícias',
  obra: 'Filmes',
  dicionario: 'Dicionário',
  sumula: 'Súmulas',
  tese: 'Teses',
  informativo: 'Informativos',
  pesquisa: 'Pesquisas prontas',
};

export const UNIFIED_TABS: UnifiedTab[] = [
  'tudo', 'leis', 'videoaula', 'livro', 'jurisprudencia', 'blog', 'resumo', 
  'noticia', 'obra', 'dicionario', 'sumula', 'tese', 'informativo', 'pesquisa'
];

export const DEFAULT_ORDER = ['cf88', 'cp', 'cc', 'cpc', 'cpp', 'ctn', 'cdc', 'clt', 'eca', 'ctb', 'ei', 'epd'];

export const getRankedTopLeis = (limit = 12) => {
  const popularIds = getPopularLeiIds();
  const order = [...popularIds, ...DEFAULT_ORDER.filter((id) => !popularIds.includes(id))];
  const byId = new Map(LEIS_CATALOG.map((l) => [l.id, l]));
  const ranked: typeof LEIS_CATALOG = [];
  for (const id of order) {
    const lei = byId.get(id);
    if (lei && !ranked.includes(lei)) ranked.push(lei);
    if (ranked.length >= limit) break;
  }
  return ranked;
};

export const sortByRelevance = <T extends { id: string }>(list: T[]) => {
  const popular = getPopularLeiIds();
  const order = [...popular, ...DEFAULT_ORDER.filter((id) => !popular.includes(id))];
  return [...list].sort((a, b) => {
    const ai = order.indexOf(a.id);
    const bi = order.indexOf(b.id);
    if (ai === -1 && bi === -1) return 0;
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
};

export const identificarLeiPorTexto = (text: string) => {
  const artMatch = text.match(/art(?:igo)?\.?\s*(\d+[-a-zA-Z]*)/i);
  const artigoNumero = artMatch ? artMatch[1] : undefined;
  const upper = text.toUpperCase();

  const catalog = [...LEIS_CATALOG].sort((a, b) => b.sigla.length - a.sigla.length);
  for (const lei of catalog) {
    const sigla = lei.sigla.toUpperCase();
    if (!sigla) continue;
    const escaped = sigla.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`);
    if (regex.test(upper)) {
      return { lei, artigoNumero };
    }
  }
  return null;
};
