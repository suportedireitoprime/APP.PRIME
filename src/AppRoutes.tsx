// @ts-nocheck
import { lazy, Suspense, useEffect, useState } from "react";
import { lazyWithRetry } from "@/utils/lazyWithRetry";
import { initAnalytics, trackPageview, setAnalyticsUserWithProfile } from "@/lib/analytics";
import { useScreenTracking } from "@/lib/screenTracking";
import { initNavTelemetry, markRouteChange } from "@/lib/navTelemetry";
import { prefetchNearby } from "@/lib/nearbyPrefetch";

// IntroOverlay desativado: o app agora usa apenas o splash nativo estático.
// import IntroOverlay from "@/components/IntroOverlay";
import { SkipToContent } from "@/components/a11y/SkipToContent";
const AnalyticsDebugPanel = lazy(() => import("@/components/AnalyticsDebugPanel"));
import { Capacitor } from '@capacitor/core';
import { isAdminEmail } from "@/lib/adminEmails";
import { shouldBypassAsAdmin, isSimulatingExpired } from "@/lib/devSimulation";
import { useSubscription } from "@/hooks/useSubscription";
import { TrialCountdownBar } from "@/components/subscription/TrialCountdownBar";
import { TrialExpiredGate } from "@/components/subscription/TrialExpiredGate";




// Boot GA4 o mais cedo possível (Consent Mode v2 default = denied).
if (typeof window !== "undefined") {
  const scheduleAnalytics = () => {
    initAnalytics();
    initNavTelemetry();
    import("@/lib/enableMouseDragScroll").then((m) => m.enableMouseDragScroll());
    import("@/lib/appMetrics").then((m) => m.startAppMetrics());
  };
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(scheduleAnalytics, { timeout: 3000 });
  } else {
    setTimeout(scheduleAnalytics, 1500);
  }
}
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { get as idbGet, set as idbSet, del as idbDel } from "idb-keyval";
import { BrowserRouter, HashRouter, Route, Routes, Navigate, useLocation, useNavigate, useParams } from "react-router-dom";

// Electron e GitHub Pages (subpastas como /APP.PRIME/) usam HashRouter (/#/rota)
// para evitar erro 404 em assets e rotas estáticas.
const isStaticSubpath = typeof window !== "undefined" && window.location.hostname.endsWith("github.io");
const Router = typeof window !== "undefined" && ((window as any).desktopApp?.isElectron || isStaticSubpath)
  ? HashRouter
  : BrowserRouter;

import PageTransition from "@/components/PageTransition";
import { ScrollRestorationWatcher } from "@/components/navigation/ScrollRestorationWatcher";
import { useMediaQuery } from "./hooks/useMediaQuery.ts";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { routePrefetch, prefetchRoute, type PrefetchKey } from "@/lib/routePrefetch";
import { Toaster as Sonner } from "@/components/ui/sonner";
import OfflineStatusBadge from "@/components/OfflineStatusBadge";
import OfflineWatcher from "@/components/OfflineWatcher";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { usePresenceTracker } from "@/hooks/usePresenceTracker";
import { useNativePermissions } from "@/hooks/useNativePermissions";
import AtivarNotificacoesGate from "@/components/notificacoes/AtivarNotificacoesGate";
import { usePushJourneyTracker } from "@/hooks/usePushJourneyTracker";
import { ThemeProvider } from "@/hooks/useTheme";
import { useHorusStatsSync } from "@/hooks/useHorusStatsSync";
import { useSessionTracker } from "@/hooks/useSessionTracker";
import { useDesktopSessionGuard } from "@/hooks/useDesktopSessionGuard";
import { useProfileSummary } from "@/hooks/useProfileSummary";
import { resetBodyScrollLock } from "@/hooks/useBodyScrollLock";
import { useHardwareBackButton } from "@/hooks/useHardwareBackButton";
import brasaoImgAsset from '@/assets/brasao-republica.webp';
const brasaoImg = brasaoImgAsset;
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { RecordingProvider } from "@/contexts/RecordingContext";
import { AudioaulasPlayerProvider } from "@/contexts/AudioaulasPlayerContext";
import { ResumoLivroPlayerProvider } from "./contexts/ResumoLivroPlayerContext.tsx";
import { PilulasPlayerProvider } from "@/contexts/PilulasPlayerContext";
import { VideoaulasPlayerProvider } from "@/contexts/VideoaulasPlayerContext";
const GeofencePresenceBanner = lazy(() => import("@/components/GeofencePresenceBanner"));
const ReminderInAppBanner = lazy(() => import("@/components/ReminderInAppBanner"));
const InAppPushPopup = lazy(() => import("@/components/ui/InAppPushPopup"));
const HorusTakeoverNoticeDialog = lazy(() => import("@/components/horus/HorusTakeoverNoticeDialog"));
const ForceUpdateScreen = lazy(() => import("@/components/ForceUpdateScreen"));
import { useAppUpdateStore } from "@/lib/appUpdateStore";

function ForceUpdateWrapper() {
  const isUpdateRequired = useAppUpdateStore((s) => s.isUpdateRequired);
  return isUpdateRequired ? <ForceUpdateScreen /> : null;
}

// Eagerly loaded (critical path)
import PersistentHome from "./components/PersistentHome.tsx";
import Index from "./pages/Index.tsx";
import Auth from "./pages/Auth.tsx";
import Landing from "@/pages/Landing";
const Onboarding = lazy(() => import("./pages/Onboarding.tsx"));

const VadeMecum = lazy(() => import("./pages/VadeMecum.tsx"));
const VadeMecumCodigos = lazy(() => import("./pages/VadeMecumCodigos.tsx"));
const VadeMecumEstatutos = lazy(() => import("./pages/VadeMecumEstatutos.tsx"));
const VadeMecumEspeciais = lazy(() => import("./pages/VadeMecumEspeciais.tsx"));
const VadeMecumSumulas = lazy(() => import("./pages/VadeMecumSumulas.tsx"));
const VadeMecumFavoritos = lazy(() => import("./pages/VadeMecumFavoritos.tsx"));
const VadeMecumRecentes = lazy(() => import("./pages/VadeMecumRecentes.tsx"));
const CategoriaLegislacao = lazy(() => import("./pages/CategoriaLegislacao.tsx"));
const Ferramentas = lazy(() => import("./pages/Ferramentas.tsx"));
const MeuEspaco = lazy(() => import("./pages/MeuEspaco.tsx"));

// Lazy loaded
const PilulasLista = lazy(() => import('@/pages/pilulas/PilulasLista'));
const SmartLink = lazy(() => import("./pages/SmartLink.tsx"));
const ResetPassword = lazy(() => import("./pages/ResetPassword.tsx"));

const QuestoesHistorico = lazy(() => import('@/pages/QuestoesHistorico'));
const AdminFuncoes = lazy(() => import("./pages/AdminFuncoes.tsx"));
const AdminPush = lazy(() => import("./pages/AdminPush.tsx"));

const AdminPilulas = lazy(() => import("./pages/AdminPilulas.tsx"));
const AdminErrosQuestoes = lazy(() => import("./pages/AdminErrosQuestoes.tsx"));
const AdminVadeMecumHistorico = lazy(() => import('./pages/AdminVadeMecumHistorico.tsx'));
const AdminMapeamentoLeis = lazy(() => import('./pages/AdminMapeamentoLeis.tsx'));
const AdminNarracaoLeis = lazy(() => import('./pages/AdminNarracaoLeis.tsx'));
const AdminSimulados = lazy(() => import("./pages/AdminSimulados.tsx"));
const Simulados = lazy(() => import("./pages/Simulados.tsx"));
const SimuladosResolver = lazy(() => import("./pages/SimuladosResolver.tsx"));
const SimuladosEstatisticas = lazy(() => import("./pages/SimuladosEstatisticas.tsx"));
const FerramentasSimulados = Simulados;
const FerramentasSimuladosResolver = SimuladosResolver;
const FerramentasSimuladosEstatisticas = SimuladosEstatisticas;
import { supabase } from "@/integrations/supabase/client";

// Lazy loaded
const ResumosJuridicosJurisprudencia = lazy(() => import("./pages/resumos-juridicos/ResumosJuridicosJurisprudencia.tsx"));
const Noticias = lazy(routePrefetch.noticias);
const Boletins = lazy(() => import("./pages/Boletins.tsx"));
const Atualizacoes = lazy(() => import("./pages/Atualizacoes.tsx"));
const Novidades = lazy(() => import("./pages/Novidades.tsx"));
const AvaliacaoInteligente = lazy(() => import("./pages/graficos/AvaliacaoInteligente.tsx"));
const PessoalGrifos = lazy(() => import("./pages/pessoal/Grifos.tsx"));
const PessoalArtigos = lazy(() => import("./pages/pessoal/Artigos.tsx"));
const PessoalLeis = lazy(() => import("./pages/pessoal/Leis.tsx"));
const PessoalAnotacoes = lazy(() => import("./pages/pessoal/Anotacoes.tsx"));
const PessoalLivros = lazy(() => import("./pages/pessoal/Livros.tsx"));
const PessoalJurisprudencias = lazy(() => import("./pages/pessoal/Jurisprudencias.tsx"));
const Concursos = lazy(() => import("./pages/Concursos.tsx"));
const RadarConcursos = lazy(() => import("./pages/RadarConcursos.tsx"));
const RadarEstatisticas = lazy(() => import("./pages/RadarEstatisticas.tsx"));
const VisualJuridico = lazy(() => import("./pages/VisualJuridico.tsx"));

