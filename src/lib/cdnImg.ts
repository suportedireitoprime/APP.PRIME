import { Capacitor } from '@capacitor/core';
import { assetUrl } from './assetUrl';

/**
 * No app nativo (Android/iOS) o Origin é `https://localhost`, o que faz
 * proxies externos como wsrv.nl responderem 403 em muitos casos.
 */
const isNativePlatform = () => {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
};

/**
 * Retorna o multiplicador de densidade de tela (DPR) seguro (clamped entre 1x e 2x).
 * Em telas ultra high-DPI (3.5x a 4x no Android/Samsung), evita alocação de texturas gigantescas na VRAM (Item 54).
 */
export const getSafeDpr = (): number => {
  if (typeof window === 'undefined') return 1;
  return Math.min(Math.max(window.devicePixelRatio || 1, 1), 2);
};

/**
 * Fase 16 — Qualidade Adaptativa de Rede (Item 43 + Item 36 do Relatório Master).
 * Detecta `navigator.connection.effectiveType` e retorna a qualidade ideal:
 * - `slow-2g` / `2g`: 40 (placeholders mínimos, economia extrema de dados)
 * - `3g`: 60 (qualidade razoável, balanceia performance e visual)
 * - `4g` / Wi-Fi / default: 80 (qualidade premium)
 * Respeita saveData automaticamente reduzindo para 40.
 */
export const getAdaptiveQuality = (baseQuality = 80): number => {
  if (typeof navigator === 'undefined') return baseQuality;
  const conn = (navigator as unknown as {
    connection?: { effectiveType?: string; saveData?: boolean };
  }).connection;
  if (!conn) return baseQuality;
  if (conn.saveData) return 40;
  switch (conn.effectiveType) {
    case 'slow-2g':
    case '2g':
      return 40;
    case '3g':
      return 60;
    default:
      return baseQuality;
  }
};

/**
 * Resolve caminhos relativos do CDN Lovable (`/__l5e/...`) ou pointers de asset
 * para uma URL absoluta/local antes de passar por qualquer redimensionador.
 */
const resolve = (url: string) => assetUrl(url) || url;

let _avifSupported: boolean | null = null;
/**
 * Detecta em runtime se o navegador cliente decodifica AVIF nativamente.
 * Memoriza o resultado para custo 0ms em chamadas subsequentes.
 */
export const isAvifSupported = (): boolean => {
  if (typeof window === 'undefined') return false;
  if (_avifSupported !== null) return _avifSupported;
  try {
    const canvas = document.createElement('canvas');
    if (canvas.getContext && canvas.getContext('2d')) {
      _avifSupported = canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0;
      return _avifSupported;
    }
  } catch {
    // Fallback defensivo
  }
  _avifSupported = false;
  return false;
};

const proxied = (url: string, w: number) => {
  const format = isAvifSupported() ? 'avif' : 'webp';
  return `https://wsrv.nl/?url=${encodeURIComponent(url)}&w=${w}&q=${getAdaptiveQuality(80)}&output=${format}`;
};

/**
 * Transforma uma URL pública do Supabase Storage no endpoint de Image Transformation:
 * `/storage/v1/object/public/<bucket>/<path>` -> `/storage/v1/render/image/public/<bucket>/<path>?width=<w>&quality=<q>&resize=contain`
 * 
 * Benefício: Reduz o download de imagens de 1.5MB-3MB para 25KB-50KB em WebP dinâmico direto da infraestrutura Supabase,
 * operando sem proxy de terceiros (funciona perfeitamente em Web, Desktop e Native Capacitor).
 */
export const toSupabaseRenderUrl = (url: string, w: number, quality?: number): string => {
  const effectiveQuality = quality ?? getAdaptiveQuality(80);
  try {
    if (!url || typeof url !== 'string') return '';
    // Normalização de barras invertidas para compatibilidade total com Android WebView (Item 55)
    const normalized = url.replace(/\\/g, '/');
    // Preserva SVGs intactos (vetores não devem ser rasterizados)
    if (normalized.toLowerCase().endsWith('.svg')) return normalized;

    if (normalized.includes('/storage/v1/object/public/')) {
      const renderBase = normalized.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/');
      const parsed = new URL(renderBase);
      const safeWidth = Math.round(w * getSafeDpr());
      parsed.searchParams.set('width', String(Math.min(Math.max(safeWidth, 100), 1600)));
      parsed.searchParams.set('quality', String(effectiveQuality));
      parsed.searchParams.set('resize', 'contain');
      return parsed.toString();
    }
  } catch {
    // Fallback defensivo
  }
  return url;
};

