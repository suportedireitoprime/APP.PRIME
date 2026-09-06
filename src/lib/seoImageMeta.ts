/**
 * seoImageMeta.ts - Gerenciador dinâmico de Meta Tags OpenGraph para Imagens
 * 
 * Permite que obras, artigos e jurisprudência atualizem dinamicamente as tags
 * og:image, twitter:image e og:image:alt (Itens 74 e 75 do Relatório Técnico)
 * para compartilhamento enriquecido no WhatsApp, Telegram, LinkedIn e Twitter.
 */

export function setDynamicOgImage(imageUrl: string | null | undefined, title?: string): void {
  if (typeof document === 'undefined' || !imageUrl || typeof imageUrl !== 'string') return;

  try {
    // Normaliza para URL absoluta completa (exigida pelos scrapers do WhatsApp/Facebook)
    const absoluteUrl = imageUrl.startsWith('http')
      ? imageUrl
      : `${window.location.origin}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;

    // 1. Meta og:image
    let ogImage = document.querySelector('meta[property="og:image"]');
    if (!ogImage) {
      ogImage = document.createElement('meta');
      ogImage.setAttribute('property', 'og:image');
      document.head.appendChild(ogImage);
    }
    ogImage.setAttribute('content', absoluteUrl);

    // 2. Meta twitter:image
    let twitterImage = document.querySelector('meta[name="twitter:image"]');
    if (!twitterImage) {
      twitterImage = document.createElement('meta');
      twitterImage.setAttribute('name', 'twitter:image');
      document.head.appendChild(twitterImage);
    }
    twitterImage.setAttribute('content', absoluteUrl);

    // 3. Meta og:image:alt (Acessibilidade e preview com descrição da capa)
    if (title) {
      let ogAlt = document.querySelector('meta[property="og:image:alt"]');
      if (!ogAlt) {
        ogAlt = document.createElement('meta');
        ogAlt.setAttribute('property', 'og:image:alt');
        document.head.appendChild(ogAlt);
      }
      ogAlt.setAttribute('content', `Capa de: ${title}`);
    }
  } catch {
    // Falha silenciosa caso o DOM esteja inacessível
  }
}