const MeExplique = lazy(routePrefetch.meExplique);
const ChatJuridico = lazy(() => import("./pages/ChatJuridico.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));
const Configuracoes = lazy(() => import("./pages/Configuracoes.tsx"));
const RadarProposicoes = lazy(() => import("./pages/RadarProposicoes.tsx"));
const RadarProposicoesDia = lazy(() => import("./pages/RadarProposicoesDia.tsx"));
const LegislacaoEstadual = lazy(() => import("./pages/LegislacaoEstadual.tsx"));
const EstadoDetalhe = lazy(() => import("./pages/EstadoDetalhe.tsx"));
const LeiEstadualView = lazy(() => import("./pages/LeiEstadualView.tsx"));
const ExplicacaoLei = lazy(() => import("./pages/ExplicacaoLei.tsx"));

const PlanoEstudos = lazy(() => import("./pages/ferramentas/PlanoEstudos.tsx"));
const Documentos = lazy(() => import("./pages/Documentos.tsx"));
const DicionarioJuridicoPage = lazy(routePrefetch.dicionario);
const Compartilhado = lazy(() => import("./pages/Compartilhado.tsx"));
const Radar360 = lazy(routePrefetch.radar360);
const OutrasNormasLista = lazy(() => import("./pages/OutrasNormasLista.tsx"));
const Radares = lazy(routePrefetch.radares);

const Estudar = lazy(routePrefetch.estudos);
const EstudosHub = lazy(() => import("./pages/EstudosHub.tsx"));

const QuestoesArea = lazy(() => import("./pages/QuestoesArea.tsx"));
const FlashcardsArea = lazy(() => import("./pages/FlashcardsArea.tsx"));
const Flashcards = lazy(() => import("./pages/Flashcards.tsx"));
const FlashcardsCargos = lazy(() => import("./pages/FlashcardsCargos.tsx"));
const FlashcardsCargosDetalhes = lazy(() => import("./pages/FlashcardsCargosDetalhes.tsx"));
const FlashcardsEstudo = lazy(() => import("./pages/FlashcardsEstudo.tsx"));
const FlashcardsRevisar = lazy(() => import("./pages/FlashcardsRevisar.tsx"));
const FlashcardsDecks = lazy(() => import("./pages/FlashcardsDecks.tsx"));
const FlashcardsDesafios = lazy(() => import("./pages/FlashcardsDesafios.tsx"));
const FlashcardsDesafiosTimeline = lazy(() => import("./pages/FlashcardsDesafiosTimeline.tsx"));
const FlashcardsTrilhas = lazy(() => import("./pages/FlashcardsTrilhas.tsx"));
const FlashcardsProgresso = lazy(() => import("./pages/FlashcardsProgresso.tsx"));
const FlashcardsHistorico = lazy(() => import("./pages/flashcards/FlashcardsHistorico.tsx"));
const FlashcardsMaterias = lazy(() => import("./pages/flashcards/FlashcardsMaterias.tsx"));
const FlashcardsLeis = lazy(() => import("./pages/flashcards/FlashcardsLeis.tsx"));
const FlashcardsJurisprudencia = lazy(() => import("./pages/flashcards/FlashcardsJurisprudencia.tsx"));
const VideoaulasLeiSeca = lazy(() => import('./pages/VideoaulasLeiSeca'));
const VideoaulasLeiSecaCategoria = lazy(() => import('./pages/VideoaulasLeiSecaCategoria'));
const VideoaulasLeiSecaArtigos = lazy(() => import('./pages/VideoaulasLeiSecaArtigos'));
const Videoaulas = lazy(routePrefetch.videoaulas);
const VideoaulasCanalDetail = lazy(() => import("./pages/VideoaulasCanalDetail.tsx"));
const VideoaulasCatalogo = lazy(routePrefetch.videoaulasCatalogo);
const VideoaulasArea = lazy(routePrefetch.videoaulasArea);
const VideoaulasLista = lazy(routePrefetch.videoaulasLista);
const VideoaulaView = lazy(routePrefetch.videoaulaView);

const JurisprudenciaArtigo = lazy(() => import("./pages/JurisprudenciaArtigo"));
const Jurisprudencia = lazy(() => import("./pages/Jurisprudencia.tsx"));
const PesquisasProntasLista = lazy(() => import("./pages/PesquisasProntasLista.tsx"));
const SumulasVinculantes = lazy(() => import("./pages/SumulasTribunal.tsx").then(m => ({ default: m.SumulasVinculantes })));
const SumulasSTF = lazy(() => import("./pages/SumulasTribunal.tsx").then(m => ({ default: m.SumulasSTF })));
const SumulasSTJ = lazy(() => import("./pages/SumulasTribunal.tsx").then(m => ({ default: m.SumulasSTJ })));
const InformativosSTJ = lazy(() => import("./pages/InformativosTribunal.tsx").then(m => ({ default: m.InformativosSTJ })));
const InformativosSTF = lazy(() => import("./pages/InformativosTribunal.tsx").then(m => ({ default: m.InformativosSTF })));
const TesesSTJ = lazy(() => import("./pages/TesesTribunal.tsx").then(m => ({ default: m.TesesSTJ })));
const TesesSTF = lazy(() => import("./pages/TesesTribunal.tsx").then(m => ({ default: m.TesesSTF })));
const PesquisasProntasTema = lazy(() => import("./pages/PesquisasProntasTema.tsx"));
const AdminQuestoes = lazy(() => import("./pages/AdminQuestoes.tsx"));
const Questoes = lazy(() => import("./pages/Questoes.tsx"));
const QuestoesAreas = lazy(() => import("./pages/QuestoesAreas.tsx"));
const QuestoesPraticar = lazy(() => import("./pages/QuestoesPraticar.tsx"));
const QuestoesSimulado = lazy(() => import("./pages/QuestoesSimulado.tsx"));
const QuestoesSimuladoCargoConfig = lazy(() => import("./pages/QuestoesSimuladoCargoConfig.tsx"));
const QuestoesRevisar = lazy(() => import("./pages/QuestoesRevisar.tsx"));
const QuestoesDesafios = lazy(() => import("./pages/QuestoesDesafios.tsx"));
const QuestoesTrilhas = lazy(() => import("./pages/QuestoesTrilhas.tsx"));
const QuestoesLembretes = lazy(() => import('./pages/QuestoesLembretes'));
const QuestoesCadernos = lazy(() => import("./pages/QuestoesCadernos.tsx"));
const QuestoesConquistas = lazy(() => import("./pages/QuestoesConquistas.tsx"));

const QuestoesDesempenho = lazy(() => import("./pages/QuestoesDesempenho.tsx"));
const ResumosJuridicosAreas = lazy(routePrefetch.resumosJuridicos);
const ResumosJuridicosDesktop = lazy(() => import("./pages/resumos-juridicos/ResumosJuridicosDesktop.tsx"));
const ResumosMaterias = lazy(() => import("./pages/resumos-juridicos/ResumosMaterias.tsx"));
const ResumosLeis = lazy(() => import("./pages/resumos-juridicos/ResumosLeis.tsx"));
const ResumosJurisprudencia = lazy(() => import("./pages/resumos-juridicos/ResumosJurisprudencia.tsx"));
const ResumosJuridicosTemas = lazy(routePrefetch.resumosJuridicosTemas);
const ResumosJuridicosSubtemas = lazy(routePrefetch.resumosJuridicosSubtemas);
const ResumosJuridicosLista = lazy(routePrefetch.resumosJuridicosLista);
const LeiSecaIndex = lazy(routePrefetch.leiSeca);
const LeiSecaTrilha = lazy(routePrefetch.leiSecaTrilha);
const LeiSecaParte = lazy(routePrefetch.leiSecaParte);

// Remonta a página quando o slug/parte muda — evita reaproveitar o render da lei anterior.
function LeiSecaTrilhaRoute() {
  const { slug = "" } = useParams();
  return <LeiSecaTrilha key={slug} />;
}
function LeiSecaParteRoute() {
  const { slug = "", parte = "" } = useParams();
  return <LeiSecaParte key={`${slug}/${parte}`} />;
}

import { ResumosNativePlugin } from "./plugins/ResumosNativePlugin";
import { getResumosCatalog } from "./services/resumosCatalog";

function ResumosJuridicosRouteWrapper({ children }: { children: React.ReactNode }) {
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const { area, tema } = useParams();

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      void (async () => {
        try {
          const catalog = await getResumosCatalog();
          const decodedArea = area ? decodeURIComponent(area) : undefined;
          const decodedTema = tema ? decodeURIComponent(tema) : undefined;

          if (decodedTema && decodedArea) {
            await ResumosNativePlugin.openReader({
              area: decodedArea,
              tema: decodedTema,
              payload: catalog,
            });
          } else if (decodedArea) {
            await ResumosNativePlugin.openResumos({
              initialArea: decodedArea,
              payload: catalog,
            });
          } else {
            await ResumosNativePlugin.openResumos({
              payload: catalog,
            });
          }
        } catch (e) {
          console.warn("ResumosNativePlugin fallback to React:", e);
        }
      })();
    }
  }, [area, tema]);

  if (isDesktop) return <ResumosJuridicosDesktop />;
  return <>{children}</>;
}
const FlashcardsRouteWrapper = lazy(() => import("@/components/flashcards/FlashcardsRouteWrapper"));
const VideoaulasRouteWrapper = lazy(() => import("@/components/videoaulas/VideoaulasRouteWrapper"));
const LeiSecaPlayer = lazy(routePrefetch.leiSecaPlayer);
const LeiSecaLembretes = lazy(routePrefetch.leiSecaLembretes);

