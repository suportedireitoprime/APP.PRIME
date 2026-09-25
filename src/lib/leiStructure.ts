import type { ArtigoLei } from '@/data/mockData';

/**
 * Verifica se um registro é um cabeçalho estrutural da lei (PARTE, LIVRO, TÍTULO, CAPÍTULO, SEÇÃO)
 * em vez de um artigo legislativo real.
 */
export const isStructuralArtigo = (artigo: { numero?: string; caput?: string } | null | undefined): boolean => {
  if (!artigo) return true;
  const num = (artigo.numero || '').trim();
  if (!num) return true;

  // Se o número começa com "Art." ou dígitos (ex: "Art. 1º", "1º", "14", "91-A"), é um artigo real!
  if (/^(?:art(?:igo|\.)?\s*)?\d+/i.test(num)) {
    return false;
  }

  // Se for explicitamente PARTE, LIVRO, TÍTULO, CAPÍTULO, SEÇÃO, SUBSEÇÃO
  if (/^\s*(PARTE|LIVRO|T[ÍI]TULO|CAP[ÍI]TULO|SE[ÇC][ÃA]O|SUBSE[ÇC][ÃA]O)\b/i.test(num)) {
    return true;
  }

  // Fallback: se não contém nenhum dígito, é um cabeçalho estrutural
  return !/\d/.test(num);
};

/**
 * Extrai puramente o número do artigo (ex: "Art. 1º" -> "1", "Art. 91-A" -> "91-A", "14" -> "14").
 */
export const formatArtigoNumeroOnly = (numero: string | undefined): string => {
  if (!numero) return '';
  const raw = numero.trim();
  // Remove prefixos como "Art.", "Artigo"
  let clean = raw.replace(/^art(?:igo|\.)?\s*/i, '').trim();
  // Remove ordinais º ou °
  clean = clean.replace(/[º°]/g, '').trim();
  return clean || raw;
};

export interface LeiCapituloItem {
  id: string;
  capituloHead: string; // ex: "CAPÍTULO I", "TÍTULO I", "CAPÍTULO ÚNICO"
  capituloNome: string; // ex: "Das Espécies de Pena", "Da Aplicação da Lei Penal"
  parentContext?: string; // ex: "Parte Geral • Das Penas"
  artigos: ArtigoLei[];
  primeiroArtigo: string;
  ultimoArtigo: string;
}

