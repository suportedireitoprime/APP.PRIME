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

  // Container Desktop/Tablet
  const desktopContainer = document.querySelector<HTMLElement>(
    '#desktop-scroll-container, [data-desktop-scroll="true"]'
  );
  if (desktopContainer) {
    desktopContainer.scrollTop = 0;
  }

  // Qualquer container com overflow interno
  const overflowContainers = document.querySelectorAll<HTMLElement>(
    '.overflow-y-auto, .overflow-y-scroll, main, [data-scrollable="true"]'
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
