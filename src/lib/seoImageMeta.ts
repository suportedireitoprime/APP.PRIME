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

/**
 * Injeta ou atualiza dados estruturados JSON-LD (Schema.org/Book e ImageObject)
 * para indexação orgânica das capas no Google Search e Google Imagens (Item 80).
 */
export function setDynamicJsonLdBook(data: {
  title: string;
  author?: string | null;
  coverUrl?: string | null;
  description?: string | null;
  isbn?: string | null;
}): void {
  if (typeof document === 'undefined') return;

  try {
    const id = 'seo-jsonld-book-schema';
    let script = document.getElementById(id) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.id = id;
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }

    const absoluteCover = data.coverUrl
      ? data.coverUrl.startsWith('http')
        ? data.coverUrl
        : `${window.location.origin}${data.coverUrl.startsWith('/') ? '' : '/'}${data.coverUrl}`
      : undefined;

    const schema: Record<string, unknown> = {
      '@context': 'https://schema.org',
      '@type': 'Book',
      name: data.title,
      url: window.location.href,
    };

    if (data.author) {
      schema.author = {
        '@type': 'Person',
        name: data.author,
      };
    }

    if (data.description) {
      schema.description = data.description;
    }

    if (data.isbn) {
      schema.isbn = data.isbn;
    }

    if (absoluteCover) {
      schema.image = {
        '@type': 'ImageObject',
        url: absoluteCover,
        contentUrl: absoluteCover,
        caption: `Capa oficial da obra ${data.title}`,
      };
    }

    script.textContent = JSON.stringify(schema, null, 2);
  } catch {
    // Falha graciosa
  }
}

/**
 * Remove os dados estruturados de livro ao fechar ou desmontar a visualização.
 */
export function removeDynamicJsonLdBook(): void {
  if (typeof document === 'undefined') return;
  try {
    const script = document.getElementById('seo-jsonld-book-schema');
    if (script) {
      script.remove();
    }
  } catch {
    // Falha silenciosa
  }
}