const AdminMonitor = lazy(() => import("./pages/AdminMonitor.tsx"));
const Perfil = lazy(() => import("./pages/Perfil.tsx"));
const SobreApp = lazy(() => import("./pages/SobreApp.tsx"));
const Blog = lazy(routePrefetch.blog);
const DesktopLinkConfirm = lazy(() => import("./pages/DesktopLinkConfirm.tsx"));
// Biblioteca — lazy para não inflar o bundle de boot
const Bibliotecas = lazy(() => import("./pages/Bibliotecas.tsx"));
const BibliotecaCategoria = lazy(() => import("./pages/BibliotecaCategoria.tsx"));
const BibliotecaTrilhas = lazy(() => import("./pages/BibliotecaTrilhas.tsx"));

const AdminFuncoesAssinantes = lazy(() => import("./pages/AdminFuncoesAssinantes.tsx"));
const AdminAulasInterativas = lazy(() => import("./pages/AdminAulasInterativas.tsx"));
const AdminNarracaoBiblioteca = lazy(() => import("./pages/AdminNarracaoBiblioteca.tsx"));
const AdminNarracaoBlog = lazy(() => import("./pages/AdminNarracaoBlog.tsx"));
const AdminAssinantes = lazy(() => import("./pages/AdminAssinantes.tsx"));
const AdminUsuarios = lazy(() => import("./pages/AdminUsuarios.tsx"));
const AdminMonitorUsuarios = lazy(() => import("./pages/AdminMonitorUsuarios.tsx"));
const AdminMonitorApis = lazy(() => import("./pages/AdminMonitorApis.tsx"));

const AdminHorus = lazy(() => import('./pages/AdminHorus'));
const HorusWhatsApp = lazy(() => import("./pages/HorusWhatsApp.tsx"));
const AdminBlogEdicao = lazy(() => import("./pages/AdminBlogEdicao.tsx"));
const AdminOmniRouteTeste = lazy(() => import("./pages/AdminOmniRouteTeste.tsx"));
const AdminFlashcardsEditar = lazy(() => import("./pages/AdminFlashcardsEditar.tsx"));
const BibliotecaEditar = lazy(() => import("./pages/BibliotecaEditar.tsx"));
const AdminLeituraNativa = lazy(() => import("./pages/AdminLeituraNativa.tsx"));
const AdminAudioaulas = lazy(() => import("./pages/AdminAudioaulas.tsx"));
const Audioaulas = lazyWithRetry(routePrefetch.audioaulas);
const Audiobooks = lazyWithRetry(routePrefetch.audiobooks);
const Assinatura = lazy(() => import("./pages/Assinatura.tsx"));
const PlanosAtivos = lazy(() => import("./pages/PlanosAtivos.tsx"));
const DesktopPromo = lazy(routePrefetch.desktop);
const NovidadesRadarOverlay = lazy(() => import("./components/NovidadesRadarOverlay"));
const GlobalDesktopHeader = lazy(() => import("./components/layout/GlobalDesktopHeader"));
const DesktopFileDropOverlay = lazy(() => import("./components/desktop/DesktopFileDropOverlay"));
const ModoOffline = lazy(() => import("./pages/ModoOffline.tsx"));
const ModoOfflineLeis = lazy(() => import("./pages/ModoOfflineLeis.tsx"));
const ModoOfflineLivros = lazy(() => import("./pages/ModoOfflineLivros.tsx"));
const ModoOfflineAudioaulas = lazy(() => import("./pages/ModoOfflineAudioaulas.tsx"));
const PilulasHome = lazy(() => import("./pages/pilulas/PilulasHome.tsx"));
const PilulasViewer = lazy(() => import("./pages/pilulas/PilulasViewer.tsx"));
const Pilulas = lazy(() => import("./pages/Pilulas.tsx"));
const PilulasLeiSeca = lazy(() => import("./pages/PilulasLeiSeca.tsx"));
const PilulasPlayer = lazy(() => import("./pages/pilulas/PilulasPlayer.tsx"));

const Privacidade = lazy(() => import("./pages/Privacidade.tsx"));
const Termos = lazy(() => import("./pages/Termos.tsx"));
const Seguranca = lazy(() => import("./pages/Seguranca.tsx"));
const ExcluirConta = lazy(() => import("./pages/ExcluirConta.tsx"));
const ExcluirContaPublico = lazy(() => import("./pages/ExcluirContaPublico.tsx"));
const CentralLembretes = lazy(() => import("./pages/CentralLembretes.tsx"));
const LembretesLocal = lazy(() => import("./pages/LembretesLocal.tsx"));
const Suporte = lazy(() => import("./pages/Suporte.tsx"));
const SuportePublico = lazy(() => import("./pages/SuportePublico.tsx"));
const MinhaCota = lazy(() => import("./pages/MinhaCota.tsx"));
const AssistenteApp = lazy(() => import("./pages/AssistenteApp.tsx"));
const AssistenteHorus = lazy(() => import("./pages/AssistenteHorus.tsx"));



function ProtectedRoute({ children, requireOnboarding = true }: { children: React.ReactNode; requireOnboarding?: boolean }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Leitura síncrona do cache — não bloqueia o paint.
  const cacheKey = user ? `onboarding_completed:${user.id}` : null;
  const cachedDone = cacheKey && typeof window !== 'undefined'
    ? localStorage.getItem(cacheKey) === '1'
    : false;

  // Otimista pós-cadastro: se acabou de criar conta nesta sessão, já assume
  // que precisa passar pela triagem — evita query desnecessária de 1.2s+
  // enquanto o Supabase ainda não criou o perfil.
  const justSignedUp =
    typeof window !== 'undefined' && window.sessionStorage.getItem('just_signed_up') === '1';

  const [needsOnboarding, setNeedsOnboarding] = useState(justSignedUp);
  // Se justSignedUp, já sabemos que precisa de triagem — não travar a tela
  // esperando a query do perfil que ainda nem existe.
  const [initialCheckDone, setInitialCheckDone] = useState(
    () => !user || cachedDone || justSignedUp || (typeof navigator !== 'undefined' && navigator.onLine === false),
  );

  useEffect(() => {
    let cancelled = false;
    if (!user) {
      setInitialCheckDone(true);
      setNeedsOnboarding(false);
      return;
    }

    if (cachedDone) {
      setInitialCheckDone(true);
      setNeedsOnboarding(false);
      try { window.sessionStorage.removeItem('just_signed_up'); } catch {}
      return;
    }

    // Acabou de criar conta — não precisa consultar o Supabase para saber
    // se a triagem foi feita (ainda nem existe o perfil). Libera a tela
    // imediatamente e deixa o Onboarding resolver o resto.
    if (justSignedUp && user) {
      setInitialCheckDone(true);
      setNeedsOnboarding(true);
      return;
    }

    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      setInitialCheckDone(true);
      return;
    }

    setInitialCheckDone(false);
    (async () => {
      try {
        let done = false;
        if (cacheKey) {
          try {
            const { get } = await import('idb-keyval');
            const val = await get(cacheKey);
            if (val === '1' || val === true) done = true;
          } catch {}
        }
        
        if (done) {
          if (!cancelled) {
            setNeedsOnboarding(false);
            setInitialCheckDone(true);
            try { localStorage.setItem(cacheKey, '1'); } catch {}
          }
          return;
        }

        // Perfil pode estar sendo criado pelo trigger (e-mail, Google, Apple).
        // Tenta algumas vezes antes de decidir, para não liberar o app por engano.
        let ok = false;
        for (let i = 0; i < 2; i++) {
          const { data, error } = await supabase
            .from('profiles')
            .select('onboarding_completed_at')
            .eq('id', user.id)
            .maybeSingle();
          if (cancelled) return;
          if (error) break;
          ok = true;
          if (data) {
            done = !!data.onboarding_completed_at;
            break;
          }
          await new Promise((r) => setTimeout(r, 200));
        }
        if (cancelled) return;
        if (ok) {
          setNeedsOnboarding(!done);
          if (done && cacheKey) {
            try {
              localStorage.setItem(cacheKey, '1');
              import('idb-keyval').then(({ set }) => set(cacheKey, '1')).catch(() => {});
              window.dispatchEvent(new Event('onboarding_checked'));
            } catch {}
            try { window.sessionStorage.removeItem('just_signed_up'); } catch {}
          }
        }
      } catch {}
      if (!cancelled) setInitialCheckDone(true);
    })();

    return () => { cancelled = true; };
  }, [user, cacheKey, cachedDone, justSignedUp]);

  if (loading) {
    // Sem tela preta com spinner: só um frame vazio enquanto o retorno de
    // OAuth é processado (caso raro).
    return null;
  }


  if (!user) {
    if (location.pathname === '/') {
      return <Navigate to="/landing" replace />;
    }
    return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
  }

  // Se a rota exige triagem concluída e o usuário ainda não possui confirmação em cache nem checagem finalizada,
  // exibe um container escuro mínimo temporário para não vazar a interface restrita antes da validação (Item 21).
  if (requireOnboarding && !cachedDone && !initialCheckDone && location.pathname !== '/onboarding') {
    return <div className="min-h-dvh bg-[#0d0f12]" />;
  }

  // Redireciona para /onboarding se a triagem está pendente, MAS apenas quando
  // NÃO estamos já em /onboarding (senão o <Onboarding /> nunca renderizaria
  // porque o Navigate vem antes do return children).
  if (requireOnboarding && needsOnboarding && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}

