/**
 * Loader do bundle estático (offline) de leis.
 *
 * Fluxo (Zero-Loading Inicial):
 *  1. App abre → tenta ler /laws-bundle/manifest.json (embutido no build Vite/dist)
 *  2. Verifica quais leis não constam no banco local Dexie (artigosCache).
 *  3. Popula o banco local em background com os dados do bundle.
 *  4. Da próxima vez que o usuário abrir a lei, já está na memória em 0ms.
 */

import { setPersistedArtigosCache, getPersistedArtigosCache, invalidateArtigosCache } from '@/services/offlineDb';
import { LEIS_CATALOG } from '@/data/leisCatalog';
import { sanitizeLegalArticleText } from '@/components/vademecum/artigo/artigoTextUtils';

// ── Cache em RAM para leitura síncrona (0ms) ──
// Evita ir ao IndexedDB/Dexie a cada abertura de lei (50-200ms).
const _ramCache = new Map<string, any[]>();

// Leis mais acessadas — carregadas com prioridade máxima no boot.
// Quando em RAM, abertura é literal 0ms.
const PRIORITY_LAWS = ['cf88', 'cp', 'cc', 'cpc', 'cpp', 'clt', 'ctn', 'cdc'];

/** Leitura síncrona do RAM cache. null = não carregada ainda. */
export function getCachedArtigosRAM(tabelaNome: string): any[] | null {
  return _ramCache.get(tabelaNome) ?? null;
}

/** Popula o RAM cache (chamado internamente ao carregar de IndexedDB ou bundle). */
function setRAMCache(tabelaNome: string, artigos: any[]): void {
  _ramCache.set(tabelaNome, artigos);
}

const MANIFEST_URL = '/laws-bundle/manifest.json';

export interface ManifestLei {
  id: string;
  slug: string;
  nome: string;
  nome_curto: string | null;
  updated_at: string | null;
  count: number;
}

export interface Manifest {
  generated_at: string;
  bundle_updated_at: string | null;
  leis: ManifestLei[];
}

let _manifestPromise: Promise<Manifest | null> | null = null;
let _slugToId: Map<string, string> | null = null;
let _idToSlug: Map<string, string> | null = null;

export function loadManifest(): Promise<Manifest | null> {
  if (_manifestPromise) return _manifestPromise;
  _manifestPromise = (async () => {
    try {
      const res = await fetch(MANIFEST_URL, { cache: 'force-cache' });
      if (!res.ok) return null;
      const m = (await res.json()) as Manifest;
      _slugToId = new Map(m.leis.map((l) => [l.slug, l.id]));
      _idToSlug = new Map(m.leis.map((l) => [l.id, l.slug]));
      return m;
    } catch {
      return null;
    }
  })();
  return _manifestPromise;
}

function normalizeArtigos(rows: any[]) {
  return (rows || [])
    .map((r: any) => ({
      id: r.id,
      numero: (r.numero || '').replace(/(\d)o\b/g, '$1º').replace(/°/g, 'º'),
      caput: sanitizeLegalArticleText((r.texto || '').replace(/(\d)o\b/g, '$1º').replace(/°/g, 'º')),
      titulo: undefined,
      epigrafe: r.epigrafe || undefined,
      nomen_juris: r.epigrafe || undefined,
      capitulo: undefined,
      ordem: typeof r.ordem === 'number' ? r.ordem : undefined,
    }))
    .filter((a: any) => a.caput.trim() !== '');
}

/** Carrega artigos bundlados de uma lei (via slug). Retorna null se sem bundle. */
export async function loadBundledLei(slug: string): Promise<any[] | null> {
  try {
    const res = await fetch(`/laws-bundle/${slug}.json`, { cache: 'force-cache' });
    if (!res.ok) return null;
    const raw = await res.json();
    return normalizeArtigos(raw);
  } catch {
    return null;
  }
}

/**
 * Aquece a memória com todos os artigos bundlados no APK/Web.
 * Chame no boot (após loadManifest) para que qualquer `getPersistedArtigosCache`
 * subsequente retorne síncrono e sem I/O — a abertura de qualquer lei do Vade Mecum ficará instantânea.
 * Concorrência controlada (6) para não travar main thread.
 */
