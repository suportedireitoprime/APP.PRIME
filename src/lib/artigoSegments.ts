/**
 * Segmentação do artigo de lei e do conteúdo de IA (explicação / exemplo).
 *
 * A IA já devolve o conteúdo fatiado por marcadores:
 *   - explicação: "---SECAO---" + títulos "## Caput", "## Inciso I", "## § 1º"
 *   - exemplo:    "---EXEMPLO---" + títulos "## Exemplo 1: ..."
 *
 * Aqui normalizamos essas seções em ids estáveis para que o leitor em tela
 * cheia consiga abrir direto no trecho que a pessoa tocou no artigo.
 */

export type AiSection = {
  /** id estável: 'caput' | 'inciso-i' | 'par-1' | 'par-unico' | 'exemplo-1' */
  id: string;
  /** rótulo curto para o chip de alternância */
  chip: string;
  /** título completo exibido no topo da seção */
  title: string;
  /** corpo em markdown */
  body: string;
};

const ROMAN_RE = /^([IVXLCDM]+)\s*[-–.)]/i;
const ALINEA_RE = /^([a-z])\)/i;
const PARAGRAFO_RE = /^§\s*(\d+)/;
const PAR_UNICO_RE = /^par[áa]grafo\s+[úu]nico/i;
const EXEMPLO_RE = /^exemplo\s*(\d+)/i;
const INCISO_TITULO_RE = /^inciso\s+([IVXLCDM]+)/i;
const ALINEA_TITULO_RE = /^al[íi]nea\s+([a-z])/i;

function strip(text: string): string {
  return text
    .replace(/^#{1,6}\s*/, '')
    .replace(/^\*\*/, '')
    .replace(/\*\*$/, '')
    .trim();
}

/** id + chip a partir do título de uma seção gerada pela IA. */
export function idFromTitle(rawTitle: string, index: number): { id: string; chip: string } {
  const t = strip(rawTitle);

  const ex = t.match(EXEMPLO_RE);
  if (ex) return { id: `exemplo-${ex[1]}`, chip: `Exemplo ${ex[1]}` };

  if (/^caput/i.test(t)) return { id: 'caput', chip: 'Caput' };

  const inc = t.match(INCISO_TITULO_RE) || t.match(ROMAN_RE);
  if (inc) return { id: `inciso-${inc[1].toLowerCase()}`, chip: inc[1].toUpperCase() };

  if (PAR_UNICO_RE.test(t)) return { id: 'par-unico', chip: 'Par. único' };

  const par = t.match(PARAGRAFO_RE);
  if (par) return { id: `par-${par[1]}`, chip: `§ ${par[1]}º` };

  const al = t.match(ALINEA_TITULO_RE);
  if (al) return { id: `alinea-${al[1].toLowerCase()}`, chip: `${al[1].toLowerCase()})` };

  return { id: `sec-${index + 1}`, chip: t.length > 14 ? `${t.slice(0, 13)}…` : t || `Parte ${index + 1}` };
}

/** Quebra o texto da IA em seções navegáveis. */
export function parseAiSections(text: string, marker: string): AiSection[] {
  if (!text?.trim()) return [];
  const parts = text.split(marker).map((p) => p.trim()).filter(Boolean);

  const sections: AiSection[] = [];
  parts.forEach((part, i) => {
    const lines = part.split('\n');
    const titleIdx = lines.findIndex((l) => /^#{2,3}\s+/.test(l) || /^\*\*.+\*\*$/.test(l.trim()));
    const rawTitle = titleIdx >= 0 ? lines[titleIdx] : '';
    const body = (titleIdx >= 0 ? lines.filter((_, idx) => idx !== titleIdx) : lines).join('\n').trim();
    const title = strip(rawTitle) || `Parte ${i + 1}`;
    const { id, chip } = idFromTitle(title, i);
    sections.push({ id, chip, title, body: body || part });
  });

  // Evita ids repetidos (IA às vezes repete um título).
  const seen = new Set<string>();
  return sections.map((s, i) => {
    if (!seen.has(s.id)) {
      seen.add(s.id);
      return s;
    }
    return { ...s, id: `${s.id}-${i}` };
  });
}

/**
 * id da seção correspondente a uma linha do artigo.
 * Alíneas herdam o inciso anterior (a IA agrupa alínea dentro do inciso).
 */
export function segmentIdForLine(line: string, previousId: string): string {
  const t = line.trim();

  const inc = t.match(ROMAN_RE);
  if (inc) return `inciso-${inc[1].toLowerCase()}`;

  if (ALINEA_RE.test(t)) return previousId || 'caput';

  if (PAR_UNICO_RE.test(t)) return 'par-unico';

  const par = t.match(PARAGRAFO_RE);
  if (par) return `par-${par[1]}`;

  return previousId && previousId !== 'caput' && !/^Art\s*\./i.test(t) ? previousId : 'caput';
}

/** Mapa linha → id de seção, calculado uma vez por artigo. */
export function buildLineSegmentMap(lines: string[]): string[] {
  let current = 'caput';
  return lines.map((line, i) => {
    if (i === 0) {
      current = 'caput';
      return current;
    }
    current = segmentIdForLine(line, current);
    return current;
  });
}

/** Escolhe a melhor seção existente para um id pedido. */
export function resolveSectionIndex(sections: AiSection[], wantedId?: string | null): number {
  if (!wantedId) return 0;
  const exact = sections.findIndex((s) => s.id === wantedId);
  if (exact >= 0) return exact;
  const prefix = sections.findIndex((s) => s.id.startsWith(wantedId));
  return prefix >= 0 ? prefix : 0;
}
