import { useMemo } from 'react';

export type CapituloJson = {
  numero?: number;
  titulo: string;
  capa_md?: string;
  paginas?: [number, number] | number[];
  conteudo_md?: string;
};

export type SumarioItem = { titulo: string; nivel: number; page: number };

export type Pagina = {
  index: number;
  ocrPage: number;
  chapterIdx: number;
  chapterTitulo: string;
  kind: 'cover' | 'content';
  md: string;
  cover?: { numero?: string; titulo: string };
};

export const limparTituloCapitulo = (raw: string): string =>
  String(raw || '')
    .replace(/^#+\s*/, '')
    .replace(/\*+/g, '')
    .replace(/_{2,}/g, '')
    .replace(/[.·•\u2026]{2,}\s*\d{1,4}\s*$/g, '')
    .replace(/^\s*(cap[ií]tulo|t[ií]tulo|livro|parte|se[cç][ãa]o|unidade)\s+[\wIVXLCDM]+\s*[-–—:.·]?\s*/i, '')
    .replace(/^\s*\d{1,3}(?:\.\d{1,3})*\s*[.\-–—):·]?\s+/, '')
    .replace(/^\s*[IVXLCDM]{1,6}\s*[.\-–—):·]\s+/, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/[\s.,;:-]+$/g, '')
    .trim();

export const ehTituloNaoCapitulo = (titulo: string): boolean => {
  const t = limparTituloCapitulo(titulo)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  if (!t) return true;
  return /^(sumario|indice|indices?( para catalogo.*)?|conteudo|table of contents|ficha catalografica|dedicatoria|agradecimentos|expediente|creditos)$/.test(t);
};

