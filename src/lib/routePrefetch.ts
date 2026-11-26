// Centralized prefetchable route imports for the 4 hero shortcuts.
// Sharing the same import() factory between React.lazy and idle/hover prefetch
// ensures the browser/bundler cache is hit — Suspense resolves without a
// visible fallback.

export const routePrefetch = {
  radares: () => import("@/pages/radares/Radares.tsx"),
  noticias: () => import("@/pages/noticias/Noticias.tsx"),
  desktop: () => import("@/pages/compartilhado/DesktopPromo.tsx"),
  blog: () => import("@/pages/blog/Blog.tsx"),
  meuEspaco: () => import("@/pages/perfil/MeuEspaco.tsx"),
  biblioteca: () => import("@/pages/biblioteca/Bibliotecas.tsx"),
  assistenteHorus: () => import("@/pages/ia/AssistenteHorus.tsx"),
  chatJuridico: () => import("@/pages/ia/ChatJuridico.tsx"),
  resumosJuridicos: () => import("@/pages/resumos-juridicos/ResumosJuridicosAreas.tsx"),
  modoOffline: () => import("@/pages/offline/ModoOffline.tsx"),
  estudos: () => import("@/pages/Estudar.tsx"),
  ferramentas: () => import("@/pages/ferramentas/Ferramentas.tsx"),
  perfil: () => import("@/pages/perfil/Perfil.tsx"),
  dicionario: () => import("@/pages/dicionario/DicionarioJuridicoPage.tsx"),
  leiSeca: () => import("@/pages/LeiSeca/LeiSecaIndex.tsx"),
  leiSecaTrilha: () => import("@/pages/LeiSeca/LeiSecaTrilha.tsx"),
  leiSecaParte: () => import("@/pages/LeiSeca/LeiSecaParte.tsx"),
  leiSecaPlayer: () => import("@/pages/LeiSeca/LeiSecaPlayer.tsx"),
  leiSecaLembretes: () => import("@/pages/LeiSeca/LeiSecaLembretes.tsx"),

  radar360: () => import("@/pages/radares/Radar360.tsx"),

  jurisprudencia: () => import("@/pages/jurisprudencia/Jurisprudencia.tsx"),
  sumulasTribunal: () => import("@/pages/tribunais/SumulasTribunal.tsx"),
  pesquisasProntasLista: () => import("@/pages/tribunais/PesquisasProntasLista.tsx"),
  pesquisasProntasTema: () => import("@/pages/tribunais/PesquisasProntasTema.tsx"),
  informativosTribunal: () => import("@/pages/tribunais/InformativosTribunal.tsx"),
  tesesTribunal: () => import("@/pages/tribunais/TesesTribunal.tsx"),
  questoes: () => import("@/pages/questoes/Questoes.tsx"),
  resumosJuridicosTemas: () => import("@/pages/resumos-juridicos/ResumosJuridicosTemas.tsx"),
  resumosJuridicosSubtemas: () => import("@/pages/resumos-juridicos/ResumosJuridicosSubtemas.tsx"),
  resumosJuridicosLista: () => import("@/pages/resumos-juridicos/ResumosJuridicosLista.tsx"),
  audioaulas: () => import("@/pages/audioaulas/Audioaulas.tsx"),
  audioLeis: () => import("@/pages/audioleis/Audioleis.tsx"),
  bibliotecaCategoria: () => import("@/pages/biblioteca/BibliotecaCategoria.tsx"),
  bibliotecaOffline: () => import("@/pages/offline/ModoOfflineLivros.tsx"),
  videoaulas: () => import("@/pages/videoaulas/Videoaulas.tsx"),
  videoaulasCatalogo: () => import("@/pages/videoaulas/VideoaulasCatalogo.tsx"),
  videoaulasArea: () => import("@/pages/videoaulas/VideoaulasArea.tsx"),
  videoaulaView: () => import("@/pages/videoaulas/VideoaulaView.tsx"),
  videoaulasLista: () => import("@/pages/videoaulas/VideoaulasLista.tsx"),
  flashcards: () => import("@/pages/flashcards/Flashcards.tsx"),
  pilulas: () => import("@/pages/pilulas/PilulasHome"),
  pilulasLista: () => import("@/pages/pilulas/PilulasLista"),
  vademecum: () => import("@/pages/vademecum/CategoriaLegislacao.tsx"),
  vadeMecum: () => import("@/pages/vademecum/VadeMecum.tsx"),
  vadeMecumCodigos: () => import("@/pages/vademecum/VadeMecumCodigos.tsx"),
  vadeMecumSumulas: () => import("@/pages/vademecum/VadeMecumSumulas.tsx"),
  vadeMecumFavoritos: () => import("@/pages/vademecum/VadeMecumFavoritos.tsx"),
  vadeMecumRecentes: () => import("@/pages/vademecum/VadeMecumRecentes.tsx"),
  meExplique: () => import("@/pages/ia/MeExplique.tsx"),
  audiobooks: () => import("@/pages/audiobooks/Audiobooks.tsx"),
  aulas: () => import("@/pages/admin/AdminAulasInterativas.tsx"),
  boletins: () => import("@/pages/noticias/Boletins.tsx"),
} as const;

export type PrefetchKey = keyof typeof routePrefetch;

// Rotas essenciais para pré-aquecimento escalonado sob demanda
const MAIN_TAB_KEYS: PrefetchKey[] = [
  "vadeMecum",
  "questoes",
  "flashcards",
];

let mainTabsScheduled = false;
let idleScheduled = false;

import { prewarmFavoritosERecentesIdle } from "@/services/warmFavoritosService";

/** Pre-aquecimento cirúrgico e leve das abas principais apenas em momentos ociosos */
export function prefetchMainTabsIdle(): void {
  if (mainTabsScheduled || typeof window === "undefined") return;
  mainTabsScheduled = true;

  // ⚡ LATÊNCIA ZERO: Aguarda 8 segundos após a Home estar totalmente estável
  // e pré-carrega apenas 3 rotas críticas de forma cadenciada (1 por segundo)
  setTimeout(() => {
    let idx = 0;
    const step = () => {
      if (idx < MAIN_TAB_KEYS.length) {
        try {
          routePrefetch[MAIN_TAB_KEYS[idx]]();
        } catch {}
        idx++;
        setTimeout(step, 1200);
      } else {
        try {
          prewarmFavoritosERecentesIdle();
        } catch {}
      }
    };
    step();
  }, 8000);
}

/** 
 * Pré-aquecimento desativado em massa para evitar o travamento de 6s na tela inicial.
 * Rotas secundárias são carregadas sob demanda ou ao aproximar o toque (0ms).
 */
export function prefetchHeroRoutesIdle(): void {
  if (idleScheduled || typeof window === "undefined") return;
  idleScheduled = true;
  prefetchMainTabsIdle();
}

/** Fires a single route prefetch (safe to call repeatedly — dedup by browser). */
export function prefetchRoute(key: PrefetchKey): void {
  try {
    routePrefetch[key]();
  } catch {
    /* noop */
  }
}
