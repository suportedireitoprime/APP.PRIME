/**
 * Popula o SQLite nativo com dados do laws-bundle para busca FTS5 offline.
 *
 * Fluxo:
 *   1. Lê o manifest do laws-bundle (lista de leis embarcadas)
 *   2. Para cada lei, carrega o JSON do bundle
 *   3. Insere artigos na tabela `artigos_cache` do SQLite nativo
 *   4. O trigger FTS5 indexa automaticamente para busca full-text
 *
 * Só roda no app nativo (Capacitor) — na web o SQLite é desabilitado.
 * Usa flag no key-value para evitar re-popular a cada boot.
 */

import { localDb } from '@/services/localDb';
import { loadManifest, loadBundledLei } from '@/services/lawsBundle';
import { LEIS_CATALOG } from '@/data/leisCatalog';

const FTS_POPULATED_KEY = 'fts5_populated_v1';
const CHUNK_SIZE = 200; // Artigos por batch INSERT

function matchSlug(lei: { tabela_nome: string; nome: string; id: string }, slug: string): boolean {
  const norm = (s: string) =>
    (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '');
  const s = norm(slug);
  return [lei.tabela_nome, lei.nome, lei.id].some((v) => norm(String(v || '')) === s);
}

async function insertArtigosBatch(lei: string, artigos: any[]): Promise<number> {
  let inserted = 0;
  for (let i = 0; i < artigos.length; i += CHUNK_SIZE) {
    const batch = artigos.slice(i, i + CHUNK_SIZE);
    const values = batch
      .map((a) => {
        const id = String(a.id || '').replace(/'/g, "''");
        const numero = String(a.numero || '').replace(/'/g, "''");
        const titulo = String(a.titulo || a.epigrafe || a.nomen_juris || '').replace(/'/g, "''");
        const texto = String(a.caput || a.texto || '').replace(/'/g, "''");
        const ts = Date.now();
        return `('${id}', '${lei.replace(/'/g, "''")}', '${numero}', '${titulo}', '${texto}', ${ts})`;
      })
      .join(',\n');

    if (values) {
      await localDb.exec(
        `INSERT OR IGNORE INTO artigos_cache(id, lei, numero, titulo, texto, updated_at) VALUES ${values};`
      );
      inserted += batch.length;
    }
  }
  return inserted;
}

async function rebuildFts5(): Promise<void> {
  try {
    await localDb.exec(`INSERT INTO artigos_fts(artigos_fts) VALUES('rebuild');`);
  } catch {
    // FTS5 indisponível nesta build — busca cairá no LIKE fallback
  }
}

/**
 * Popula o SQLite FTS5 nativo com todas as leis do bundle.
 * Chame uma vez no boot — idempotente via flag KV.
 */
export async function populateFTS5FromBundle(): Promise<void> {
  if (!localDb.available) return;

  try {
    await localDb.ready();

    // Checa se já populou nesta versão
    const populated = await localDb.getKv(FTS_POPULATED_KEY);
    if (populated === 'done') return;

    const manifest = await loadManifest();
    if (!manifest?.leis?.length) return;

    console.info('[fts5Populator] Iniciando população do SQLite FTS5 com', manifest.leis.length, 'leis');
    const started = Date.now();
    let totalArtigos = 0;

    // Mapeia slug → tabela_nome usando LEIS_CATALOG
    const slugToTabela = new Map<string, string>();
    for (const m of manifest.leis) {
      const lei = LEIS_CATALOG.find((l) => matchSlug(l as any, m.slug));
      if (lei) {
        slugToTabela.set(m.slug, lei.tabela_nome);
      } else {
        slugToTabela.set(m.slug, m.slug);
      }
    }

    // Processa leis em série (não sobrecarregar o SQLite)
    for (const m of manifest.leis) {
      const tabela = slugToTabela.get(m.slug);
      if (!tabela) continue;

      try {
        const artigos = await loadBundledLei(m.slug);
        if (!artigos?.length) continue;

        const inserted = await insertArtigosBatch(tabela, artigos);
        totalArtigos += inserted;
      } catch {
        // Lei individual falhou — seguir com as demais
      }
    }

    // Rebuild do índice FTS5 para incluir todos os novos artigos
    await rebuildFts5();

    // Marcar como populado
    await localDb.setKv(FTS_POPULATED_KEY, 'done');

    console.info(
      `[fts5Populator] ✅ ${totalArtigos} artigos indexados no FTS5 em ${Date.now() - started}ms`
    );
  } catch (err) {
    console.warn('[fts5Populator] Erro ao popular FTS5:', err);
  }
}

/**
 * Invalida o cache FTS5 (útil ao atualizar bundle).
 * Próximo boot vai re-popular.
 */
export async function invalidateFTS5Cache(): Promise<void> {
  if (!localDb.available) return;
  try {
    await localDb.ready();
    await localDb.delKv(FTS_POPULATED_KEY);
  } catch { /* ignore */ }
}