// Preload critical chunks in idle time
if (typeof window !== 'undefined') {
  const preloadChunks = () => {
    import('./pages/Assinatura.tsx');
    import('./pages/CategoriaLegislacao.tsx');
    routePrefetch.estudos();
    routePrefetch.ferramentas();
    routePrefetch.radar360();
    routePrefetch.blog();
    routePrefetch.noticias();
    routePrefetch.questoes();
    import('@/pages/pilulas/PilulasLista');
    routePrefetch.leiSeca();
    routePrefetch.leiSecaTrilha();
    routePrefetch.leiSecaParte();
    routePrefetch.leiSecaPlayer();
  };
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(preloadChunks, { timeout: 1000 });
  } else {
    setTimeout(preloadChunks, 400);
  }
}

function EstudosRouter() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const hasStudyParams = ['mode', 'view', 'room', 'tabela', 'artigo'].some(k => params.has(k));
  return hasStudyParams ? <Estudar /> : <EstudosHub />;
}

function LazyFallback() {
  const location = useLocation();
  const path = location.pathname.toLowerCase();
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Item 16: Evita "piscar" um skeleton se o chunk carregar quase instantaneamente (cache/prefetch).
    const t = setTimeout(() => setShow(true), 120);
    return () => clearTimeout(t);
  }, []);

  if (!show) {
    // Retorna fundo vazio (idêntico ao do app) nos primeiros 120ms.
    // Isso cria a sensação de navegação 100% instantânea sem flashing.
    return <div className="min-h-dvh bg-transparent" aria-hidden="true" />;
  }

  // Skeleton contextual para Leis, Artigos e Vade Mecum (Item 43)
  if (path.includes('/vade-mecum') || path.includes('/legislacao') || path.includes('/codigos')) {
    return (
      <div className="min-h-dvh bg-[#0D0D0D] p-4 pt-16 space-y-6 max-w-4xl mx-auto" aria-busy="true">
        <div className="space-y-2">
          <div className="h-7 w-56 rounded-lg bg-white/[0.06] animate-pulse" />
          <div className="h-4 w-80 rounded bg-white/[0.04] animate-pulse" />
        </div>
        <div className="space-y-4 mt-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.04] space-y-3 animate-pulse">
              <div className="h-5 w-28 rounded bg-primary/20" />
              <div className="space-y-2">
                <div className="h-3.5 w-full rounded bg-white/[0.05]" />
                <div className="h-3.5 w-[90%] rounded bg-white/[0.04]" />
                <div className="h-3.5 w-[75%] rounded bg-white/[0.03]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Skeleton contextual para Questões e Simulados (Item 43)
  if (path.includes('/questoes')) {
    return (
      <div className="min-h-dvh bg-[#0D0D0D] p-4 pt-16 space-y-6 max-w-3xl mx-auto" aria-busy="true">
        <div className="h-6 w-40 rounded bg-white/[0.06] animate-pulse" />
        <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.04] space-y-4 animate-pulse">
          <div className="h-4 w-full rounded bg-white/[0.05]" />
          <div className="h-4 w-4/5 rounded bg-white/[0.04]" />
          <div className="space-y-2.5 pt-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 rounded-xl bg-white/[0.02] border border-white/[0.03]" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Skeleton contextual para Aulas e Videoaulas (Item 43)
  if (path.includes('/aulas') || path.includes('/videoaulas')) {
    return (
      <div className="min-h-dvh bg-[#0D0D0D] p-4 pt-16 space-y-5 max-w-5xl mx-auto" aria-busy="true">
        <div className="h-8 w-60 rounded bg-white/[0.06] animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-44 rounded-2xl bg-white/[0.03] border border-white/[0.04] p-4 space-y-3 animate-pulse">
              <div className="h-24 rounded-xl bg-white/[0.04]" />
              <div className="h-4 w-3/4 rounded bg-white/[0.05]" />
              <div className="h-3 w-1/2 rounded bg-white/[0.03]" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Fallback padrão balanceado
  return (
    <div
      className="min-h-dvh bg-[#0D0D0D] p-4 pt-16 space-y-4 max-w-4xl mx-auto"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="h-8 w-48 rounded-md bg-white/[0.06] animate-pulse" />
      <div className="h-4 w-64 rounded bg-white/[0.04] animate-pulse" />
      <div className="space-y-3 mt-6">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-20 rounded-xl bg-white/[0.03] border border-white/[0.04] animate-pulse"
          />
        ))}
      </div>
    </div>
  );
}

function PresenceWrapperInner({ user }: { user: any }) {
  usePresenceTracker();
  useHorusStatsSync();
  useSessionTracker();
  useDesktopSessionGuard(!!user);
  return <AtivarNotificacoesGate />;
}

function PresenceWrapper() {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    // Item 15: Adia a inicialização de trackers pesados via requestIdleCallback
    const ric = (window as any).requestIdleCallback as ((cb: () => void, opts?: { timeout?: number }) => number) | undefined;
    if (ric) {
      const id = ric(() => setMounted(true), { timeout: 2000 });
      return () => (window as any).cancelIdleCallback?.(id);
    }
    const t = setTimeout(() => setMounted(true), 1500);
    return () => clearTimeout(t);
  }, []);

  if (!mounted) return null;
  return <PresenceWrapperInner user={user} />;
}

function NativeBootstrap() {
  useNativePermissions();
  useEffect(() => {
    // Adia tudo para após o primeiro paint — não compete pela primeira renderização.
    const run = () => {
      import("@/lib/webPush").then((m) => m.trackPushLandingIfAny()).catch(() => {});
      import("@/services/noticiasService").then((m) => m.prefetchNoticias()).catch(() => {});
      import("@/services/syncQueue").then((m) => m.startSyncQueueWorker()).catch(() => {});
      import("@/services/jurisprudenciaWarmup").then((m) => m.warmupJurisprudencia()).catch(() => {});
      import('@capgo/capacitor-updater').then((m) => m.CapacitorUpdater.notifyAppReady()).catch(() => {});
      
      // Inicializa o Native Core (Kotlin/Swift) para tarefas nativas
      import('@/lib/NativeCore').then((m) => {
        m.NativeCore.initialize({ message: "App started from React!" })
          .then(res => console.log("[NativeCore] Initialize success:", res))
          .catch(err => console.warn("[NativeCore] Native bridge not available:", err));
      }).catch(() => {});

      import("@/lib/backgroundRunner").then(async (m) => {
        try {
          await m.ensureBackgroundPermissions();
          m.runPrefetchNow();
        } catch {}
      });
    };
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      const id = (window as any).requestIdleCallback(run, { timeout: 3000 });
      return () => { try { (window as any).cancelIdleCallback?.(id); } catch {} };
    }
    const t = setTimeout(run, 1500);
    return () => clearTimeout(t);
  }, []);

  return null;
}

function PushNavListener() {
  const navigate = useNavigate();
  usePushJourneyTracker();
  useEffect(() => {
    // Consome URL pendente caso o push tenha disparado antes do componente montar (Cold Start)
    if (typeof window !== 'undefined' && (window as any)._pendingPushUrl) {
      const pending = (window as any)._pendingPushUrl;
      (window as any)._pendingPushUrl = undefined;
      // setTimeout pequeno para não colidir com o render inicial do react-router
      setTimeout(() => navigate(pending), 10);
    }

    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { path?: string } | undefined;
      if (detail?.path) navigate(detail.path);
      (window as any)._pendingPushUrl = undefined;
    };
    // Atalhos do ícone do app (long-press / Quick Actions)
    const atalhoHandler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { rota?: string } | undefined;
      if (detail?.rota) navigate(detail.rota);
    };
    window.addEventListener('direitoprime:push-navigate', handler as EventListener);
    window.addEventListener('app:atalho', atalhoHandler as EventListener);
    return () => {
      window.removeEventListener('direitoprime:push-navigate', handler as EventListener);
      window.removeEventListener('app:atalho', atalhoHandler as EventListener);
    };
  }, [navigate]);
  return null;
}


function DeepLinkBootstrap() {
  const navigate = useNavigate();
  useEffect(() => {
    import('@/lib/nativeDeepLinks').then((m) => m.initDeepLinkRouter(navigate));
    import('@/lib/nativeSharedIntent').then((m) => m.initSharedIntentListener(navigate));
    return () => {
      import('@/lib/nativeDeepLinks').then((m) => m.disposeDeepLinkRouter());
    };
  }, [navigate]);
  return null;
}

function GlobalTrialGate() {
  return (
    <>
      <TrialCountdownBar />
      <TrialExpiredGate />
    </>
  );
}

function LegacyGlobalTrialGateDisabled() {
  // Conforme diretriz do usuário: quem não for assinante ou tiver os 3 dias encerrados
  // tem acesso ao aplicativo, com travas e cotas gratuitas mensais (ex: 10 por mês)
  // aplicadas pontualmente dentro de cada recurso, sem modal de bloqueio global de tela.
  return null;
}

function HomeGate() {
  const { user, loading: authLoading } = useAuth();
  if (authLoading) {
    // Sem tela preta com spinner: retorna null para que a tela nativa de splash ou fundo cubra isso.
    return null;
  }
  if (!user) return <Landing />;
  // O PersistentHome já renderiza a Home para usuários logados.
  // Retornamos null aqui para evitar duplicação do Index no DOM.
  return null;
}

