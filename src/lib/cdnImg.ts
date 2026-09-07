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

const proxied = (url: string, w: number) =>
  `https://wsrv.nl/?url=${encodeURIComponent(url)}&w=${w}&q=${getAdaptiveQuality(80)}&output=webp`;

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
class ImagePrefetchQueue {
  private queue: string[] = [];
  private activeCount = 0;
  private readonly maxConcurrency = 3;
  private readonly fetched = new Set<string>();
  private readonly activeImages = new Set<HTMLImageElement>();

  add(url: string | null | undefined, width = 400): void {
    if (!url || typeof window === 'undefined') return;

    // Respeito à economia de dados do usuário (Item 36)
    const conn = (navigator as unknown as { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
    if (conn?.saveData || conn?.effectiveType === 'slow-2g' || conn?.effectiveType === '2g') {
      return;
    }

    const optimized = directImg(url, width);
    if (!optimized || this.fetched.has(optimized) || this.queue.includes(optimized)) {
      return;
    }

    // Limite máximo da fila para evitar consumo excessivo de memória em scroll infinito
    if (this.queue.length > 50) {
      this.queue.shift();
    }

    this.queue.push(optimized);
    this.process();
  }

  private process(): void {
    while (this.activeCount < this.maxConcurrency && this.queue.length > 0) {
      const nextUrl = this.queue.shift();
      if (!nextUrl) break;

      this.activeCount++;
      this.fetched.add(nextUrl);

      const img = new Image();
      img.decoding = 'async';
      this.activeImages.add(img);

      const cleanup = () => {
        img.onload = null;
        img.onerror = null;
        this.activeImages.delete(img);
        this.activeCount--;
        this.process();
      };

      img.onload = cleanup;
      img.onerror = cleanup;
      img.src = nextUrl;
    }
  }

  cancelAll(): void {
    this.queue = [];
    this.activeImages.forEach((img) => {
      img.onload = null;
      img.onerror = null;
      img.src = '';
    });
    this.activeImages.clear();
    this.activeCount = 0;
  }
}

const prefetchQueue = new ImagePrefetchQueue();

/** Pré-carrega uma única imagem de forma concorrente e segura */
export function prefetchImage(url: string | null | undefined, width = 400): void {
  prefetchQueue.add(url, width);
}

/** Pré-carrega uma lista de imagens através da fila de prioridade */
export function prefetchImages(urls: (string | null | undefined)[], width = 400): void {
  urls.forEach((u) => prefetchQueue.add(u, width));
}

/** Cancela downloads de prefetch pendentes ao trocar de tela */
export function cancelAllPrefetches(): void {
  prefetchQueue.cancelAll();
}
