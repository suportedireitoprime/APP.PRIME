/**
 * Utilitário global para reset imediato e seguro de todos os scrolls da aplicação:
 * - window (Mobile / WebView / Electron)
 * - document.documentElement, document.body, document.scrollingElement
 * - Desktop scroll container (#desktop-scroll-container / data-desktop-scroll)
 * - Qualquer elemento com scroll interno (.overflow-y-auto / .overflow-y-scroll)
 */
export function resetGlobalScroll() {
  if (typeof window === 'undefined') return;

  try {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  } catch {
    try {
      window.scrollTo(0, 0);
    } catch {}
  }

  if (document.documentElement) document.documentElement.scrollTop = 0;
  if (document.body) document.body.scrollTop = 0;
  if (document.scrollingElement) document.scrollingElement.scrollTop = 0;

  const root = document.getElementById('root');
  if (root) root.scrollTop = 0;

  // Container Desktop/Tablet
  const desktopContainers = document.querySelectorAll<HTMLElement>(
    '#desktop-scroll-container, [data-desktop-scroll="true"]'
  );
  desktopContainers.forEach(el => {
    el.scrollTop = 0;
  });

  // Qualquer container com overflow vertical interno
  const overflowContainers = document.querySelectorAll<HTMLElement>(
    '#desktop-scroll-container, [data-desktop-scroll="true"], .overflow-y-auto, .overflow-y-scroll, .overflow-auto, [class*="overflow-y-auto"], [class*="overflow-auto"], main, [data-scrollable="true"]'
  );
  overflowContainers.forEach(el => {
    if (!el.classList.contains('preserve-scroll')) {
      el.scrollTop = 0;
    }
  });
}

// Injeta também no escopo global do window para segurança total contra ReferenceErrors em HMR
if (typeof window !== 'undefined') {
  (window as any).resetGlobalScroll = resetGlobalScroll;
}
