import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { bootstrapCriticalNative, bootstrapIdleNative } from "./lib/boot/nativeBootstrap";

// Preload síncrono das duas imagens críticas de marca (aparecem no primeiro paint).
// Import estático com ?url faz o Vite empacotar a URL com hash já resolvida no bundle
// inicial — o <link rel="preload"> é injetado ANTES do createRoot, garantindo download
// paralelo ao parse do JS. Sem isso, a webp só começa a baixar depois do primeiro render.
import horusOwlUrl from "./assets/horus/horus-owl.webp?url";
import primeLogoUrl from "./assets/bundled/logo-direitoprime-v2.webp?url";

bootstrapCriticalNative();

function preloadImage(url: string) {
  const link = document.createElement("link");
  link.rel = "preload";
  link.as = "image";
  link.href = url;
  link.type = "image/webp";
  link.fetchPriority = "high";
  document.head.appendChild(link);
}
preloadImage(primeLogoUrl);
preloadImage(horusOwlUrl);

// Monkey-patch no window.scrollTo para compatibilidade com o lock do viewport no iOS/Mobile.
// Como movemos o scroll principal do <body> para a div #root para ocultar a barra branca nativa,
// precisamos redirecionar as chamadas window.scrollTo({top: 0}) para o #root.
const originalScrollTo = window.scrollTo;
window.scrollTo = function(...args: any[]) {
  const root = document.getElementById("root");
  if (root) {
    if (args.length === 1 && typeof args[0] === 'object' && args[0] !== null) {
      root.scrollTo(args[0]);
    } else if (args.length === 2 && typeof args[0] === 'number' && typeof args[1] === 'number') {
      root.scrollTo(args[0], args[1]);
    } else {
      root.scrollTop = 0;
    }
  } else {
    if (args.length > 0) {
      (originalScrollTo as any).apply(window, args);
    }
  }
};

createRoot(document.getElementById("root")!).render(<App />);

// Sinaliza prontidão ao splash screen — pode sair antes do timeout de 1.2s.
requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    window.dispatchEvent(new Event('app:ready'));
  });
});

// Executa boot nativo secundário e não bloqueante (Crashlytics, Sync, Push etc)
bootstrapIdleNative();
