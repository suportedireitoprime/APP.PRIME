import React from 'react';
import type { Highlight } from '@/hooks/useHighlights';
import { toast } from 'sonner';

// ─── Pure text processing functions ───

/** Remove metadata between parentheses: (Redação...), (Incluído...), etc. */
export function stripRedacao(text: string): string {
  return text.replace(/\s*\((?:Redação|Incluído|Acrescido|Alterado|Vide|Regulamento|Vigência|Vetado)[^)]*\)/gi, '');
}

/** Normalize a word token for narration alignment (removes accents, lowercases). */
export function normalizeNarracaoToken(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '');
}

/** Extract word tokens from text using Unicode-aware regex. */
export function getWordTokens(text: string): string[] {
  return Array.from(text.matchAll(/[\p{L}\p{N}]+(?:[-–][\p{L}\p{N}]+)*/gu), match => match[0]);
}

/**
 * Alinha os word_timings da narração (que incluem prefixo falado e números por extenso)
 * com as palavras realmente exibidas, devolvendo um timing por palavra renderizada.
 * Palavras sem correspondência são interpoladas entre as vizinhas encontradas.
 */
export function alinharTimingsComTexto(
  renderedTokens: string[],
  timings: Array<{ word: string; start: number; end: number }>,
  audioDuration: number,
): Array<{ word: string; start: number; end: number }> | null {
  if (!renderedTokens.length || !timings.length) return null;
  const tTokens = timings.map(t => normalizeNarracaoToken(t.word));

  // Descobre onde o texto do artigo começa dentro da fala (após o prefixo)
  const amostra = renderedTokens.slice(0, Math.min(8, renderedTokens.length));
  let melhorInicio = -1;
  let melhorScore = 0;
  for (let i = 0; i < tTokens.length; i++) {
    if (tTokens[i] !== amostra[0]) continue;
    let score = 0;
    let j = i;
    for (let k = 0; k < amostra.length && j < tTokens.length; k++) {
      const janela = Math.min(tTokens.length, j + 4);
      for (let p = j; p < janela; p++) {
        if (tTokens[p] === amostra[k]) { score++; j = p + 1; break; }
      }
    }
    if (score > melhorScore) { melhorScore = score; melhorInicio = i; }
    if (score === amostra.length) break;
  }
  if (melhorInicio < 0) return null;

  // Casamento guloso com janela de tolerância
  const mapeado: Array<{ start: number; end: number } | null> = new Array(renderedTokens.length).fill(null);
  let cursor = melhorInicio;
  for (let i = 0; i < renderedTokens.length; i++) {
    const alvo = renderedTokens[i];
    const limite = Math.min(tTokens.length, cursor + 6);
    for (let p = cursor; p < limite; p++) {
      if (tTokens[p] === alvo) {
        mapeado[i] = { start: timings[p].start, end: timings[p].end };
        cursor = p + 1;
        break;
      }
    }
  }

  const primeiroConhecido = mapeado.findIndex(Boolean);
  if (primeiroConhecido < 0) return null;

  const fim = Number.isFinite(audioDuration) && audioDuration > 0
    ? audioDuration
    : timings[timings.length - 1].end;

  // Interpola os buracos
  const resultado: Array<{ word: string; start: number; end: number }> = [];
  for (let i = 0; i < renderedTokens.length; i++) {
    if (mapeado[i]) { resultado.push({ word: renderedTokens[i], ...mapeado[i]! }); continue; }
    const anteriorFim = i > 0 && resultado[i - 1] ? resultado[i - 1].end : timings[melhorInicio].start;
    let proxIdx = -1;
    for (let j = i + 1; j < renderedTokens.length; j++) {
      if (mapeado[j]) { proxIdx = j; break; }
    }
    const proxInicio = proxIdx >= 0 ? mapeado[proxIdx]!.start : fim;
    const vazios = (proxIdx >= 0 ? proxIdx : renderedTokens.length) - i;
    const passo = Math.max(0.05, (proxInicio - anteriorFim) / Math.max(1, vazios));
    resultado.push({
      word: renderedTokens[i],
      start: anteriorFim,
      end: Math.min(proxInicio, anteriorFim + passo),
    });
  }
  return resultado;
}

/** Convert article number to spoken Portuguese (1 → "primeiro", etc.) */
export function formatArtigoNumeroExtenso(numStr: string): string {
  const clean = numStr.replace(/^[Aa]rt\.?\s*/, '').trim();
  if (/^1º?$/i.test(clean)) return 'primeiro';
  if (/^2º?$/i.test(clean)) return 'segundo';
  if (/^3º?$/i.test(clean)) return 'terceiro';
  if (/^4º?$/i.test(clean)) return 'quarto';
  if (/^5º?$/i.test(clean)) return 'quinto';
  if (/^6º?$/i.test(clean)) return 'sexto';
  if (/^7º?$/i.test(clean)) return 'sétimo';
  if (/^8º?$/i.test(clean)) return 'oitavo';
  if (/^9º?$/i.test(clean)) return 'nono';
  return clean;
}