export function useLeitorPaginas(conteudo: string, capitulos: CapituloJson[], sumario: SumarioItem[]) {
  const paginas = useMemo<Pagina[]>(() => {
    const cleanArtefatos = (raw: string) => {
      return raw
        .split('\n')
        .map(line => {
          let l = line;
          l = l.replace(/^[ \t]*-{2,}[ \t]*\d+[ \t]*\|[ \t]*$/, '');
          l = l.replace(/^[ \t]*-{2,}[ \t]*\d+[ \t]*\|?[ \t]*$/, '');
          l = l.replace(/^[ \t]*-{3,}[ \t]*$/, '');
          l = l.replace(/^[ \t]*[\[\(]?[ \t]*[-–—·•*|]{0,3}[ \t]*\d{1,4}[ \t]*[-–—·•*|]{0,3}[ \t]*[\]\)]?[ \t]*$/, '');
          l = l.replace(/^[ \t]*\d{1,4}[ \t]*[|·•][ \t]*[^|\n.;:]{3,60}[ \t]*$/, '');
          l = l.replace(/^[ \t]*[^|\n.;:]{3,60}?[ \t]*[|·•][ \t]*\d{1,4}[ \t]*$/, '');
          l = l.replace(/^#{4,6}[ \t]+/, '### ');
          return l;
        })
        .join('\n')
        .replace(/<!--\s*capa-capitulo\s*-->/g, '')
        .replace(/<!--\s*(continua|page:\d+|toc-original|\/toc-original)\s*-->/g, '')
        .replace(/([^\n])[ \t]+(#{1,6})[ \t]+/g, '$1\n\n$2 ')
        .replace(/(^|\s)#{2,6}(?=\s*$)/gm, '$1')
        .replace(/\n{3,}/g, '\n\n')
        .replace(/\n[ \t]*\d{1,4}[ \t]*$/g, '')
        .trim();
    };

    const stripTocOriginal = (raw: string) => {
      let res = raw;
      while (true) {
        const start = res.indexOf('<!-- toc-original -->');
        if (start === -1) break;
        const end = res.indexOf('<!-- /toc-original -->', start);
        if (end === -1) {
          res = res.substring(0, start);
          break;
        }
        res = res.substring(0, start) + res.substring(end + 22);
      }
      return res;
    };

    const promoverTitulosDePagina = (raw: string) => {
      return raw.split('\n').map(line => {
        if (!/p[áa]g/i.test(line)) return line;
        return line
          .replace(/^[ \t]*(?:#{1,6}[ \t]*)?[*_]{0,2}[ \t]*P[ÁA]G(?:\.|INA)?[ \t]+(\d+)[º°ª]?[ \t]*[*_]{0,2}[ \t]*[.:\-–—]?[ \t]*$/i, '\n<!-- page:$1 -->\n')
          .replace(/^[ \t]*#{1,6}[ \t]*P[áa]gina[ \t]+\d+[.:\-]?[ \t]*$/i, '');
      }).join('\n');
    };

    const paginarPorMarcadores = (texto: string): Array<{ ocrPage: number; md: string }> => {
      const src = promoverTitulosDePagina(stripTocOriginal(texto));
      const parts = src.split(/<!--\s*page:(\d+)\s*-->/g);
      const raw: Array<{ ocrPage: number; md: string }> = [];
      if (parts.length > 1) {
        if (parts[0].trim()) {
          parts[2] = parts[0] + '\n\n' + (parts[2] || '');
        }
        for (let i = 1; i < parts.length; i += 2) {
          const n = Number(parts[i]);
          const md = cleanArtefatos(parts[i + 1] || '');
          if (md) raw.push({ ocrPage: n, md });
        }
      } else {
        const CHUNK = 2500;
        const blocks = src.split(/\n\n+/);
        let buf = '';
        let counter = 1;
        for (const b of blocks) {
          if ((buf + '\n\n' + b).length > CHUNK && buf) {
            const c = cleanArtefatos(buf);
            if (c) raw.push({ ocrPage: counter++, md: c });
            buf = b;
          } else {
            buf = buf ? buf + '\n\n' + b : b;
          }
        }
        const c = cleanArtefatos(buf);
        if (c) raw.push({ ocrPage: counter++, md: c });
      }
      const out: Array<{ ocrPage: number; md: string }> = [];
      for (const p of raw) {
        const prev = out[out.length - 1];
        const textoLocal = p.md.replace(/\s+/g, ' ').trim();
        const curto = textoLocal.length > 0 && textoLocal.length <= 12;
        const prevSemPontuacao = prev && /[a-zà-úñç,;:—-]$/i.test(prev.md.replace(/\s+$/g, ''));
        if (prev && curto && prevSemPontuacao) {
          prev.md = prev.md.replace(/\s+$/, '') + ' ' + p.md.replace(/^\s+/, '');
        } else {
          out.push(p);
        }
      }
      return out;
    };

    const out: Pagina[] = [];
    let idxCounter = 0;

    if (capitulos && capitulos.length > 0) {
      let paginasGlobais: Array<{ ocrPage: number; md: string }> | null = null;
      const getPaginasGlobais = () => {
        if (paginasGlobais) return paginasGlobais;
        paginasGlobais = conteudo ? paginarPorMarcadores(conteudo) : [];
        return paginasGlobais;
      };

      const hasTextoUtil = (md: string) =>
        md
          .replace(/<!--[^>]*-->/g, '')
          .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
          .replace(/\[[^\]]+\]\([^)]*\)/g, '$1')
          .replace(/https?:\/\/\S+/g, '')
          .replace(/^#{1,6}\s+/gm, '')
          .replace(/\s+/g, ' ')
          .trim().length >= 40;

      capitulos.forEach((cap, cIdx) => {
        const numero = cap.numero ?? cIdx + 1;
        const titCap = limparTituloCapitulo(cap.titulo) || `Capítulo ${numero}`;
        const conteudoCap = String(cap.conteudo_md || '').trim();
        let paginado: Array<{ ocrPage: number; md: string }> = [];
        if (conteudoCap) {
          paginado = paginarPorMarcadores(conteudoCap);
        } else if (Array.isArray(cap.paginas) && cap.paginas.length) {
          const start = Number(cap.paginas[0]);
          const end = Number(cap.paginas[cap.paginas.length - 1]);
          const proxCap = capitulos[cIdx + 1];
          const proxStart = Array.isArray(proxCap?.paginas) && proxCap.paginas.length
            ? Number(proxCap.paginas[0])
            : Number.POSITIVE_INFINITY;
          const limite = Math.min(end, proxStart - 1);
          paginado = getPaginasGlobais().filter(
            (p) => p.ocrPage >= start && p.ocrPage <= limite,
          );
        }
        const paginasValidas = paginado.filter((p) => hasTextoUtil(p.md));
        if (!paginasValidas.length) return;
        const numeroExibido = out.filter((p) => p.kind === 'cover').length + 1;
        out.push({
          index: idxCounter++,
          ocrPage: Array.isArray(cap.paginas) && cap.paginas.length ? Number(cap.paginas[0]) : paginasValidas[0].ocrPage,
          chapterIdx: cIdx,
          chapterTitulo: titCap,
          kind: 'cover',
          md: '',
          cover: { numero: `CAPÍTULO ${numeroExibido}`, titulo: titCap },
        });
        for (const p of paginasValidas) {
          out.push({
            index: idxCounter++,
            ocrPage: p.ocrPage,
            chapterIdx: cIdx,
            chapterTitulo: titCap,
            kind: 'content',
            md: p.md,
          });
        }
      });
      return out;
    }

    if (!conteudo) return out;
    const chapters = stripTocOriginal(conteudo).split(/<!--\s*capa-capitulo\s*-->/g);
    let ocrCounter = 1;
    chapters.forEach((raw, cIdx) => {
      const bloco = raw.trim();
      if (!bloco) return;
      if (cIdx === 0) {
        for (const p of paginarPorMarcadores(bloco)) {
          out.push({
            index: idxCounter++,
            ocrPage: p.ocrPage || ocrCounter++,
            chapterIdx: 0,
            chapterTitulo: 'Introdução do livro',
            kind: 'content',
            md: p.md,
          });
        }
        return;
      }
      const linhas = bloco.split('\n');
      let numero: string | undefined;
      let titCap = '';
      let i = 0;
      while (i < linhas.length && !linhas[i].trim()) i++;
      const mNum = linhas[i]?.match(/^#{0,3}\s*(CAP[IÍ]TULO|TÍTULO|LIVRO|PARTE|SEÇÃO|SECAO)\s+([\wIVXLCDM\d]+).*$/i);
      if (mNum) {
        numero = `${mNum[1].toUpperCase()} ${mNum[2]}`;
        i++;
        while (i < linhas.length && !linhas[i].trim()) i++;
      }
      if (i < linhas.length) {
        const t = linhas[i].replace(/^#{1,6}\s*/, '').trim();
        if (t) {
          titCap = t;
          i++;
        }
      }
      const resto = linhas.slice(i).join('\n').trim();
      const chapterTitulo = titCap || (numero ?? `Capítulo ${cIdx}`);

      out.push({
        index: idxCounter++,
        ocrPage: ocrCounter,
        chapterIdx: cIdx,
        chapterTitulo,
        kind: 'cover',
        md: '',
        cover: { numero, titulo: chapterTitulo },
      });

      for (const p of paginarPorMarcadores(resto)) {
        out.push({
          index: idxCounter++,
          ocrPage: p.ocrPage || ocrCounter++,
          chapterIdx: cIdx,
          chapterTitulo,
          kind: 'content',
          md: p.md,
        });
      }
    });
    return out;
  }, [conteudo, capitulos]);

  const tocItems = useMemo(() => {
    if (capitulos && capitulos.length > 0) {
      const comConteudo = new Set(
        paginas.map((p) => p.chapterIdx).filter((v): v is number => typeof v === 'number'),
      );
      return capitulos
        .map((c, i) => ({
          nivel: 1 as number,
          titulo: limparTituloCapitulo(c.titulo) || `Capítulo ${c.numero ?? i + 1}`,
          chapterIdx: i,
        }))
        .filter((c) => comConteudo.has(c.chapterIdx) && !ehTituloNaoCapitulo(c.titulo));
    }
    return (sumario || [])
      .map((s, i) => ({
        nivel: s.nivel,
        titulo: limparTituloCapitulo(s.titulo),
        ocrPage: s.page,
        chapterIdx: i,
      }))
      .filter((s) => s.titulo && !ehTituloNaoCapitulo(s.titulo)) as any;
  }, [capitulos, sumario, paginas]);

  const chapterRanges = useMemo(() => {
    const map = new Map<number, { start: number; end: number }>();
    paginas.forEach((p) => {
      if (typeof p.chapterIdx !== 'number') return;
      const cur = map.get(p.chapterIdx);
      if (!cur) map.set(p.chapterIdx, { start: p.ocrPage, end: p.ocrPage });
      else {
        if (p.ocrPage < cur.start) cur.start = p.ocrPage;
        if (p.ocrPage > cur.end) cur.end = p.ocrPage;
      }
    });
    return map;
  }, [paginas]);

  return { paginas, tocItems, chapterRanges };
}
