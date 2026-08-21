import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { setNativeStatusBar } from "./lib/nativeStatusBar";
import { initCrashlytics, installGlobalErrorHandlers } from "./lib/nativeCrashlytics";
import { Capacitor } from "@capacitor/core";

if (Capacitor.isNativePlatform()) {
  document.documentElement.classList.add('capacitor-native');
}

// Preload síncrono das duas imagens críticas de marca (aparecem no primeiro paint).
// Import estático com ?url faz o Vite empacotar a URL com hash já resolvida no bundle
// inicial — o <link rel="preload"> é injetado ANTES do createRoot, garantindo download
// paralelo ao parse do JS. Sem isso, a webp só começa a baixar depois do primeiro render.
import horusOwlUrl from "./assets/horus/horus-owl.webp?url";
import primeLogoUrl from "./assets/bundled/logo-direitoprime-v2.webp?url";

function preloadImage(url: string) {
  const link = document.createElement("link");
  link.rel = "preload";
  link.as = "image";
  link.href = url;
  link.type = "image/webp";
  link.fetchPriority = "high";
  document.head.appendChild(link);
  // Aquece também o cache de decode do browser
  const img = new Image();
  img.decoding = "async";
  img.src = url;
}
preloadImage(primeLogoUrl);
preloadImage(horusOwlUrl);

// A Splash Screen nativa agora é ocultada sob demanda pelos componentes principais
// (ex: IndexMobile.tsx, Auth.tsx) após o primeiro render, evitando a "tela branca"
// ou "travadinha" durante o boot.

// Push: anexa os listeners nativos ANTES do React montar e converte o
// parâmetro `_pc` da URL em evento de abertura. Sem isso, o toque em uma
// notificação com o app fechado podia ser perdido antes de o hook montar.
// NOTE: Deve rodar antes do createRoot para não perder o evento.
import('./lib/nativePush').then((m) => m.bootstrapNativePush()).catch(() => {});


createRoot(document.getElementById("root")!).render(<App />);

// Sinaliza prontidão ao splash screen — pode sair antes do timeout de 1.2s.
requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    window.dispatchEvent(new Event('app:ready'));
  });
});

// Conectividade, atalhos, notificações, widget e background sync —
// tudo em idle para não competir com o primeiro paint.
const bootNative = () => {
  import('./lib/nativo/rede').then((m) => m.iniciarMonitorRede()).catch(() => {});
  import('./lib/nativo/atalhos').then((m) => m.registrarAtalhos()).catch(() => {});
  import('./lib/nativo/notificacaoAcoes').then((m) => m.registrarAcoesNotificacao()).catch(() => {});
  import('./lib/nativo/backgroundSync').then((m) => m.iniciarSyncBackground()).catch(() => {});
  import('./lib/nativo/widgetFeed').then((m) => m.atualizarWidgetDoDia()).catch(() => {});
};
if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
  (window as any).requestIdleCallback(bootNative, { timeout: 2000 });
} else {
  setTimeout(bootNative, 500);
}

// Paint the native status bar with the app's Wine theme at boot.
setNativeStatusBar('wine');

// Init Firebase Crashlytics (no-op em web) e handlers globais de erro.
installGlobalErrorHandlers();
void initCrashlytics();

// RUM de Core Web Vitals (LCP/INP/CLS/FCP/TTFB) — env real dos usuários.
import('./lib/webVitalsRum').then((m) => m.initWebVitals()).catch(() => {});

// Sincronização incremental de leis + prime da memória com o bundle nativo.
// Rodam em idle real para não competir com o primeiro paint —
// abertura de lei depois disso é síncrona (getCachedArtigos → hit direto).
const scheduleBoot = () => {
  import('./services/lawsBundle').then(async (m) => {
    await m.loadManifest();
    void m.primeMemoryCacheFromBundle();
    void m.syncLawsDelta();
  });
  // Prefetch de capas do blog (nativo): baixa em background, guarda em Filesystem.
  import('./services/blogAssetsPrefetch').then(m => void m.prefetchBlogCovers());
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
