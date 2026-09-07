import type { ArtigoLei } from '@/data/mockData';

export interface BreadcrumbData {
  parte?: string;
  livro?: string;
  titulo?: string;
  tituloDesc?: string;
  capitulo?: string;
  capituloDesc?: string;
  secao?: string;
  subsecao?: string;
}

const _lowerWords = new Set([
  'a', 'à', 'às', 'ao', 'aos', 'o', 'os', 'as', 'e', 'ou', 'de', 'do', 'da', 'dos', 'das',
  'em', 'no', 'na', 'nos', 'nas', 'por', 'para', 'com', 'sem', 'sob', 'sobre', 'entre',
  'após', 'ante', 'até', 'contra', 'desde', 'perante', 'trás', 'um', 'uma', 'uns', 'umas',
]);

/**
 * Converte strings em Title Case preservando numerais romanos (I, II, III, IV, etc.)
 * e palavras curtas de ligação (de, da, do, dos, em, etc.).
 */
export const toTitleCase = (s: string): string => {
  if (!s) return '';
  return s
    .toLowerCase()
    .split(/(\s+)/)
    .map((w, i) => {
      if (/^\s+$/.test(w) || !w) return w;
      if (i !== 0 && _lowerWords.has(w)) return w;
      if (/^[ivxlcdm]+$/i.test(w)) return w.toUpperCase();
      return w.charAt(0).toUpperCase() + w.slice(1);
    })
    .join('');
};

