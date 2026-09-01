import { Capacitor } from "@capacitor/core";
import { setNativeStatusBar } from "../nativeStatusBar";
import { initCrashlytics, installGlobalErrorHandlers } from "../nativeCrashlytics";

export function bootstrapCriticalNative() {
  if (Capacitor.isNativePlatform()) {
    document.documentElement.classList.add('capacitor-native');
  }

  // Push: anexa os listeners nativos ANTES do React montar e converte o
  // parâmetro `_pc` da URL em evento de abertura. Sem isso, o toque em uma
  // notificação com o app fechado podia ser perdido antes de o hook montar.
  // NOTE: Deve rodar antes do createRoot para não perder o evento.
  import('../nativePush').then((m) => m.bootstrapNativePush()).catch(() => {});
}

export function bootstrapIdleNative() {
  // Paint the native status bar with the app's Wine theme at boot.
  setNativeStatusBar('wine');

  // Init Firebase Crashlytics (no-op em web) e handlers globais de erro.
  installGlobalErrorHandlers();
  void initCrashlytics();

  // Conectividade, atalhos, notificações, widget e background sync —
  // tudo em idle para não competir com o primeiro paint.
  const bootNative = () => {
    import('../nativo/rede').then((m) => m.iniciarMonitorRede()).catch(() => {});
    import('../nativo/atalhos').then((m) => m.registrarAtalhos()).catch(() => {});
    import('../nativo/notificacaoAcoes').then((m) => m.registrarAcoesNotificacao()).catch(() => {});
    import('../nativo/backgroundSync').then((m) => m.iniciarSyncBackground()).catch(() => {});
    import('../nativo/widgetFeed').then((m) => m.atualizarWidgetDoDia()).catch(() => {});
  };
  
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    (window as any).requestIdleCallback(bootNative, { timeout: 2000 });
  } else {
    setTimeout(bootNative, 500);
  }

  // RUM de Core Web Vitals (LCP/INP/CLS/FCP/TTFB) — env real dos usuários.
  import('../webVitalsRum').then((m) => m.initWebVitals()).catch(() => {});

  // Sincronização incremental de leis + prime da memória com o bundle nativo.
  // Rodam em idle real para não competir com o primeiro paint —
  // abertura de lei depois disso é síncrona (getCachedArtigos → hit direto).
  const scheduleBoot = () => {
    import('../../services/lawsBundle').then(async (m) => {
      await m.loadManifest();
      void m.primeMemoryCacheFromBundle();
      void m.syncLawsDelta();
    });
    // Prefetch de capas do blog (nativo): baixa em background, guarda em Filesystem.
    import('../../services/blogAssetsPrefetch').then(m => void m.prefetchBlogCovers());
  };
  
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    (window as any).requestIdleCallback(scheduleBoot, { timeout: 3000 });
  } else {
    setTimeout(scheduleBoot, 1200);
  }

  // Register Service Worker for persistent image caching (production only)
  if ('serviceWorker' in navigator) {
    const isInIframe = (() => {
      try { return window.self !== window.top; } catch { return true; }
    })();
    const isPreview = window.location.hostname.includes('id-preview--');

    if (!isInIframe && !isPreview) {
      navigator.serviceWorker.register('/sw-cache.js').catch(() => {});
    } else {
      // Cleanup any stale SW in preview/iframe
      navigator.serviceWorker.getRegistrations().then((regs) =>
        regs.forEach((r) => r.unregister())
      );
    }
  }
}
