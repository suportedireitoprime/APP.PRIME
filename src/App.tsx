import { Suspense, useEffect } from "react";
import { lazyWithRetry } from "@/utils/lazyWithRetry";
import { AnimatePresence } from "framer-motion";
import { initAnalytics, trackPageview, setAnalyticsUserWithProfile } from "@/lib/analytics";
import { useScreenTracking } from "@/lib/screenTracking";
import { initNavTelemetry, markRouteChange } from "@/lib/navTelemetry";
import { prefetchNearby } from "@/lib/nearbyPrefetch";

// IntroOverlay desativado: o app agora usa apenas o splash nativo estático.
// import IntroOverlay from "@/components/IntroOverlay";
import { SkipToContent } from "@/components/a11y/SkipToContent";
import AnalyticsDebugPanel from "@/components/AnalyticsDebugPanel";
import { Capacitor } from '@capacitor/core';




// Boot GA4 diferido — não compete com o parse/render inicial.
if (typeof window !== "undefined") {
  const bootAnalytics = () => {
    initAnalytics();
    initNavTelemetry();
    import("@/lib/enableMouseDragScroll").then((m) => m.enableMouseDragScroll());
    import("@/lib/appMetrics").then((m) => m.startAppMetrics());
  };
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(bootAnalytics, { timeout: 1500 });
  } else {
    setTimeout(bootAnalytics, 300);
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
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { routePrefetch, prefetchRoute } from "@/lib/routePrefetch";
import { Toaster as Sonner } from "@/components/ui/sonner";
import OfflineStatusBadge from "@/components/OfflineStatusBadge";
import OfflineWatcher from "@/components/OfflineWatcher";
import BackToTop from "@/components/ui/back-to-top";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { HorusAvaliacaoOverlay } from "./components/vademecum/HorusAvaliacaoOverlay";
import { usePresenceTracker } from "@/hooks/usePresenceTracker";
import { useNativePermissions } from "@/hooks/useNativePermissions";
import AtivarNotificacoesGate from "@/components/notificacoes/AtivarNotificacoesGate";
import { usePushJourneyTracker } from "@/hooks/usePushJourneyTracker";
import { ThemeProvider } from "@/hooks/useTheme";
import { useHorusStatsSync } from "@/hooks/useHorusStatsSync";
import { useSessionTracker } from "@/hooks/useSessionTracker";
import { useDesktopSessionGuard } from "@/hooks/useDesktopSessionGuard";
import { useProfileSummary } from "@/hooks/useProfileSummary";
import brasaoImgAsset from '@/assets/brasao-republica.webp';
const brasaoImg = brasaoImgAsset;
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { RecordingProvider } from "@/contexts/RecordingContext";
import { AudioaulasPlayerProvider } from "@/contexts/AudioaulasPlayerContext";
import { ResumoLivroPlayerProvider } from "./contexts/ResumoLivroPlayerContext.tsx";
import { VideoaulasPlayerProvider } from "@/contexts/VideoaulasPlayerContext";
import { LazyMediaPlayers } from "./components/layout/LazyMediaPlayers.tsx";
import { GeofencePresenceBanner } from "@/components/GeofencePresenceBanner";
import { ReminderInAppBanner } from "@/components/ReminderInAppBanner";
import InAppPushPopup from "@/components/ui/InAppPushPopup";
import HorusTakeoverNoticeDialog from "@/components/horus/HorusTakeoverNoticeDialog";

// Eagerly loaded (critical path)
import Index from "./pages/Index.tsx";
import PersistentHome from "./components/PersistentHome";

// Lazy loaded (moved from critical path to reduce bundle size & startup jank)
const Auth = lazyWithRetry(() => import("./pages/Auth.tsx"));
const Landing = lazyWithRetry(() => import("./pages/Landing.tsx"));
const SmartLink = lazyWithRetry(() => import("./pages/SmartLink.tsx"));
const ResetPassword = lazyWithRetry(() => import("./pages/ResetPassword.tsx"));
const Onboarding = lazyWithRetry(() => import("./pages/Onboarding.tsx"));
const QuestoesHistorico = lazyWithRetry(() => import('./pages/QuestoesHistorico'));
const AdminFuncoes = lazyWithRetry(() => import("./pages/AdminFuncoes.tsx"));
const AdminPush = lazyWithRetry(() => import("./pages/AdminPush.tsx"));
const AdminPushSection = lazyWithRetry(() => import("./pages/AdminPushSection.tsx"));
const AdminResumoLivroAudioEditar = lazyWithRetry(() => import("./pages/AdminResumoLivroAudioEditar.tsx"));
const AdminErrosQuestoes = lazyWithRetry(() => import("./pages/AdminErrosQuestoes.tsx"));
const AdminVadeMecumHistorico = lazyWithRetry(() => import('./pages/AdminVadeMecumHistorico.tsx'));

import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

// Lazy loaded
const CategoriaLegislacao = lazyWithRetry(() => import("./pages/CategoriaLegislacao.tsx"));
const ResumosJuridicosJurisprudencia = lazyWithRetry(() => import("./pages/resumos-juridicos/ResumosJuridicosJurisprudencia.tsx"));
const Noticias = lazyWithRetry(routePrefetch.noticias);
const Novidades = lazyWithRetry(() => import("./pages/Novidades.tsx"));
const Anotacoes = lazyWithRetry(() => import("./pages/Anotacoes.tsx"));
const PessoalAvisos = lazyWithRetry(() => import("./pages/pessoal/Avisos.tsx"));
const PessoalGrifos = lazyWithRetry(() => import("./pages/pessoal/Grifos.tsx"));
const PessoalArtigos = lazyWithRetry(() => import("./pages/pessoal/Artigos.tsx"));
const PessoalLeis = lazyWithRetry(() => import("./pages/pessoal/Leis.tsx"));
const PessoalAnotacoes = lazyWithRetry(() => import("./pages/pessoal/Anotacoes.tsx"));
const PessoalLivros = lazyWithRetry(() => import("./pages/pessoal/Livros.tsx"));
const PessoalFilmes = lazyWithRetry(() => import("./pages/pessoal/Filmes.tsx"));
const PessoalJurisprudencias = lazyWithRetry(() => import("./pages/pessoal/Jurisprudencias.tsx"));
const PessoalTematicas = lazyWithRetry(() => import("./pages/pessoal/Tematicas.tsx"));
const MeuEspaco = lazyWithRetry(() => import("./pages/MeuEspaco.tsx"));

const MeusDownloads = lazyWithRetry(() => import("./pages/MeusDownloads.tsx"));
const MinhasLeituras = lazyWithRetry(() => import("./pages/MinhasLeituras.tsx"));
const MeusResumos = lazyWithRetry(() => import("./pages/MeusResumos.tsx"));
const MinhasVideoaulas = lazyWithRetry(() => import("./pages/MinhasVideoaulas.tsx"));


const MeExplique = lazyWithRetry(() => import("./pages/MeExplique.tsx"));
const NotFound = lazyWithRetry(() => import("./pages/NotFound.tsx"));
const Configuracoes = lazyWithRetry(() => import("./pages/Configuracoes.tsx"));
const RadarDeputados = lazyWithRetry(() => import("./pages/RadarDeputados.tsx"));
const RadarVotacoes = lazyWithRetry(() => import("./pages/RadarVotacoes.tsx"));
const RadarRankings = lazyWithRetry(() => import("./pages/RadarRankings.tsx"));
const RadarProposicoes = lazyWithRetry(() => import("./pages/RadarProposicoes.tsx"));
const RadarCategorias = lazyWithRetry(() => import("./pages/RadarCategorias.tsx"));
const RadarEmAlta = lazyWithRetry(() => import("./pages/RadarEmAlta.tsx"));
const RadarDeputadoDetalhe = lazyWithRetry(() => import("./pages/RadarDeputadoDetalhe.tsx"));
const LegislacaoEstadual = lazyWithRetry(() => import("./pages/LegislacaoEstadual.tsx"));
const EstadoDetalhe = lazyWithRetry(() => import("./pages/EstadoDetalhe.tsx"));
const LeiEstadualView = lazyWithRetry(() => import("./pages/LeiEstadualView.tsx"));
const ExplicacaoLei = lazyWithRetry(() => import("./pages/ExplicacaoLei.tsx"));
const RadarPLDetalhe = lazyWithRetry(() => import("./pages/RadarPLDetalhe.tsx"));
const NarracaoLei = lazyWithRetry(() => import("./pages/NarracaoLei.tsx"));
const VisualJuridico = lazyWithRetry(() => import("./pages/VisualJuridico.tsx"));
const GrafoArtigos = lazyWithRetry(() => import("./pages/GrafoArtigos.tsx"));
const Ferramentas = lazyWithRetry(routePrefetch.ferramentas);
const LocaisJuridicos = lazyWithRetry(() => import("./pages/LocaisJuridicos.tsx"));
const DicionarioJuridicoPage = lazyWithRetry(routePrefetch.dicionario);
const PeticaoInicial = lazyWithRetry(() => import("./pages/PeticaoInicial.tsx"));
const PeticaoInicialEditor = lazyWithRetry(() => import("./pages/PeticaoInicialEditor.tsx"));
const AdminLocais = lazyWithRetry(() => import("./pages/AdminLocais.tsx"));
const AdminEstatisticasAssinatura = lazyWithRetry(() => import("./pages/AdminEstatisticasAssinatura.tsx"));
const TematicaJuridica = lazyWithRetry(routePrefetch.tematica);
const Compartilhado = lazyWithRetry(() => import("./pages/Compartilhado.tsx"));
const Radar360 = lazyWithRetry(routePrefetch.radar360);
const OutrasNormasLista = lazyWithRetry(() => import("./pages/OutrasNormasLista.tsx"));
const Radares = lazyWithRetry(routePrefetch.radares);
const Praticar = lazyWithRetry(routePrefetch.praticar);
const PraticarArea = lazyWithRetry(() => import("./pages/PraticarArea.tsx"));
const PraticarLei = lazyWithRetry(() => import("./pages/PraticarLei.tsx"));
const PraticarSessao = lazyWithRetry(() => import("./pages/PraticarSessao.tsx"));
const Estudar = lazyWithRetry(routePrefetch.estudos);
const EstudosHub = lazyWithRetry(() => import("./pages/EstudosHub.tsx"));
const Aprender = lazyWithRetry(routePrefetch.aprender);
const VadeMecum = lazyWithRetry(() => import("./pages/VadeMecum.tsx"));
const VadeMecumCodigos = lazyWithRetry(() => import("./pages/VadeMecumCodigos.tsx"));
const VadeMecumSumulas = lazyWithRetry(() => import("./pages/VadeMecumSumulas.tsx"));
const VadeMecumFavoritos = lazyWithRetry(() => import("./pages/VadeMecumFavoritos.tsx"));
const VadeMecumRecentes = lazyWithRetry(() => import("./pages/VadeMecumRecentes.tsx"));

const ArtigoEducacional = lazyWithRetry(() => import("./pages/ArtigoEducacional.tsx"));
const ForcaPage = lazyWithRetry(() => import("./pages/gamificacao/Forca.tsx"));
const CategoriaAprender = lazyWithRetry(() => import("./pages/CategoriaAprender.tsx"));
const AprenderArea = lazyWithRetry(() => import("./pages/AprenderArea.tsx"));
const AprenderTeoria = lazyWithRetry(() => import("./pages/AprenderTeoria.tsx"));
const AprenderTrilhas = lazyWithRetry(() => import("./pages/AprenderTrilhas.tsx"));
const AprenderQuestoes = lazyWithRetry(() => import("./pages/AprenderQuestoes.tsx"));
const AprenderFlashcards = lazyWithRetry(() => import("./pages/AprenderFlashcards.tsx"));
const Flashcards = lazyWithRetry(() => import("./pages/Flashcards.tsx"));
const FlashcardsCargos = lazyWithRetry(() => import("./pages/FlashcardsCargos.tsx"));
const FlashcardsCargosDetalhes = lazyWithRetry(() => import("./pages/FlashcardsCargosDetalhes.tsx"));
const FlashcardsEstudo = lazyWithRetry(() => import("./pages/FlashcardsEstudo.tsx"));
const FlashcardsRevisar = lazyWithRetry(() => import("./pages/FlashcardsRevisar.tsx"));
const FlashcardsCornell = lazyWithRetry(() => import("./pages/FlashcardsCornell.tsx"));
const FlashcardsDecks = lazyWithRetry(() => import("./pages/FlashcardsDecks.tsx"));
const FlashcardsPersonalizado = lazyWithRetry(() => import("./pages/flashcards/FlashcardsPersonalizado.tsx"));
const FlashcardsDesafios = lazyWithRetry(() => import("./pages/FlashcardsDesafios.tsx"));
const FlashcardsTrilhas = lazyWithRetry(() => import("./pages/FlashcardsTrilhas.tsx"));
const FlashcardsProgresso = lazyWithRetry(() => import("./pages/FlashcardsProgresso.tsx"));
const FlashcardsHistorico = lazyWithRetry(() => import("./pages/flashcards/FlashcardsHistorico.tsx"));
const FlashcardsMaterias = lazyWithRetry(() => import("./pages/flashcards/FlashcardsMaterias.tsx"));
const FlashcardsLeis = lazyWithRetry(() => import("./pages/flashcards/FlashcardsLeis.tsx"));
const FlashcardsJurisprudencia = lazyWithRetry(() => import("./pages/flashcards/FlashcardsJurisprudencia.tsx"));
const FlashcardsTermos = lazyWithRetry(() => import("./pages/flashcards/FlashcardsTermos.tsx"));
const FlashcardsFilosofos = lazyWithRetry(() => import("./pages/flashcards/FlashcardsFilosofos.tsx"));
const FlashcardsJuristas = lazyWithRetry(() => import("./pages/flashcards/FlashcardsJuristas.tsx"));
const FlashcardsPrazos = lazyWithRetry(() => import("./pages/flashcards/FlashcardsPrazos.tsx"));
const FlashcardsExcecoes = lazyWithRetry(() => import("./pages/flashcards/FlashcardsExcecoes.tsx"));
const FlashcardsClassificacoes = lazyWithRetry(() => import("./pages/flashcards/FlashcardsClassificacoes.tsx"));
const Videoaulas = lazyWithRetry(routePrefetch.videoaulas);
const VideoaulasCategorias = lazyWithRetry(routePrefetch.videoaulasCategorias);
const VideoaulasCatalogo = lazyWithRetry(routePrefetch.videoaulasCatalogo);
const VideoaulasArea = lazyWithRetry(routePrefetch.videoaulasArea);
const VideoaulasPraticar = lazyWithRetry(() => import('@/pages/VideoaulasPraticar'));
const VideoaulasAnotacoes = lazyWithRetry(() => import('@/pages/VideoaulasAnotacoes'));
const VideoaulasConquistas = lazyWithRetry(routePrefetch.videoaulasConquistas);
const VideoaulaView = lazyWithRetry(routePrefetch.videoaulaView);
const VideoaulasLista = lazyWithRetry(routePrefetch.videoaulasLista);

// Novas rotas da Faculdade e Documentos
const FaculdadeLousa = lazyWithRetry(() => import("./pages/faculdade/FaculdadeLousa.tsx"));
const FaculdadeLembretes = lazyWithRetry(() => import("./pages/faculdade/FaculdadeLembretes.tsx"));
const FaculdadeResumos = lazyWithRetry(() => import("./pages/faculdade/FaculdadeResumos.tsx"));
const DocumentosPage = lazyWithRetry(() => import("./pages/Documentos.tsx"));
const VideoaulasTrilhas = lazyWithRetry(routePrefetch.videoaulasTrilhas);
const VideoaulasCatalogoTrilha = lazyWithRetry(routePrefetch.videoaulasCatalogoTrilha);

const VideoaulasConcurso = lazyWithRetry(() => import("./pages/VideoaulasConcurso.tsx"));
const AprenderDesempenho = lazyWithRetry(() => import("./pages/AprenderDesempenho.tsx"));
const AprenderAula = lazyWithRetry(() => import("./pages/AprenderAula.tsx"));
const AprenderModulo = lazyWithRetry(routePrefetch.aprenderModulo);
const JurisprudenciaArtigo = lazyWithRetry(() => import("./pages/JurisprudenciaArtigo.tsx"));
const Jurisprudencia = lazyWithRetry(() => import("./pages/Jurisprudencia.tsx"));
const PesquisasProntasLista = lazyWithRetry(() => import("./pages/PesquisasProntasLista.tsx"));
const SumulasVinculantes = lazyWithRetry(() => import("./pages/SumulasTribunal.tsx").then(m => ({ default: m.SumulasVinculantes })));
const SumulasSTF = lazyWithRetry(() => import("./pages/SumulasTribunal.tsx").then(m => ({ default: m.SumulasSTF })));
const SumulasSTJ = lazyWithRetry(() => import("./pages/SumulasTribunal.tsx").then(m => ({ default: m.SumulasSTJ })));
const InformativosSTJ = lazyWithRetry(() => import("./pages/InformativosTribunal.tsx").then(m => ({ default: m.InformativosSTJ })));
const InformativosSTF = lazyWithRetry(() => import("./pages/InformativosTribunal.tsx").then(m => ({ default: m.InformativosSTF })));
const TesesSTJ = lazyWithRetry(() => import("./pages/TesesTribunal.tsx").then(m => ({ default: m.TesesSTJ })));
const TesesSTF = lazyWithRetry(() => import("./pages/TesesTribunal.tsx").then(m => ({ default: m.TesesSTF })));
const PesquisasProntasTema = lazyWithRetry(() => import("./pages/PesquisasProntasTema.tsx"));
const AdminPesquisasProntas = lazyWithRetry(() => import("./pages/AdminPesquisasProntas.tsx"));
const AdminQuestoes = lazyWithRetry(() => import("./pages/AdminQuestoes.tsx"));
const Questoes = lazyWithRetry(() => import("./pages/Questoes.tsx"));
const QuestoesAreas = lazyWithRetry(() => import("./pages/QuestoesAreas.tsx"));
const QuestoesPraticar = lazyWithRetry(() => import("./pages/QuestoesPraticar.tsx"));
const QuestoesSimulado = lazyWithRetry(() => import("./pages/QuestoesSimulado.tsx"));
const QuestoesSimuladoCargoConfig = lazyWithRetry(() => import("./pages/QuestoesSimuladoCargoConfig.tsx"));
const QuestoesRevisar = lazyWithRetry(() => import("./pages/QuestoesRevisar.tsx"));
const QuestoesDesafios = lazyWithRetry(() => import("./pages/QuestoesDesafios.tsx"));
const QuestoesTrilhas = lazyWithRetry(() => import("./pages/QuestoesTrilhas.tsx"));
const QuestoesLembretes = lazyWithRetry(() => import('./pages/QuestoesLembretes'));
const QuestoesCadernos = lazyWithRetry(() => import("./pages/QuestoesCadernos.tsx"));
const QuestoesConquistas = lazyWithRetry(() => import("./pages/QuestoesConquistas.tsx"));

const QuestoesDesempenho = lazyWithRetry(() => import("./pages/QuestoesDesempenho.tsx"));

const ResumosJuridicosAreas = lazyWithRetry(routePrefetch.resumosJuridicos);
const ResumosJuridicosTemas = lazyWithRetry(routePrefetch.resumosJuridicosTemas);
const ResumosJuridicosSubtemas = lazyWithRetry(routePrefetch.resumosJuridicosSubtemas);
const ResumosJuridicosLista = lazyWithRetry(routePrefetch.resumosJuridicosLista);
const LeiSecaIndex = lazyWithRetry(routePrefetch.leiSeca);
const LeiSecaTrilha = lazyWithRetry(routePrefetch.leiSecaTrilha);
const LeiSecaParte = lazyWithRetry(routePrefetch.leiSecaParte);
// Remonta a página quando o slug/parte muda — evita reaproveitar o render da lei anterior.
function LeiSecaTrilhaRoute() {
  const { slug = "" } = useParams();
  return <LeiSecaTrilha key={slug} />;
}
function LeiSecaParteRoute() {
  const { slug = "", parte = "" } = useParams();
  return <LeiSecaParte key={`${slug}/${parte}`} />;
}
const LeiSecaPlayer = lazyWithRetry(routePrefetch.leiSecaPlayer);
const LeiSecaLembretes = lazyWithRetry(routePrefetch.leiSecaLembretes);

const AdminMonitor = lazyWithRetry(() => import("./pages/AdminMonitor.tsx"));
const AdminAvaliacoesLoja = lazyWithRetry(() => import("./pages/AdminAvaliacoesLoja.tsx"));
const Perfil = lazyWithRetry(() => import("./pages/Perfil.tsx"));
const Atualizacoes = lazyWithRetry(() => import("./pages/Atualizacoes.tsx"));
const SobreApp = lazyWithRetry(() => import("./pages/SobreApp.tsx"));
const GeradorPost = lazyWithRetry(() => import("./pages/GeradorPost.tsx"));
const Blog = lazyWithRetry(routePrefetch.blog);
const Newsletter = lazyWithRetry(() => import("./pages/Newsletter.tsx"));
const DesktopLinkConfirm = lazyWithRetry(() => import("./pages/DesktopLinkConfirm.tsx"));
// Biblioteca — lazy (eram eager, adicionando ~82KB desnecessários ao boot)
const Bibliotecas = lazyWithRetry(() => import("./pages/Bibliotecas.tsx"));
const BibliotecaCategoria = lazyWithRetry(() => import("./pages/BibliotecaCategoria.tsx"));
const BibliotecaOffline = lazyWithRetry(() => import("./pages/BibliotecaOffline.tsx"));
const BibliotecaTrilhas = lazyWithRetry(() => import("./pages/BibliotecaTrilhas.tsx"));

const CompressaoImagens = lazyWithRetry(() => import("./pages/CompressaoImagens.tsx"));
const AdminFuncoesAssinantes = lazyWithRetry(() => import("./pages/AdminFuncoesAssinantes.tsx"));
const AdminVadeMecum = lazyWithRetry(() => import("./pages/AdminVadeMecum.tsx"));
const AdminLembretes = lazyWithRetry(() => import("./pages/AdminLembretes.tsx"));
const AdminLembretesBiblioteca = lazyWithRetry(() => import("./pages/AdminLembretesBiblioteca.tsx"));
const AdminNarracaoConteudo = lazyWithRetry(() => import("./pages/AdminNarracaoConteudo.tsx"));
const AdminNarracaoBiblioteca = lazyWithRetry(() => import("./pages/AdminNarracaoBiblioteca.tsx"));
const AdminNarracaoBlog = lazyWithRetry(() => import("./pages/AdminNarracaoBlog.tsx"));
const AdminNarracaoApresentacao = lazyWithRetry(() => import("./pages/AdminNarracaoApresentacao.tsx"));
const ApresentacaoPlayer = lazyWithRetry(() => import("./pages/ApresentacaoPlayer.tsx"));
const Apresentacoes = lazyWithRetry(() => import("./pages/Apresentacoes.tsx"));
const AdminApresentacaoEditar = lazyWithRetry(() => import("./pages/AdminApresentacaoEditar.tsx"));
const AdminAssinantes = lazyWithRetry(() => import("./pages/AdminAssinantes.tsx"));
const TestePush = lazyWithRetry(() => import("./pages/TestePush.tsx"));
const AdminMonitorUsuarios = lazyWithRetry(() => import("./pages/AdminMonitorUsuarios.tsx"));
const AdminMonitoramento = lazyWithRetry(() => import("./pages/AdminMonitoramento.tsx"));
const AdminMonitorApis = lazyWithRetry(() => import("./pages/AdminMonitorApis.tsx"));
const AdminAtualizacao = lazyWithRetry(() => import("./pages/AdminAtualizacao.tsx"));
const AdminNativeAssets = lazyWithRetry(() => import("./pages/AdminNativeAssets.tsx"));
const AdminAprender = lazyWithRetry(() => import("./pages/AdminAprender.tsx"));
const AdminLaboratorio = lazyWithRetry(() => import("./pages/AdminLaboratorio.tsx"));
const AdminAprenderArea = lazyWithRetry(() => import("./pages/AdminAprenderArea.tsx"));
const AdminJurisprudencia = lazyWithRetry(() => import("./pages/AdminJurisprudencia.tsx"));

const AdminHorus = lazyWithRetry(() => import('./pages/AdminHorus'));
const AdminHorusTemplate = lazyWithRetry(() => import('./pages/AdminHorusTemplate'));
const AdminTriagem = lazyWithRetry(() => import('./pages/AdminTriagem'));
const TriagemFinal = lazyWithRetry(() => import('./components/draggable-card-demo-2'));
const HorusWhatsApp = lazyWithRetry(() => import("./pages/HorusWhatsApp.tsx"));
const AdminBlogEdicao = lazyWithRetry(() => import("./pages/AdminBlogEdicao.tsx"));
const AdminFlashcardsEditar = lazyWithRetry(() => import("./pages/AdminFlashcardsEditar.tsx"));
const AdminDesignImagens = lazyWithRetry(() => import("./pages/AdminDesignImagens.tsx"));
const AdminHeroHome = lazyWithRetry(() => import("./pages/AdminHeroHome.tsx"));
const AdminHomeCuriosidades = lazyWithRetry(() => import("./pages/AdminHomeCuriosidades.tsx"));
const AdminOverlayFrases = lazyWithRetry(() => import("./pages/AdminOverlayFrases.tsx"));
const BibliotecaEditar = lazyWithRetry(() => import("./pages/BibliotecaEditar.tsx"));

const AdminLeituraNativa = lazyWithRetry(() => import("./pages/AdminLeituraNativa.tsx"));
const AdminAudioaulas = lazyWithRetry(() => import("./pages/AdminAudioaulas.tsx"));
const Audioaulas = lazyWithRetry(routePrefetch.audioaulas);
const LeisCantadas = lazyWithRetry(() => import("./pages/LeisCantadas.tsx"));
const AdminLeisCantadas = lazyWithRetry(() => import("./pages/AdminLeisCantadas.tsx"));
const AdminConteudoFila = lazyWithRetry(() => import("./pages/AdminConteudoFila.tsx"));
const Assinatura = lazyWithRetry(() => import("./pages/Assinatura.tsx"));
const PlanosAtivos = lazyWithRetry(() => import("./pages/PlanosAtivos.tsx"));
const DesktopPromo = lazyWithRetry(routePrefetch.desktop);
const AdminRadaresLeis = lazyWithRetry(() => import("./pages/AdminRadaresLeis.tsx"));
const AdminBibliotecaLeis = lazyWithRetry(() => import("./pages/AdminBibliotecaLeis.tsx"));
const AdminBibliotecaLeisEstaduais = lazyWithRetry(() => import("./pages/AdminBibliotecaLeisEstaduais.tsx"));
const AdminBibliotecaLeisGeral = lazyWithRetry(() => import("./pages/AdminBibliotecaLeisGeral.tsx"));
const AdminBuscadorLeis = lazyWithRetry(() => import("./pages/AdminBuscadorLeis.tsx"));
const AdminConcorrentes = lazyWithRetry(() => import("./pages/AdminConcorrentes.tsx"));
const AdminConcorrenteDetalhe = lazyWithRetry(() => import("./pages/AdminConcorrenteDetalhe.tsx"));
const NovidadesRadarOverlay = lazyWithRetry(() => import("./components/NovidadesRadarOverlay"));
const GlobalDesktopHeader = lazyWithRetry(() => import("./components/layout/GlobalDesktopHeader"));
const DesktopFileDropOverlay = lazyWithRetry(() => import("./components/desktop/DesktopFileDropOverlay"));
const ModoOffline = lazyWithRetry(() => import("./pages/ModoOffline.tsx"));
const ModoOfflineLeis = lazyWithRetry(() => import("./pages/ModoOfflineLeis.tsx"));
const ModoOfflineLivros = lazyWithRetry(() => import("./pages/ModoOfflineLivros.tsx"));
const ModoOfflineAudioaulas = lazyWithRetry(() => import("./pages/ModoOfflineAudioaulas.tsx"));
const ModoOfflineLeisCantadas = lazyWithRetry(() => import("./pages/ModoOfflineLeisCantadas.tsx"));
const ModoOfflineApresentacoes = lazyWithRetry(() => import("./pages/ModoOfflineApresentacoes.tsx"));
const PacotesOffline = lazyWithRetry(() => import("./pages/PacotesOffline.tsx"));
const AdminSecretsDownload = lazyWithRetry(() => import("./pages/AdminSecretsDownload.tsx"));
const AdminAppleCsr = lazyWithRetry(() => import("./pages/AdminAppleCsr.tsx"));
const AdminPassoAPassoLojas = lazyWithRetry(() => import("./pages/AdminPassoAPassoLojas.tsx"));
const AdminHandoffIA = lazyWithRetry(() => import("./pages/AdminHandoffIA.tsx"));
const AdminTransferenciaApp = lazyWithRetry(() => import("./pages/AdminTransferenciaApp.tsx"));
const BoletinsJuridicos = lazyWithRetry(routePrefetch.boletins);
const AdminBoletins = lazyWithRetry(() => import("./pages/AdminBoletins.tsx"));
const AdminModelos = lazyWithRetry(() => import("./pages/AdminModelos.tsx"));
const AdminDesktop = lazyWithRetry(() => import("./pages/AdminDesktop.tsx"));

const Privacidade = lazyWithRetry(() => import("./pages/Privacidade.tsx"));
const Termos = lazyWithRetry(() => import("./pages/Termos.tsx"));
const Seguranca = lazyWithRetry(() => import("./pages/Seguranca.tsx"));
const ExcluirConta = lazyWithRetry(() => import("./pages/ExcluirConta.tsx"));
const ExcluirContaPublico = lazyWithRetry(() => import("./pages/ExcluirContaPublico.tsx"));
const Lembretes = lazyWithRetry(() => import("./pages/Lembretes.tsx"));
const CentralLembretes = lazyWithRetry(() => import("./pages/CentralLembretes.tsx"));
const MeusLembretes = lazyWithRetry(() => import("./pages/MeusLembretes.tsx"));
const LembretesMeus = lazyWithRetry(() => import("./pages/lembretes/LembretesMeus.tsx"));
const LembretesVideoaulas = lazyWithRetry(() => import("./pages/lembretes/LembretesVideoaulas.tsx"));
const LembretesResumos = lazyWithRetry(() => import("./pages/lembretes/LembretesResumos.tsx"));
const LembretesLeitura = lazyWithRetry(() => import("./pages/lembretes/LembretesLeitura.tsx"));
const LembretesQuestoesTab = lazyWithRetry(() => import("./pages/lembretes/LembretesQuestoes.tsx"));
const Suporte = lazyWithRetry(() => import("./pages/Suporte.tsx"));
const SuportePublico = lazyWithRetry(() => import("./pages/SuportePublico.tsx"));
const AdminSuporte = lazyWithRetry(() => import("./pages/AdminSuporte.tsx"));
const Opiniao = lazyWithRetry(() => import("./pages/Opiniao.tsx"));
const LembretesLocal = lazyWithRetry(() => import("./pages/LembretesLocal.tsx"));
const PreferenciasLembretes = lazyWithRetry(() => import("./pages/PreferenciasLembretes.tsx"));
const AnotacoesAudio = lazyWithRetry(() => import("./pages/AnotacoesAudio.tsx"));
const AssistenteApp = lazyWithRetry(() => import("./pages/AssistenteApp.tsx"));
const AssistenteHorus = lazyWithRetry(() => import("./pages/AssistenteHorus.tsx"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 24 * 60 * 60 * 1000, // 24h para persistência
      retry: 2,
      refetchOnWindowFocus: false,
      networkMode: 'offlineFirst',
    },
    mutations: {
      networkMode: 'offlineFirst',
    },
  },
});

