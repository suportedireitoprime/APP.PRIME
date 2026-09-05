import { lazy, Suspense, useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { initAnalytics, trackPageview, setAnalyticsUserWithProfile } from "@/lib/analytics";
import { useScreenTracking } from "@/lib/screenTracking";
import { initNavTelemetry, markRouteChange } from "@/lib/navTelemetry";
import { prefetchNearby } from "@/lib/nearbyPrefetch";

// IntroOverlay desativado: o app agora usa apenas o splash nativo estático.
// import IntroOverlay from "@/components/IntroOverlay";
import { SkipToContent } from "@/components/a11y/SkipToContent";
const AnalyticsDebugPanel = lazy(() => import("@/components/AnalyticsDebugPanel"));
import { Capacitor } from '@capacitor/core';




// Boot GA4 o mais cedo possível (Consent Mode v2 default = denied).
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
const HorusTrialEndedDialog = lazy(() => import("@/components/horus/HorusTrialEndedDialog"));
const ForceUpdateScreen = lazy(() => import("@/components/ForceUpdateScreen"));
import { useAppUpdateStore } from "@/lib/appUpdateStore";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 24 * 60 * 60 * 1000, // 24h: cache extremamente agressivo para performance máxima
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

function ForceUpdateWrapper() {
  const isUpdateRequired = useAppUpdateStore((s) => s.isUpdateRequired);
  return (
    <AnimatePresence>
      {isUpdateRequired && <ForceUpdateScreen />}
    </AnimatePresence>
  );
}

const AnimatedRoutes = lazy(() => import("./AppRoutes"));

import { CustomSplashScreen } from "@/components/CustomSplashScreen";

function AppBootSplash() {
  const [show, setShow] = useState(true);
  
  return (
    <AnimatePresence>
      {show && <CustomSplashScreen onComplete={() => setShow(false)} />}
    </AnimatePresence>
  );
}

const LazyMediaPlayers = () => (
  <>
    <GlobalLeisCantadasMiniPlayer />
    <GlobalAudioaulasMiniPlayer />
    <GlobalResumoMiniPlayer />
    <ResumoLivroAudioSheet />
    <GlobalVideoaulaMiniPlayer />
  </>
);

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
            // Persistir dados baratos e áreas fundamentais (Modo Avião / Offline nativo)
            const offlineKeys = [
              'biblioteca-colecao', 
              'blog-posts', 
              'noticias',
              'pilulas', 
              'lei-seca-trilha', 
              'lei-seca-licao', 
              'lei-seca-artigos', 
              'vademecum'
            ];
            return typeof k === 'string' && offlineKeys.includes(k);
          },
        },
      }}
    >
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider>
          <ThemeProvider>
            <RecordingProvider>
              <LeisCantadasPlayerProvider>
                <AudioaulasPlayerProvider>
                  <PilulasPlayerProvider>
                    <VideoaulasPlayerProvider>
                      <ResumoLivroPlayerProvider>
                        <Suspense fallback={null}>
                          <AppBootSplash />
                        </Suspense>
                        <TooltipProvider>
                          <SkipToContent />
                          <Sonner />

                          <Analytics />
                          <SpeedInsights />
                          <Suspense fallback={null}>
                            <AnalyticsDebugPanel />
                          </Suspense>

                          <OfflineStatusBadge />
                          <OfflineWatcher />
                          
                          <Suspense fallback={null}>
                            <GeofencePresenceBanner />
                            <ReminderInAppBanner />
                            <InAppPushPopup />
                            <HorusTakeoverNoticeDialog />
                            <HorusTrialEndedDialog />
                          </Suspense>
                          <ForceUpdateWrapper />
                          
                          <Suspense fallback={<div className="min-h-screen bg-[#0D0D0D]" />}>
                            <AnimatedRoutes />
                          </Suspense>
                          <LazyMediaPlayers />
                        </TooltipProvider>
                      </ResumoLivroPlayerProvider>
                    </VideoaulasPlayerProvider>
                  </PilulasPlayerProvider>
                </AudioaulasPlayerProvider>
              </LeisCantadasPlayerProvider>
            </RecordingProvider>
          </ThemeProvider>
        </AuthProvider>
      </Router>
    </PersistQueryClientProvider>
  </ErrorBoundary>
);

export default App;
