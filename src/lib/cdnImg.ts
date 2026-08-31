import { Capacitor } from '@capacitor/core';
import { assetUrl } from './assetUrl';




/**
 * No app nativo (Android/iOS) o Origin é `https://localhost`, o que faz o
 * proxy wsrv.nl responder 403/erro de referer em muitos casos e as imagens
 * não aparecem. Nesse ambiente pulamos o proxy e usamos a URL original.
 */
const shouldBypassProxy = () => {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
};

const proxied = (url: string, w: number) =>
  `https://wsrv.nl/?url=${encodeURIComponent(url)}&w=${w}&q=80&output=webp`;

/**
 * Resolve caminhos relativos do CDN Lovable (`/__l5e/...`) ou pointers de asset
 * para uma URL absoluta/local antes de passar por qualquer proxy externo.
 * Sem isso, o wsrv.nl recebia uma URL relativa e devolvia erro (capas somem).
 */
const resolve = (url: string) => assetUrl(url) || url;

/**
 * Regra única de otimização.
 *
 * Antes as URLs do Supabase Storage passavam DIRETO, em resolução cheia — era a
 * maior fonte de "Cached Egress" do projeto (capas de 1–3 MB servidas em
 * miniaturas de 150 px). Agora tudo passa pelo redimensionador, que também
 * funciona como cache externo: o Supabase entrega o arquivo uma vez e o wsrv
 * serve todas as demais requisições.
 *
 * No app nativo o Origin é `https://localhost` e o proxy pode responder 403,
 * então mantemos a URL original — lá as capas já ficam em cache no filesystem
 * (ver `bibliotecaCapasPrefetch`), então o download acontece uma vez por device.
 */
const otimizar = (url: string, w: number) => {
  if (!url) return '';
  const resolved = resolve(url);
  if (shouldBypassProxy()) return resolved;
  
  // Se a imagem já vem do nosso storage Supabase, 
  // ela já foi comprimida na extração e o proxy só causa lentidão
  if (resolved.includes('.supabase.co/storage/')) return resolved;
  
  if (!/^https?:\/\//i.test(resolved)) return resolved;
  return proxied(resolved, w);
};

/** Imagem grande (hero, leitor, detalhe) */
export const cdnImg = (url: string, w = 800) => otimizar(url, w);

/** Imagem pequena (capas, listas, grids) */
export const directImg = (url: string, w = 400) => otimizar(url, w);

/** Imagem de notícias/cards */
export const newsImg = (url: string, w = 640) => otimizar(url, w);

export function prefetchImage(url: string | null | undefined) {
  if (!url) return;
  const img = new Image();
  img.src = directImg(url, 400);
}

export function prefetchImages(urls: (string | null | undefined)[]) {
  urls.filter(Boolean).forEach((url) => {
    const img = new Image();
    img.src = directImg(url!, 400);
  });
}