let _primePromise: Promise<void> | null = null;
export function primeMemoryCacheFromBundle(concurrency = 6): Promise<void> {
  if (_primePromise) return _primePromise;
  _primePromise = (async () => {
    const manifest = await loadManifest();
    if (!manifest || !manifest.leis?.length) return;

    // Precisamos resolver a qual 'tabela_nome' no APP.PRIME o 'slug' do Supabase se refere.
    // Usamos o LEIS_CATALOG e o service para indexar.
    const { LEIS_CATALOG } = await import('@/data/leisCatalog');

    const slugToTabela = new Map<string, string>();
    for (const m of manifest.leis) {
      const lei = LEIS_CATALOG.find((l) => matchesSlug(l as any, m.slug));
      if (lei) {
          slugToTabela.set(m.slug, lei.tabela_nome);
      } else {
          slugToTabela.set(m.slug, m.slug);
      }
    }

    // Invalidação de versão de cache local
    const BUNDLE_CACHE_VER = 'vade_bundle_v7';
    if (typeof localStorage !== 'undefined' && localStorage.getItem('vade_bundle_cache_ver') !== BUNDLE_CACHE_VER) {
      await invalidateArtigosCache();
      localStorage.setItem('vade_bundle_cache_ver', BUNDLE_CACHE_VER);
    }

    // ⚡ FASE 1: Carregar as 8 leis prioritárias direto na RAM (0ms de abertura)
    // Estas são as mais acessadas — carregamos primeiro e em paralelo.
    const priorityManifest = manifest.leis.filter(m => 
      PRIORITY_LAWS.some(p => matchesSlug({ tabela_nome: p, nome: p, id: p } as any, m.slug))
    );
    const restManifest = manifest.leis.filter(m => !priorityManifest.includes(m));

    // Carrega leis prioritárias primeiro — tanto IndexedDB quanto RAM
    for (const m of priorityManifest) {
      const tabela = slugToTabela.get(m.slug);
      if (!tabela) continue;
      try {
        // Tenta do IndexedDB primeiro
        const cached = await getPersistedArtigosCache(tabela);
        if (cached && cached.length > 0) {
          setRAMCache(tabela, cached);
          continue;
        }
        // Senão, carrega do bundle
        const arts = await loadBundledLei(m.slug);
        if (arts && arts.length > 0) {
          await setPersistedArtigosCache(tabela, arts);
          setRAMCache(tabela, arts);
        }
      } catch { /* segue */ }
    }
    console.info(`[lawsBundle] ⚡ ${priorityManifest.length} leis prioritárias em RAM`);

    // FASE 2: Processar restante das leis (as que ainda não estão no cache)
    const queue: typeof manifest.leis = [];
    for (const m of restManifest) {
        const t = slugToTabela.get(m.slug);
        if (!t) continue;
        const exists = await getPersistedArtigosCache(t);
        if (exists && exists.length > 0) {
          // Já está no IndexedDB — popular RAM cache também
          setRAMCache(t, exists);
        } else {
          queue.push(m);
        }
    }

    let i = 0;
    const worker = async () => {
      while (i < queue.length) {
        const item = queue[i++];
        if (!item) continue;
        const tabela = slugToTabela.get(item.slug)!;
        try {
          const arts = await loadBundledLei(item.slug);
          if (arts && arts.length > 0) {
              await setPersistedArtigosCache(tabela, arts);
              setRAMCache(tabela, arts);
          }
        } catch { /* segue */ }
      }
    };
    await Promise.all(Array.from({ length: Math.min(concurrency, queue.length) }, () => worker()));
  })();
  return _primePromise;
}

function matchesSlug(lei: { tabela_nome: string; nome: string; id: string }, slug: string): boolean {
  const norm = (s: string) =>
    (s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '');
  const s = norm(slug);
  return [lei.tabela_nome, lei.nome, lei.id].some((v) => norm(String(v || '')) === s);
}

export function getBundleSlugForTabela(tabelaNome: string): string | null {
  if (!tabelaNome || !_slugToId) return null;
  if (_slugToId.has(tabelaNome)) return tabelaNome;

  const lei = LEIS_CATALOG.find(l => l.tabela_nome === tabelaNome);
  if (!lei) return null;

  for (const slug of Array.from(_slugToId.keys())) {
    if (matchesSlug(lei as any, slug)) return slug;
  }
  return null;
}

/** 
 * Sincroniza deltas de leis após carregamento do bundle offline.
 * Implementação full-sync reservada para o backend edge-functions delta.
 */
export async function syncLawsDelta(): Promise<void> {
    // Stub
}

