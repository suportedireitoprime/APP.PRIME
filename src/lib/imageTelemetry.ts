/**
 * imageTelemetry.ts - Monitoramento de Performance (LCP) de Imagens no APP.PRIME
 * 
 * Implementa telemetria Core Web Vitals (Item 88 do Relatório Técnico) através de
 * PerformanceObserver para capturar Largest Contentful Paint (LCP) e identificar
 * URLs de assets com carregamento acima do orçamento de performance (> 2.5s).
 */

export interface ImageLcpMetric {
  url: string;
  durationMs: number;
  sizePixels: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
  pathname: string;
}

let latestImageLcp: ImageLcpMetric | null = null;
const lcpListeners = new Set<(metric: ImageLcpMetric) => void>();
let isInitialized = false;

/**
 * Inicializa o observador de telemetria de LCP desacoplado da thread principal.
 */
export function initImageTelemetry(): void {
  if (isInitialized || typeof window === 'undefined' || !('PerformanceObserver' in window)) {
    return;
  }
  isInitialized = true;

  try {
    const observer = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      for (const entry of entries) {
        // @ts-expect-error PerformanceEntry attributes específicos do LCP
        const url: string | undefined = entry.url;
        // @ts-expect-error PerformanceEntry attributes específicos do LCP
        const duration = Math.round(entry.renderTime || entry.loadTime || entry.startTime || 0);
        // @ts-expect-error PerformanceEntry attributes específicos do LCP
        const size = entry.size || 0;

        if (url && typeof url === 'string') {
          const rating: 'good' | 'needs-improvement' | 'poor' =
            duration <= 2500 ? 'good' : duration <= 4000 ? 'needs-improvement' : 'poor';

          latestImageLcp = {
            url,
            durationMs: duration,
            sizePixels: size,
            rating,
            timestamp: Date.now(),
            pathname: window.location.pathname,
          };

          lcpListeners.forEach((listener) => {
            try { listener(latestImageLcp!); } catch {}
          });

          // Dispara evento customizado para integrações externas de telemetria
          window.dispatchEvent(new CustomEvent('prime:image-lcp', { detail: latestImageLcp }));

          if (rating === 'poor' && process.env.NODE_ENV !== 'production') {
            console.warn(`[imageTelemetry] ⚠️ LCP lento detectado (${duration}ms):`, url);
          }
        }
      }
    });

    observer.observe({ type: 'largest-contentful-paint', buffered: true });
  } catch {
    // Silencia em navegadores sem suporte a LCP observer
  }
}

/**
 * Retorna a métrica mais recente de LCP de imagem registrada.
 */
export function getLatestImageLcp(): ImageLcpMetric | null {
  return latestImageLcp;
}

/**
 * Permite que componentes ou painéis de administração escutem métricas de LCP.
 */
export function subscribeImageLcp(listener: (metric: ImageLcpMetric) => void): () => void {
  if (latestImageLcp) {
    try { listener(latestImageLcp); } catch {}
  }
  lcpListeners.add(listener);
  return () => lcpListeners.delete(listener);
}
