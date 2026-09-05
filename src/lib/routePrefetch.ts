// Centralized prefetchable route imports for the 4 hero shortcuts.
// Sharing the same import() factory between React.lazy and idle/hover prefetch
// ensures the browser/bundler cache is hit — Suspense resolves without a
// visible fallback.

export const routePrefetch = {
  radares:  () => import("@/pages/Radares.tsx"),
  boletins: () => import("@/pages/BoletinsJuridicos.tsx"),
  noticias: () => import("@/pages/Noticias.tsx"),
  locais:   () => import("@/pages/LocaisJuridicos.tsx"),
  desktop:  () => import("@/pages/DesktopPromo.tsx"),
  blog:     () => import("@/pages/Blog.tsx"),
  meuEspaco: () => import("@/pages/MeuEspaco.tsx"),
  biblioteca: () => import("@/pages/Bibliotecas.tsx"),
  assistenteHorus: () => import("@/pages/AssistenteHorus.tsx"),
  resumosJuridicos: () => import("@/pages/resumos-juridicos/ResumosJuridicosAreas.tsx"),
  modoOffline: () => import("@/pages/ModoOffline.tsx"),
  tematica: () => import("@/pages/TematicaJuridica.tsx"),
  estudos: () => import("@/pages/Estudar.tsx"),
  ferramentas: () => import("@/pages/Ferramentas.tsx"),
  pessoal: () => import("@/pages/pessoal/Avisos.tsx"),
  perfil: () => import("@/pages/Perfil.tsx"),
  aprender: () => import("@/pages/Aprender.tsx"),
  aprenderModulo: () => import("@/pages/AprenderModulo.tsx"),
  peticaoInicial: () => import("@/pages/PeticaoInicial.tsx"),
  dicionario: () => import("@/pages/DicionarioJuridicoPage.tsx"),
  leiSeca: () => import("@/pages/LeiSeca/LeiSecaIndex.tsx"),
  leiSecaTrilha: () => import("@/pages/LeiSeca/LeiSecaTrilha.tsx"),
  leiSecaParte: () => import("@/pages/LeiSeca/LeiSecaParte.tsx"),
  leiSecaPlayer: () => import("@/pages/LeiSeca/LeiSecaPlayer.tsx"),
  leiSecaLembretes: () => import("@/pages/LeiSeca/LeiSecaLembretes.tsx"),

  radar360: () => import("@/pages/Radar360.tsx"),
  newsletter: () => import("@/pages/Newsletter.tsx"),
  gravarAula: () => import("@/pages/AnotacoesAudio.tsx"),
  categoriaAprender: () => import("@/pages/CategoriaAprender.tsx"),
  aprenderAula: () => import("@/pages/AprenderAula.tsx"),
  praticar: () => import("@/pages/Praticar.tsx"),
  jurisprudencia: () => import("@/pages/Jurisprudencia.tsx"),
  sumulasTribunal: () => import("@/pages/SumulasTribunal.tsx"),
  pesquisasProntasLista: () => import("@/pages/PesquisasProntasLista.tsx"),
  pesquisasProntasTema: () => import("@/pages/PesquisasProntasTema.tsx"),
  informativosTribunal: () => import("@/pages/InformativosTribunal.tsx"),
  tesesTribunal: () => import("@/pages/TesesTribunal.tsx"),
  questoes: () => import("@/pages/Questoes.tsx"),
  resumosJuridicosTemas: () => import("@/pages/resumos-juridicos/ResumosJuridicosTemas.tsx"),
  resumosJuridicosSubtemas: () => import("@/pages/resumos-juridicos/ResumosJuridicosSubtemas.tsx"),
  resumosJuridicosLista: () => import("@/pages/resumos-juridicos/ResumosJuridicosLista.tsx"),
  audioaulas: () => import("@/pages/Audioaulas.tsx"),
  bibliotecaCategoria: () => import("@/pages/BibliotecaCategoria.tsx"),
  bibliotecaOffline: () => import("@/pages/BibliotecaOffline.tsx"),
  videoaulas: () => import("@/pages/Videoaulas.tsx"),
  videoaulasCatalogo: () => import("@/pages/VideoaulasCatalogo.tsx"),
  videoaulasArea: () => import("@/pages/VideoaulasArea.tsx"),
  videoaulaView: () => import("@/pages/VideoaulaView.tsx"),
  videoaulasLista: () => import("@/pages/VideoaulasLista.tsx"),
  videoaulasTrilhas: () => import("@/pages/VideoaulasTrilhas.tsx"),
  videoaulasCategorias: () => import("@/pages/VideoaulasCategorias.tsx"),
  videoaulasCatalogoTrilha: () => import("@/pages/VideoaulasCatalogoTrilha.tsx"),
  videoaulasConquistas: () => import("@/pages/VideoaulasConquistas.tsx"),
  flashcards: () => import("@/pages/Flashcards.tsx"),
  pilulas: () => import("@/pages/pilulas/PilulasHome"),
  pilulasLista: () => import("@/pages/pilulas/PilulasLista"),
  vademecum: () => import("@/pages/CategoriaLegislacao.tsx"),
  meExplique: () => import("@/pages/MeExplique.tsx"),
} as const;

export type PrefetchKey = keyof typeof routePrefetch;

const MAIN_TAB_KEYS: PrefetchKey[] = [
  'vademecum',
  'pilulas',
  'ferramentas',
  'blog',
  'aprender',
  'meuEspaco',
];

let mainTabsScheduled = false;
let idleScheduled = false;

/** Pre-aquecimento imediato das 6 abas e rotas principais do BottomNav em idle. */
export function prefetchMainTabsIdle(): void {
  if (mainTabsScheduled || typeof window === "undefined") return;
  mainTabsScheduled = true;

  const run = () => {
    MAIN_TAB_KEYS.forEach((key) => {
      try { routePrefetch[key](); } catch { /* noop */ }
    });
  };

  const ric = (window as any).requestIdleCallback as
    | ((cb: () => void, opts?: { timeout?: number }) => number)
    | undefined;

  if (ric) ric(run, { timeout: 1200 });
  else setTimeout(run, 350);
}

/** Prefetches all navigation chunks in staggered batches after the browser is idle. */
export function prefetchHeroRoutesIdle(): void {
  if (idleScheduled || typeof window === "undefined") return;
  idleScheduled = true;

  // Primeiro pré-aquece as abas mais acessadas
  prefetchMainTabsIdle();

  const run = () => {
    const allKeys = Object.keys(routePrefetch) as PrefetchKey[];
    const remaining = allKeys.filter((k) => !MAIN_TAB_KEYS.includes(k));

    // Pré-carrega o restante de forma cadenciada para não afogar a CPU/rede
    remaining.forEach((key, index) => {
      setTimeout(() => {
        try { routePrefetch[key](); } catch { /* noop */ }
      }, index * 40);
    });
  };

  const ric = (window as any).requestIdleCallback as
    | ((cb: () => void, opts?: { timeout?: number }) => number)
    | undefined;

  if (ric) ric(run, { timeout: 3000 });
  else setTimeout(run, 1500);
}

/** Fires a single route prefetch (safe to call repeatedly — dedup by browser). */
export function prefetchRoute(key: PrefetchKey): void {
  try { routePrefetch[key](); } catch { /* noop */ }
}