function AnimatedRoutes() {
  const location = useLocation();
  const { user, loading: authLoading, signOut } = useAuth();
  const { data: profile } = useProfileSummary();
  const qc = useQueryClient();



  // Safety: ensure body scroll/touch locks left over from bottom sheets or
  // overlays are always cleared when navigating to a new route. Without this a stale
  // `overflow:hidden` + `touchAction:none` on <body> can make the screen appear "frozen".
  useEffect(() => {
    return () => {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
      document.documentElement.style.overflow = '';
    };
  }, [location.pathname]);

  // Screen tracking unificado (page_view + screen_view + scroll + screen_exit).
  useScreenTracking();

  // Interceptador global do botão físico/gestual de voltar do Android (Capacitor)
  useHardwareBackButton();

  // GA4: pageview em cada route change (mantido para compatibilidade).
  useEffect(() => {
    trackPageview(location.pathname + location.search);
    markRouteChange(location.pathname + location.search);
    prefetchNearby(location.pathname);
  }, [location.pathname, location.search, location.hash]);

  // Hidrata o cache das Videoaulas (IndexedDB → memória) logo no boot, em idle:
  // ao entrar na área, a lista já pinta sem skeleton nem rede.
  useEffect(() => {
    if (!user) return;
    void import('@/lib/videoaulasStore').then((m) => {
      m.hydrateVideoaulasCache();
      m.warmVideoaulasCache();
    });
    // Favoritos/recentes (biblioteca, leis, resumos, dicionário) da conta.
    void Promise.all([
      import('@/lib/leisFavoritos'),
      import('@/lib/bibliotecaTracking'),
      import('@/lib/resumosLocal'),
      import('@/hooks/useDicionarioPrefs'),
      import('@/lib/flashcardsQueries').then((m) => m.prefetchFlashcardsDashboard(qc)),
      // import('@/hooks/useQuestoes').then((m) => m.prefetchQuestoesCache()),
    ]).then(() => import('@/lib/userSync').then((m) => m.pullAllUserSync(true)));


    // Pré-carrega os chunks das telas de Videoaulas em idle: navegar
    // (e voltar) passa a resolver do cache de módulos, sem Suspense visível.
    const carregarChunks = () => {
      ([
        'videoaulas', 'videoaulasCatalogo', 'videoaulasArea', 'videoaulaView',
        'videoaulasLista', 'resumosJuridicos', 'resumosJuridicosTemas',
        'resumosJuridicosSubtemas', 'resumosJuridicosLista', 'audioaulas',
        'dicionario', 'biblioteca', 'bibliotecaCategoria', 'blog',
      ] as PrefetchKey[]).forEach((k) => prefetchRoute(k));
    };
    const ric = (window as any).requestIdleCallback as ((cb: () => void, o?: { timeout?: number }) => number) | undefined;
    if (ric) ric(carregarChunks, { timeout: 3000 }); else setTimeout(carregarChunks, 1200);
  }, [user]);


  // GA4/Meta: vincular user_id e propriedades quando autentica / desloga.
  useEffect(() => {
    setAnalyticsUserWithProfile(user?.id ?? null, {
      email: user?.email,
      is_premium: profile?.isPremium ?? false,
    });
  }, [user?.id, user?.email, profile?.isPremium]);

  // Sem usuário logado, a Home persistente não monta.
  // Renderiza a landing imediatamente na raiz para nunca deixar tela preta,
  // mesmo enquanto a autenticação ainda está resolvendo.




  return (
    <div className="overflow-x-hidden">
      <ScrollRestorationWatcher />
      <NativeBootstrap />
      <PushNavListener />
      <DeepLinkBootstrap />
      {user && <PresenceWrapper />}
      {user && <NovidadesRadarOverlay />}
      <GlobalDesktopHeader />
      <DesktopFileDropOverlay />
      <PersistentHome />
      <GlobalTrialGate />
      <Suspense fallback={<LazyFallback />}>
        <Routes>
            <Route path="/auth" element={<PageTransition><Auth /></PageTransition>} />
            <Route path="/landing" element={<PageTransition><Landing /></PageTransition>} />

            <Route path="/ir/*" element={<SmartLink />} />
              <Route path="/admin/assinantes" element={<AdminAssinantes />} />
              <Route path="/admin/usuarios" element={<Navigate to="/admin-usuarios" replace />} />
              <Route path="/admin/monitor/usuarios" element={<Navigate to="/admin-monitor-usuarios" replace />} />
            <Route path="/privacidade" element={<PageTransition><Privacidade /></PageTransition>} />
            <Route path="/termos" element={<PageTransition><Termos /></PageTransition>} />
            <Route path="/excluir-conta" element={<PageTransition><ExcluirContaPublico /></PageTransition>} />
            <Route path="/suporte-publico" element={<PageTransition><SuportePublico /></PageTransition>} />

            <Route path="/reset-password" element={<PageTransition><ResetPassword /></PageTransition>} />
            <Route path="/desktop-link/:token" element={<PageTransition><DesktopLinkConfirm /></PageTransition>} />
            <Route path="/onboarding" element={<ProtectedRoute><PageTransition><Onboarding /></PageTransition></ProtectedRoute>} />
            <Route path="/" element={<ProtectedRoute><HomeGate /></ProtectedRoute>} />

          <Route path="/legislacao/:tipo" element={<ProtectedRoute><PageTransition><CategoriaLegislacao /></PageTransition></ProtectedRoute>} />
          <Route path="/legislacao/:tipo/:leiSlug" element={<ProtectedRoute><PageTransition><CategoriaLegislacao /></PageTransition></ProtectedRoute>} />
          <Route path="/legislacao/:tipo/:leiSlug/:artigoNumero" element={<ProtectedRoute><PageTransition><CategoriaLegislacao /></PageTransition></ProtectedRoute>} />
          <Route path="/noticias" element={<ProtectedRoute><PageTransition><Noticias /></PageTransition></ProtectedRoute>} />
          <Route path="/concursos" element={<ProtectedRoute><PageTransition><Concursos /></PageTransition></ProtectedRoute>} />
          <Route path="/radar-concursos" element={<ProtectedRoute><PageTransition><RadarConcursos /></PageTransition></ProtectedRoute>} />
          <Route path="/concursos/radar" element={<Navigate to="/radar-concursos" replace />} />
          <Route path="/ferramentas/radar-concursos" element={<Navigate to="/radar-concursos" replace />} />
          <Route path="/radar-concursos/estatisticas" element={<ProtectedRoute><PageTransition><RadarEstatisticas /></PageTransition></ProtectedRoute>} />
          <Route path="/atualizacoes" element={<ProtectedRoute><PageTransition instant><Atualizacoes /></PageTransition></ProtectedRoute>} />
          <Route path="/boletins" element={<ProtectedRoute><PageTransition instant><Boletins /></PageTransition></ProtectedRoute>} />
          <Route path="/boletim" element={<Navigate to="/boletins" replace />} />
          <Route path="/novidades" element={<ProtectedRoute><PageTransition><Novidades /></PageTransition></ProtectedRoute>} />
          <Route path="/anotacoes" element={<Navigate to="/pessoal/anotacoes" replace />} />
          <Route path="/configuracoes" element={<ProtectedRoute><PageTransition><Configuracoes /></PageTransition></ProtectedRoute>} />
          <Route path="/lembretes" element={<ProtectedRoute><PageTransition><CentralLembretes /></PageTransition></ProtectedRoute>} />
          <Route path="/lembretes/local" element={<ProtectedRoute><PageTransition><LembretesLocal /></PageTransition></ProtectedRoute>} />
          <Route path="/ajustes/seguranca" element={<ProtectedRoute><PageTransition><Seguranca /></PageTransition></ProtectedRoute>} />
          <Route path="/ajustes/excluir-conta" element={<ProtectedRoute><PageTransition><ExcluirConta /></PageTransition></ProtectedRoute>} />
          <Route path="/radar/proposicoes" element={<ProtectedRoute><PageTransition><RadarProposicoes /></PageTransition></ProtectedRoute>} />
          <Route path="/radar/proposicoes/:date" element={<ProtectedRoute><PageTransition><RadarProposicoesDia /></PageTransition></ProtectedRoute>} />
          <Route path="/radar/categorias" element={<Navigate to="/radar-360" replace />} />
          <Route path="/radar/em-alta" element={<Navigate to="/radar-360" replace />} />
          <Route path="/legislacao-estadual" element={<ProtectedRoute><PageTransition><LegislacaoEstadual /></PageTransition></ProtectedRoute>} />
          <Route path="/legislacao-estadual/:uf" element={<ProtectedRoute><PageTransition><EstadoDetalhe /></PageTransition></ProtectedRoute>} />
          <Route path="/legislacao-estadual/:uf/lei/:slug" element={<ProtectedRoute><PageTransition><LeiEstadualView /></PageTransition></ProtectedRoute>} />
          <Route path="/explicacao-lei" element={<ProtectedRoute><PageTransition><ExplicacaoLei /></PageTransition></ProtectedRoute>} />

          <Route path="/ferramentas" element={<ProtectedRoute><PageTransition instant><Ferramentas /></PageTransition></ProtectedRoute>} />
          <Route path="/documentos" element={<ProtectedRoute><PageTransition><Documentos /></PageTransition></ProtectedRoute>} />
          <Route path="/ferramentas/dicionario" element={<ProtectedRoute><PageTransition instant><DicionarioJuridicoPage /></PageTransition></ProtectedRoute>} />
          <Route path="/simulados/provas" element={<Navigate to="/simulados" replace />} />
          <Route path="/simulados/estatisticas" element={<ProtectedRoute><PageTransition><SimuladosEstatisticas /></PageTransition></ProtectedRoute>} />
          <Route path="/simulados/resolver/:id" element={<ProtectedRoute><PageTransition><SimuladosResolver /></PageTransition></ProtectedRoute>} />
          <Route path="/ferramentas/plano-estudos" element={<ProtectedRoute><PageTransition><PlanoEstudos /></PageTransition></ProtectedRoute>} />
          <Route path="/pilulas" element={<ProtectedRoute><PageTransition instant><PilulasHome /></PageTransition></ProtectedRoute>} />
          <Route path="/pilulas/lista" element={<ProtectedRoute><PageTransition instant><PilulasLista /></PageTransition></ProtectedRoute>} />
          <Route path="/pilulas/deck/:deckId" element={<ProtectedRoute><PageTransition instant><PilulasViewer /></PageTransition></ProtectedRoute>} />
          <Route path="/radar-360" element={<ProtectedRoute><PageTransition instant><Radar360 /></PageTransition></ProtectedRoute>} />
          <Route path="/normas/:slug" element={<ProtectedRoute><PageTransition><OutrasNormasLista /></PageTransition></ProtectedRoute>} />
          <Route path="/radares" element={<ProtectedRoute><PageTransition instant><Radares /></PageTransition></ProtectedRoute>} />


          <Route path="/compartilhado" element={<ProtectedRoute><PageTransition><Compartilhado /></PageTransition></ProtectedRoute>} />
          <Route path="/estudos" element={<ProtectedRoute><PageTransition><EstudosRouter /></PageTransition></ProtectedRoute>} />
          <Route path="/vade-mecum" element={<ProtectedRoute><PageTransition instant><VadeMecum /></PageTransition></ProtectedRoute>} />
          <Route path="/vade-mecum/areas" element={<Navigate to="/vade-mecum" replace />} />
          <Route path="/vade-mecum/categorias" element={<Navigate to="/vade-mecum" replace />} />
          <Route path="/vade-mecum/codigos" element={<ProtectedRoute><PageTransition instant><VadeMecumCodigos /></PageTransition></ProtectedRoute>} />
          <Route path="/vade-mecum/estatutos" element={<ProtectedRoute><PageTransition instant><VadeMecumEstatutos /></PageTransition></ProtectedRoute>} />
          <Route path="/vade-mecum/especiais" element={<ProtectedRoute><PageTransition instant><VadeMecumEspeciais /></PageTransition></ProtectedRoute>} />
          <Route path="/vade-mecum/sumulas" element={<ProtectedRoute><PageTransition instant><VadeMecumSumulas /></PageTransition></ProtectedRoute>} />
          <Route path="/vade-mecum/favoritos" element={<Navigate to="/vade-mecum" replace />} />
          <Route path="/vade-mecum/recentes" element={<ProtectedRoute><PageTransition instant><VadeMecumRecentes /></PageTransition></ProtectedRoute>} />
          
          <Route path="/questoes/area/:slug" element={<ProtectedRoute><PageTransition instant><QuestoesArea /></PageTransition></ProtectedRoute>} />
          <Route path="/flashcards/area/:slug" element={<ProtectedRoute><PageTransition instant><FlashcardsArea /></PageTransition></ProtectedRoute>} />

          <Route path="/flashcards" element={<ProtectedRoute><FlashcardsRouteWrapper><PageTransition instant><Flashcards /></PageTransition></FlashcardsRouteWrapper></ProtectedRoute>} />
          <Route path="/flashcards/estudar" element={<Navigate to="/flashcards/estudo" replace />} />
          <Route path="/flashcards/trilhas" element={<ProtectedRoute><PageTransition instant><FlashcardsTrilhas /></PageTransition></ProtectedRoute>} />
          <Route path="/flashcards/cargos" element={<ProtectedRoute><PageTransition instant><FlashcardsCargos /></PageTransition></ProtectedRoute>} />
          <Route path="/flashcards/cargos/:id" element={<ProtectedRoute><PageTransition instant><FlashcardsCargosDetalhes /></PageTransition></ProtectedRoute>} />
          <Route path="/flashcards/revisar" element={<ProtectedRoute><PageTransition instant><FlashcardsRevisar /></PageTransition></ProtectedRoute>} />
          <Route path="/flashcards/progresso" element={<ProtectedRoute><PageTransition instant><FlashcardsProgresso /></PageTransition></ProtectedRoute>} />
          <Route path="/flashcards/historico" element={<ProtectedRoute><PageTransition instant><FlashcardsHistorico /></PageTransition></ProtectedRoute>} />
          <Route path="/flashcards/desafios" element={<ProtectedRoute><PageTransition instant><FlashcardsDesafios /></PageTransition></ProtectedRoute>} />
          <Route path="/flashcards/desafios/:slug" element={<ProtectedRoute><PageTransition instant><FlashcardsDesafiosTimeline /></PageTransition></ProtectedRoute>} />
          <Route path="/flashcards/estudo" element={<ProtectedRoute><PageTransition instant><FlashcardsEstudo /></PageTransition></ProtectedRoute>} />
          <Route path="/flashcards/decks" element={<ProtectedRoute><PageTransition instant><FlashcardsDecks /></PageTransition></ProtectedRoute>} />
          <Route path="/flashcards/materias" element={<ProtectedRoute><PageTransition instant><FlashcardsMaterias /></PageTransition></ProtectedRoute>} />
          <Route path="/flashcards/leis" element={<ProtectedRoute><PageTransition instant><FlashcardsLeis /></PageTransition></ProtectedRoute>} />
          <Route path="/flashcards/jurisprudencia" element={<Suspense fallback={<div className="min-h-dvh bg-background" />}><FlashcardsJurisprudencia /></Suspense>} />
          <Route path="/videoaulas" element={<Navigate to="/videoaulas/painel" replace />} />
          <Route path="/videoaulas/painel" element={<ProtectedRoute><VideoaulasRouteWrapper><PageTransition instant><Videoaulas /></PageTransition></VideoaulasRouteWrapper></ProtectedRoute>} />
          <Route path="/videoaulas/favoritos" element={<ProtectedRoute><PageTransition instant><VideoaulasLista modo="favoritos" /></PageTransition></ProtectedRoute>} />
          
          <Route path="/videoaulas/lei-seca" element={<ProtectedRoute><PageTransition instant><VideoaulasLeiSeca /></PageTransition></ProtectedRoute>} />
          <Route path="/videoaulas/lei-seca/categoria/:categoriaId" element={<ProtectedRoute><PageTransition instant><VideoaulasLeiSecaCategoria /></PageTransition></ProtectedRoute>} />
          <Route path="/videoaulas/lei-seca/lei/:leiId" element={<ProtectedRoute><PageTransition instant><VideoaulasLeiSecaArtigos /></PageTransition></ProtectedRoute>} />
          <Route path="/videoaulas/jurisprudencia" element={<Navigate to="/jurisprudencia" replace />} />
          <Route path="/videoaulas/estatutos" element={<Navigate to="/videoaulas/lei-seca/categoria/estatutos" replace />} />
          
          <Route path="/videoaulas/canal/:id" element={<ProtectedRoute><PageTransition instant><VideoaulasCanalDetail /></PageTransition></ProtectedRoute>} />
          <Route path="/videoaulas/concurso/:id" element={<Navigate to="/videoaulas" replace />} />
          
          <Route path="/videoaulas/:catalogo" element={<ProtectedRoute><PageTransition instant><VideoaulasCatalogo /></PageTransition></ProtectedRoute>} />
          <Route path="/videoaulas/:catalogo/:area" element={<ProtectedRoute><PageTransition instant><VideoaulasArea /></PageTransition></ProtectedRoute>} />
          <Route path="/videoaulas/:catalogo/:area/:videoId" element={<ProtectedRoute><VideoaulaView /></ProtectedRoute>} />
          <Route path="/jurisprudencia/:slugLei/:numeroArtigo" element={<ProtectedRoute><PageTransition><JurisprudenciaArtigo /></PageTransition></ProtectedRoute>} />
          <Route path="/jurisprudencia/prontas/:tribunal" element={<ProtectedRoute><PageTransition><PesquisasProntasLista /></PageTransition></ProtectedRoute>} />
          <Route path="/jurisprudencia/prontas/:tribunal/:slug" element={<ProtectedRoute><PageTransition><PesquisasProntasTema /></PageTransition></ProtectedRoute>} />
          <Route path="/jurisprudencia/sumulas-vinculantes" element={<ProtectedRoute><PageTransition><SumulasVinculantes /></PageTransition></ProtectedRoute>} />
          <Route path="/jurisprudencia/sumulas-stf" element={<ProtectedRoute><PageTransition><SumulasSTF /></PageTransition></ProtectedRoute>} />
          <Route path="/jurisprudencia/sumulas-stj" element={<ProtectedRoute><PageTransition><SumulasSTJ /></PageTransition></ProtectedRoute>} />
         <Route path="/jurisprudencia/informativos-stj" element={<ProtectedRoute><PageTransition><InformativosSTJ /></PageTransition></ProtectedRoute>} />
         <Route path="/jurisprudencia/informativos-stf" element={<ProtectedRoute><PageTransition><InformativosSTF /></PageTransition></ProtectedRoute>} />
        <Route path="/jurisprudencia/teses-stj" element={<ProtectedRoute><PageTransition><TesesSTJ /></PageTransition></ProtectedRoute>} />
        <Route path="/jurisprudencia/teses-stf" element={<ProtectedRoute><PageTransition><TesesSTF /></PageTransition></ProtectedRoute>} />
          <Route path="/jurisprudencia" element={<ProtectedRoute><PageTransition instant><Jurisprudencia /></PageTransition></ProtectedRoute>} />
          <Route path="/aulas" element={<ProtectedRoute><PageTransition instant><AdminAulasInterativas /></PageTransition></ProtectedRoute>} />
          <Route path="/aprender" element={<Navigate to="/aulas" replace />} />
          <Route path="/aprender/*" element={<Navigate to="/aulas" replace />} />
          {/* Pílulas */}
          <Route path="/pilulas/classicos" element={<ProtectedRoute><PageTransition><Pilulas /></PageTransition></ProtectedRoute>} />
          <Route path="/pilulas/cp" element={<ProtectedRoute><PageTransition><PilulasLeiSeca slug="cp" /></PageTransition></ProtectedRoute>} />
          <Route path="/pilulas/cf" element={<ProtectedRoute><PageTransition instant><PilulasLeiSeca slug="cf" /></PageTransition></ProtectedRoute>} />
          <Route path="/pilulas/cc" element={<ProtectedRoute><PageTransition instant><PilulasLeiSeca slug="cc" /></PageTransition></ProtectedRoute>} />
          <Route path="/pilulas/cpp" element={<ProtectedRoute><PageTransition instant><PilulasLeiSeca slug="cpp" /></PageTransition></ProtectedRoute>} />
          <Route path="/pilulas/clt" element={<ProtectedRoute><PageTransition instant><PilulasLeiSeca slug="clt" /></PageTransition></ProtectedRoute>} />
          <Route path="/pilulas/:id" element={<ProtectedRoute><PageTransition instant><PilulasPlayer /></PageTransition></ProtectedRoute>} />
          {/* Lei Seca */}
          <Route path="/lei-seca" element={<ErrorBoundary><ProtectedRoute><PageTransition instant><LeiSecaIndex /></PageTransition></ProtectedRoute></ErrorBoundary>} />
          <Route path="/lei-seca/favoritos" element={<ErrorBoundary><ProtectedRoute><PageTransition instant><LeiSecaIndex modo="favoritos" /></PageTransition></ProtectedRoute></ErrorBoundary>} />
          <Route path="/lei-seca/recentes" element={<ErrorBoundary><ProtectedRoute><PageTransition instant><LeiSecaIndex modo="recentes" /></PageTransition></ProtectedRoute></ErrorBoundary>} />
          <Route path="/lei-seca/lembretes" element={<ErrorBoundary><ProtectedRoute><PageTransition instant><LeiSecaLembretes /></PageTransition></ProtectedRoute></ErrorBoundary>} />
          <Route path="/lei-seca/:slug" element={<ErrorBoundary><ProtectedRoute><PageTransition instant><LeiSecaTrilhaRoute /></PageTransition></ProtectedRoute></ErrorBoundary>} />
          <Route path="/lei-seca/:slug/:parte" element={<ErrorBoundary><ProtectedRoute><PageTransition instant><LeiSecaParteRoute /></PageTransition></ProtectedRoute></ErrorBoundary>} />
          <Route path="/lei-seca/:slug/:parte/licao/:id" element={<ErrorBoundary><ProtectedRoute><PageTransition instant><LeiSecaPlayer /></PageTransition></ProtectedRoute></ErrorBoundary>} />
          <Route path="/resumos" element={<Navigate to="/resumos-juridicos" replace />} />

          <Route path="/resumos-juridicos" element={<ProtectedRoute><ResumosJuridicosRouteWrapper><PageTransition instant><ResumosJuridicosAreas /></PageTransition></ResumosJuridicosRouteWrapper></ProtectedRoute>} />
          <Route path="/resumos-juridicos/materias" element={<ProtectedRoute><PageTransition instant><ResumosMaterias /></PageTransition></ProtectedRoute>} />
          <Route path="/resumos-juridicos/leis" element={<ProtectedRoute><PageTransition instant><ResumosLeis /></PageTransition></ProtectedRoute>} />
          <Route path="/resumos-juridicos/jurisprudencia" element={<ProtectedRoute><PageTransition instant><ResumosJurisprudencia /></PageTransition></ProtectedRoute>} />
          <Route path="/resumos-juridicos/favoritos" element={<ProtectedRoute><PageTransition instant><ResumosJuridicosLista modo="favoritos" /></PageTransition></ProtectedRoute>} />
          <Route path="/resumos-juridicos/recentes" element={<ProtectedRoute><PageTransition instant><ResumosJuridicosLista modo="recentes" /></PageTransition></ProtectedRoute>} />
          <Route path="/resumos-juridicos/jurisprudencia/:categoria" element={<ProtectedRoute><PageTransition instant><ResumosJuridicosJurisprudencia /></PageTransition></ProtectedRoute>} />
          <Route path="/resumos-juridicos/:area" element={<ProtectedRoute><ResumosJuridicosRouteWrapper><PageTransition instant><ResumosJuridicosTemas /></PageTransition></ResumosJuridicosRouteWrapper></ProtectedRoute>} />
          <Route path="/resumos-juridicos/:area/:tema" element={<ProtectedRoute><ResumosJuridicosRouteWrapper><PageTransition instant><ResumosJuridicosSubtemas /></PageTransition></ResumosJuridicosRouteWrapper></ProtectedRoute>} />
          <Route path="/questoes" element={<ProtectedRoute><PageTransition instant><Questoes /></PageTransition></ProtectedRoute>} />
          <Route path="/simulados" element={<ProtectedRoute><PageTransition instant><Simulados /></PageTransition></ProtectedRoute>} />
          <Route path="/questoes/areas" element={<ProtectedRoute><PageTransition instant><QuestoesAreas /></PageTransition></ProtectedRoute>} />
          <Route path="/questoes/praticar" element={<ProtectedRoute><PageTransition instant><QuestoesPraticar /></PageTransition></ProtectedRoute>} />
          <Route path="/questoes/simulado" element={<ProtectedRoute><PageTransition instant><QuestoesSimulado /></PageTransition></ProtectedRoute>} />
          <Route path="/questoes/simulado/:cargoId" element={<ProtectedRoute><PageTransition instant><QuestoesSimuladoCargoConfig /></PageTransition></ProtectedRoute>} />
          <Route path="/questoes/desafios" element={<ProtectedRoute><PageTransition instant><QuestoesDesafios /></PageTransition></ProtectedRoute>} />
          <Route path="/questoes/revisar" element={<ProtectedRoute><PageTransition instant><QuestoesRevisar /></PageTransition></ProtectedRoute>} />
          <Route path="/questoes/lembretes" element={<ProtectedRoute><PageTransition instant><QuestoesLembretes /></PageTransition></ProtectedRoute>} />
          <Route path="/questoes/trilhas" element={<ProtectedRoute><PageTransition instant><QuestoesTrilhas /></PageTransition></ProtectedRoute>} />
          <Route path="/questoes/cadernos" element={<ProtectedRoute><PageTransition instant><QuestoesCadernos /></PageTransition></ProtectedRoute>} />
          <Route path="/questoes/desafios" element={<ProtectedRoute><PageTransition instant><QuestoesDesafios /></PageTransition></ProtectedRoute>} />
          <Route path="/questoes/desafios/conquistas" element={<ProtectedRoute><PageTransition instant><QuestoesConquistas /></PageTransition></ProtectedRoute>} />

          <Route path="/questoes/desempenho" element={<ProtectedRoute><PageTransition instant><QuestoesDesempenho /></PageTransition></ProtectedRoute>} />
          <Route path="/questoes/historico" element={<ProtectedRoute><PageTransition instant><QuestoesHistorico /></PageTransition></ProtectedRoute>} />
          <Route path="/admin-questoes" element={<ProtectedRoute><PageTransition><AdminQuestoes /></PageTransition></ProtectedRoute>} />
          <Route path="/admin-simulados" element={<ProtectedRoute><PageTransition><AdminSimulados /></PageTransition></ProtectedRoute>} />
          <Route path="/admin/pilulas" element={<ProtectedRoute><PageTransition><AdminPilulas /></PageTransition></ProtectedRoute>} />

          <Route path="/admin-monitor" element={<ProtectedRoute><PageTransition><AdminMonitor /></PageTransition></ProtectedRoute>} />
          <Route path="/perfil" element={<ProtectedRoute><PageTransition instant><Perfil /></PageTransition></ProtectedRoute>} />
          <Route path="/sobre" element={<ProtectedRoute><PageTransition><SobreApp /></PageTransition></ProtectedRoute>} />
          <Route path="/blog" element={<ProtectedRoute><PageTransition instant><Blog /></PageTransition></ProtectedRoute>} />
          <Route path="/biblioteca" element={<ProtectedRoute><PageTransition instant><Bibliotecas /></PageTransition></ProtectedRoute>} />
          <Route path="/bibliotecas" element={<ProtectedRoute><PageTransition instant><Bibliotecas /></PageTransition></ProtectedRoute>} />
          <Route path="/biblioteca/caderno" element={<Navigate to="/pessoal/grifos" replace />} />
          <Route path="/bibliotecas/trilhas" element={<ProtectedRoute><PageTransition instant><BibliotecaTrilhas /></PageTransition></ProtectedRoute>} />
          <Route path="/bibliotecas/:colecaoId" element={<ProtectedRoute><PageTransition instant><BibliotecaCategoria /></PageTransition></ProtectedRoute>} />
          <Route path="/bibliotecas/:colecaoId/:areaSlug" element={<ProtectedRoute><PageTransition instant><BibliotecaCategoria /></PageTransition></ProtectedRoute>} />
          <Route path="/biblioteca-offline" element={<Navigate to="/modo-offline/livros" replace />} />

          <Route path="/admin-funcoes" element={<ProtectedRoute><PageTransition><AdminFuncoes /></PageTransition></ProtectedRoute>} />
          <Route path="/admin-instagram-posts" element={<Navigate to="/admin-funcoes" replace />} />
          <Route path="/admin-aulas-interativas" element={<ProtectedRoute><PageTransition><AdminAulasInterativas /></PageTransition></ProtectedRoute>} />
          <Route path="/admin-funcoes-assinantes" element={<ProtectedRoute><PageTransition><AdminFuncoesAssinantes /></PageTransition></ProtectedRoute>} />
          <Route path="/admin-vade-mecum-historico" element={<ProtectedRoute><PageTransition><AdminVadeMecumHistorico /></PageTransition></ProtectedRoute>} />
          <Route path="/admin-mapeamento-leis" element={<ProtectedRoute><PageTransition><AdminMapeamentoLeis /></PageTransition></ProtectedRoute>} />
          <Route path="/admin-narracao-leis" element={<ProtectedRoute><PageTransition><AdminNarracaoLeis /></PageTransition></ProtectedRoute>} />
          <Route path="/admin-narracao" element={<Navigate to="/admin-narracao-leis" replace />} />
          <Route path="/admin-narracao/biblioteca" element={<ProtectedRoute><PageTransition><AdminNarracaoBiblioteca /></PageTransition></ProtectedRoute>} />
          <Route path="/admin-narracao/blog" element={<ProtectedRoute><PageTransition><AdminNarracaoBlog /></PageTransition></ProtectedRoute>} />
          <Route path="/admin-assinantes" element={<ProtectedRoute><PageTransition><AdminAssinantes /></PageTransition></ProtectedRoute>} />
          <Route path="/admin-usuarios" element={<ProtectedRoute><PageTransition><AdminUsuarios /></PageTransition></ProtectedRoute>} />
          <Route path="/admin-monitor-usuarios" element={<ProtectedRoute><PageTransition><AdminMonitorUsuarios /></PageTransition></ProtectedRoute>} />
          <Route path="/admin-monitor-apis" element={<ProtectedRoute><PageTransition><AdminMonitorApis /></PageTransition></ProtectedRoute>} />
          <Route path="/assinatura" element={<ProtectedRoute><PageTransition instant><Assinatura /></PageTransition></ProtectedRoute>} />
          <Route path="/suporte" element={<ProtectedRoute><PageTransition><Suporte /></PageTransition></ProtectedRoute>} />
          <Route path="/minha-cota" element={<ProtectedRoute><PageTransition><MinhaCota /></PageTransition></ProtectedRoute>} />
          <Route path="/planos/ativos" element={<ProtectedRoute><PageTransition><PlanosAtivos /></PageTransition></ProtectedRoute>} />
          <Route path="/admin-push" element={<ProtectedRoute><PageTransition><AdminPush /></PageTransition></ProtectedRoute>} />


          <Route path="/admin-horus" element={<ProtectedRoute><PageTransition><AdminHorus /></PageTransition></ProtectedRoute>} />
          <Route path="/admin-erros-questoes" element={<ProtectedRoute><PageTransition><AdminErrosQuestoes /></PageTransition></ProtectedRoute>} />

          <Route path="/ajustes/horus" element={<ProtectedRoute><PageTransition><HorusWhatsApp /></PageTransition></ProtectedRoute>} />
          <Route path="/admin-blog-edicao" element={<ProtectedRoute><PageTransition><AdminBlogEdicao /></PageTransition></ProtectedRoute>} />
          <Route path="/admin-omniroute" element={<ProtectedRoute><PageTransition><AdminOmniRouteTeste /></PageTransition></ProtectedRoute>} />
          <Route path="/admin-flashcards-editar" element={<ProtectedRoute><PageTransition><AdminFlashcardsEditar /></PageTransition></ProtectedRoute>} />
          <Route path="/admin-design-imagens" element={<Navigate to="/admin-blog-edicao" replace />} />
          <Route path="/admin-biblioteca-editar" element={<ProtectedRoute><PageTransition><BibliotecaEditar /></PageTransition></ProtectedRoute>} />
          <Route path="/admin-leitura-nativa" element={<ProtectedRoute><PageTransition><AdminLeituraNativa /></PageTransition></ProtectedRoute>} />
          <Route path="/admin-audioaulas" element={<ProtectedRoute><PageTransition><AdminAudioaulas /></PageTransition></ProtectedRoute>} />
          <Route path="/audioaulas" element={<ProtectedRoute><PageTransition instant><Audioaulas /></PageTransition></ProtectedRoute>} />
          <Route path="/audioaulas/:area" element={<ProtectedRoute><PageTransition instant><Audioaulas /></PageTransition></ProtectedRoute>} />
          <Route path="/meus-downloads" element={<Navigate to="/modo-offline" replace />} />
          <Route path="/minhas-leituras" element={<Navigate to="/pessoal/livros" replace />} />
          <Route path="/meus-resumos" element={<Navigate to="/resumos-juridicos" replace />} />
          <Route path="/minhas-videoaulas" element={<Navigate to="/videoaulas/painel" replace />} />

          <Route path="/me-explique" element={<ProtectedRoute><PageTransition instant><MeExplique /></PageTransition></ProtectedRoute>} />
          <Route path="/chat-juridico" element={<ProtectedRoute><PageTransition instant><ChatJuridico /></PageTransition></ProtectedRoute>} />
          <Route path="/ferramentas/plano-estudos" element={<ProtectedRoute><PageTransition><PlanoEstudos /></PageTransition></ProtectedRoute>} />
          <Route path="/audiobooks" element={<ProtectedRoute><PageTransition><Audiobooks /></PageTransition></ProtectedRoute>} />
          <Route path="/audioleis" element={<Navigate to="/audiobooks" replace />} />
          <Route path="/audio-leis" element={<Navigate to="/audiobooks" replace />} />
          <Route path="/admin-biblioteca-leis" element={<Navigate to="/admin-mapeamento-leis" replace />} />
          <Route path="/admin-biblioteca-leis/*" element={<Navigate to="/admin-mapeamento-leis" replace />} />


          <Route path="/desktop" element={<PageTransition><DesktopPromo /></PageTransition>} />
          <Route path="/modo-offline" element={<ProtectedRoute><PageTransition><ModoOffline /></PageTransition></ProtectedRoute>} />
          <Route path="/modo-offline/leis-e-narracoes" element={<ProtectedRoute><PageTransition><ModoOfflineLeis /></PageTransition></ProtectedRoute>} />
          <Route path="/modo-offline/livros" element={<ProtectedRoute><PageTransition><ModoOfflineLivros /></PageTransition></ProtectedRoute>} />
          <Route path="/modo-offline/audioaulas" element={<ProtectedRoute><PageTransition><ModoOfflineAudioaulas /></PageTransition></ProtectedRoute>} />
          <Route path="/assistente" element={<ProtectedRoute><PageTransition instant><AssistenteApp /></PageTransition></ProtectedRoute>} />
          <Route path="/assistente-horus" element={<ProtectedRoute><PageTransition instant><AssistenteHorus /></PageTransition></ProtectedRoute>} />

          <Route path="/pessoal/grifos" element={<ProtectedRoute><PageTransition><PessoalGrifos /></PageTransition></ProtectedRoute>} />
          <Route path="/pessoal/artigos" element={<ProtectedRoute><PageTransition><PessoalArtigos /></PageTransition></ProtectedRoute>} />
          <Route path="/pessoal/leis" element={<ProtectedRoute><PageTransition><PessoalLeis /></PageTransition></ProtectedRoute>} />
          <Route path="/pessoal/anotacoes" element={<ProtectedRoute><PageTransition><PessoalAnotacoes /></PageTransition></ProtectedRoute>} />
          <Route path="/pessoal/livros" element={<ProtectedRoute><PageTransition><PessoalLivros /></PageTransition></ProtectedRoute>} />
          <Route path="/pessoal/jurisprudencias" element={<ProtectedRoute><PageTransition><PessoalJurisprudencias /></PageTransition></ProtectedRoute>} />
          <Route path="/meu-espaco" element={<ProtectedRoute><PageTransition instant><MeuEspaco /></PageTransition></ProtectedRoute>} />
          <Route path="/graficos/avaliacao" element={<ProtectedRoute><PageTransition><AvaliacaoInteligente /></PageTransition></ProtectedRoute>} />
          <Route path="/notificacoes" element={<Navigate to="/?notificacoes=1" replace />} />
          <Route path="/meus-lembretes" element={<Navigate to="/?notificacoes=1" replace />} />
          <Route path="/mapas-mentais" element={<ProtectedRoute><PageTransition instant><VisualJuridico /></PageTransition></ProtectedRoute>} />
          <Route path="/mapas-mentais/*" element={<ProtectedRoute><PageTransition instant><VisualJuridico /></PageTransition></ProtectedRoute>} />
          <Route path="/mapas" element={<Navigate to="/mapas-mentais" replace />} />
          <Route path="/visuais" element={<Navigate to="/mapas-mentais" replace />} />
          <Route path="/visuais/*" element={<Navigate to="/mapas-mentais" replace />} />
          <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />

          </Routes>
      </Suspense>
  </div>
  );
}

// Importação do AppBootSplash
export default AnimatedRoutes;
