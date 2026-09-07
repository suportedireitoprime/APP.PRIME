// Estudos Jurídicos service worker — estratégias inspiradas em Workbox (sem dependência),
// mantém compat com o registro atual em src/main.tsx. Não interfere no
// firebase-messaging-sw.js nem no push-sw.js.
const VERSION = 'v8';
const IMG_CACHE = `vacatio-img-${VERSION}`;
const ASSET_CACHE = `vacatio-assets-${VERSION}`;
const RUNTIME_CACHE = `vacatio-runtime-${VERSION}`;
const AUDIO_CACHE = `vacatio-audio-${VERSION}`;
const IMG_EXT = /\.(jpe?g|png|webp|svg|gif|avif|ico)(\?|$)/i;
const AUDIO_EXT = /\.(mp3|wav|ogg|m4a)(\?|$)/i;
const FONT_EXT = /\.(woff2?|ttf|otf)(\?|$)/i;
const BLOG_COVERS_STORAGE = '/storage/v1/object/sign/blog-capas/';

const IMG_LIMIT = 350;
const AUDIO_LIMIT = 50;
const RUNTIME_LIMIT = 60;

// SVG de fallback elegante para imagens quando offline (sem ícone quebrado de navegador)
const OFFLINE_IMAGE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600" viewBox="0 0 400 600" fill="#121214"><rect width="100%" height="100%" fill="#121214"/><path d="M160 270 L240 270 L200 220 Z" fill="#27272a"/><circle cx="175" cy="235" r="12" fill="#27272a"/><text x="50%" y="330" font-family="system-ui, sans-serif" font-size="13" font-weight="600" fill="#71717a" text-anchor="middle" letter-spacing="1">MODO OFFLINE</text></svg>`;

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const cache = await caches.open(ASSET_CACHE);
    await cache.addAll([
      '/index.html',
      '/offline-covers/manifest.json',
    ]).catch(() => cache.add('/index.html'));
  })());
  self.skipWaiting();
});
self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys
      .filter((k) => ![IMG_CACHE, ASSET_CACHE, RUNTIME_CACHE, AUDIO_CACHE].includes(k))
      .map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

async function trimCache(cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length <= maxItems) return;
  await Promise.all(keys.slice(0, keys.length - maxItems).map((k) => cache.delete(k)));
}

async function cacheFirst(req, cacheName, limit, isImg = false) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);
  if (cached) {
    // Fase 33: Checagem de expiração de 30 dias para renovação suave de cache de imagem
    const dateHeader = cached.headers.get('sw-cached-date') || cached.headers.get('date');
    if (dateHeader) {
      const age = Date.now() - new Date(dateHeader).getTime();
      if (age > THIRTY_DAYS_MS) {
        cache.delete(req).catch(() => {});
      } else {
        return cached;
      }
    } else {
      return cached;
    }
  }

  try {
    const res = await fetch(req);
    if (res && res.ok) {
      // Fase 36: Enriquece headers com Cache-Control: immutable e timestamp para zero revalidação
      let responseToCache = res.clone();
      if (isImg) {
        const headers = new Headers(responseToCache.headers);
        headers.set('Cache-Control', 'public, max-age=31536000, immutable');
        headers.set('sw-cached-date', new Date().toUTCString());
        const blob = await responseToCache.blob();
        responseToCache = new Response(blob, {
          status: responseToCache.status,
          statusText: responseToCache.statusText,
          headers,
        });
      }
      cache.put(req, responseToCache).then(() => limit && trimCache(cacheName, limit));
    }
    return res;
  } catch (err) {
    if (isImg) {
      return new Response(OFFLINE_IMAGE_SVG, {
        status: 200,
        headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'no-store' },
      });
    }
    throw err;
  }
}

async function staleWhileRevalidate(req, cacheName, limit) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);
  const network = fetch(req).then((res) => {
    if (res && res.ok) {
      cache.put(req, res.clone()).then(() => limit && trimCache(cacheName, limit));
    }
    return res;
  }).catch(() => cached);
  return cached || network;
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Capas de blog (Signed URLs): o token muda, então ignoramos a querystring no cache
  if (url.pathname.includes(BLOG_COVERS_STORAGE)) {
    e.respondWith((async () => {
      const cache = await caches.open(IMG_CACHE);
      const cached = await cache.match(req, { ignoreSearch: true });
      if (cached) return cached;
      
      try {
        const res = await fetch(req);
        if (res.ok) {
          cache.put(req, res.clone()).then(() => trimCache(IMG_CACHE, IMG_LIMIT));
        }
        return res;
      } catch (err) {
        return new Response('Imagem offline', { status: 503 });
      }
    })());
    return;
  }

  // Assets hashed do build (imutáveis) → cache-first
  if (url.pathname.startsWith('/assets/') || url.pathname.startsWith('/__l5e/')) {
    e.respondWith(cacheFirst(req, ASSET_CACHE, 300));
    return;
  }

  // Fontes → cache-first
  if (FONT_EXT.test(url.pathname) || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(cacheFirst(req, ASSET_CACHE, 60));
    return;
  }

  const isSupabaseStorage = url.hostname.endsWith('supabase.co') && (url.pathname.includes('/storage') || url.pathname.includes('/object'));

  const isAudio = AUDIO_EXT.test(url.pathname) || (isSupabaseStorage && url.pathname.includes('boletins-audio'));

  if (isAudio) {
    // Áudio pesado (WAV/MP3) -> Cache-First para não re-baixar 2MB+ no background (SWR)
    e.respondWith(cacheFirst(req, AUDIO_CACHE, AUDIO_LIMIT));
    return;
  }

  const isImage =
    IMG_EXT.test(url.pathname) ||
    url.hostname === 'wsrv.nl' ||
    (isSupabaseStorage && !url.pathname.includes('boletins-audio'));

  if (isImage) {
    // Cache-first para capas, avatares e imagens estáticas (0ms em visitas recorrentes e offline)
    e.respondWith(cacheFirst(req, IMG_CACHE, IMG_LIMIT, true));
    return;
  }

  // GETs de API do Supabase (metadados leves): SWR curto p/ resiliência offline
  if (url.hostname.endsWith('supabase.co') && url.pathname.startsWith('/rest/v1/')) {
    e.respondWith(staleWhileRevalidate(req, RUNTIME_CACHE, RUNTIME_LIMIT));
    return;
  }

  // SPA Navigation Fallback (Retornar index.html do cache caso offline)
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).catch(async () => {
        const cache = await caches.open(ASSET_CACHE);
        const cachedResponse = await cache.match('/index.html');
        // Fallback genérico de PWA
        return cachedResponse || new Response('Você está offline.', {
          status: 503,
          headers: { 'Content-Type': 'text/plain' }
        });
      })
    );
    return;
  }
});