/** Format article text for TTS narration (adds hierarchy, converts abbreviations). */
export function formatTextoArtigoParaNarracao(artigo: any, breadcrumb: any): string {
  if (!artigo) return '';
  const STRUCT_RE = /^(PARTE|LIVRO|T[IÍ]TULO|CAP[IÍ]TULO|SEÇ[AÃ]O|SUBSEÇ[AÃ]O)\b/i;

  const partes: string[] = [];

  if (breadcrumb?.parte) partes.push(`${breadcrumb.parte.trim()}.`);
  if (breadcrumb?.titulo) partes.push(`${breadcrumb.titulo.trim()}.`);
  if (breadcrumb?.tituloDesc) partes.push(`${breadcrumb.tituloDesc.trim()}.`);

  const tituloIsEpigrafe = artigo.titulo && !STRUCT_RE.test(artigo.titulo);

  if (partes.length === 0) {
    const hier = artigo.capitulo || (!tituloIsEpigrafe ? artigo.titulo : null);
    if (hier) partes.push(`${hier.trim()}.`);
  }

  if (tituloIsEpigrafe) partes.push(`${String(artigo.titulo).trim().replace(/\.+$/, '')}.`);

  const numExtenso = formatArtigoNumeroExtenso(artigo.numero);
  partes.push(`Artigo ${numExtenso}.`);

  let texto = stripRedacao((artigo.caput || '').trim());
  texto = texto.replace(/^\s*(?:Artigo|Art)\.?\s*\d+[º°]?(?:\s*[-–—]\s*[A-Za-z])?\s*[.\-–—:]?\s*/i, '').trim();
  texto = texto.replace(/\b[Aa]rt\.?\s*/g, 'Artigo ');
  texto = texto.replace(/§\s*único/gi, 'Parágrafo único');
  texto = texto.replace(/§\s*/g, 'Parágrafo ');
  texto = texto.replace(/\b[Ii]nc\.\s*/g, 'Inciso ');
  texto = texto.replace(/\b[Aa]l\.\s*/g, 'Alínea ');

  partes.push(texto);

  return partes.filter(Boolean).join(' ');
}

/** Check if a line of text is revoked. */
export function isLineRevogado(line: string): boolean {
  return /\(Revogado[^)]*\)/i.test(line);
}

// Regex que identifica INÍCIO de uma unidade lógica de texto legal.
export const LEGAL_LINE_START_RE = /^(?:Art\s*\.|§|Parágrafo\b|[IVXLCDM]+\s*[-–.)]|[a-z]\)|LIVRO\b|PARTE\b|TÍTULO\b|CAPÍTULO\b|SEÇÃO\b|SUBSEÇÃO\b)/i;

// Se a linha inteira for só uma nota entre parênteses
export const LEGAL_NOTE_ONLY_RE = /^\((?:Redação|Incluído|Acrescido|Alterado|Vide|Regulamento|Vigência|Revogado|Vetado)\b/i;

/** Merge physical line breaks into logical legal units. */
export function normalizeLegalLineBreaks(text: string): string {
  const raw = text.split('\n').map(l => l.trim());
  const merged: string[] = [];
  for (const line of raw) {
    if (!line) continue;
    if (
      merged.length === 0 ||
      LEGAL_LINE_START_RE.test(line) ||
      LEGAL_NOTE_ONLY_RE.test(line)
    ) {
      merged.push(line);
    } else {
      const prev = merged[merged.length - 1];
      if (/[-–]$/.test(prev)) {
        merged[merged.length - 1] = prev.replace(/[-–]$/, '') + line;
      } else {
        merged[merged.length - 1] = prev + ' ' + line;
      }
    }
  }
  return merged.join('\n');
}

/** Highlight legal tokens (Art., §, incisos, alíneas) with colored spans. */
export function highlightTermos(text: string, showRedacao?: boolean): React.ReactNode[] {
  const redacaoPattern = /\((?:Redação|Incluído|Acrescido|Alterado|Vide|Regulamento|Vigência|Revogado|Vetado)[^)]*\)/gi;

  if (showRedacao) {
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let m: RegExpExecArray | null;
    redacaoPattern.lastIndex = 0;
    while ((m = redacaoPattern.exec(text)) !== null) {
      if (m.index > lastIndex) parts.push(...highlightTermosOnly(text.slice(lastIndex, m.index)));
      parts.push(
        <span key={`r${m.index}`} className="text-primary text-xs font-normal bg-primary/10 rounded px-0.5">
          {m[0]}
        </span>
      );
      lastIndex = m.index + m[0].length;
    }
    if (lastIndex < text.length) parts.push(...highlightTermosOnly(text.slice(lastIndex)));
    return parts.length > 0 ? parts : highlightTermosOnly(text);
  }
  return highlightTermosOnly(text);
}

