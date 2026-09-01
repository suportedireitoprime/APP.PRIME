import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { bootstrapCriticalNative, bootstrapIdleNative } from "./lib/boot/nativeBootstrap";

bootstrapCriticalNative();

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

createRoot(document.getElementById("root")!).render(<App />);

// Sinaliza prontidão ao splash screen — pode sair antes do timeout de 1.2s.
requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    window.dispatchEvent(new Event('app:ready'));
  });
});

// Executa boot nativo secundário e não bloqueante (Crashlytics, Sync, Push etc)
bootstrapIdleNative();
