import { lazy, Suspense, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { initAnalytics, trackPageview, setAnalyticsUserWithProfile } from "@/lib/analytics";
import { useScreenTracking } from "@/lib/screenTracking";
import { initNavTelemetry, markRouteChange } from "@/lib/navTelemetry";
import { prefetchNearby } from "@/lib/nearbyPrefetch";

// IntroOverlay desativado: o app agora usa apenas o splash nativo estÃ¡tico.
// import IntroOverlay from "@/components/IntroOverlay";
import { SkipToContent } from "@/components/a11y/SkipToContent";
const AnalyticsDebugPanel = lazy(() => import("@/components/AnalyticsDebugPanel"));
import { Capacitor } from '@capacitor/core';




// Boot GA4 o mais cedo possÃ­vel (Consent Mode v2 default = denied).
if (typeof window !== "undefined") {
  initAnalytics();
  initNavTelemetry();
  import("@/lib/enableMouseDragScroll").then((m) => m.enableMouseDragScroll());
  import("@/lib/appMetrics").then((m) => m.startAppMetrics());
}
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { get as idbGet, set as idbSet, del as idbDel } from "idb-keyval";
import { BrowserRouter, HashRouter, Route, Routes, Navigate, useLocation, useNavigate, useParams } from "react-router-dom";

// Electron e GitHub Pages (subpastas como /APP.PRIME/) usam HashRouter (/#/rota)
// para evitar erro 404 em assets e rotas estÃ¡ticas.
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
import brasaoImgAsset from '@/assets/brasao-republica.webp';
const brasaoImg = brasaoImgAsset;
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { RecordingProvider } from "@/contexts/RecordingContext";
import { LeisCantadasPlayerProvider } from "@/contexts/LeisCantadasPlayerContext";
import GlobalLeisCantadasMiniPlayer from "@/components/leis-cantadas/GlobalLeisCantadasMiniPlayer";
import { AudioaulasPlayerProvider } from "@/contexts/AudioaulasPlayerContext";
import GlobalAudioaulasMiniPlayer from "@/components/audioaulas/GlobalAudioaulasMiniPlayer";
import { ResumoLivroPlayerProvider } from "./contexts/ResumoLivroPlayerContext.tsx";
import { PilulasPlayerProvider } from "@/contexts/PilulasPlayerContext";
import { GlobalResumoMiniPlayer } from "./components/biblioteca/GlobalResumoMiniPlayer.tsx";
import ResumoLivroAudioSheet from "./components/biblioteca/ResumoLivroAudioSheet.tsx";
import { VideoaulasPlayerProvider } from "@/contexts/VideoaulasPlayerContext";
import GlobalVideoaulaMiniPlayer from "@/components/videoaulas/GlobalVideoaulaMiniPlayer";
const GeofencePresenceBanner = lazy(() => import("@/components/GeofencePresenceBanner"));
const ReminderInAppBanner = lazy(() => import("@/components/ReminderInAppBanner"));
const InAppPushPopup = lazy(() => import("@/components/ui/InAppPushPopup"));
const HorusTakeoverNoticeDialog = lazy(() => import("@/components/horus/HorusTakeoverNoticeDialog"));
const ForceUpdateScreen = lazy(() => import("@/components/ForceUpdateScreen"));
import { useAppUpdateStore } from "@/lib/appUpdateStore";

function ForceUpdateWrapper() {
  const isUpdateRequired = useAppUpdateStore((s) => s.isUpdateRequired);
  return (
    <AnimatePresence>
      {isUpdateRequired && <ForceUpdateScreen />}
    </AnimatePresence>
  );
}

// Eagerly loaded (critical path)
const Index = lazy(() => import("./pages/Index.tsx"));
const PersistentHome = lazy(() => import("./components/PersistentHome"));
const Auth = lazy(() => import("./pages/Auth.tsx"));
const Landing = lazy(() => import('@/pages/Landing'));
const PilulasLista = lazy(() => import('@/pages/pilulas/PilulasLista'));
const SmartLink = lazy(() => import("./pages/SmartLink.tsx"));
const ResetPassword = lazy(() => import("./pages/ResetPassword.tsx"));
const Onboarding = lazy(() => import("./pages/Onboarding.tsx"));

const QuestoesHistorico = lazy(() => import('@/pages/QuestoesHistorico'));
const AdminFuncoes = lazy(() => import("./pages/AdminFuncoes.tsx"));
const AdminPush = lazy(() => import("./pages/AdminPush.tsx"));
const AdminPushSection = lazy(() => import("./pages/AdminPushSection.tsx"));
const AdminLaboratorio = lazy(() => import("./pages/AdminLaboratorio.tsx"));
const AdminPilulas = lazy(() => import("./pages/AdminPilulas.tsx"));
const AdminResumoLivroAudioEditar = lazy(() => import("./pages/AdminResumoLivroAudioEditar.tsx"));
const AdminErrosQuestoes = lazy(() => import("./pages/AdminErrosQuestoes.tsx"));
const AdminVadeMecumHistorico = lazy(() => import('./pages/AdminVadeMecumHistorico.tsx'));
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

// Lazy loaded
const CategoriaLegislacao = lazy(() => import("./pages/CategoriaLegislacao.tsx"));
const ResumosJuridicosJurisprudencia = lazy(() => import("./pages/resumos-juridicos/ResumosJuridicosJurisprudencia.tsx"));
const Noticias = lazy(routePrefetch.noticias);
const Novidades = lazy(() => import("./pages/Novidades.tsx"));
const Anotacoes = lazy(() => import("./pages/Anotacoes.tsx"));
const AvaliacaoInteligente = lazy(() => import("./pages/graficos/AvaliacaoInteligente.tsx"));
const PessoalAvisos = lazy(() => import("./pages/pessoal/Avisos.tsx"));
const PessoalGrifos = lazy(() => import("./pages/pessoal/Grifos.tsx"));
const PessoalArtigos = lazy(() => import("./pages/pessoal/Artigos.tsx"));
const PessoalLeis = lazy(() => import("./pages/pessoal/Leis.tsx"));
const PessoalAnotacoes = lazy(() => import("./pages/pessoal/Anotacoes.tsx"));
const PessoalLivros = lazy(() => import("./pages/pessoal/Livros.tsx"));
const PessoalFilmes = lazy(() => import("./pages/pessoal/Filmes.tsx"));
const PessoalJurisprudencias = lazy(() => import("./pages/pessoal/Jurisprudencias.tsx"));
const PessoalTematicas = lazy(() => import("./pages/pessoal/Tematicas.tsx"));
const MeuEspaco = lazy(() => import("./pages/MeuEspaco.tsx"));

const MeusDownloads = lazy(() => import("./pages/MeusDownloads.tsx"));
const MinhasLeituras = lazy(() => import("./pages/MinhasLeituras.tsx"));
const MeusResumos = lazy(() => import("./pages/MeusResumos.tsx"));
const MinhasVideoaulas = lazy(() => import("./pages/MinhasVideoaulas.tsx"));

const ModoAula = lazy(() => import("./pages/ModoAula.tsx"));
const ModoAulaSessao = lazy(() => import("./pages/ModoAulaSessao.tsx"));
const ModoAulaAula = lazy(() => import("./pages/ModoAulaAula.tsx"));
const MeExplique = lazy(() => import("./pages/MeExplique.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));
const Configuracoes = lazy(() => import("./pages/Configuracoes.tsx"));
const RadarDeputados = lazy(() => import("./pages/RadarDeputados.tsx"));
const RadarVotacoes = lazy(() => import("./pages/RadarVotacoes.tsx"));
const RadarRankings = lazy(() => import("./pages/RadarRankings.tsx"));
const RadarProposicoes = lazy(() => import("./pages/RadarProposicoes.tsx"));
const RadarCategorias = lazy(() => import("./pages/RadarCategorias.tsx"));
const RadarEmAlta = lazy(() => import("./pages/RadarEmAlta.tsx"));
const RadarDeputadoDetalhe = lazy(() => import("./pages/RadarDeputadoDetalhe.tsx"));
const LegislacaoEstadual = lazy(() => import("./pages/LegislacaoEstadual.tsx"));
const EstadoDetalhe = lazy(() => import("./pages/EstadoDetalhe.tsx"));
const LeiEstadualView = lazy(() => import("./pages/LeiEstadualView.tsx"));
const ExplicacaoLei = lazy(() => import("./pages/ExplicacaoLei.tsx"));
const RadarPLDetalhe = lazy(() => import("./pages/RadarPLDetalhe.tsx"));
const NarracaoLei = lazy(() => import("./pages/NarracaoLei.tsx"));
const VisualJuridico = lazy(() => import("./pages/VisualJuridico.tsx"));
const GrafoArtigos = lazy(() => import("./pages/GrafoArtigos.tsx"));
const Ferramentas = lazy(routePrefetch.ferramentas);
const PeticaoInicial = lazy(() => import("./pages/PeticaoInicial.tsx"));
const PeticaoInicialEditor = lazy(() => import("./pages/PeticaoInicialEditor.tsx"));
const PlanoEstudos = lazy(() => import("./pages/ferramentas/PlanoEstudos.tsx"));
const STFDashboard = lazy(() => import("./pages/ferramentas/STFDashboard.tsx"));
const STFBiografias = lazy(() => import("./pages/ferramentas/STFBiografias.tsx"));
const STFNoticias = lazy(() => import("./pages/ferramentas/STFNoticias.tsx"));
const SessoesSTF = lazy(() => import("./pages/ferramentas/SessoesSTF.tsx"));
const SessaoSTFDetalhes = lazy(() => import("./pages/ferramentas/SessaoSTFDetalhes.tsx"));
const LocaisJuridicos = lazy(() => import("./pages/LocaisJuridicos.tsx"));
const Documentos = lazy(() => import("./pages/Documentos.tsx"));
const DicionarioJuridicoPage = lazy(routePrefetch.dicionario);
const AdminLocais = lazy(() => import("./pages/AdminLocais.tsx"));
const TematicaJuridica = lazy(routePrefetch.tematica);
const Compartilhado = lazy(() => import("./pages/Compartilhado.tsx"));
const Radar360 = lazy(routePrefetch.radar360);
const OutrasNormasLista = lazy(() => import("./pages/OutrasNormasLista.tsx"));
const Radares = lazy(routePrefetch.radares);
const Praticar = lazy(routePrefetch.praticar);
const PraticarArea = lazy(() => import("./pages/PraticarArea.tsx"));
const PraticarLei = lazy(() => import("./pages/PraticarLei.tsx"));
const PraticarSessao = lazy(() => import("./pages/PraticarSessao.tsx"));
const Estudar = lazy(routePrefetch.estudos);
const EstudosHub = lazy(() => import("./pages/EstudosHub.tsx"));
const Aprender = lazy(routePrefetch.aprender);
const VadeMecum = lazy(() => import("./pages/VadeMecum.tsx"));
const VadeMecumCodigos = lazy(() => import("./pages/VadeMecumCodigos.tsx"));
const VadeMecumSumulas = lazy(() => import("./pages/VadeMecumSumulas.tsx"));
const VadeMecumFavoritos = lazy(() => import("./pages/VadeMecumFavoritos.tsx"));
const VadeMecumRecentes = lazy(() => import("./pages/VadeMecumRecentes.tsx"));

const ArtigoEducacional = lazy(() => import("./pages/ArtigoEducacional.tsx"));
const ForcaPage = lazy(() => import("./pages/gamificacao/Forca.tsx"));
const CategoriaAprender = lazy(() => import("./pages/CategoriaAprender.tsx"));
const AprenderArea = lazy(() => import("./pages/AprenderArea.tsx"));
const AprenderTeoria = lazy(() => import("./pages/AprenderTeoria.tsx"));
const AprenderTrilhas = lazy(() => import("./pages/AprenderTrilhas.tsx"));
const AprenderQuestoes = lazy(() => import("./pages/AprenderQuestoes.tsx"));
const AprenderFlashcards = lazy(() => import("./pages/AprenderFlashcards.tsx"));
const Flashcards = lazy(() => import("./pages/Flashcards.tsx"));
const FlashcardsCargos = lazy(() => import("./pages/FlashcardsCargos.tsx"));
const FlashcardsCargosDetalhes = lazy(() => import("./pages/FlashcardsCargosDetalhes.tsx"));
const FlashcardsEstudo = lazy(() => import("./pages/FlashcardsEstudo.tsx"));
const FlashcardsRevisar = lazy(() => import("./pages/FlashcardsRevisar.tsx"));
const FlashcardsCornell = lazy(() => import("./pages/FlashcardsCornell.tsx"));
const FlashcardsDecks = lazy(() => import("./pages/FlashcardsDecks.tsx"));
const FlashcardsPersonalizado = lazy(() => import("./pages/flashcards/FlashcardsPersonalizado.tsx"));
const FlashcardsDesafios = lazy(() => import("./pages/FlashcardsDesafios.tsx"));
const FlashcardsTrilhas = lazy(() => import("./pages/FlashcardsTrilhas.tsx"));
const FlashcardsProgresso = lazy(() => import("./pages/FlashcardsProgresso.tsx"));
const FlashcardsHistorico = lazy(() => import("./pages/flashcards/FlashcardsHistorico.tsx"));
const FlashcardsMaterias = lazy(() => import("./pages/flashcards/FlashcardsMaterias.tsx"));
const FlashcardsLeis = lazy(() => import("./pages/flashcards/FlashcardsLeis.tsx"));
const FlashcardsJurisprudencia = lazy(() => import("./pages/flashcards/FlashcardsJurisprudencia.tsx"));
const FlashcardsTermos = lazy(() => import("./pages/flashcards/FlashcardsTermos.tsx"));
const FlashcardsFilosofos = lazy(() => import("./pages/flashcards/FlashcardsFilosofos.tsx"));
const FlashcardsJuristas = lazy(() => import("./pages/flashcards/FlashcardsJuristas.tsx"));
const FlashcardsPrazos = lazy(() => import("./pages/flashcards/FlashcardsPrazos.tsx"));
const FlashcardsExcecoes = lazy(() => import("./pages/flashcards/FlashcardsExcecoes.tsx"));
const FlashcardsClassificacoes = lazy(() => import("./pages/flashcards/FlashcardsClassificacoes.tsx"));
const VideoaulasLeiSeca = lazy(() => import('./pages/VideoaulasLeiSeca'));
const VideoaulasLeiSecaCategoria = lazy(() => import('./pages/VideoaulasLeiSecaCategoria'));
const VideoaulasLeiSecaArtigos = lazy(() => import('./pages/VideoaulasLeiSecaArtigos'));
const Videoaulas = lazy(routePrefetch.videoaulas);
const VideoaulasCategorias = lazy(routePrefetch.videoaulasCategorias);
const VideoaulasCatalogo = lazy(routePrefetch.videoaulasCatalogo);
const VideoaulasArea = lazy(routePrefetch.videoaulasArea);
const VideoaulasPraticar = lazy(() => import('@/pages/VideoaulasPraticar'));
const VideoaulasAnotacoes = lazy(() => import('@/pages/VideoaulasAnotacoes'));
const VideoaulasConquistas = lazy(routePrefetch.videoaulasConquistas);
const VideoaulaView = lazy(routePrefetch.videoaulaView);
const VideoaulasLista = lazy(routePrefetch.videoaulasLista);
const VideoaulasTrilhas = lazy(routePrefetch.videoaulasTrilhas);
const VideoaulasCatalogoTrilha = lazy(routePrefetch.videoaulasCatalogoTrilha);

const VideoaulasConcurso = lazy(() => import("./pages/VideoaulasConcurso.tsx"));
const AprenderDesempenho = lazy(() => import("./pages/AprenderDesempenho.tsx"));
const AprenderAula = lazy(() => import("./pages/AprenderAula.tsx"));
const AprenderModulo = lazy(routePrefetch.aprenderModulo);
const JurisprudenciaArtigo = lazy(() => import("./pages/JurisprudenciaArtigo.tsx"));
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
const AdminPesquisasProntas = lazy(() => import("./pages/AdminPesquisasProntas.tsx"));
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
import { LazyMediaPlayers } from "./components/layout/LazyMediaPlayers.tsx";
const ResumosJuridicosAreas = lazy(routePrefetch.resumosJuridicos);
const ResumosMaterias = lazy(() => import("./pages/resumos-juridicos/ResumosMaterias.tsx"));
const ResumosLeis = lazy(() => import("./pages/resumos-juridicos/ResumosLeis.tsx"));
const ResumosJurisprudencia = lazy(() => import("./pages/resumos-juridicos/ResumosJurisprudencia.tsx"));
const ResumosJuridicosTemas = lazy(routePrefetch.resumosJuridicosTemas);
const ResumosJuridicosSubtemas = lazy(routePrefetch.resumosJuridicosSubtemas);
const ResumosJuridicosLista = lazy(routePrefetch.resumosJuridicosLista);
const LeiSecaIndex = lazy(routePrefetch.leiSeca);
const LeiSecaTrilha = lazy(routePrefetch.leiSecaTrilha);
const LeiSecaParte = lazy(routePrefetch.leiSecaParte);
const Magistratura = lazy(() => import("./pages/resumos-juridicos/cargos/Magistratura.tsx"));
const Oab = lazy(() => import("./pages/resumos-juridicos/cargos/Oab.tsx"));
const MinisterioPublico = lazy(() => import("./pages/resumos-juridicos/cargos/MinisterioPublico.tsx"));
const CarreiraPolicial = lazy(() => import("./pages/resumos-juridicos/cargos/CarreiraPolicial.tsx"));

// Remonta a pÃ¡gina quando o slug/parte muda â€” evita reaproveitar o render da lei anterior.
function LeiSecaTrilhaRoute() {
  const { slug = "" } = useParams();
  return <LeiSecaTrilha key={slug} />;
}
function LeiSecaParteRoute() {
  const { slug = "", parte = "" } = useParams();
  return <LeiSecaParte key={`${slug}/${parte}`} />;
}
const LeiSecaPlayer = lazy(routePrefetch.leiSecaPlayer);
const LeiSecaLembretes = lazy(routePrefetch.leiSecaLembretes);

const AdminMonitor = lazy(() => import("./pages/AdminMonitor.tsx"));
const Perfil = lazy(() => import("./pages/Perfil.tsx"));
const SobreApp = lazy(() => import("./pages/SobreApp.tsx"));
const GeradorPost = lazy(() => import("./pages/GeradorPost.tsx"));
const Blog = lazy(routePrefetch.blog);
const Newsletter = lazy(() => import("./pages/Newsletter.tsx"));
const DesktopLinkConfirm = lazy(() => import("./pages/DesktopLinkConfirm.tsx"));
// Biblioteca â€” lazy para nÃ£o inflar o bundle de boot
const Bibliotecas = lazy(() => import("./pages/Bibliotecas.tsx"));
const BibliotecaCategoria = lazy(() => import("./pages/BibliotecaCategoria.tsx"));
const BibliotecaOffline = lazy(() => import("./pages/BibliotecaOffline.tsx"));
const BibliotecaTrilhas = lazy(() => import("./pages/BibliotecaTrilhas.tsx"));

const CompressaoImagens = lazy(() => import("./pages/CompressaoImagens.tsx"));
const AdminFuncoesAssinantes = lazy(() => import("./pages/AdminFuncoesAssinantes.tsx"));
const AdminRankingFuncoes = lazy(() => import("./pages/AdminRankingFuncoes.tsx"));
const AdminInstagramPosts = lazy(() => import("./pages/AdminInstagramPosts.tsx"));
const AdminVadeMecum = lazy(() => import("./pages/AdminVadeMecum.tsx"));
const AdminLembretes = lazy(() => import("./pages/AdminLembretes.tsx"));
const AdminLembretesBiblioteca = lazy(() => import("./pages/AdminLembretesBiblioteca.tsx"));
const AdminNarracaoConteudo = lazy(() => import("./pages/AdminNarracaoConteudo.tsx"));
const AdminNarracaoBiblioteca = lazy(() => import("./pages/AdminNarracaoBiblioteca.tsx"));
const AdminNarracaoBlog = lazy(() => import("./pages/AdminNarracaoBlog.tsx"));
const AdminNarracaoApresentacao = lazy(() => import("./pages/AdminNarracaoApresentacao.tsx"));
const ApresentacaoPlayer = lazy(() => import("./pages/ApresentacaoPlayer.tsx"));
const Apresentacoes = lazy(() => import("./pages/Apresentacoes.tsx"));
const AdminApresentacaoEditar = lazy(() => import("./pages/AdminApresentacaoEditar.tsx"));
const AdminAssinantes = lazy(() => import("./pages/AdminAssinantes.tsx"));
const AdminFunil = lazy(() => import("./pages/AdminFunil.tsx"));
const AdminMonitorUsuarios = lazy(() => import("./pages/AdminMonitorUsuarios.tsx"));
const AdminMonitoramento = lazy(() => import("./pages/AdminMonitoramento.tsx"));
const AdminMonitorApis = lazy(() => import("./pages/AdminMonitorApis.tsx"));
const AdminAtualizacao = lazy(() => import("./pages/AdminAtualizacao.tsx"));
const AdminNativeAssets = lazy(() => import("./pages/AdminNativeAssets.tsx"));
const AdminAprender = lazy(() => import("./pages/AdminAprender.tsx"));
const AdminAvaliacaoLoja = lazy(() => import("./pages/AdminAvaliacaoLoja.tsx"));
const AdminAprenderArea = lazy(() => import("./pages/AdminAprenderArea.tsx"));
const AdminJurisprudencia = lazy(() => import("./pages/AdminJurisprudencia.tsx"));
const TribunalSimulado = lazy(() => import("./pages/TribunalSimulado.tsx"));
const AdminHorus = lazy(() => import('./pages/AdminHorus'));
const AdminHorusTemplate = lazy(() => import('./pages/AdminHorusTemplate'));
const AdminTriagem = lazy(() => import('./pages/AdminTriagem'));
const HorusWhatsApp = lazy(() => import("./pages/HorusWhatsApp.tsx"));
const AdminBlogEdicao = lazy(() => import("./pages/AdminBlogEdicao.tsx"));
const AdminFlashcardsEditar = lazy(() => import("./pages/AdminFlashcardsEditar.tsx"));
const AdminDesignImagens = lazy(() => import("./pages/AdminDesignImagens.tsx"));
const AdminHeroHome = lazy(() => import("./pages/AdminHeroHome.tsx"));
const AdminHomeCuriosidades = lazy(() => import("./pages/AdminHomeCuriosidades.tsx"));
const AdminOverlayFrases = lazy(() => import("./pages/AdminOverlayFrases.tsx"));
const BibliotecaEditar = lazy(() => import("./pages/BibliotecaEditar.tsx"));
const BibliotecaCaderno = lazy(() => import("./pages/BibliotecaCaderno.tsx"));
const AdminLeituraNativa = lazy(() => import("./pages/AdminLeituraNativa.tsx"));
const AdminAudioaulas = lazy(() => import("./pages/AdminAudioaulas.tsx"));
const Audioaulas = lazy(routePrefetch.audioaulas);
const LeisCantadas = lazy(() => import("./pages/LeisCantadas.tsx"));
const AdminLeisCantadas = lazy(() => import("./pages/AdminLeisCantadas.tsx"));
const AdminConteudoFila = lazy(() => import("./pages/AdminConteudoFila.tsx"));
const Assinatura = lazy(() => import("./pages/Assinatura.tsx"));
const PlanosAtivos = lazy(() => import("./pages/PlanosAtivos.tsx"));
const DesktopPromo = lazy(routePrefetch.desktop);
const AdminRadaresLeis = lazy(() => import("./pages/AdminRadaresLeis.tsx"));
const AdminBibliotecaLeis = lazy(() => import("./pages/AdminBibliotecaLeis.tsx"));
const AdminBibliotecaLeisEstaduais = lazy(() => import("./pages/AdminBibliotecaLeisEstaduais.tsx"));
const AdminBibliotecaLeisGeral = lazy(() => import("./pages/AdminBibliotecaLeisGeral.tsx"));
const AdminBuscadorLeis = lazy(() => import("./pages/AdminBuscadorLeis.tsx"));
const NovidadesRadarOverlay = lazy(() => import("./components/NovidadesRadarOverlay"));
const GlobalDesktopHeader = lazy(() => import("./components/layout/GlobalDesktopHeader"));
const DesktopFileDropOverlay = lazy(() => import("./components/desktop/DesktopFileDropOverlay"));
const ModoOffline = lazy(() => import("./pages/ModoOffline.tsx"));
const ModoOfflineLeis = lazy(() => import("./pages/ModoOfflineLeis.tsx"));
const ModoOfflineLivros = lazy(() => import("./pages/ModoOfflineLivros.tsx"));
const ModoOfflineAudioaulas = lazy(() => import("./pages/ModoOfflineAudioaulas.tsx"));
const ModoOfflineLeisCantadas = lazy(() => import("./pages/ModoOfflineLeisCantadas.tsx"));
const ModoOfflineApresentacoes = lazy(() => import("./pages/ModoOfflineApresentacoes.tsx"));
const AdminSecretsDownload = lazy(() => import("./pages/AdminSecretsDownload.tsx"));
const AdminAppleCsr = lazy(() => import("./pages/AdminAppleCsr.tsx"));

const AdminHandoffIA = lazy(() => import("./pages/AdminHandoffIA.tsx"));
const AdminTransferenciaApp = lazy(() => import("./pages/AdminTransferenciaApp.tsx"));
const BoletinsJuridicos = lazy(routePrefetch.boletins);
const AdminBoletins = lazy(() => import("./pages/AdminBoletins.tsx"));
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
const Lembretes = lazy(() => import("./pages/Lembretes.tsx"));
const CentralLembretes = lazy(() => import("./pages/CentralLembretes.tsx"));
const MeusLembretes = lazy(() => import("./pages/MeusLembretes.tsx"));
const LembretesMeus = lazy(() => import("./pages/lembretes/LembretesMeus.tsx"));
const LembretesVideoaulas = lazy(() => import("./pages/lembretes/LembretesVideoaulas.tsx"));
const LembretesResumos = lazy(() => import("./pages/lembretes/LembretesResumos.tsx"));
const LembretesLeitura = lazy(() => import("./pages/lembretes/LembretesLeitura.tsx"));
const LembretesQuestoesTab = lazy(() => import("./pages/lembretes/LembretesQuestoes.tsx"));
const Suporte = lazy(() => import("./pages/Suporte.tsx"));
const SuportePublico = lazy(() => import("./pages/SuportePublico.tsx"));
const AdminSuporte = lazy(() => import("./pages/AdminSuporte.tsx"));
const Opiniao = lazy(() => import("./pages/Opiniao.tsx"));
const LembretesLocal = lazy(() => import("./pages/LembretesLocal.tsx"));
const PreferenciasLembretes = lazy(() => import("./pages/PreferenciasLembretes.tsx"));
const AnotacoesAudio = lazy(() => import("./pages/AnotacoesAudio.tsx"));
const AssistenteApp = lazy(() => import("./pages/AssistenteApp.tsx"));
const AssistenteHorus = lazy(() => import("./pages/AssistenteHorus.tsx"));



const preloadImage = new Image();
preloadImage.src = brasaoImg;
preloadImage.decoding = 'async';

function ProtectedRoute({ children, requireOnboarding = true }: { children: React.ReactNode; requireOnboarding?: boolean }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Leitura sÃ­ncrona do cache â€” nÃ£o bloqueia o paint.
  const cacheKey = user ? `onboarding_completed:${user.id}` : null;
  const cachedDone = cacheKey && typeof window !== 'undefined'
    ? localStorage.getItem(cacheKey) === '1'
    : false;

  // Otimista pÃ³s-cadastro: se acabou de criar conta nesta sessÃ£o, jÃ¡ assume
  // que precisa passar pela triagem â€” evita query desnecessÃ¡ria de 1.2s+
  // enquanto o Supabase ainda nÃ£o criou o perfil.
  const justSignedUp =
    typeof window !== 'undefined' && window.sessionStorage.getItem('just_signed_up') === '1';

  const [needsOnboarding, setNeedsOnboarding] = useState(justSignedUp);
  // Se justSignedUp, jÃ¡ sabemos que precisa de triagem â€” nÃ£o travar a tela
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

    // Acabou de criar conta â€” nÃ£o precisa consultar o Supabase para saber
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
        // Tenta algumas vezes antes de decidir, para nÃ£o liberar o app por engano.
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
    // Sem tela preta com spinner: sÃ³ um frame vazio enquanto o retorno de
    // OAuth Ã© processado (caso raro).
    return null;
  }


  if (!user) {
    return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
  }

  // Removido o bloqueio estrito `if (!initialCheckDone) return null;` para 
  // permitir que a UI principal (Home) renderize de forma otimista, eliminando a
  // tela preta e o "engasgo" de dezenas de nÃ³s DOM sendo montados de uma vez
  // apÃ³s o timeout do Supabase. O cache ou a flag justSignedUp jÃ¡ resolvem 99% dos casos.

  // Redireciona para /onboarding se a triagem estÃ¡ pendente, MAS apenas quando
  // NÃƒO estamos jÃ¡ em /onboarding (senÃ£o o <Onboarding /> nunca renderizaria
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
    // Adia a inicializaÃ§Ã£o de trackers pesados para liberar a main thread no boot
    const t = setTimeout(() => setMounted(true), 1500);
    return () => clearTimeout(t);
  }, []);

  if (!mounted) return null;
  return <PresenceWrapperInner user={user} />;
}

