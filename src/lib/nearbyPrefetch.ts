// Prefetches routes that are likely to come next from the current path.
// Runs on idle so it never competes with the current transition.
// Reuses the same import() factories as React.lazy so Suspense resolves
// instantly from the module cache.
import { routePrefetch, type PrefetchKey } from './routePrefetch';

// Map: current path prefix -> keys likely to be visited next.
const NEARBY: Array<[RegExp, PrefetchKey[]]> = [
  [/^\/$/,                    ['ferramentas', 'estudos', 'biblioteca', 'blog', 'noticias', 'questoes', 'flashcards', 'pilulas', 'vademecum', 'assistenteHorus', 'aprender', 'tematica']],
  [/^\/legislacao\//,         ['assistenteHorus', 'ferramentas', 'vademecum']],
  [/^\/ferramentas/,          ['estudos', 'perfil', 'pilulas', 'blog']],
  [/^\/blog/,                 ['noticias', 'boletins', 'ferramentas']],
  [/^\/biblioteca/,           ['modoOffline', 'pessoal', 'bibliotecaCategoria', 'bibliotecaOffline']],
  [/^\/aprender/,             ['estudos', 'tematica']],
  [/^\/radar/,                ['radares', 'boletins']],
  [/^\/estudos/,              ['tematica', 'resumosJuridicos', 'questoes', 'flashcards']],
  [/^\/perfil/,               ['pessoal']],
  [/^\/resumos-juridicos$/,   ['resumosJuridicosTemas', 'resumosJuridicosSubtemas', 'resumosJuridicosLista']],
  [/^\/resumos-juridicos\//,  ['resumosJuridicos', 'resumosJuridicosTemas', 'resumosJuridicosSubtemas', 'resumosJuridicosLista']],
  [/^\/audioaulas/,           ['videoaulas', 'videoaulasCatalogo', 'resumosJuridicos']],
  [/^\/bibliotecas?/,         ['bibliotecaCategoria', 'bibliotecaOffline', 'modoOffline', 'blog']],
  [/^\/ferramentas\/dicionario/, ['ferramentas', 'biblioteca']],
  [/^\/tematica-juridica/,    ['blog', 'biblioteca', 'videoaulas']],
  [/^\/videoaulas$/,          ['videoaulasCatalogo', 'videoaulasArea', 'videoaulasCategorias', 'videoaulasTrilhas', 'videoaulasLista', 'videoaulaView']],
  [/^\/videoaulas\//,         ['videoaulas', 'videoaulasCatalogo', 'videoaulasArea', 'videoaulaView', 'videoaulasLista']],
];

function idle(cb: () => void, timeout = 1200) {
  if (typeof window === 'undefined') return;
  const ric = (window as any).requestIdleCallback as
    | ((c: () => void, o?: { timeout?: number }) => number) | undefined;
  if (ric) ric(cb, { timeout }); else setTimeout(cb, 300);
}

/**
 * Prefetch route chunks likely to be visited next from `path`.
 * Also inserts <link rel="prefetch"> hints so nearby chunks land in HTTP cache
 * even before the module import runs.
 */
export function prefetchNearby(path: string): void {
  if (typeof window === 'undefined') return;
  const match = NEARBY.find(([re]) => re.test(path));
  if (!match) return;
  idle(() => {
    for (const key of match[1]) {
      try { routePrefetch[key](); } catch {}
    }
  });
}

/** Prefetch a single asset URL via <link rel="prefetch"> (dedup by href). */
export function prefetchAsset(href: string, as: 'image' | 'fetch' | 'script' = 'fetch') {
  if (typeof window === 'undefined' || !href) return;
  try {
    const existing = document.head.querySelector(`link[rel="prefetch"][href="${href}"]`);
    if (existing) return;
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = href;
    link.as = as;
    if (as === 'image') link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  } catch {}
}