/**
 * Regra centralizada de otimização de imagens do APP.PRIME.
 */
const otimizar = (url: string, w: number): string => {
  if (!url || typeof url !== 'string') return '';
  
  // URLs de instâncias legadas/desativadas do Supabase descartadas para prevenir broken images
  if (url.includes('izspjvegxdfgkgibpyst.supabase.co')) return '';
  const resolved = resolve(url);
  if (resolved.includes('izspjvegxdfgkgibpyst.supabase.co')) return '';

  // 1. Supabase Storage: utiliza o endpoint nativo de Image Transformation
  if (resolved.includes('.supabase.co/storage/')) {
    return toSupabaseRenderUrl(resolved, w);
  }

  // 2. TMDB (Filmes e Séries da Temática Jurídica) possui CDN global Cloudflare com tiers de tamanho
  if (resolved.includes('image.tmdb.org/t/p/')) {
    let size = 'w500';
    if (w <= 92) size = 'w92';
    else if (w <= 154) size = 'w154';
    else if (w <= 185) size = 'w185';
    else if (w <= 342) size = 'w342';
    else if (w <= 500) size = 'w500';
    else if (w <= 780) size = 'w780';
    else size = 'w1280';
    return resolved.replace(/\/t\/p\/[^/]+\//, `/t/p/${size}/`);
  }

  // 3. Domínios externos que bloqueiam proxy
  if (resolved.includes('migalhas.com.br')) {
    return resolved;
  }

  // 4. No app nativo (Android/iOS), se não for Supabase nem TMDB, preserva a URL original para evitar 403 de proxy
  if (isNativePlatform()) {
    return resolved;
  }

  // 5. Demais URLs web externas: proxy WebP via wsrv.nl
  if (!/^https?:\/\//i.test(resolved)) return resolved;
  return proxied(resolved, w);
};

/** Imagem grande (hero, leitor, detalhe) */
export const cdnImg = (url: string, w = 800) => otimizar(url, w);

/** Imagem média/pequena (capas, listas, decks, carrosséis) */
export const directImg = (url: string, w = 400) => otimizar(url, w);

/** Imagem de notícias e cards horizontais */
export const newsImg = (url: string, w = 640) => otimizar(url, w);

/** Avatar de usuário com máscara circular */
export const avatarImg = (url: string, size = 128) => {
  if (!url) return '';
  const resolved = resolve(url);
  if (isNativePlatform()) return resolved;
  return `https://wsrv.nl/?url=${encodeURIComponent(resolved)}&w=${size}&h=${size}&fit=cover&mask=circle&output=webp`;
};

/**
 * Fila inteligente de Pré-Aquecimento (Prefetch) com controle de concorrência,
 * prevenção de saturação de rede (Item 31 do relatório) e descarte seguro de memória (Item 33).
 */
interface QueueItem {
  url: string;
  signal?: AbortSignal;
}

/**
 * Fila inteligente de Pré-Aquecimento (Prefetch) com controle de concorrência (Fase 31 — máx 3 downloads),
 * prevenção de saturação de rede (Item 31) e cancelamento seguro via AbortSignal (Fase 32 — Item 32 e 33).
 */
class ImagePrefetchQueue {
  private queue: QueueItem[] = [];
  private activeCount = 0;
  private readonly maxConcurrency = 3;
  private readonly fetched = new Set<string>();
  private readonly activeImages = new Map<HTMLImageElement, { url: string; cleanupSignal?: () => void }>();

  add(url: string | null | undefined, width = 400, signal?: AbortSignal): void {
    if (!url || typeof window === 'undefined' || signal?.aborted) return;

    // Respeito à economia de dados do usuário (Item 36)
    const conn = (navigator as unknown as { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
    if (conn?.saveData || conn?.effectiveType === 'slow-2g' || conn?.effectiveType === '2g') {
      return;
    }

    const optimized = directImg(url, width);
    if (!optimized || this.fetched.has(optimized) || this.queue.some(item => item.url === optimized)) {
      return;
    }

    // Limite máximo da fila para evitar consumo excessivo de memória em scroll infinito
    if (this.queue.length > 50) {
      this.queue.shift();
    }

    const item: QueueItem = { url: optimized, signal };
    this.queue.push(item);

    // Se o signal abortar enquanto ainda está na fila, remove sem executar
    if (signal) {
      const onAbort = () => {
        this.queue = this.queue.filter(q => q !== item);
        signal.removeEventListener('abort', onAbort);
      };
      signal.addEventListener('abort', onAbort, { once: true });
    }

    this.process();
  }

  private process(): void {
    while (this.activeCount < this.maxConcurrency && this.queue.length > 0) {
      const next = this.queue.shift();
      if (!next) break;

      if (next.signal?.aborted) {
        continue;
      }

      this.activeCount++;
      this.fetched.add(next.url);

      const img = new Image();
      img.decoding = 'async';

      const cleanup = () => {
        img.onload = null;
        img.onerror = null;
        const entry = this.activeImages.get(img);
        entry?.cleanupSignal?.();
        this.activeImages.delete(img);
        this.activeCount--;
        this.process();
      };

      let cleanupSignal: (() => void) | undefined;
      if (next.signal) {
        const onAbort = () => {
          img.onload = null;
          img.onerror = null;
          img.src = '';
          this.activeImages.delete(img);
          this.activeCount--;
          this.process();
        };
        next.signal.addEventListener('abort', onAbort, { once: true });
        cleanupSignal = () => next.signal?.removeEventListener('abort', onAbort);
      }

      this.activeImages.set(img, { url: next.url, cleanupSignal });

      img.onload = cleanup;
      img.onerror = cleanup;
      img.src = next.url;
    }
  }

  cancelAll(): void {
    this.queue = [];
    this.activeImages.forEach((val, img) => {
      img.onload = null;
      img.onerror = null;
      img.src = '';
      val.cleanupSignal?.();
    });
    this.activeImages.clear();
    this.activeCount = 0;
  }
}

const prefetchQueue = new ImagePrefetchQueue();

/** Fase 31/32: Pré-carrega uma única imagem de forma concorrente e segura com AbortSignal opcional */
export function prefetchImage(url: string | null | undefined, width = 400, signal?: AbortSignal): void {
  prefetchQueue.add(url, width, signal);
}

/** Fase 31/32: Pré-carrega uma lista de imagens através da fila com suporte a cancelamento */
export function prefetchImages(urls: (string | null | undefined)[], width = 400, signal?: AbortSignal): void {
  urls.forEach((u) => prefetchQueue.add(u, width, signal));
}

/** Cancela downloads de prefetch pendentes ao trocar de tela (Fase 32) */
export function cancelAllPrefetches(): void {
  prefetchQueue.cancelAll();
}

/**
 * Fase 22 — Geração de srcset responsivo para telas Retina (1x, 2x e 3x)
 * Permite que telas de alta densidade (iPhones, MacBooks, AMOLEDs) exibam
 * capas com máxima nitidez sem distorção, enquanto dispositivos comuns não desperdiçam dados.
 */
export const generateResponsiveSrcSet = (
  url: string | null | undefined,
  baseWidth = 400
): { srcSet?: string; sizes?: string } => {
  if (!url || typeof url !== 'string' || !url.trim()) return {};

  const clean = url.trim();
  // Não gera srcset para SVGs, base64 ou blob URLs
  if (clean.startsWith('data:') || clean.startsWith('blob:') || clean.toLowerCase().endsWith('.svg')) {
    return {};
  }

  // Apenas gera se a URL puder ser transformada via CDN / Storage
  const isTransformable = clean.includes('/storage/v1/') || clean.includes('image.tmdb.org') || /^https?:\/\//i.test(clean);
  if (!isTransformable) return {};

  const w1x = Math.round(baseWidth);
  const w2x = Math.round(baseWidth * 1.5);
  const w3x = Math.min(Math.round(baseWidth * 2.25), 1400);

  const url1x = directImg(clean, w1x);
  const url2x = directImg(clean, w2x);
  const url3x = directImg(clean, w3x);

  if (!url1x || url1x === clean) return {};

  return {
    srcSet: `${url1x} 1x, ${url2x} 1.5x, ${url3x} 2x`,
    sizes: `(max-width: 640px) 100vw, ${baseWidth}px`,
  };
};