const planaltoAnnotationRe =
  /\s*[([]?\s*(?:Redação\s+dada|Incluíd[oa]|Acrescid[oa]|Revogad[oa]|Alterad[oa]|Vide|Vigência|Regulamento|Nova\s+redação|Renumerad[oa]|Transformad[oa]|Restabelecid[oa]|Produção\s+de\s+efeito)[\s\S]*$/i;

const cleanStructuralText = (value: string) =>
  value.replace(planaltoAnnotationRe, '').replace(/\s+/g, ' ').trim();

/**
 * Constrói o mapa de breadcrumbs hierárquicos a partir do array ordenado de artigos e nós estruturais da lei.
 */
export function buildArtigoBreadcrumbsMap(artigos: ArtigoLei[]): Map<string, BreadcrumbData> {
  const map = new Map<string, BreadcrumbData>();
  if (!artigos || artigos.length === 0) return map;

  let currentParte: string | undefined;
  let currentLivro: string | undefined;
  let currentTitulo: string | undefined;
  let currentTituloDesc: string | undefined;
  let currentCapitulo: string | undefined;
  let currentCapituloDesc: string | undefined;
  let currentSecao: string | undefined;
  let currentSubsecao: string | undefined;

  for (const art of artigos) {
    const num = (art.numero || '').trim();
    const rawCaput = (art.caput || '').trim();
    const firstLine = rawCaput.split('\n')[0]?.trim() || '';

    const isParte =
      /^\s*PARTE\s+/i.test(num) ||
      /^\s*PARTE\s+(?:GERAL|ESPECIAL|[IVXLCDM0-9]+)\b/i.test(firstLine);
    const isLivro =
      /^\s*LIVRO\s+/i.test(num) || /^\s*LIVRO\s+[IVXLCDM0-9]+/i.test(firstLine);
    const isTitulo =
      /^\s*T[ÍI]TULO\s+/i.test(num) || /^\s*T[ÍI]TULO\s+[IVXLCDM0-9]+/i.test(firstLine);
    const isCapitulo =
      /^\s*CAP[ÍI]TULO\s+/i.test(num) || /^\s*CAP[ÍI]TULO\s+[IVXLCDM0-9]+/i.test(firstLine);
    const isSecao =
      /^\s*SE[ÇC][ÃA]O\s+/i.test(num) || /^\s*SE[ÇC][ÃA]O\s+[IVXLCDM0-9]+/i.test(firstLine);
    const isSubsecao =
      /^\s*SUBSE[ÇC][ÃA]O\s+/i.test(num) ||
      /^\s*SUBSE[ÇC][ÃA]O\s+[IVXLCDM0-9]+/i.test(firstLine);

    const extractHeadAndDesc = (h: string) => {
      const lines = rawCaput.split('\n').map((l) => l.trim()).filter(Boolean);
      let head = cleanStructuralText(lines[0] || h) || h;
      let desc = cleanStructuralText(lines.slice(1).join(' — '));
      const splitRe =
        /^((?:PARTE|LIVRO|T[ÍI]TULO|CAP[ÍI]TULO|SE[ÇC][ÃA]O|SUBSE[ÇC][ÃA]O)\s+[IVXLCDM0-9º°]+(?:-[A-Z])?)\s*[–—\-:]?\s*(.+)$/i;
      if (!desc) {
        const m = head.match(splitRe);
        if (m && m[2] && m[2].trim().length >= 3) {
          head = cleanStructuralText(m[1].trim()) || head;
          desc = cleanStructuralText(m[2].trim());
        }
      }
      return { head, desc };
    };

    if (isParte) {
      const { head, desc } = extractHeadAndDesc(num || firstLine);
      currentParte = desc ? `${head} — ${desc}` : head;
      currentLivro = undefined;
      currentTitulo = undefined;
      currentTituloDesc = undefined;
      currentCapitulo = undefined;
      currentCapituloDesc = undefined;
      currentSecao = undefined;
      currentSubsecao = undefined;
      continue;
    }

    if (isLivro) {
      const { head, desc } = extractHeadAndDesc(num || firstLine);
      currentLivro = desc ? `${head} — ${desc}` : head;
      currentTitulo = undefined;
      currentTituloDesc = undefined;
      currentCapitulo = undefined;
      currentCapituloDesc = undefined;
      currentSecao = undefined;
      currentSubsecao = undefined;
      continue;
    }

    if (isTitulo) {
      const { head, desc } = extractHeadAndDesc(num || firstLine);
      currentTitulo = head;
      currentTituloDesc = desc || undefined;
      currentCapitulo = undefined;
      currentCapituloDesc = undefined;
      currentSecao = undefined;
      currentSubsecao = undefined;
      continue;
    }

    if (isCapitulo) {
      const { head, desc } = extractHeadAndDesc(num || firstLine);
      currentCapitulo = head;
      currentCapituloDesc = desc || undefined;
      currentSecao = undefined;
      currentSubsecao = undefined;
      continue;
    }

    if (isSecao) {
      const { head, desc } = extractHeadAndDesc(num || firstLine);
      currentSecao = desc ? `${head} — ${desc}` : head;
      currentSubsecao = undefined;
      continue;
    }

    if (isSubsecao) {
      const { head, desc } = extractHeadAndDesc(num || firstLine);
      currentSubsecao = desc ? `${head} — ${desc}` : head;
      continue;
    }

    // Para artigos comuns:
    let itemTitulo = currentTitulo;
    const itemTituloDesc = currentTituloDesc;
    let itemCapitulo = currentCapitulo;
    const itemCapituloDesc = currentCapituloDesc;

    if (!itemTitulo && art.titulo && /^(T[ÍI]TULO|PARTE|LIVRO)\b/i.test(art.titulo)) {
      itemTitulo = art.titulo;
    }
    if (!itemCapitulo && art.capitulo && /^CAP[ÍI]TULO\b/i.test(art.capitulo)) {
      itemCapitulo = art.capitulo;
    }

    const crumb: BreadcrumbData = {
      parte: currentParte,
      livro: currentLivro,
      titulo: itemTitulo,
      tituloDesc: itemTituloDesc,
      capitulo: itemCapitulo,
      capituloDesc: itemCapituloDesc,
      secao: currentSecao,
      subsecao: currentSubsecao,
    };

    if (art.id) map.set(String(art.id), crumb);
    if (art.numero) {
      const cleanNum = String(art.numero).trim();
      const norm = cleanNum.replace(/^art\.\s*/i, '');
      map.set(cleanNum, crumb);
      map.set(norm, crumb);
      map.set(`Art. ${norm}`, crumb);
      map.set(`art. ${norm}`, crumb);
    }
  }

  return map;
}