/** Highlight only legal structure tokens (Art., §, Roman numerals, alíneas). */
export function highlightTermosOnly(text: string): React.ReactNode[] {
  const patterns = [
    /^(Art\.\s*\d+[º°]?(?:-[A-Z])?)(\s*[–-]\s*)?/i,
    /^(§\s*\d+[º°]?(?:-[A-Z])?)(\s*[.–-]?\s*)?/i,
    /^(Parágrafo\s+único)(\.?\s*[–-]?\s*)?/i,
    /^([IVXLC]+\s*[-–.)])\s*/i,
    /^([a-z]\))\s*/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (!match) continue;
    const fullMatch = match[0];
    const leadingToken = match[1] || fullMatch;
    const separator = fullMatch.slice(leadingToken.length);
    const rest = text.slice(fullMatch.length);
    const parts: React.ReactNode[] = [];
    parts.push(<span key="token" className="text-primary font-bold">{leadingToken}</span>);
    if (separator) parts.push(<span key="sep">{separator}</span>);
    if (rest) parts.push(rest);
    return parts;
  }
  return [text];
}

/** Classify a line of legal text by its structural type. */
export function classifyLine(line: string): { type: 'nomen' | 'caput' | 'inciso' | 'alinea' | 'paragrafo' | 'text'; text: string } {
  if (/^[IVXLC]+\s*[-–.]\s*/i.test(line)) return { type: 'inciso', text: line };
  if (/^[a-z]\)\s*/i.test(line)) return { type: 'alinea', text: line };
  if (/^(§\s*\d+[º°]?\s*[-–.]?\s*|Parágrafo\s+único)/i.test(line)) return { type: 'paragrafo', text: line };
  return { type: 'text', text: line };
}

/** Apply highlight marks over existing React nodes for a given line. */
export function applyHighlightsToText(
  nodes: React.ReactNode[],
  lineHighlights: Highlight[],
  onRemove: (id: string) => void,
  highlightMode: boolean,
  onHoverHighlight?: (id: string | null, rect?: DOMRect) => void,
  onTapHighlight?: (id: string, rect: DOMRect) => void,
): React.ReactNode[] {
  if (lineHighlights.length === 0) return nodes;

  const flatText = nodes.map(n => (typeof n === 'string' ? n : (n && typeof n === 'object' && 'props' in n ? (n as any).props.children : ''))).join('');
  const sorted = [...lineHighlights].sort((a, b) => a.startOffset - b.startOffset);

  type Segment = { start: number; end: number; color?: string; id?: string; hasComment?: boolean };
  const segments: Segment[] = [];
  let cursor = 0;
  for (const h of sorted) {
    if (h.startOffset > cursor) segments.push({ start: cursor, end: h.startOffset });
    segments.push({ start: h.startOffset, end: h.endOffset, color: h.color, id: h.id, hasComment: !!(h.comment && h.comment.trim()) });
    cursor = h.endOffset;
  }
  if (cursor < flatText.length) segments.push({ start: cursor, end: flatText.length });

  const result: React.ReactNode[] = [];

  let tokenEnd = 0;
  const tokenNodes: React.ReactNode[] = [];
  for (const n of nodes) {
    if (typeof n !== 'string' && n && typeof n === 'object' && 'props' in n) {
      const len = ((n as any).props.children as string)?.length || 0;
      tokenNodes.push(n);
      tokenEnd += len;
    } else {
      break;
    }
  }

  for (const seg of segments) {
    const segText = flatText.slice(seg.start, seg.end);
    if (!segText) continue;

    if (seg.end <= tokenEnd && !seg.color) {
      if (seg.start === 0) result.push(...tokenNodes);
      continue;
    }

    if (seg.start === 0 && !seg.color && tokenNodes.length > 0) {
      result.push(...tokenNodes);
      const remainder = segText.slice(tokenEnd);
      if (remainder) result.push(remainder);
      continue;
    }

    if (seg.color) {
      result.push(
        <mark
          key={`hl-${seg.id}`}
          style={{ backgroundColor: seg.color, color: 'white', borderRadius: '2px', padding: '0 1px' }}
          className={`${highlightMode ? 'cursor-pointer select-none' : 'cursor-default'} ${seg.hasComment ? 'underline decoration-dotted decoration-white/50' : ''}`}
          onClick={highlightMode ? (e) => {
            e.stopPropagation();
            onRemove(seg.id!);
            import('@/lib/nativeHaptics').then(({ haptic }) => haptic.light()).catch(() => {});
            toast.success('Grifo removido', { duration: 1500 });
          } : (e) => {
            if (onTapHighlight) {
              e.stopPropagation();
              const rect = (e.target as HTMLElement).getBoundingClientRect();
              onTapHighlight(seg.id!, rect);
            }
          }}
          onMouseEnter={!highlightMode && seg.hasComment && onHoverHighlight ? (e) => {
            const rect = (e.target as HTMLElement).getBoundingClientRect();
            onHoverHighlight(seg.id!, rect);
          } : undefined}
          onMouseLeave={!highlightMode && onHoverHighlight ? () => onHoverHighlight(null) : undefined}
          title={highlightMode ? 'Toque para apagar este grifo' : undefined}
        >
          {segText}
        </mark>
      );
    } else {
      result.push(segText);
    }
  }

  return result.length > 0 ? result : nodes;
}

/** Format narration time as mm:ss */
export function formatNarracaoTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
