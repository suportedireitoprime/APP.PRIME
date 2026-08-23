// Estudos Jurídicos service worker — estratégias inspiradas em Workbox (sem dependência),
// mantém compat com o registro atual em src/main.tsx. Não interfere no
// firebase-messaging-sw.js nem no push-sw.js.
const VERSION = 'v6';
const IMG_CACHE = `vacatio-img-${VERSION}`;
const ASSET_CACHE = `vacatio-assets-${VERSION}`;
const RUNTIME_CACHE = `vacatio-runtime-${VERSION}`;
const AUDIO_CACHE = `vacatio-audio-${VERSION}`;
const IMG_EXT = /\.(jpe?g|png|webp|svg|gif|avif|ico)(\?|$)/i;
const AUDIO_EXT = /\.(mp3|wav|ogg|m4a)(\?|$)/i;
const FONT_EXT = /\.(woff2?|ttf|otf)(\?|$)/i;
const BLOG_COVERS_STORAGE = '/storage/v1/object/sign/blog-capas/';

const IMG_LIMIT = 200;
const AUDIO_LIMIT = 50;
const RUNTIME_LIMIT = 60;

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const cache = await caches.open(ASSET_CACHE);
    await cache.add('/index.html');
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

async function trimCache(cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length <= maxItems) return;
  await Promise.all(keys.slice(0, keys.length - maxItems).map((k) => cache.delete(k)));
}

async function cacheFirst(req, cacheName, limit) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);
  if (cached) return cached;
  const res = await fetch(req);
  if (res.ok) {
    cache.put(req, res.clone()).then(() => limit && trimCache(cacheName, limit));
  }
  return res;
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
    e.respondWith(staleWhileRevalidate(req, IMG_CACHE, IMG_LIMIT));
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
