import type { DicionarioTermo } from "@/hooks/useDicionarioJuridico";

/** Minúsculas, sem acentos e sem pontuação. */
export function normalizar(texto: string): string {
  return (texto || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Damerau-Levenshtein com corte máximo (retorna max+1 se ultrapassar). */
export function distancia(a: string, b: string, max = 3): number {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const la = a.length;
  const lb = b.length;
  if (!la) return lb;
  if (!lb) return la;

  let prev2: number[] = [];
  let prev: number[] = new Array(lb + 1);
  let cur: number[] = new Array(lb + 1);
  for (let j = 0; j <= lb; j++) prev[j] = j;

  for (let i = 1; i <= la; i++) {
    cur[0] = i;
    let melhor = cur[0];
    for (let j = 1; j <= lb; j++) {
      const custo = a[i - 1] === b[j - 1] ? 0 : 1;
      let v = Math.min(cur[j - 1] + 1, prev[j] + 1, prev[j - 1] + custo);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        v = Math.min(v, prev2[j - 2] + 1);
      }
      cur[j] = v;
      if (v < melhor) melhor = v;
    }
    if (melhor > max) return max + 1;
    prev2 = prev;
    prev = cur;
    cur = new Array(lb + 1);
  }
  return prev[lb];
}

/** Tolerância de erros conforme o tamanho da busca. */
function tolerancia(len: number): number {
  if (len <= 3) return 0;
  if (len <= 5) return 1;
  if (len <= 9) return 2;
  return 3;
}

const cacheNorm = new WeakMap<DicionarioTermo, { p: string; s: string }>();

function norm(t: DicionarioTermo) {
  let v = cacheNorm.get(t);
  if (!v) {
    v = { p: normalizar(t.palavra), s: normalizar(t.significado) };
    cacheNorm.set(t, v);
  }
  return v;
}

export interface ResultadoBusca {
  termo: DicionarioTermo;
  score: number;
  /** true quando só a definição casou (nunca a palavra). */
  apenasDefinicao: boolean;
}

/**
 * Busca ordenada por relevância:
 * palavra exata > prefixo > início de palavra > contém > erro de digitação > definição.
 */
export function buscarTermosDetalhado(
  lista: DicionarioTermo[],
  query: string,
): ResultadoBusca[] {
  const q = normalizar(query);
  if (!q) return lista.map((t) => ({ termo: t, score: 0, apenasDefinicao: false }));

  const tol = tolerancia(q.length);
  const fortes: ResultadoBusca[] = [];
  const fuzzy: ResultadoBusca[] = [];
  const defs: ResultadoBusca[] = [];

  for (const t of lista) {
    const { p, s } = norm(t);
    let score = -1;

    if (p === q) score = 1000;
    else if (p.startsWith(q)) score = 900 - Math.min(p.length - q.length, 80);
    else if (p.includes(" " + q)) score = 800 - Math.min(p.length - q.length, 80);
    else if (p.includes(q)) score = 700 - Math.min(p.length - q.length, 80);

    if (score >= 0) {
      fortes.push({ termo: t, score, apenasDefinicao: false });
      continue;
    }

    if (tol > 0) {
      // compara com a palavra inteira e com o prefixo do mesmo tamanho da busca
      const d1 = distancia(q, p, tol);
      const d2 = p.length > q.length ? distancia(q, p.slice(0, q.length), tol) : tol + 1;
      const d = Math.min(d1, d2);
      if (d <= tol) {
        fuzzy.push({ termo: t, score: 600 - d * 100 - Math.min(p.length, 60), apenasDefinicao: false });
        continue;
      }
    }

    if (q.length >= 3 && s.includes(q)) {
      defs.push({ termo: t, score: 100, apenasDefinicao: true });
    }
  }

  const ordena = (arr: ResultadoBusca[]) =>
    arr.sort((a, b) => b.score - a.score || a.termo.palavra.localeCompare(b.termo.palavra, "pt-BR"));

  return [...ordena(fortes), ...ordena(fuzzy), ...ordena(defs)];
}

export function buscarTermos(lista: DicionarioTermo[], query: string): DicionarioTermo[] {
  return buscarTermosDetalhado(lista, query).map((r) => r.termo);
}

/** Melhor candidato para "Você quis dizer...". */
export function sugerir(lista: DicionarioTermo[], query: string): string | null {
  const q = normalizar(query);
  if (q.length < 4) return null;
  const tol = Math.max(tolerancia(q.length), 1);
  let melhor: { palavra: string; d: number } | null = null;
  for (const t of lista) {
    const { p } = norm(t);
    if (Math.abs(p.length - q.length) > tol) continue;
    const d = distancia(q, p, tol);
    if (d > 0 && d <= tol && (!melhor || d < melhor.d)) {
      melhor = { palavra: t.palavra, d };
      if (d === 1) break;
    }
  }
  return melhor?.palavra ?? null;
}
