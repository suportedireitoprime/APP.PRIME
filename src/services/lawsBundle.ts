/**
 * Loader do bundle estático (offline) de leis.
 *
 * Fluxo (Zero-Loading Inicial):
 *  1. App abre → tenta ler /laws-bundle/manifest.json (embutido no build Vite/dist)
 *  2. Verifica quais leis não constam no banco local Dexie (artigosCache).
 *  3. Popula o banco local em background com os dados do bundle.
 *  4. Da próxima vez que o usuário abrir a lei, já está na memória em 0ms.
 */

import { setPersistedArtigosCache, getPersistedArtigosCache } from '@/services/offlineDb';

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
      caput: (r.texto || '').replace(/(\d)o\b/g, '$1º').replace(/°/g, 'º'),
      titulo: r.epigrafe || undefined,
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
      // O slug unificado no supabase bate com o `tabela_nome` no catalog?
      // Usaremos a rotina de match fuzzy.
      const lei = LEIS_CATALOG.find((l) => matchesSlug(l as any, m.slug));
      if (lei) {
          slugToTabela.set(m.slug, lei.tabela_nome);
      } else {
          // Se for uma lei especial dinâmica que não está no catalog, a `tabelaNome` é o próprio slug
          slugToTabela.set(m.slug, m.slug);
      }
    }

    // Processa apenas as leis que AINDA NÃO estão no cache.
    const queue = [];
    for (const m of manifest.leis) {
        const t = slugToTabela.get(m.slug);
        if (!t) continue;
        const exists = await getPersistedArtigosCache(t);
        if (!exists || exists.length === 0) {
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
              console.log(`[lawsBundle] ${item.slug} injetada offline (zero-load).`);
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

/** 
 * Sincroniza deltas de leis após carregamento do bundle offline.
 * Implementação full-sync reservada para o backend edge-functions delta.
 */
export async function syncLawsDelta(): Promise<void> {
    // Stub
}

