/**
 * Blog cover URL helpers.
 *
 * A transformação de imagem do Supabase Storage (`/render/image/...`) NÃO está
 * habilitada neste tenant — ela responde 403 `FeatureNotEnabled`, o que fazia
 * TODA capa falhar e cair na capa genérica bundled (por isso os posts
 * apareciam todos com a mesma imagem). Enquanto o recurso estiver desligado,
 * usamos a URL assinada original.
 */
const STORAGE_IMAGE_TRANSFORM_ENABLED = false;

function transform(url: string, width: number, quality = 70): string {
  if (!url) return url;
  if (!STORAGE_IMAGE_TRANSFORM_ENABLED) return url;
  // Só reescreve URLs assinadas do Supabase Storage.
  if (!url.includes('/storage/v1/object/sign/')) return url;
  const rendered = url.replace('/storage/v1/object/sign/', '/storage/v1/render/image/sign/');
  const sep = rendered.includes('?') ? '&' : '?';
  return `${rendered}${sep}width=${width}&quality=${quality}&resize=cover&format=webp`;
}


/** Thumb dos cards da listagem (~112px no mobile, 2x para retina). */
export const blogThumb = (url: string, w = 260) => transform(url, w, 68);

/** Capa do sheet aberto / hero grande. */
export const blogHero = (url: string, w = 900) => transform(url, w, 75);