const queryPersister = typeof window !== 'undefined'
  ? createAsyncStoragePersister({
      storage: {
        getItem: async (key) => {
          if (Capacitor.isNativePlatform()) {
            const { localDb } = await import('@/services/localDb');
            if (localDb.available) return localDb.getKv(key);
          }
          return idbGet(key).then((v) => (v == null ? null : v as string));
        },
        setItem: async (key, value) => {
          if (Capacitor.isNativePlatform()) {
            const { localDb } = await import('@/services/localDb');
            if (localDb.available) return localDb.setKv(key, value);
          }
          return idbSet(key, value).then(() => undefined);
        },
        removeItem: async (key) => {
          if (Capacitor.isNativePlatform()) {
            const { localDb } = await import('@/services/localDb');
            if (localDb.available) return localDb.delKv(key);
          }
          return idbDel(key).then(() => undefined);
        },
      },
      key: 'rq-cache-v1',
      throttleTime: 1500,
    })
  : undefined;

const preloadImage = new Image();
preloadImage.src = brasaoImg;
preloadImage.decoding = 'async';

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
    if (justSignedUp) {
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
        // Perfil pode estar sendo criado pelo trigger (e-mail, Google, Apple).
        // Tenta algumas vezes antes de decidir, para não liberar o app por engano.
        let done = false;
        let ok = false;
        for (let i = 0; i < 3; i++) {
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
          await new Promise((r) => setTimeout(r, 400));
        }
        if (cancelled) return;
        if (ok) {
          setNeedsOnboarding(!done);
          if (done && cacheKey) {
            try {
              localStorage.setItem(cacheKey, '1');
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
    return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
  }

  if (requireOnboarding && !initialCheckDone) {
    // Exibe o fallback elegante com spinner ao invés de tela preta vazia,
    // mantendo a ilusão de que o app já carregou enquanto valida no DB
    return (
      <div className="fixed inset-0 z-[9999] bg-background">
        <LazyFallback />
      </div>
    );
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
    import('./pages/CategoriaLegislacao.tsx');
    routePrefetch.estudos();
    routePrefetch.ferramentas();
    routePrefetch.radar360();
    routePrefetch.blog();
    routePrefetch.leiSeca();
    routePrefetch.leiSecaTrilha();
    routePrefetch.leiSecaParte();
    routePrefetch.leiSecaPlayer();



  };
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(preloadChunks);
  } else {
    setTimeout(preloadChunks, 1500);
  }
}

function EstudosRouter() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const hasStudyParams = ['mode', 'view', 'room', 'tabela', 'artigo'].some(k => params.has(k));
  return hasStudyParams ? <Estudar /> : <EstudosHub />;
}