const cleanStructuralText = (s: string) => {
  return (s || '')
    .replace(/\s*\((?:Redação|Incluído|Revogado|Acrescido|Alterado|Vide|Regulamento)[^)]*\)/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

const _lowerWords = new Set([
  'a', 'à', 'às', 'ao', 'aos', 'o', 'os', 'as', 'e', 'ou', 'de', 'do', 'da',
  'dos', 'das', 'em', 'no', 'na', 'nos', 'nas', 'por', 'para', 'com', 'sem',
  'sob', 'sobre', 'entre', 'após', 'ante', 'até', 'contra', 'desde', 'perante',
  'trás', 'um', 'uma', 'uns', 'umas'
]);

export const toTitleCase = (s: string): string => {
  return s.toLowerCase().split(/(\s+)/).map((w, i) => {
    if (/^\s+$/.test(w) || !w) return w;
    if (i !== 0 && _lowerWords.has(w)) return w;
    return w.charAt(0).toUpperCase() + w.slice(1);
  }).join('');
};

/**
 * Varre a lista de artigos da lei e extrai os Capítulos reais.
 * Elimina falsos capítulos gerados por epígrafes e agrupa artigos em unidades legislativas reais.
 */
export function extractLeiCapitulos(artigos: ArtigoLei[]): LeiCapituloItem[] {
  if (!artigos || artigos.length === 0) return [];

  const isParteRow = (s: string) => /^\s*PARTE\s+(?:GERAL|ESPECIAL|[IVXLCDM0-9]+)/i.test(s);
  const isLivroRow = (s: string) => /^\s*LIVRO\s+[IVXLCDM0-9]+/i.test(s);
  const isTituloRow = (s: string) => /^\s*T[ÍI]TULO\s+[IVXLCDM0-9]+/i.test(s);
  const isCapituloRow = (s: string) => /^\s*CAP[ÍI]TULO\s+[IVXLCDM0-9]+/i.test(s);
  const isSecaoRow = (s: string) => /^\s*(?:SUB)?SE[ÇC][ÃA]O\s+[IVXLCDM0-9]+/i.test(s);

  const cleanHeadAndSub = (num: string, caput: string) => {
    const raw = cleanStructuralText(caput || num);
    const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);
    const line0 = lines[0] || num;
    const line1 = lines.slice(1).join(' — ');

    const splitRe = /^((?:PARTE|LIVRO|T[ÍI]TULO|CAP[ÍI]TULO|SE[ÇC][ÃA]O|SUBSE[ÇC][ÃA]O)\s+[IVXLCDM0-9º°]+(?:-[A-Z])?)\s*[–—\-:]?\s*(.+)$/i;
    let m = line0.match(splitRe);
    let head = m ? m[1].trim() : line0;
    let sub = m ? m[2].trim() : line1;

    // Se o head e o sub começarem iguais, remove duplicação
    if (sub && head) {
      const dupRe = new RegExp(`^${head.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*[-–—:]?\\s*`, 'i');
      sub = sub.replace(dupRe, '').trim();
    }

    if (!sub && line1) sub = line1;
    return { head, sub };
  };

  const result: LeiCapituloItem[] = [];

  let currentParte = '';
  let currentLivro = '';
  let currentTitulo = '';
  let currentTituloHead = '';
  let currentCapitulo = '';
  let currentCapituloHead = '';

  let currentItem: LeiCapituloItem | null = null;

  const flushCurrent = () => {
    if (currentItem && currentItem.artigos.length > 0) {
      currentItem.primeiroArtigo = currentItem.artigos[0]?.numero || '';
      currentItem.ultimoArtigo = currentItem.artigos[currentItem.artigos.length - 1]?.numero || '';
      result.push(currentItem);
    }
    currentItem = null;
  };

  for (const art of artigos) {
    const num = (art.numero || '').trim();
    const caput = (art.caput || '').trim();

    if (isParteRow(num)) {
      currentParte = cleanStructuralText(num);
      continue;
    }
    if (isLivroRow(num)) {
      currentLivro = cleanStructuralText(num);
      continue;
    }
    if (isTituloRow(num)) {
      flushCurrent();
      const { head, sub } = cleanHeadAndSub(num, caput);
      currentTituloHead = head;
      currentTitulo = sub || head;
      currentCapituloHead = '';
      currentCapitulo = '';

      // Título como potencial unidade de capítulo (se não tiver sub-capítulos)
      currentItem = {
        id: `tit_${num}_${result.length}`,
        capituloHead: head,
        capituloNome: sub ? toTitleCase(sub) : toTitleCase(head),
        parentContext: [currentParte, currentLivro].filter(Boolean).join(' • '),
        artigos: [],
        primeiroArtigo: '',
        ultimoArtigo: '',
      };
      continue;
    }
    if (isCapituloRow(num)) {
      flushCurrent();
      const { head, sub } = cleanHeadAndSub(num, caput);
      currentCapituloHead = head;
      currentCapitulo = sub || head;

      currentItem = {
        id: `cap_${num}_${result.length}`,
        capituloHead: head,
        capituloNome: sub ? toTitleCase(sub) : toTitleCase(head),
        parentContext: [currentParte, currentLivro, currentTitulo].filter(Boolean).join(' • '),
        artigos: [],
        primeiroArtigo: '',
        ultimoArtigo: '',
      };
      continue;
    }
    if (isSecaoRow(num)) {
      // Seção é subdivisão interna do capítulo; os artigos permanecem no capítulo ativo
      continue;
    }
    if (isStructuralArtigo(art)) {
      // Outro cabeçalho estrutural
      continue;
    }

    // Artigo Legislativo Real!
    if (!currentItem) {
      const head = currentCapituloHead || currentTituloHead || 'CAPÍTULO ÚNICO';
      const nome = currentCapitulo || currentTitulo || 'Disposições Gerais';
      currentItem = {
        id: `cap_geral_${result.length}`,
        capituloHead: head,
        capituloNome: toTitleCase(nome),
        parentContext: [currentParte, currentLivro, currentTitulo].filter(Boolean).join(' • '),
        artigos: [],
        primeiroArtigo: '',
        ultimoArtigo: '',
      };
    }

    currentItem.artigos.push(art);
  }

  flushCurrent();

  // Fallback: se a lei não possui marcações estruturais sequenciais no array de artigos,
  // mas tem capitulo/titulo atribuído em cada artigo (banco Supabase normalizado)
  if (result.length === 0 && artigos.length > 0) {
    const realArts = artigos.filter(a => !isStructuralArtigo(a));
    const capMap = new Map<string, ArtigoLei[]>();

    for (const a of realArts) {
      // Se o capítulo for válido (e não for epígrafe com apenas 1 palavra isolada ou nulo)
      const capKey = (a.capitulo && /^CAP[ÍI]TULO/i.test(a.capitulo))
        ? a.capitulo
        : (a.titulo && /^T[ÍI]TULO/i.test(a.titulo))
        ? a.titulo
        : 'Disposições Gerais';
      
      if (!capMap.has(capKey)) capMap.set(capKey, []);
      capMap.get(capKey)!.push(a);
    }

    for (const [key, arts] of capMap.entries()) {
      const { head, sub } = cleanHeadAndSub(key, key);
      result.push({
        id: `cap_fallback_${result.length}`,
        capituloHead: head || 'CAPÍTULO',
        capituloNome: sub ? toTitleCase(sub) : toTitleCase(key),
        artigos: arts,
        primeiroArtigo: arts[0]?.numero || '',
        ultimoArtigo: arts[arts.length - 1]?.numero || '',
      });
    }
  }

  return result;
}
