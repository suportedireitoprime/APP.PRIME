// Cover loader — lei covers are small WebPs bundled with the app.
import {assetUrl, srcOf } from '@/lib/assetUrl';
// On native (Capacitor), imports resolve inside the APK (offline, instant).
// On web/desktop, warmCoverCache() pre-fetches them into the browser cache
// during idle time so subsequent navigation opens instantly.
import { Capacitor } from '@capacitor/core';

import landingBibliotecaAsset from '@/assets/landing-biblioteca.webp.asset.json';
import landingRadarAsset from '@/assets/landing-radar.webp.asset.json';
import landingVideoaulasAsset from '@/assets/landing-videoaulas.webp.asset.json';
import logoVacatioAsset from '@/assets/logo-direitoprime-v2.png.asset.json';
import themisMarbleCutoutAsset from '@/assets/themis-marble-cutout.webp.asset.json';

import cp from '@/assets/lei-cover-cp.webp';
import cf88 from '@/assets/lei-cover-cf88.webp';
import cc from '@/assets/lei-cover-cc.webp';
import clt from '@/assets/lei-cover-clt.webp';
import cdc from '@/assets/lei-cover-cdc.webp';
import defaultCover from '@/assets/lei-cover-default.webp';
// Thematic covers per estatuto/lei — mantêm o brasão da República ao fundo.
import eca from '@/assets/lei-cover-eca.jpg';
import ei from '@/assets/lei-cover-ei.webp';
import epd from '@/assets/lei-cover-epd.jpg';
import eir from '@/assets/lei-cover-eir.jpg';
import ec from '@/assets/lei-cover-ec.jpg';
import ed from '@/assets/lei-cover-ed.jpg';
import eoab from '@/assets/lei-cover-eoab.jpg';
import ctn from '@/assets/lei-cover-ctn.webp';

const isNative =
  typeof window !== 'undefined' && Capacitor.isNativePlatform();

export const COVERS = {
  cp,
  cf88,
  cc,
  clt,
  cdc,
  eca,
  ei,
  epd,
  eir,
  ec,
  ed,
  eoab,
  ctn,
  default: defaultCover,
} as const;


const CDN_WARMUP_URLS: readonly string[] = [
  assetUrl(srcOf(landingBibliotecaAsset)),
  assetUrl(srcOf(landingRadarAsset)),
  assetUrl(srcOf(landingVideoaulasAsset)),
  assetUrl(srcOf(logoVacatioAsset)),
  assetUrl(srcOf(themisMarbleCutoutAsset)),
];

export const PILULAS_COVERS: readonly string[] = [
  'https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas_fixas/cp_artigos_v2.jpg',
  '/pilulas/cf_portrait.jpg',
  '/pilulas/cc_portrait.png',
  '/pilulas/cpp_portrait.jpg',
  '/pilulas/clt_portrait.jpg',
  '/pilulas/ministros/moraes.jpg',
  '/pilulas/ministros/mendonca.jpg',
  '/pilulas/ministros/carmen.jpg',
  '/pilulas/ministros/zanin.jpg',
  '/pilulas/ministros/toffoli.jpg',
  '/pilulas/ministros/fachin.jpg',
  '/pilulas/ministros/dino.jpg',
  '/pilulas/ministros/mendes.jpg',
  '/pilulas/ministros/fux.jpg',
  '/pilulas/ministros/marques.jpg',
  '/pilulas/ministros/barroso.jpg',
  'https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas/a_luta_pelo_direito_manual.jpg',
  'https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas/sobre_a_liberdade_manual.jpg',
  'https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas/a_arte_da_guerra_manual.jpg',
  'https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas/o_espirito_das_leis_manual.jpg',
  'https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas/o_mundo_assombrado_pelos_demonios_manual.jpg'
];

type IdleWindow = Window & {
  requestIdleCallback?: (
    cb: () => void,
    opts?: { timeout?: number },
  ) => number;
};

function whenIdle(fn: () => void) {
  if (typeof window === 'undefined') return;
  const w = window as IdleWindow;
  if (typeof w.requestIdleCallback === 'function') {
    w.requestIdleCallback(fn, { timeout: 2000 });
  } else {
    window.setTimeout(fn, 500);
  }
}

export function prefetchImage(url: string | null | undefined) {
  if (!url) return;
  const img = new Image();
  img.decoding = 'async';
  img.src = url;
}

export function prefetchImages(urls: (string | null | undefined)[]) {
  urls.filter(Boolean).forEach((url) => {
    prefetchImage(url);
  });
}

/**
 * Warm the browser HTTP cache for lei covers and heavy CDN images.
 * No-op on native (already bundled) and on mobile viewports
 * (spare data / CPU on small devices).
 */
export function warmCoverCache() {
  if (typeof window === 'undefined') return;
  const isDesktop = window.matchMedia?.('(min-width: 1024px)').matches ?? false;

  whenIdle(() => {
    // Preload fast covers
    if (!isNative) {
      Object.values(COVERS).forEach((url) => prefetchImage(url));
    }
    // Preload Pílulas covers regardless of platform (CDN/local images)
    PILULAS_COVERS.forEach((url) => prefetchImage(url));
    
    if (isDesktop && !isNative) {
      CDN_WARMUP_URLS.forEach((url) => prefetchImage(url));
    }
  });
}