function LazyFallback() {
  return (
    <div
      className="min-h-dvh bg-[#0D0D0D] p-4 pt-16 space-y-4 animate-in fade-in duration-300"
      style={{ animationDelay: '120ms', animationFillMode: 'backwards' }}
      aria-busy="true"
      aria-live="polite"
    >
      <div className="h-8 w-48 rounded-md bg-muted/70 animate-pulse" />
      <div className="h-4 w-64 rounded bg-muted/60 animate-pulse" />
      <div className="space-y-3 mt-6">
        {[1, 2, 3, 4, 5].map(i => (
          <div
            key={i}
            className="h-20 rounded-xl bg-muted/60 animate-pulse"
            style={{ animationDelay: `${i * 80}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

function PresenceWrapper() {
  const { user } = useAuth();
  usePresenceTracker();
  useHorusStatsSync();
  useSessionTracker();
  useDesktopSessionGuard(!!user);
  return <AtivarNotificacoesGate />;
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
      import("@/lib/backgroundRunner").then(async (m) => {
        try {
          await m.ensureBackgroundPermissions();
          m.runPrefetchNow();
        } catch {}
      });
      import("@/services/bundleUpdater").then((m) => m.startSilentBundleUpdate()).catch(() => {});
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
    window.addEventListener('vacatio:push-navigate', handler as EventListener);
    window.addEventListener('app:atalho', atalhoHandler as EventListener);
    return () => {
      window.removeEventListener('vacatio:push-navigate', handler as EventListener);
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

function AnimatedRoutes() {
  const location = useLocation();
  const { user } = useAuth();
  const { data: profile } = useProfileSummary();

  // Screen tracking unificado (page_view + screen_view + scroll + screen_exit).
  useScreenTracking();

  // GA4: pageview em cada route change (mantido para compatibilidade).
  useEffect(() => {
    trackPageview(location.pathname + location.search);
    markRouteChange(location.pathname + location.search);
    prefetchNearby(location.pathname);
  }, [location.pathname, location.search]);

  // Hidrata caches de forma escalonada (2 fases em idle) para não competir
  // com o primeiro paint e as interações iniciais do usuário.
  useEffect(() => {
    if (!user) return;

    const ric = (typeof window !== 'undefined' && 'requestIdleCallback' in window)
      ? (cb: () => void, opts?: { timeout?: number }) => (window as any).requestIdleCallback(cb, opts) as number
      : undefined;
    const schedule = (cb: () => void, delay: number, idleTimeout?: number) => {
      const t = setTimeout(() => { if (ric) ric(cb, { timeout: idleTimeout ?? 3000 }); else cb(); }, delay);
      return t;
    };

    // Fase 1 (2s): hydrate de stores em memória
    const t1 = schedule(() => {
      void import('@/lib/videoaulasStore').then((m) => {
        m.hydrateVideoaulasCache();
        m.warmVideoaulasCache();
      });
      void import('@/lib/tematicaStore').then((m) => {
        m.hydrateTematicaCache();
        m.warmTematicaCache();
      });
      // Favoritos/recentes (biblioteca, leis, resumos, dicionário) da conta.
      void Promise.all([
        import('@/lib/leisFavoritos'),
        import('@/lib/bibliotecaTracking'),
        import('@/lib/resumosLocal'),
        import('@/hooks/useDicionarioPrefs'),
        import('@/lib/flashcardsQueries').then((m) => m.prefetchFlashcardsDashboard(queryClient)),
      ]).then(() => import('@/lib/userSync').then((m) => m.pullAllUserSync(true)));
    }, 2000);

    // Fase 2 (4s): pré-carrega chunks de navegação
    const t2 = schedule(() => {
      (['videoaulas', 'videoaulasCatalogo', 'videoaulasArea', 'videoaulaView',
        'videoaulasCategorias', 'videoaulasTrilhas', 'videoaulasCatalogoTrilha', 'videoaulasLista',
        'videoaulaView', 'videoaulasConquistas', 'resumosJuridicos', 'resumosJuridicosTemas',
        'resumosJuridicosSubtemas', 'resumosJuridicosLista', 'audioaulas',
        'dicionario', 'biblioteca', 'bibliotecaCategoria', 'blog',
        'tematica'] as const).forEach((k) => prefetchRoute(k));
    }, 4000, 5000);

    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [user]);

  // Sempre voltar ao topo ao navegar (voltar, avançar, clique).
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
  }, [location.pathname, location.search]);

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
  const HomeGate = () => {
    if (!user) return <Landing />;
    return null;
  };



  const getRouteKey = (path: string) => {
    // Agrupa abas do Vade Mecum para não acionar a transição de página inteira
    if (path.match(/^\/vade-mecum(\/areas|\/categorias|\/favoritos)?$/)) {
      return '/vade-mecum-tabs';
    }
    return path;
  };

  return (
    <div className="overflow-x-hidden">
      <NativeBootstrap />
      <PushNavListener />
      <DeepLinkBootstrap />
      {user && <PresenceWrapper />}
      {user && <Suspense fallback={null}><NovidadesRadarOverlay /></Suspense>}
      <HorusAvaliacaoOverlay />
      <Suspense fallback={null}><GlobalDesktopHeader /></Suspense>
      <Suspense fallback={null}><DesktopFileDropOverlay /></Suspense>
      <PersistentHome />
      <BackToTop />
      <Suspense fallback={<LazyFallback />}>
        <AnimatePresence mode="wait">
          <Routes location={location} key={getRouteKey(location.pathname)}>
          <Route path="/auth" element={<Auth />} />
          <Route path="/landing" element={<Landing />} />

          <Route path="/ir/*" element={<SmartLink />} />
          <Route path="/privacidade" element={<Privacidade />} />
          <Route path="/termos" element={<Termos />} />
          <Route path="/excluir-conta" element={<ExcluirContaPublico />} />
          <Route path="/suporte-publico" element={<SuportePublico />} />

          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/desktop-link/:token" element={<DesktopLinkConfirm />} />
          <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
          <Route path="/" element={<ProtectedRoute><HomeGate /></ProtectedRoute>} />

          <Route path="/faculdade/lousa" element={<ProtectedRoute><PageTransition><Suspense fallback={<div className="min-h-dvh bg-background" />}><FaculdadeLousa /></Suspense></PageTransition></ProtectedRoute>} />
          <Route path="/faculdade/lembretes" element={<ProtectedRoute><PageTransition><FaculdadeLembretes /></PageTransition></ProtectedRoute>} />
          <Route path="/faculdade/resumos" element={<ProtectedRoute><PageTransition><FaculdadeResumos /></PageTransition></ProtectedRoute>} />
          <Route path="/documentos" element={<ProtectedRoute><PageTransition><DocumentosPage /></PageTransition></ProtectedRoute>} />
          <Route path="/legislacao/:tipo" element={<ProtectedRoute><PageTransition><CategoriaLegislacao /></PageTransition></ProtectedRoute>} />
          <Route path="/legislacao/:tipo/:leiSlug" element={<ProtectedRoute><PageTransition><CategoriaLegislacao /></PageTransition></ProtectedRoute>} />
          <Route path="/legislacao/:tipo/:leiSlug/:artigoNumero" element={<ProtectedRoute><PageTransition><CategoriaLegislacao /></PageTransition></ProtectedRoute>} />
          <Route path="/noticias" element={<ProtectedRoute><PageTransition><Noticias /></PageTransition></ProtectedRoute>} />
          <Route path="/atualizacoes" element={<ProtectedRoute><PageTransition><Atualizacoes /></PageTransition></ProtectedRoute>} />
          <Route path="/novidades" element={<ProtectedRoute><PageTransition><Novidades /></PageTransition></ProtectedRoute>} />
          <Route path="/anotacoes" element={<ProtectedRoute><PageTransition><Anotacoes /></PageTransition></ProtectedRoute>} />
          <Route path="/configuracoes" element={<ProtectedRoute><PageTransition><Configuracoes /></PageTransition></ProtectedRoute>} />
          <Route path="/ajustes/seguranca" element={<ProtectedRoute><PageTransition><Seguranca /></PageTransition></ProtectedRoute>} />
          <Route path="/lembretes" element={<ProtectedRoute><PageTransition><CentralLembretes /></PageTransition></ProtectedRoute>} />
          <Route path="/central-lembretes" element={<Navigate to="/lembretes" replace />} />
          <Route path="/ajustes/lembretes" element={<ProtectedRoute><PageTransition><Lembretes /></PageTransition></ProtectedRoute>} />
          <Route path="/meus-lembretes" element={<ProtectedRoute><PageTransition><MeusLembretes /></PageTransition></ProtectedRoute>} />
          <Route path="/lembretes/local" element={<ProtectedRoute><PageTransition><LembretesLocal /></PageTransition></ProtectedRoute>} />
          <Route path="/lembretes/preferencias" element={<ProtectedRoute><PageTransition><PreferenciasLembretes /></PageTransition></ProtectedRoute>} />
          <Route path="/lembretes/meus" element={<ProtectedRoute><PageTransition><LembretesMeus /></PageTransition></ProtectedRoute>} />
          <Route path="/lembretes/videoaulas" element={<ProtectedRoute><PageTransition><LembretesVideoaulas /></PageTransition></ProtectedRoute>} />
          <Route path="/lembretes/resumos" element={<ProtectedRoute><PageTransition><LembretesResumos /></PageTransition></ProtectedRoute>} />
          <Route path="/lembretes/leitura" element={<ProtectedRoute><PageTransition><LembretesLeitura /></PageTransition></ProtectedRoute>} />
          <Route path="/lembretes/questoes" element={<ProtectedRoute><PageTransition><LembretesQuestoesTab /></PageTransition></ProtectedRoute>} />
          <Route path="/anotacoes/audio" element={<ProtectedRoute><PageTransition><Suspense fallback={<div className="min-h-dvh bg-background" />}><AnotacoesAudio /></Suspense></PageTransition></ProtectedRoute>} />
          <Route path="/ajustes/excluir-conta" element={<ProtectedRoute><PageTransition><ExcluirConta /></PageTransition></ProtectedRoute>} />
          <Route path="/radar/deputados" element={<ProtectedRoute><PageTransition><RadarDeputados /></PageTransition></ProtectedRoute>} />
          <Route path="/radar/votacoes" element={<ProtectedRoute><PageTransition><RadarVotacoes /></PageTransition></ProtectedRoute>} />
          <Route path="/radar/rankings" element={<ProtectedRoute><PageTransition><RadarRankings /></PageTransition></ProtectedRoute>} />
          <Route path="/radar/proposicoes" element={<ProtectedRoute><PageTransition><RadarProposicoes /></PageTransition></ProtectedRoute>} />
          <Route path="/radar/categorias" element={<ProtectedRoute><PageTransition><RadarCategorias /></PageTransition></ProtectedRoute>} />
          <Route path="/radar/deputado/:id" element={<ProtectedRoute><PageTransition><RadarDeputadoDetalhe /></PageTransition></ProtectedRoute>} />
          <Route path="/radar/em-alta" element={<ProtectedRoute><PageTransition><RadarEmAlta /></PageTransition></ProtectedRoute>} />
          <Route path="/radar/pl/:id" element={<ProtectedRoute><PageTransition><RadarPLDetalhe /></PageTransition></ProtectedRoute>} />
          <Route path="/legislacao-estadual" element={<ProtectedRoute><PageTransition><LegislacaoEstadual /></PageTransition></ProtectedRoute>} />
          <Route path="/legislacao-estadual/:uf" element={<ProtectedRoute><PageTransition><EstadoDetalhe /></PageTransition></ProtectedRoute>} />
          <Route path="/legislacao-estadual/:uf/lei/:slug" element={<ProtectedRoute><PageTransition><LeiEstadualView /></PageTransition></ProtectedRoute>} />
          <Route path="/explicacao-lei" element={<ProtectedRoute><PageTransition><ExplicacaoLei /></PageTransition></ProtectedRoute>} />
          <Route path="/narracao" element={<ProtectedRoute><PageTransition><NarracaoLei /></PageTransition></ProtectedRoute>} />
          <Route path="/visuais/*" element={<ProtectedRoute><VisualJuridico /></ProtectedRoute>} />
          <Route path="/grafo-artigos" element={<ProtectedRoute><PageTransition><GrafoArtigos /></PageTransition></ProtectedRoute>} />
          <Route path="/ferramentas" element={<ProtectedRoute><PageTransition><Ferramentas /></PageTransition></ProtectedRoute>} />
          <Route path="/ferramentas/locais" element={<ProtectedRoute><PageTransition><LocaisJuridicos /></PageTransition></ProtectedRoute>} />
          <Route path="/ferramentas/dicionario" element={<ProtectedRoute><PageTransition><DicionarioJuridicoPage /></PageTransition></ProtectedRoute>} />
          <Route path="/ferramentas/peticao-inicial" element={<ProtectedRoute><PageTransition><PeticaoInicial /></PageTransition></ProtectedRoute>} />
          <Route path="/ferramentas/peticao-inicial/:id" element={<ProtectedRoute><PageTransition><PeticaoInicialEditor /></PageTransition></ProtectedRoute>} />
          <Route path="/admin/locais" element={<ProtectedRoute><PageTransition><AdminLocais /></PageTransition></ProtectedRoute>} />
          <Route path="/admin-estatisticas-assinatura" element={<ProtectedRoute><PageTransition><AdminEstatisticasAssinatura /></PageTransition></ProtectedRoute>} />
          <Route path="/admin-avaliacoes-loja" element={<ProtectedRoute><PageTransition><AdminAvaliacoesLoja /></PageTransition></ProtectedRoute>} />
          <Route path="/tematica-juridica" element={<ProtectedRoute><PageTransition><TematicaJuridica /></PageTransition></ProtectedRoute>} />
          <Route path="/radar-360" element={<ProtectedRoute><PageTransition><Radar360 /></PageTransition></ProtectedRoute>} />
          <Route path="/normas/:slug" element={<ProtectedRoute><PageTransition><OutrasNormasLista /></PageTransition></ProtectedRoute>} />
          <Route path="/radares" element={<ProtectedRoute><PageTransition><Radares /></PageTransition></ProtectedRoute>} />
          <Route path="/praticar" element={<ProtectedRoute><PageTransition><Praticar /></PageTransition></ProtectedRoute>} />
          <Route path="/praticar/area/:areaSlug" element={<ProtectedRoute><PageTransition><PraticarArea /></PageTransition></ProtectedRoute>} />
          <Route path="/praticar/:leiSlug" element={<ProtectedRoute><PageTransition><PraticarLei /></PageTransition></ProtectedRoute>} />
          <Route path="/praticar/:leiSlug/sessao" element={<ProtectedRoute><PageTransition><PraticarSessao /></PageTransition></ProtectedRoute>} />

          <Route path="/compartilhado" element={<ProtectedRoute><PageTransition><Compartilhado /></PageTransition></ProtectedRoute>} />
          <Route path="/estudos" element={<ProtectedRoute><PageTransition><EstudosRouter /></PageTransition></ProtectedRoute>} />
          <Route path="/vade-mecum" element={<ProtectedRoute><PageTransition><VadeMecum /></PageTransition></ProtectedRoute>} />
          <Route path="/vade-mecum/areas" element={<ProtectedRoute><PageTransition><VadeMecum /></PageTransition></ProtectedRoute>} />
          <Route path="/vade-mecum/categorias" element={<ProtectedRoute><PageTransition><VadeMecum /></PageTransition></ProtectedRoute>} />
          <Route path="/vade-mecum/codigos" element={<ProtectedRoute><PageTransition><VadeMecumCodigos /></PageTransition></ProtectedRoute>} />
          <Route path="/vade-mecum/sumulas" element={<ProtectedRoute><PageTransition><VadeMecumSumulas /></PageTransition></ProtectedRoute>} />
          <Route path="/vade-mecum/favoritos" element={<ProtectedRoute><PageTransition><VadeMecum /></PageTransition></ProtectedRoute>} />
          <Route path="/vade-mecum/recentes" element={<ProtectedRoute><PageTransition><VadeMecumRecentes /></PageTransition></ProtectedRoute>} />
          <Route path="/aprender" element={<ProtectedRoute><PageTransition><Aprender /></PageTransition></ProtectedRoute>} />
          <Route path="/gamificacao/forca" element={<ProtectedRoute><PageTransition><ForcaPage /></PageTransition></ProtectedRoute>} />

          <Route path="/aprender/categoria/:categoriaId" element={<ProtectedRoute><PageTransition><CategoriaAprender /></PageTransition></ProtectedRoute>} />
          <Route path="/aprender/area/:slug" element={<ProtectedRoute><PageTransition><AprenderArea /></PageTransition></ProtectedRoute>} />
          <Route path="/aprender/modulo/:moduloId" element={<ProtectedRoute><PageTransition><AprenderModulo /></PageTransition></ProtectedRoute>} />
          <Route path="/aprender/teoria" element={<ProtectedRoute><PageTransition><AprenderTeoria /></PageTransition></ProtectedRoute>} />
          <Route path="/aprender/trilhas" element={<ProtectedRoute><PageTransition><AprenderTrilhas /></PageTransition></ProtectedRoute>} />
          <Route path="/aprender/questoes" element={<ProtectedRoute><PageTransition><AprenderQuestoes /></PageTransition></ProtectedRoute>} />
          <Route path="/aprender/flashcards" element={<ProtectedRoute><PageTransition><AprenderFlashcards /></PageTransition></ProtectedRoute>} />
          <Route path="/aprender/desempenho" element={<ProtectedRoute><PageTransition><AprenderDesempenho /></PageTransition></ProtectedRoute>} />
          <Route path="/aprender/aula/:aulaId" element={<ProtectedRoute><AprenderAula /></ProtectedRoute>} />
          <Route path="/flashcards" element={<ProtectedRoute><PageTransition><Flashcards /></PageTransition></ProtectedRoute>} />
          <Route path="/flashcards/estudar" element={<ProtectedRoute><PageTransition><FlashcardsEstudo /></PageTransition></ProtectedRoute>} />
          <Route path="/flashcards/trilhas" element={<ProtectedRoute><PageTransition><FlashcardsTrilhas /></PageTransition></ProtectedRoute>} />
          <Route path="/flashcards/cargos" element={<ProtectedRoute><PageTransition><FlashcardsCargos /></PageTransition></ProtectedRoute>} />
          <Route path="/flashcards/cargos/:id" element={<ProtectedRoute><PageTransition><FlashcardsCargosDetalhes /></PageTransition></ProtectedRoute>} />
          <Route path="/flashcards/revisar" element={<ProtectedRoute><PageTransition><FlashcardsRevisar /></PageTransition></ProtectedRoute>} />
          <Route path="/flashcards/cornell" element={<ProtectedRoute><PageTransition><FlashcardsCornell /></PageTransition></ProtectedRoute>} />
          <Route path="/flashcards/progresso" element={<ProtectedRoute><PageTransition><FlashcardsProgresso /></PageTransition></ProtectedRoute>} />
          <Route path="/flashcards/historico" element={<ProtectedRoute><PageTransition><FlashcardsHistorico /></PageTransition></ProtectedRoute>} />
          <Route path="/flashcards/desafios" element={<ProtectedRoute><PageTransition><FlashcardsDesafios /></PageTransition></ProtectedRoute>} />
          <Route path="/flashcards/decks" element={<ProtectedRoute><PageTransition><FlashcardsDecks /></PageTransition></ProtectedRoute>} />
          <Route path="/flashcards/personalizado" element={<ProtectedRoute><PageTransition><FlashcardsPersonalizado /></PageTransition></ProtectedRoute>} />
          <Route path="/flashcards/materias" element={<ProtectedRoute><PageTransition><FlashcardsMaterias /></PageTransition></ProtectedRoute>} />
          <Route path="/flashcards/leis" element={<ProtectedRoute><PageTransition><FlashcardsLeis /></PageTransition></ProtectedRoute>} />
          <Route path="/flashcards/jurisprudencia" element={<Suspense fallback={<div className="min-h-dvh bg-background" />}><FlashcardsJurisprudencia /></Suspense>} />
          <Route path="/flashcards/termos" element={<Suspense fallback={<div className="min-h-dvh bg-background" />}><FlashcardsTermos /></Suspense>} />
          <Route path="/flashcards/filosofos" element={<Suspense fallback={<div className="min-h-dvh bg-background" />}><FlashcardsFilosofos /></Suspense>} />
          <Route path="/flashcards/juristas" element={<Suspense fallback={<div className="min-h-dvh bg-background" />}><FlashcardsJuristas /></Suspense>} />
          <Route path="/flashcards/prazos" element={<Suspense fallback={<div className="min-h-dvh bg-background" />}><FlashcardsPrazos /></Suspense>} />
          <Route path="/flashcards/excecoes" element={<Suspense fallback={<div className="min-h-dvh bg-background" />}><FlashcardsExcecoes /></Suspense>} />
          <Route path="/flashcards/classificacoes" element={<Suspense fallback={<div className="min-h-dvh bg-background" />}><FlashcardsClassificacoes /></Suspense>} />
          <Route path="/videoaulas" element={<Navigate to="/videoaulas/painel" replace />} />
          <Route path="/videoaulas/painel" element={<ProtectedRoute><PageTransition><Videoaulas /></PageTransition></ProtectedRoute>} />
          <Route path="/videoaulas/favoritos" element={<ProtectedRoute><PageTransition><VideoaulasLista modo="favoritos" /></PageTransition></ProtectedRoute>} />
          <Route path="/videoaulas/recentes" element={<ProtectedRoute><PageTransition><VideoaulasLista modo="recentes" /></PageTransition></ProtectedRoute>} />
          <Route path="/videoaulas/trilhas" element={<ProtectedRoute><PageTransition><VideoaulasTrilhas /></PageTransition></ProtectedRoute>} />
          <Route path="/videoaulas/:catalogo/trilha" element={<ProtectedRoute><PageTransition><VideoaulasCatalogoTrilha /></PageTransition></ProtectedRoute>} />
          <Route path="/videoaulas/praticar" element={<ProtectedRoute><PageTransition><VideoaulasPraticar /></PageTransition></ProtectedRoute>} />
          <Route path="/videoaulas/anotacoes" element={<ProtectedRoute><PageTransition><VideoaulasAnotacoes /></PageTransition></ProtectedRoute>} />
          <Route path="/videoaulas/categorias" element={<ProtectedRoute><PageTransition><VideoaulasCategorias /></PageTransition></ProtectedRoute>} />
          <Route path="/videoaulas/concurso/:id" element={<ProtectedRoute><PageTransition><VideoaulasConcurso /></PageTransition></ProtectedRoute>} />
          <Route path="/videoaulas/conquistas" element={<ProtectedRoute><PageTransition><VideoaulasConquistas /></PageTransition></ProtectedRoute>} />
          <Route path="/videoaulas/:catalogo" element={<ProtectedRoute><PageTransition><VideoaulasCatalogo /></PageTransition></ProtectedRoute>} />
          <Route path="/videoaulas/:catalogo/:area" element={<ProtectedRoute><PageTransition><VideoaulasArea /></PageTransition></ProtectedRoute>} />
          <Route path="/videoaulas/:catalogo/:area/:videoId" element={<ProtectedRoute><VideoaulaView /></ProtectedRoute>} />
          <Route path="/jurisprudencia/:slugLei/:numeroArtigo" element={<ProtectedRoute><PageTransition><JurisprudenciaArtigo /></PageTransition></ProtectedRoute>} />
          <Route path="/jurisprudencia/prontas/:tribunal" element={<ProtectedRoute><PageTransition><PesquisasProntasLista /></PageTransition></ProtectedRoute>} />
          <Route path="/jurisprudencia/prontas/:tribunal/:slug" element={<ProtectedRoute><PageTransition><PesquisasProntasTema /></PageTransition></ProtectedRoute>} />
          <Route path="/admin/pesquisas-prontas" element={<ProtectedRoute><PageTransition><AdminPesquisasProntas /></PageTransition></ProtectedRoute>} />
          <Route path="/jurisprudencia/sumulas-vinculantes" element={<ProtectedRoute><PageTransition><SumulasVinculantes /></PageTransition></ProtectedRoute>} />
          <Route path="/jurisprudencia/sumulas-stf" element={<ProtectedRoute><PageTransition><SumulasSTF /></PageTransition></ProtectedRoute>} />
          <Route path="/jurisprudencia/sumulas-stj" element={<ProtectedRoute><PageTransition><SumulasSTJ /></PageTransition></ProtectedRoute>} />
         <Route path="/jurisprudencia/informativos-stj" element={<ProtectedRoute><PageTransition><InformativosSTJ /></PageTransition></ProtectedRoute>} />
         <Route path="/jurisprudencia/informativos-stf" element={<ProtectedRoute><PageTransition><InformativosSTF /></PageTransition></ProtectedRoute>} />
        <Route path="/jurisprudencia/teses-stj" element={<ProtectedRoute><PageTransition><TesesSTJ /></PageTransition></ProtectedRoute>} />
        <Route path="/jurisprudencia/teses-stf" element={<ProtectedRoute><PageTransition><TesesSTF /></PageTransition></ProtectedRoute>} />
          <Route path="/jurisprudencia" element={<ProtectedRoute><PageTransition><Jurisprudencia /></PageTransition></ProtectedRoute>} />
          <Route path="/aprender/:slug" element={<ProtectedRoute><PageTransition><ArtigoEducacional /></PageTransition></ProtectedRoute>} />
          {/* Lei Seca */}
          <Route path="/lei-seca" element={<ProtectedRoute><PageTransition><LeiSecaIndex /></PageTransition></ProtectedRoute>} />
          <Route path="/lei-seca/favoritos" element={<ProtectedRoute><PageTransition><LeiSecaIndex modo="favoritos" /></PageTransition></ProtectedRoute>} />
          <Route path="/lei-seca/recentes" element={<ProtectedRoute><PageTransition><LeiSecaIndex modo="recentes" /></PageTransition></ProtectedRoute>} />
          <Route path="/lei-seca/lembretes" element={<ProtectedRoute><PageTransition><LeiSecaLembretes /></PageTransition></ProtectedRoute>} />
          <Route path="/lei-seca/:slug" element={<ProtectedRoute><PageTransition><LeiSecaTrilhaRoute /></PageTransition></ProtectedRoute>} />
          <Route path="/lei-seca/:slug/:parte" element={<ProtectedRoute><PageTransition><LeiSecaParteRoute /></PageTransition></ProtectedRoute>} />
          <Route path="/lei-seca/:slug/:parte/licao/:id" element={<ProtectedRoute><PageTransition><LeiSecaPlayer /></PageTransition></ProtectedRoute>} />
          <Route path="/resumos" element={<Navigate to="/resumos-juridicos" replace />} />

          <Route path="/resumos-juridicos" element={<ProtectedRoute><PageTransition><ResumosJuridicosAreas /></PageTransition></ProtectedRoute>} />
          <Route path="/resumos-juridicos/favoritos" element={<ProtectedRoute><PageTransition><ResumosJuridicosLista modo="favoritos" /></PageTransition></ProtectedRoute>} />
          <Route path="/resumos-juridicos/recentes" element={<ProtectedRoute><PageTransition><ResumosJuridicosLista modo="recentes" /></PageTransition></ProtectedRoute>} />
          <Route path="/resumos-juridicos/jurisprudencia/:categoria" element={<ProtectedRoute><PageTransition><ResumosJuridicosJurisprudencia /></PageTransition></ProtectedRoute>} />
          <Route path="/resumos-juridicos/:area" element={<ProtectedRoute><PageTransition><ResumosJuridicosTemas /></PageTransition></ProtectedRoute>} />
          <Route path="/resumos-juridicos/:area/:tema" element={<ProtectedRoute><PageTransition><ResumosJuridicosSubtemas /></PageTransition></ProtectedRoute>} />
          <Route path="/questoes" element={<ProtectedRoute><PageTransition><Questoes /></PageTransition></ProtectedRoute>} />
          <Route path="/questoes/areas" element={<ProtectedRoute><PageTransition><QuestoesAreas /></PageTransition></ProtectedRoute>} />
          <Route path="/questoes/praticar" element={<ProtectedRoute><PageTransition><QuestoesPraticar /></PageTransition></ProtectedRoute>} />
          <Route path="/questoes/simulado" element={<ProtectedRoute><PageTransition><QuestoesSimulado /></PageTransition></ProtectedRoute>} />
          <Route path="/questoes/simulado/:cargoId" element={<ProtectedRoute><PageTransition><QuestoesSimuladoCargoConfig /></PageTransition></ProtectedRoute>} />
          <Route path="/questoes/desafios" element={<ProtectedRoute><PageTransition><QuestoesDesafios /></PageTransition></ProtectedRoute>} />
          <Route path="/questoes/revisar" element={<ProtectedRoute><PageTransition><QuestoesRevisar /></PageTransition></ProtectedRoute>} />
          <Route path="/questoes/lembretes" element={<ProtectedRoute><PageTransition><QuestoesLembretes /></PageTransition></ProtectedRoute>} />
          <Route path="/questoes/trilhas" element={<ProtectedRoute><PageTransition><QuestoesTrilhas /></PageTransition></ProtectedRoute>} />
          <Route path="/questoes/cadernos" element={<ProtectedRoute><PageTransition><QuestoesCadernos /></PageTransition></ProtectedRoute>} />
          <Route path="/questoes/desafios" element={<ProtectedRoute><PageTransition><QuestoesDesafios /></PageTransition></ProtectedRoute>} />
          <Route path="/questoes/desafios/conquistas" element={<ProtectedRoute><PageTransition><QuestoesConquistas /></PageTransition></ProtectedRoute>} />

          <Route path="/questoes/desempenho" element={<ProtectedRoute><PageTransition><QuestoesDesempenho /></PageTransition></ProtectedRoute>} />
          <Route path="/questoes/historico" element={<ProtectedRoute><PageTransition><QuestoesHistorico /></PageTransition></ProtectedRoute>} />
          <Route path="/admin-questoes" element={<ProtectedRoute><PageTransition><AdminQuestoes /></PageTransition></ProtectedRoute>} />
          <Route path="/admin/resumo-livro-audio" element={<ProtectedRoute><PageTransition><AdminResumoLivroAudioEditar /></PageTransition></ProtectedRoute>} />
          <Route path="/admin-avaliacao-loja" element={<ProtectedRoute><PageTransition><AdminAvaliacoesLoja /></PageTransition></ProtectedRoute>} />
          <Route path="/admin-monitor" element={<ProtectedRoute><PageTransition><AdminMonitor /></PageTransition></ProtectedRoute>} />
          <Route path="/perfil" element={<ProtectedRoute><PageTransition><Perfil /></PageTransition></ProtectedRoute>} />
          <Route path="/sobre" element={<ProtectedRoute><PageTransition><SobreApp /></PageTransition></ProtectedRoute>} />
          <Route path="/gerador-post" element={<ProtectedRoute><PageTransition><GeradorPost /></PageTransition></ProtectedRoute>} />
          <Route path="/blog" element={<ProtectedRoute><PageTransition><Blog /></PageTransition></ProtectedRoute>} />
          <Route path="/newsletter" element={<ProtectedRoute><PageTransition><Newsletter /></PageTransition></ProtectedRoute>} />
          <Route path="/biblioteca" element={<ProtectedRoute><PageTransition><Bibliotecas /></PageTransition></ProtectedRoute>} />
          <Route path="/bibliotecas" element={<ProtectedRoute><PageTransition><Bibliotecas /></PageTransition></ProtectedRoute>} />

          <Route path="/bibliotecas/trilhas" element={<ProtectedRoute><PageTransition><BibliotecaTrilhas /></PageTransition></ProtectedRoute>} />
          <Route path="/bibliotecas/:colecaoId" element={<ProtectedRoute><PageTransition><BibliotecaCategoria /></PageTransition></ProtectedRoute>} />
          <Route path="/bibliotecas/:colecaoId/:areaSlug" element={<ProtectedRoute><PageTransition><BibliotecaCategoria /></PageTransition></ProtectedRoute>} />
          <Route path="/biblioteca-offline" element={<ProtectedRoute><PageTransition><BibliotecaOffline /></PageTransition></ProtectedRoute>} />

          
          <Route path="/compressao-imagens" element={<ProtectedRoute><PageTransition><CompressaoImagens /></PageTransition></ProtectedRoute>} />
          <Route path="/admin-funcoes" element={<ProtectedRoute><PageTransition><AdminFuncoes /></PageTransition></ProtectedRoute>} />
          <Route path="/admin-funcoes-assinantes" element={<ProtectedRoute><PageTransition><AdminFuncoesAssinantes /></PageTransition></ProtectedRoute>} />
          <Route path="/admin-vade-mecum" element={<ProtectedRoute><PageTransition><AdminVadeMecum /></PageTransition></ProtectedRoute>} />
          <Route path="/admin-vade-mecum-historico" element={<ProtectedRoute><PageTransition><AdminVadeMecumHistorico /></PageTransition></ProtectedRoute>} />
          <Route path="/admin-lembretes" element={<ProtectedRoute><PageTransition><AdminLembretes /></PageTransition></ProtectedRoute>} />
          <Route path="/admin-lembretes/biblioteca" element={<ProtectedRoute><PageTransition><AdminLembretesBiblioteca /></PageTransition></ProtectedRoute>} />
          <Route path="/admin-narracao" element={<ProtectedRoute><PageTransition><AdminNarracaoConteudo /></PageTransition></ProtectedRoute>} />
          <Route path="/admin-narracao/biblioteca" element={<ProtectedRoute><PageTransition><AdminNarracaoBiblioteca /></PageTransition></ProtectedRoute>} />
          <Route path="/admin-narracao/blog" element={<ProtectedRoute><PageTransition><AdminNarracaoBlog /></PageTransition></ProtectedRoute>} />
          <Route path="/admin-narracao/apresentacao" element={<ProtectedRoute><PageTransition><AdminNarracaoApresentacao /></PageTransition></ProtectedRoute>} />
          <Route path="/apresentacoes" element={<ProtectedRoute><PageTransition><Apresentacoes /></PageTransition></ProtectedRoute>} />
          <Route path="/admin-apresentacao-editar" element={<ProtectedRoute><PageTransition><AdminApresentacaoEditar /></PageTransition></ProtectedRoute>} />
          <Route path="/apresentacao/:id" element={<ProtectedRoute><PageTransition><ApresentacaoPlayer /></PageTransition></ProtectedRoute>} />
          <Route path="/admin-assinantes" element={<ProtectedRoute><PageTransition><AdminAssinantes /></PageTransition></ProtectedRoute>} />
          <Route path="/teste-push" element={<ProtectedRoute><PageTransition><TestePush /></PageTransition></ProtectedRoute>} />
          <Route path="/admin-monitor-usuarios" element={<ProtectedRoute><PageTransition><AdminMonitorUsuarios /></PageTransition></ProtectedRoute>} />
          <Route path="/admin-monitoramento" element={<ProtectedRoute><PageTransition><AdminMonitoramento /></PageTransition></ProtectedRoute>} />
          <Route path="/admin-monitor-apis" element={<ProtectedRoute><PageTransition><AdminMonitorApis /></PageTransition></ProtectedRoute>} />
          <Route path="/assinatura" element={<ProtectedRoute><PageTransition><Assinatura /></PageTransition></ProtectedRoute>} />
          <Route path="/planos" element={<Navigate to="/assinatura" replace />} />
          <Route path="/planos/*" element={<Navigate to="/assinatura" replace />} />
          <Route path="/suporte" element={<ProtectedRoute><PageTransition><Suporte /></PageTransition></ProtectedRoute>} />
          <Route path="/opiniao" element={<ProtectedRoute><PageTransition><Opiniao /></PageTransition></ProtectedRoute>} />
          <Route path="/planos/ativos" element={<ProtectedRoute><PageTransition><PlanosAtivos /></PageTransition></ProtectedRoute>} />
          <Route path="/admin-suporte" element={<ProtectedRoute><PageTransition><AdminSuporte /></PageTransition></ProtectedRoute>} />
          <Route path="/admin-atualizacao" element={<ProtectedRoute><PageTransition><AdminAtualizacao /></PageTransition></ProtectedRoute>} />
          <Route path="/admin-native-assets" element={<ProtectedRoute><PageTransition><AdminNativeAssets /></PageTransition></ProtectedRoute>} />
          <Route path="/admin-aprender" element={<ProtectedRoute><PageTransition><AdminAprender /></PageTransition></ProtectedRoute>} />
          <Route path="/admin-laboratorio" element={<ProtectedRoute><PageTransition><AdminLaboratorio /></PageTransition></ProtectedRoute>} />
          <Route path="/admin-aprender/:area" element={<ProtectedRoute><PageTransition><AdminAprenderArea /></PageTransition></ProtectedRoute>} />
          <Route path="/admin-jurisprudencia" element={<ProtectedRoute><PageTransition><AdminJurisprudencia /></PageTransition></ProtectedRoute>} />
          <Route path="/admin-push" element={<ProtectedRoute><PageTransition><AdminPush /></PageTransition></ProtectedRoute>} />

          <Route path="/admin-push/:section" element={<ProtectedRoute><PageTransition><AdminPushSection /></PageTransition></ProtectedRoute>} />
          <Route path="/admin-horus" element={<ProtectedRoute><PageTransition><AdminHorus /></PageTransition></ProtectedRoute>} />
          <Route path="/admin-horus-template" element={<ProtectedRoute><PageTransition><AdminHorusTemplate /></PageTransition></ProtectedRoute>} />
          <Route path="/admin-triagem" element={<ProtectedRoute><PageTransition><AdminTriagem /></PageTransition></ProtectedRoute>} />
          <Route path="/admin/triagem-final" element={<ProtectedRoute><PageTransition><TriagemFinal /></PageTransition></ProtectedRoute>} />
          <Route path="/admin-boletins" element={<ProtectedRoute><PageTransition><AdminBoletins /></PageTransition></ProtectedRoute>} />
          <Route path="/admin-desktop" element={<ProtectedRoute><PageTransition><AdminDesktop /></PageTransition></ProtectedRoute>} />
          <Route path="/admin-erros-questoes" element={<ProtectedRoute><PageTransition><AdminErrosQuestoes /></PageTransition></ProtectedRoute>} />

          <Route path="/admin-modelos" element={<ProtectedRoute><PageTransition><AdminModelos /></PageTransition></ProtectedRoute>} />
          <Route path="/boletins" element={<ProtectedRoute><PageTransition><BoletinsJuridicos /></PageTransition></ProtectedRoute>} />
          <Route path="/boletins/:id" element={<ProtectedRoute><PageTransition><BoletinsJuridicos /></PageTransition></ProtectedRoute>} />
          <Route path="/boletins-noticias" element={<ProtectedRoute><PageTransition><BoletinsJuridicos tipo="noticias" /></PageTransition></ProtectedRoute>} />
          <Route path="/boletins-noticias/:id" element={<ProtectedRoute><PageTransition><BoletinsJuridicos tipo="noticias" /></PageTransition></ProtectedRoute>} />
          <Route path="/ajustes/horus" element={<ProtectedRoute><PageTransition><HorusWhatsApp /></PageTransition></ProtectedRoute>} />
          <Route path="/admin-blog-edicao" element={<ProtectedRoute><PageTransition><AdminBlogEdicao /></PageTransition></ProtectedRoute>} />
          <Route path="/admin-flashcards-editar" element={<ProtectedRoute><PageTransition><AdminFlashcardsEditar /></PageTransition></ProtectedRoute>} />
          <Route path="/admin-design-imagens" element={<ProtectedRoute><PageTransition><AdminDesignImagens /></PageTransition></ProtectedRoute>} />
          <Route path="/admin-hero-home" element={<ProtectedRoute><PageTransition><AdminHeroHome /></PageTransition></ProtectedRoute>} />
          <Route path="/admin-home-curiosidades" element={<ProtectedRoute><PageTransition><AdminHomeCuriosidades /></PageTransition></ProtectedRoute>} />
          <Route path="/admin-overlay-frases" element={<ProtectedRoute><PageTransition><AdminOverlayFrases /></PageTransition></ProtectedRoute>} />
          <Route path="/admin-biblioteca-editar" element={<ProtectedRoute><PageTransition><BibliotecaEditar /></PageTransition></ProtectedRoute>} />
          <Route path="/admin-leitura-nativa" element={<ProtectedRoute><PageTransition><AdminLeituraNativa /></PageTransition></ProtectedRoute>} />
          <Route path="/admin-audioaulas" element={<ProtectedRoute><PageTransition><AdminAudioaulas /></PageTransition></ProtectedRoute>} />
          <Route path="/audioaulas" element={<ProtectedRoute><PageTransition><Audioaulas /></PageTransition></ProtectedRoute>} />
          <Route path="/audioaulas/:area" element={<ProtectedRoute><PageTransition><Audioaulas /></PageTransition></ProtectedRoute>} />
          <Route path="/meus-downloads" element={<ProtectedRoute><PageTransition><MeusDownloads /></PageTransition></ProtectedRoute>} />
          <Route path="/minhas-leituras" element={<ProtectedRoute><PageTransition><MinhasLeituras /></PageTransition></ProtectedRoute>} />
          <Route path="/meus-resumos" element={<ProtectedRoute><PageTransition><MeusResumos /></PageTransition></ProtectedRoute>} />
          <Route path="/minhas-videoaulas" element={<ProtectedRoute><PageTransition><MinhasVideoaulas /></PageTransition></ProtectedRoute>} />


          <Route path="/me-explique" element={<ProtectedRoute><MeExplique /></ProtectedRoute>} />
          <Route path="/ferramentas/me-explique" element={<ProtectedRoute><MeExplique /></ProtectedRoute>} />
          <Route path="/leis-cantadas" element={<ProtectedRoute><PageTransition><LeisCantadas /></PageTransition></ProtectedRoute>} />
          <Route path="/admin-leis-cantadas" element={<ProtectedRoute><PageTransition><AdminLeisCantadas /></PageTransition></ProtectedRoute>} />
          <Route path="/admin-conteudo-fila" element={<ProtectedRoute><PageTransition><AdminConteudoFila /></PageTransition></ProtectedRoute>} />
          <Route path="/admin-radares-leis" element={<ProtectedRoute><PageTransition><AdminRadaresLeis /></PageTransition></ProtectedRoute>} />
          <Route path="/admin-biblioteca-leis" element={<ProtectedRoute><PageTransition><AdminBibliotecaLeis /></PageTransition></ProtectedRoute>} />
          <Route path="/admin-biblioteca-leis/estadual" element={<ProtectedRoute><PageTransition><AdminBibliotecaLeisEstaduais /></PageTransition></ProtectedRoute>} />
          <Route path="/admin-biblioteca-leis/estadual/:uf" element={<ProtectedRoute><PageTransition><AdminBibliotecaLeisEstaduais /></PageTransition></ProtectedRoute>} />
          <Route path="/admin-biblioteca-leis/geral" element={<ProtectedRoute><PageTransition><AdminBibliotecaLeisGeral /></PageTransition></ProtectedRoute>} />
          <Route path="/admin-buscador-leis" element={<ProtectedRoute><PageTransition><AdminBuscadorLeis /></PageTransition></ProtectedRoute>} />
          <Route path="/admin-concorrentes" element={<ProtectedRoute><PageTransition><AdminConcorrentes /></PageTransition></ProtectedRoute>} />
          <Route path="/admin-concorrentes/:id" element={<ProtectedRoute><PageTransition><AdminConcorrenteDetalhe /></PageTransition></ProtectedRoute>} />


          <Route path="/desktop" element={<PageTransition><DesktopPromo /></PageTransition>} />
          <Route path="/modo-offline" element={<ProtectedRoute><PageTransition><ModoOffline /></PageTransition></ProtectedRoute>} />
          <Route path="/modo-offline/pacotes" element={<ProtectedRoute><PageTransition><PacotesOffline /></PageTransition></ProtectedRoute>} />
          <Route path="/modo-offline/leis-e-narracoes" element={<ProtectedRoute><PageTransition><ModoOfflineLeis /></PageTransition></ProtectedRoute>} />
          <Route path="/modo-offline/leis" element={<Navigate to="/modo-offline/leis-e-narracoes" replace />} />
          <Route path="/modo-offline/livros" element={<ProtectedRoute><PageTransition><ModoOfflineLivros /></PageTransition></ProtectedRoute>} />
          <Route path="/modo-offline/audioaulas" element={<ProtectedRoute><PageTransition><ModoOfflineAudioaulas /></PageTransition></ProtectedRoute>} />
          <Route path="/modo-offline/leis-cantadas" element={<ProtectedRoute><PageTransition><ModoOfflineLeisCantadas /></PageTransition></ProtectedRoute>} />
          <Route path="/modo-offline/apresentacoes" element={<ProtectedRoute><PageTransition><ModoOfflineApresentacoes /></PageTransition></ProtectedRoute>} />
          <Route path="/admin-secrets" element={<ProtectedRoute><PageTransition><AdminSecretsDownload /></PageTransition></ProtectedRoute>} />
          <Route path="/admin-apple-csr" element={<ProtectedRoute><PageTransition><AdminAppleCsr /></PageTransition></ProtectedRoute>} />
          <Route path="/admin-passo-a-passo-lojas" element={<ProtectedRoute><PageTransition><AdminPassoAPassoLojas /></PageTransition></ProtectedRoute>} />
          <Route path="/admin-lojas" element={<ProtectedRoute><PageTransition><AdminPassoAPassoLojas /></PageTransition></ProtectedRoute>} />
          <Route path="/admin-handoff" element={<ProtectedRoute><PageTransition><AdminHandoffIA /></PageTransition></ProtectedRoute>} />
          <Route path="/admin-transferencia-app" element={<ProtectedRoute><PageTransition><AdminTransferenciaApp /></PageTransition></ProtectedRoute>} />
          <Route path="/assistente" element={<ProtectedRoute><PageTransition><AssistenteApp /></PageTransition></ProtectedRoute>} />
          <Route path="/assistente-horus" element={<ProtectedRoute><PageTransition><AssistenteHorus /></PageTransition></ProtectedRoute>} />

          <Route path="/pessoal/avisos" element={<ProtectedRoute><PageTransition><PessoalAvisos /></PageTransition></ProtectedRoute>} />
          <Route path="/pessoal/grifos" element={<ProtectedRoute><PageTransition><PessoalGrifos /></PageTransition></ProtectedRoute>} />
          <Route path="/pessoal/artigos" element={<ProtectedRoute><PageTransition><PessoalArtigos /></PageTransition></ProtectedRoute>} />
          <Route path="/pessoal/leis" element={<ProtectedRoute><PageTransition><PessoalLeis /></PageTransition></ProtectedRoute>} />
          <Route path="/pessoal/anotacoes" element={<ProtectedRoute><PageTransition><PessoalAnotacoes /></PageTransition></ProtectedRoute>} />
          <Route path="/pessoal/livros" element={<ProtectedRoute><PageTransition><PessoalLivros /></PageTransition></ProtectedRoute>} />
          <Route path="/pessoal/filmes" element={<ProtectedRoute><PageTransition><PessoalFilmes /></PageTransition></ProtectedRoute>} />
          <Route path="/pessoal/jurisprudencias" element={<ProtectedRoute><PageTransition><PessoalJurisprudencias /></PageTransition></ProtectedRoute>} />
          <Route path="/pessoal/tematicas" element={<ProtectedRoute><PageTransition><PessoalTematicas /></PageTransition></ProtectedRoute>} />
          <Route path="/meu-espaco" element={<ProtectedRoute><PageTransition><MeuEspaco /></PageTransition></ProtectedRoute>} />
          <Route path="/homepage/meu-espaco" element={<ProtectedRoute><PageTransition><MeuEspaco /></PageTransition></ProtectedRoute>} />
          <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />

          </Routes>
        </AnimatePresence>
      </Suspense>
    </div>
  );
}

// Importação do AppBootSplash
import { CustomSplashScreen } from "@/components/CustomSplashScreen";

function AppBootSplash() {
  const [show, setShow] = useState(true);
  return (
    <AnimatePresence>
      {show && <CustomSplashScreen onComplete={() => setShow(false)} />}
    </AnimatePresence>
  );
}

const App = () => (
  <ErrorBoundary>
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister: queryPersister as any,
        maxAge: 24 * 60 * 60 * 1000,
        dehydrateOptions: {
          shouldDehydrateQuery: (q) => {
            const k = q.queryKey?.[0];
            // Persistir só dados baratos e úteis pra abertura instantânea
            return k === 'biblioteca-colecao' || k === 'blog-posts' || k === 'noticias';
          },
        },
      }}
    >
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider>
          <ThemeProvider>
            <AppBootSplash />
            <TooltipProvider>
              <SkipToContent />
              <Sonner />

              <Analytics />
              <SpeedInsights />
              <AnalyticsDebugPanel />

              <OfflineStatusBadge />
              <OfflineWatcher />
              
              <GeofencePresenceBanner />
              <ReminderInAppBanner />
              <InAppPushPopup />
              <HorusTakeoverNoticeDialog />
              {/* <IntroOverlay /> — desativado por preferência (splash estático) */}
              <RecordingProvider>
                <LeisCantadasPlayerProvider>
                  <AudioaulasPlayerProvider>
                    <VideoaulasPlayerProvider>
                      <ResumoLivroPlayerProvider>
                        <AnimatedRoutes />
                        <LazyMediaPlayers />
                      </ResumoLivroPlayerProvider>
                    </VideoaulasPlayerProvider>
                  </AudioaulasPlayerProvider>
                </LeisCantadasPlayerProvider>
              </RecordingProvider>



            </TooltipProvider>
          </ThemeProvider>
        </AuthProvider>
      </Router>
    </PersistQueryClientProvider>
  </ErrorBoundary>
);

export default App;
