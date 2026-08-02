// Utilitários de formatação/karaokê para as Leis Cantadas.

const ORDINAIS: Record<string, string> = {
  "1": "1", "2": "2", "3": "3", "4": "4", "5": "5",
  first: "1", second: "2", third: "3", fourth: "4", fifth: "5",
  i: "1", ii: "2", iii: "3", iv: "4", v: "5",
};

/** Traduz rótulos de seção do inglês para português. */
export function traduzirSecao(rotuloBruto: string): string {
  let s = rotuloBruto.trim();
  s = s.replace(/^[[({]+/, "").replace(/[\])}]+$/, "").trim();

  const lower = s.toLowerCase();

  const num = (resto: string) => {
    const m = resto.trim().match(/(\d+|first|second|third|fourth|fifth|i{1,3}|iv|v)$/i);
    if (!m) return "";
    const key = m[1].toLowerCase();
    return ORDINAIS[key] ? ` ${ORDINAIS[key]}` : ` ${m[1]}`;
  };

  if (/^intro/.test(lower)) return "Introdução";
  if (/^outro/.test(lower)) return "Encerramento";
  if (/^pre[\s-]?chorus/.test(lower)) return "Pré-Refrão";
  if (/^post[\s-]?chorus/.test(lower)) return "Pós-Refrão";
  if (/^chorus/.test(lower) || /^refrain/.test(lower)) return "Refrão";
  if (/^hook/.test(lower)) return "Refrão";
  if (/^verse/.test(lower)) return `Verso${num(lower.replace(/^verse/, ""))}`;
  if (/^bridge/.test(lower)) return "Ponte";
  if (/^break/.test(lower) || /^instrumental/.test(lower)) return "Instrumental";
  if (/^drop/.test(lower)) return "Batida";
  if (/^interlude/.test(lower)) return "Interlúdio";
  if (/^solo/.test(lower)) return "Solo";
  if (/^ad[\s-]?libs?/.test(lower)) return "Improviso";

  return s.charAt(0).toUpperCase() + s.slice(1);
}

const RE_SECAO = /^\s*[\[({].+[\])}]\s*$/;

/** Uma linha é um rótulo de seção quando está totalmente entre colchetes/parênteses. */
export function ehSecao(linha: string): boolean {
  return RE_SECAO.test(linha);
}

export type LinhaLetra = { texto: string; secao: boolean };

/** Remove glifos de emoji/pictogramas do texto. */
export function removerEmojis(texto: string): string {
  return texto
    .replace(
      /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{1F1E6}-\u{1F1FF}\u{FE00}-\u{FE0F}\u{200D}\u{2190}-\u{21FF}\u{2300}-\u{23FF}]/gu,
      ""
    )
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function parseLetra(letra: string | null | undefined): LinhaLetra[] {
  if (!letra) return [];
  return letra
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) =>
      ehSecao(l)
        ? { texto: traduzirSecao(l), secao: true }
        : { texto: removerEmojis(l), secao: false }
    )
    .filter((l) => l.texto.length > 0);
}

/**
 * Determina a linha ativa no karaokê.
 * - Com tempos sincronizados, usa a última linha cujo tempo <= atual.
 * - Sem sync, cai no fallback proporcional (tempo/duração).
 */
export function linhaAtivaIndex(
  tempo: number,
  duracao: number,
  totalLinhas: number,
  sync?: number[] | null
): number {
  if (totalLinhas <= 0) return -1;

  if (Array.isArray(sync) && sync.length === totalLinhas) {
    let idx = -1;
    for (let i = 0; i < sync.length; i++) {
      if (typeof sync[i] === "number" && tempo + 0.05 >= sync[i]) idx = i;
      else break;
    }
    return idx;
  }

  if (duracao <= 0) return -1;
  const idx = Math.floor((tempo / duracao) * totalLinhas);
  return Math.min(totalLinhas - 1, Math.max(0, idx));
}

/**
 * Formata o texto de um artigo no estilo Vade Mecum: quebra de linha antes de
 * cada parágrafo (§ ou "Parágrafo único"), inciso e alínea.
 */
export function formatarArtigoVadeMecum(texto: string | null | undefined): string {
  if (!texto) return "";
  let t = String(texto).replace(/\r/g, "").replace(/[ \t]+/g, " ").trim();

  t = t.replace(/\s*(§\s*\d+[ºoª°]?)/g, "\n\n$1");
  t = t.replace(/\s*(Par[áa]grafo [úu]nico)/g, "\n\n$1");
  t = t.replace(/\s+((?:X{0,3})(?:IX|IV|V?I{0,3})\s*[-–—])\s*/g, "\n$1 ");
  t = t.replace(/\s+([a-z])\)\s*/g, "\n$1) ");
  t = t.replace(/\n{3,}/g, "\n\n").replace(/[ \t]+\n/g, "\n").trim();
  return t;
}

/** Remove anotações de redação/vigência/inclusão do texto legal. */
export function limparAnotacoes(texto: string): string {
  return (texto || "")
    .replace(
      /\s*\([^()]*(reda[çc][ãa]o|inclu[íi]d|vide|vig[êe]ncia|revogad|renumerad|regulament|produ[çc][ãa]o de efeito)[^()]*\)/gi,
      ""
    )
    .replace(/(^|\n)[ \t]*vig[êe]ncia[ \t]*(?=\n|$)/gi, "$1")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\s+([,.;:])/g, "$1")
    .trim();
}