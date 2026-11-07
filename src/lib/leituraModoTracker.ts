export type UltimoModoLeitura = 'nativa' | 'pdf-clara' | 'pdf-escura';

export function saveUltimoModoLeitura(livroId: string | number, modo: UltimoModoLeitura | string) {
  if (typeof window === 'undefined') return;
  try {
    const normalizado: UltimoModoLeitura =
      modo === 'pdf-escura' ? 'pdf-escura' : modo === 'nativa' ? 'nativa' : 'pdf-clara';
    localStorage.setItem(`biblioteca:ultimo-modo:${livroId}`, normalizado);
    localStorage.setItem('biblioteca:ultimo-modo:global', normalizado);
  } catch {}
}

export function getUltimoModoLeitura(
  livroId?: string | number | null,
  options?: {
    hasNativaProgress?: boolean;
    hasVersaoEscura?: boolean;
    urlClara?: string | null;
    urlEscura?: string | null;
  }
): UltimoModoLeitura {
  if (typeof window === 'undefined') return 'nativa';
  try {
    if (livroId) {
      const specific = localStorage.getItem(`biblioteca:ultimo-modo:${livroId}`) as UltimoModoLeitura | null;
      if (specific === 'nativa' || specific === 'pdf-clara' || specific === 'pdf-escura') {
        return specific;
      }
    }

    // Heurística secundária por páginas salvas no localStorage
    if (options?.urlEscura && localStorage.getItem(`pdf-reader:page:${options.urlEscura}`)) {
      return 'pdf-escura';
    }
    if (options?.urlClara && localStorage.getItem(`pdf-reader:page:${options.urlClara}`)) {
      return 'pdf-clara';
    }
    if (options?.hasNativaProgress) {
      return 'nativa';
    }

    // Heurística terciária global do usuário
    const globalMode = localStorage.getItem('biblioteca:ultimo-modo:global') as UltimoModoLeitura | null;
    if (globalMode === 'nativa' || globalMode === 'pdf-clara' || globalMode === 'pdf-escura') {
      return globalMode;
    }
  } catch {}

  return 'nativa';
}