function NativeBootstrap() {
  useNativePermissions();
  useEffect(() => {
    // Adia tudo para apÃ³s o primeiro paint â€” nÃ£o compete pela primeira renderizaÃ§Ã£o.
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
      // setTimeout pequeno para nÃ£o colidir com o render inicial do react-router
      setTimeout(() => navigate(pending), 10);
    }

    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { path?: string } | undefined;
      if (detail?.path) navigate(detail.path);
      (window as any)._pendingPushUrl = undefined;
    };
    // Atalhos do Ã­cone do app (long-press / Quick Actions)
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

function AnimatedRoutes() {
  const location = useLocation();
  const { user } = useAuth();
  const { data: profile } = useProfileSummary();
  const qc = useQueryClient();

  // Screen tracking unificado (page_view + screen_view + scroll + screen_exit).
  useScreenTracking();

  // GA4: pageview em cada route change (mantido para compatibilidade).
  useEffect(() => {
    trackPageview(location.pathname + location.search);
    markRouteChange(location.pathname + location.search);
    prefetchNearby(location.pathname);
  }, [location.pathname, location.search]);

  // Hidrata o cache das Videoaulas (IndexedDB â†’ memÃ³ria) logo no boot, em idle:
  // ao entrar na Ã¡rea, a lista jÃ¡ pinta sem skeleton nem rede.
  useEffect(() => {
    if (!user) return;
    void import('@/lib/videoaulasStore').then((m) => {
      m.hydrateVideoaulasCache();
      m.warmVideoaulasCache();
    });
    void import('@/lib/tematicaStore').then((m) => {
      m.hydrateTematicaCache();
      m.warmTematicaCache();
    });
    // Favoritos/recentes (biblioteca, leis, resumos, dicionÃ¡rio) da conta.
    void Promise.all([
      import('@/lib/leisFavoritos'),
      import('@/lib/bibliotecaTracking'),
      import('@/lib/resumosLocal'),
      import('@/hooks/useDicionarioPrefs'),
      import('@/lib/flashcardsQueries').then((m) => m.prefetchFlashcardsDashboard(qc)),
      // import('@/hooks/useQuestoes').then((m) => m.prefetchQuestoesCache()),
    ]).then(() => import('@/lib/userSync').then((m) => m.pullAllUserSync(true)));


    // PrÃ©-carrega os chunks das telas de Videoaulas em idle: navegar
    // (e voltar) passa a resolver do cache de mÃ³dulos, sem Suspense visÃ­vel.
    const carregarChunks = () => {
      (['videoaulas', 'videoaulasCatalogo', 'videoaulasArea', 'videoaulaView',
        'videoaulasCategorias', 'videoaulasTrilhas', 'videoaulasCatalogoTrilha', 'videoaulasLista',
        'videoaulaView', 'videoaulasConquistas', 'resumosJuridicos', 'resumosJuridicosTemas',
        'resumosJuridicosSubtemas', 'resumosJuridicosLista', 'audioaulas',
        'dicionario', 'biblioteca', 'bibliotecaCategoria', 'blog',
        'tematica'] as const).forEach((k) => prefetchRoute(k));
    };
    const ric = (window as any).requestIdleCallback as ((cb: () => void, o?: { timeout?: number }) => number) | undefined;
    if (ric) ric(carregarChunks, { timeout: 3000 }); else setTimeout(carregarChunks, 1200);
  }, [user]);

  // Sempre voltar ao topo ao navegar (voltar, avanÃ§ar, clique).
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

  // Sem usuÃ¡rio logado, a Home persistente nÃ£o monta.
  // Renderiza a landing imediatamente na raiz para nunca deixar tela preta,
  // mesmo enquanto a autenticaÃ§Ã£o ainda estÃ¡ resolvendo.


  const HomeGate = () => {
    if (!user) return <Landing />;
    // O PersistentHome jÃ¡ renderiza a Home para usuÃ¡rios logados.
    // Retornamos null aqui para evitar duplicaÃ§Ã£o do Index no DOM.
    return null;
  };



  const getRouteKey = (path: string) => {
    // Agrupa abas do Vade Mecum para nÃ£o acionar a transiÃ§Ã£o de pÃ¡gina inteira
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
      {user && <NovidadesRadarOverlay />}
      <GlobalDesktopHeader />
      <DesktopFileDropOverlay />
      <Suspense fallback={null}>
        <PersistentHome />
      </Suspense>
      <Suspense fallback={<LazyFallback />}>
          <Routes location={location} key={getRouteKey(location.pathname)}>
          <Route path="/auth" element={<Auth />} />
          <Route path="/landing" element={<Landing />} />

          <Route path="/ir/*" element={<SmartLink />} />
            <Route path="/admin/assinantes" element={<AdminAssinantes />} />
            <Route path="/admin/funil" element={<AdminFunil />} />
            <Route path="/admin/monitor/usuarios" element={<AdminMonitorUsuarios />} />
          <Route path="/privacidade" element={<Privacidade />} />
          <Route path="/termos" element={<Termos />} />
          <Route path="/excluir-conta" element={<ExcluirContaPublico />} />
          <Route path="/suporte-publico" element={<SuportePublico />} />

          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/desktop-link/:token" element={<DesktopLinkConfirm />} />
          <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
          <Route path="/" element={<ProtectedRoute><HomeGate /></ProtectedRoute>} />

          <Route path="/legislacao/:tipo" element={<ProtectedRoute><PageTransition><CategoriaLegislacao /></PageTransition></ProtectedRoute>} />
          <Route path="/legislacao/:tipo/:leiSlug" element={<ProtectedRoute><PageTransition><CategoriaLegislacao /></PageTransition></ProtectedRoute>} />
          <Route path="/legislacao/:tipo/:leiSlug/:artigoNumero" element={<ProtectedRoute><PageTransition><CategoriaLegislacao /></PageTransition></ProtectedRoute>} />
          <Route path="/noticias" element={<ProtectedRoute><PageTransition><Noticias /></PageTransition></ProtectedRoute>} />
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
          <Route path="/anotacoes/audio" element={<ProtectedRoute><PageTransition><AnotacoesAudio /></PageTransition></ProtectedRoute>} />
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
          <Route path="/documentos" element={<ProtectedRoute><PageTransition><Documentos /></PageTransition></ProtectedRoute>} />
          <Route path="/ferramentas/locais" element={<ProtectedRoute><PageTransition><LocaisJuridicos /></PageTransition></ProtectedRoute>} />
          <Route path="/ferramentas/dicionario" element={<ProtectedRoute><PageTransition><DicionarioJuridicoPage /></PageTransition></ProtectedRoute>} />
          <Route path="/ferramentas/stf" element={<ProtectedRoute><PageTransition><STFDashboard /></PageTransition></ProtectedRoute>} />
          <Route path="/ferramentas/stf/biografias" element={<ProtectedRoute><PageTransition><STFBiografias /></PageTransition></ProtectedRoute>} />
          <Route path="/ferramentas/stf/noticias" element={<ProtectedRoute><PageTransition><STFNoticias /></PageTransition></ProtectedRoute>} />
          <Route path="/ferramentas/stf/sessoes" element={<ProtectedRoute><PageTransition><SessoesSTF /></PageTransition></ProtectedRoute>} />
          <Route path="/ferramentas/stf/:id" element={<ProtectedRoute><PageTransition><SessaoSTFDetalhes /></PageTransition></ProtectedRoute>} />
          <Route path="/ferramentas/peticao-inicial" element={<ProtectedRoute><PageTransition><PeticaoInicial /></PageTransition></ProtectedRoute>} />
          <Route path="/ferramentas/peticao-inicial/:id" element={<ProtectedRoute><PageTransition><PeticaoInicialEditor /></PageTransition></ProtectedRoute>} />
          <Route path="/ferramentas/plano-estudos" element={<ProtectedRoute><PageTransition><PlanoEstudos /></PageTransition></ProtectedRoute>} />
          <Route path="/admin/locais" element={<ProtectedRoute><PageTransition><AdminLocais /></PageTransition></ProtectedRoute>} />
          <Route path="/pilulas" element={<ProtectedRoute><PageTransition><PilulasHome /></PageTransition></ProtectedRoute>} />
          <Route path="/pilulas/lista" element={<ProtectedRoute><PageTransition><PilulasLista /></PageTransition></ProtectedRoute>} />
          <Route path="/pilulas/deck/:deckId" element={<ProtectedRoute><PageTransition><PilulasViewer /></PageTransition></ProtectedRoute>} />
          <Route path="/tematica-juridica" element={<ProtectedRoute><PageTransition><TematicaJuridica /></PageTransition></ProtectedRoute>} />
          <Route path="/radar-360" element={<ProtectedRoute><PageTransition><Radar360 /></PageTransition></ProtectedRoute>} />
          <Route path="/normas/:slug" element={<ProtectedRoute><PageTransition><OutrasNormasLista /></PageTransition></ProtectedRoute>} />
          <Route path="/radares" element={<ProtectedRoute><PageTransition><Radares /></PageTransition></ProtectedRoute>} />
          <Route path="/praticar" element={<ProtectedRoute><PageTransition><Praticar /></PageTransition></ProtectedRoute>} />
          <Route path="/praticar/area/:areaSlug" element={<ProtectedRoute><PageTransition><PraticarArea /></PageTransition></ProtectedRoute>} />
          <Route path="/praticar/:leiSlug" element={<ProtectedRoute><PageTransition><PraticarLei /></PageTransition></ProtectedRoute>} />
          <Route path="/praticar/:leiSlug/sessao" element={<ProtectedRoute><PageTransition><PraticarSessao /></PageTransition></ProtectedRoute>} />
          <Route path="/tribunal-simulado" element={<ProtectedRoute><PageTransition><TribunalSimulado /></PageTransition></ProtectedRoute>} />
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
          <Route path="/videoaulas/lei-seca" element={<ProtectedRoute><PageTransition><VideoaulasLeiSeca /></PageTransition></ProtectedRoute>} />
          <Route path="/videoaulas/lei-seca/categoria/:categoriaId" element={<ProtectedRoute><PageTransition><VideoaulasLeiSecaCategoria /></PageTransition></ProtectedRoute>} />
          <Route path="/videoaulas/lei-seca/lei/:leiId" element={<ProtectedRoute><PageTransition><VideoaulasLeiSecaArtigos /></PageTransition></ProtectedRoute>} />
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
          {/* PÃ­lulas */}
          <Route path="/pilulas/classicos" element={<ProtectedRoute><PageTransition><Pilulas /></PageTransition></ProtectedRoute>} />
          <Route path="/pilulas/cp" element={<ProtectedRoute><PageTransition><PilulasLeiSeca slug="cp" /></PageTransition></ProtectedRoute>} />
          <Route path="/pilulas/cf" element={<ProtectedRoute><PageTransition><PilulasLeiSeca slug="cf" /></PageTransition></ProtectedRoute>} />
          <Route path="/pilulas/cc" element={<ProtectedRoute><PageTransition><PilulasLeiSeca slug="cc" /></PageTransition></ProtectedRoute>} />
          <Route path="/pilulas/:id" element={<ProtectedRoute><PageTransition><PilulasPlayer /></PageTransition></ProtectedRoute>} />
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
          <Route path="/resumos-juridicos/materias" element={<ProtectedRoute><PageTransition><ResumosMaterias /></PageTransition></ProtectedRoute>} />
          <Route path="/resumos-juridicos/leis" element={<ProtectedRoute><PageTransition><ResumosLeis /></PageTransition></ProtectedRoute>} />
          <Route path="/resumos-juridicos/jurisprudencia" element={<ProtectedRoute><PageTransition><ResumosJurisprudencia /></PageTransition></ProtectedRoute>} />
          <Route path="/resumos-juridicos/cargos/magistratura" element={<ProtectedRoute><PageTransition><Magistratura /></PageTransition></ProtectedRoute>} />
          <Route path="/resumos-juridicos/cargos/oab" element={<ProtectedRoute><PageTransition><Oab /></PageTransition></ProtectedRoute>} />
          <Route path="/resumos-juridicos/cargos/ministerio-publico" element={<ProtectedRoute><PageTransition><MinisterioPublico /></PageTransition></ProtectedRoute>} />
          <Route path="/resumos-juridicos/cargos/carreira-policial" element={<ProtectedRoute><PageTransition><CarreiraPolicial /></PageTransition></ProtectedRoute>} />
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
          <Route path="/admin/questoes" element={<ProtectedRoute><PageTransition><AdminQuestoes /></PageTransition></ProtectedRoute>} />
          <Route path="/admin/laboratorio" element={<ProtectedRoute><PageTransition><AdminLaboratorio /></PageTransition></ProtectedRoute>} />
          <Route path="/admin/pilulas" element={<ProtectedRoute><PageTransition><AdminPilulas /></PageTransition></ProtectedRoute>} />
          <Route path="/admin/resumo-livro-audio" element={<ProtectedRoute><PageTransition><AdminResumoLivroAudioEditar /></PageTransition></ProtectedRoute>} />

          <Route path="/admin-monitor" element={<ProtectedRoute><PageTransition><AdminMonitor /></PageTransition></ProtectedRoute>} />
          <Route path="/perfil" element={<ProtectedRoute><PageTransition><Perfil /></PageTransition></ProtectedRoute>} />
          <Route path="/sobre" element={<ProtectedRoute><PageTransition><SobreApp /></PageTransition></ProtectedRoute>} />
          <Route path="/gerador-post" element={<ProtectedRoute><PageTransition><GeradorPost /></PageTransition></ProtectedRoute>} />
          <Route path="/blog" element={<ProtectedRoute><PageTransition><Blog /></PageTransition></ProtectedRoute>} />
          <Route path="/newsletter" element={<ProtectedRoute><PageTransition><Newsletter /></PageTransition></ProtectedRoute>} />
          <Route path="/biblioteca" element={<ProtectedRoute><PageTransition><Bibliotecas /></PageTransition></ProtectedRoute>} />
          <Route path="/bibliotecas" element={<ProtectedRoute><PageTransition><Bibliotecas /></PageTransition></ProtectedRoute>} />
          <Route path="/biblioteca/caderno" element={<ProtectedRoute><PageTransition><BibliotecaCaderno /></PageTransition></ProtectedRoute>} />
          <Route path="/bibliotecas/trilhas" element={<ProtectedRoute><PageTransition><BibliotecaTrilhas /></PageTransition></ProtectedRoute>} />
          <Route path="/bibliotecas/:colecaoId" element={<ProtectedRoute><PageTransition><BibliotecaCategoria /></PageTransition></ProtectedRoute>} />
          <Route path="/bibliotecas/:colecaoId/:areaSlug" element={<ProtectedRoute><PageTransition><BibliotecaCategoria /></PageTransition></ProtectedRoute>} />
          <Route path="/biblioteca-offline" element={<ProtectedRoute><PageTransition><BibliotecaOffline /></PageTransition></ProtectedRoute>} />

          
          <Route path="/compressao-imagens" element={<ProtectedRoute><PageTransition><CompressaoImagens /></PageTransition></ProtectedRoute>} />
          <Route path="/admin-funcoes" element={<ProtectedRoute><PageTransition><AdminFuncoes /></PageTransition></ProtectedRoute>} />
          <Route path="/admin-instagram-posts" element={<ProtectedRoute><PageTransition><AdminInstagramPosts /></PageTransition></ProtectedRoute>} />
          <Route path="/admin-avaliacao-loja" element={<ProtectedRoute><PageTransition><AdminAvaliacaoLoja /></PageTransition></ProtectedRoute>} />
          <Route path="/admin-funcoes-assinantes" element={<ProtectedRoute><PageTransition><AdminFuncoesAssinantes /></PageTransition></ProtectedRoute>} />
          <Route path="/admin-ranking-funcoes" element={<ProtectedRoute><PageTransition><AdminRankingFuncoes /></PageTransition></ProtectedRoute>} />
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
          <Route path="/admin-monitor-usuarios" element={<ProtectedRoute><PageTransition><AdminMonitorUsuarios /></PageTransition></ProtectedRoute>} />
          <Route path="/admin-monitoramento" element={<ProtectedRoute><PageTransition><AdminMonitoramento /></PageTransition></ProtectedRoute>} />
          <Route path="/admin-monitor-apis" element={<ProtectedRoute><PageTransition><AdminMonitorApis /></PageTransition></ProtectedRoute>} />
          <Route path="/assinatura" element={<ProtectedRoute><PageTransition><Assinatura /></PageTransition></ProtectedRoute>} />
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
          <Route path="/admin-boletins" element={<ProtectedRoute><PageTransition><AdminBoletins /></PageTransition></ProtectedRoute>} />
          <Route path="/admin-erros-questoes" element={<ProtectedRoute><PageTransition><AdminErrosQuestoes /></PageTransition></ProtectedRoute>} />

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

          <Route path="/modo-aula" element={<ProtectedRoute><PageTransition><ModoAula /></PageTransition></ProtectedRoute>} />
          <Route path="/modo-aula/sessao" element={<ProtectedRoute><ModoAulaSessao /></ProtectedRoute>} />
          <Route path="/modo-aula/aula/:id" element={<ProtectedRoute><PageTransition><ModoAulaAula /></PageTransition></ProtectedRoute>} />
          <Route path="/modo-aula/disciplina/:id" element={<ProtectedRoute><PageTransition><ModoAula /></PageTransition></ProtectedRoute>} />
          <Route path="/me-explique" element={<ProtectedRoute><MeExplique /></ProtectedRoute>} />
          <Route path="/ferramentas/plano-estudos" element={<ProtectedRoute><PageTransition><PlanoEstudos /></PageTransition></ProtectedRoute>} />
          <Route path="/leis-cantadas" element={<ProtectedRoute><PageTransition><LeisCantadas /></PageTransition></ProtectedRoute>} />
          <Route path="/admin-leis-cantadas" element={<ProtectedRoute><PageTransition><AdminLeisCantadas /></PageTransition></ProtectedRoute>} />
          <Route path="/admin-conteudo-fila" element={<ProtectedRoute><PageTransition><AdminConteudoFila /></PageTransition></ProtectedRoute>} />
          <Route path="/admin-radares-leis" element={<ProtectedRoute><PageTransition><AdminRadaresLeis /></PageTransition></ProtectedRoute>} />
          <Route path="/admin-biblioteca-leis" element={<ProtectedRoute><PageTransition><AdminBibliotecaLeis /></PageTransition></ProtectedRoute>} />
          <Route path="/admin-biblioteca-leis/estadual" element={<ProtectedRoute><PageTransition><AdminBibliotecaLeisEstaduais /></PageTransition></ProtectedRoute>} />
          <Route path="/admin-biblioteca-leis/estadual/:uf" element={<ProtectedRoute><PageTransition><AdminBibliotecaLeisEstaduais /></PageTransition></ProtectedRoute>} />
          <Route path="/admin-biblioteca-leis/geral" element={<ProtectedRoute><PageTransition><AdminBibliotecaLeisGeral /></PageTransition></ProtectedRoute>} />
          <Route path="/admin-buscador-leis" element={<ProtectedRoute><PageTransition><AdminBuscadorLeis /></PageTransition></ProtectedRoute>} />


          <Route path="/desktop" element={<PageTransition><DesktopPromo /></PageTransition>} />
          <Route path="/modo-offline" element={<ProtectedRoute><PageTransition><ModoOffline /></PageTransition></ProtectedRoute>} />
          <Route path="/modo-offline/leis-e-narracoes" element={<ProtectedRoute><PageTransition><ModoOfflineLeis /></PageTransition></ProtectedRoute>} />
          <Route path="/modo-offline/livros" element={<ProtectedRoute><PageTransition><ModoOfflineLivros /></PageTransition></ProtectedRoute>} />
          <Route path="/modo-offline/audioaulas" element={<ProtectedRoute><PageTransition><ModoOfflineAudioaulas /></PageTransition></ProtectedRoute>} />
          <Route path="/modo-offline/leis-cantadas" element={<ProtectedRoute><PageTransition><ModoOfflineLeisCantadas /></PageTransition></ProtectedRoute>} />
          <Route path="/modo-offline/apresentacoes" element={<ProtectedRoute><PageTransition><ModoOfflineApresentacoes /></PageTransition></ProtectedRoute>} />
          <Route path="/admin-secrets" element={<ProtectedRoute><PageTransition><AdminSecretsDownload /></PageTransition></ProtectedRoute>} />
          <Route path="/admin-apple-csr" element={<ProtectedRoute><PageTransition><AdminAppleCsr /></PageTransition></ProtectedRoute>} />

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
          <Route path="/graficos/avaliacao" element={<ProtectedRoute><PageTransition><AvaliacaoInteligente /></PageTransition></ProtectedRoute>} />
          <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />

          </Routes>
      </Suspense>
    </div>
  );
}

// ImportaÃ§Ã£o do AppBootSplash
export default AnimatedRoutes;
