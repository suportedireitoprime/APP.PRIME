#!/usr/bin/env node
/**
 * Exporta todas as leis + artigos do Supabase (schema unificado) para JSON bundlável.
 *
 * Saída:
 *   public/laws-bundle/manifest.json  → [{ id, slug, nome, nome_curto, updated_at, count }]
 *   public/laws-bundle/<slug>.json    → [{ id, numero, texto, ordem, epigrafe, updated_at, revogado }]
 *
 * Rodado no CI (prebuild). Requer VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY no .env.
 * Falha silenciosa se as env vars estiverem ausentes (não quebra o build web em dev).
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

try {
  if (existsSync('.env')) {
    for (const line of readFileSync('.env', 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  }
} catch {}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const OUT_DIR = resolve('public/laws-bundle');
const PAGE_SIZE = 1000;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn('[export-laws] VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY ausentes; pulando bundle.');
  process.exit(0);
}

const headers = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` };

async function fetchAllPages(pathAndQuery) {
  const rows = [];
  let offset = 0;
  while (true) {
    const url = `${SUPABASE_URL}/rest/v1/${pathAndQuery}&offset=${offset}&limit=${PAGE_SIZE}`;
    const res = await fetch(url, { headers });
    if (!res.ok) {
        console.error(`Supabase falhou: ${res.status}`);
        return [];
    }
    const batch = await res.json();
    if (!batch || batch.length === 0) break;
    rows.push(...batch);
    if (batch.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }
  return rows;
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  console.log('[export-laws] baixando lista de leis do Vade Mecum…');
  
  // No novo schema unificado usamos `vade_mecum_leis`
  const leis = await fetchAllPages('vade_mecum_leis?select=id,slug,nome,nome_curto');

  if (!leis || leis.length === 0) {
      console.warn('[export-laws] Nenhuma lei encontrada no vade_mecum_leis.');
      process.exit(0);
  }

  const manifest = [];
  for (const lei of leis) {
    if (!lei.slug) continue;
    process.stdout.write(`[export-laws] ${lei.slug}… `);
    try {
      const artigos = await fetchAllPages(
        `vade_mecum_artigos?lei_id=eq.${lei.id}&select=id,numero,texto,ordem,epigrafe,ult_alteracao_em,revogado&order=ordem.asc`
      );
      
      let maxUpdated = null;
      for (const a of artigos) {
        if (a.ult_alteracao_em && (!maxUpdated || a.ult_alteracao_em > maxUpdated)) {
          maxUpdated = a.ult_alteracao_em;
        }
      }
      
      await writeFile(join(OUT_DIR, `${lei.slug}.json`), JSON.stringify(artigos));
      manifest.push({
        id: lei.id,
        slug: lei.slug,
        nome: lei.nome,
        nome_curto: lei.nome_curto,
        updated_at: maxUpdated,
        count: artigos.length,
      });
      console.log(`${artigos.length} artigos exportados.`);
    } catch (e) {
      console.log(`ERRO: ${e.message}`);
    }
  }

  const bundleUpdatedAt = manifest.reduce(
    (max, l) => (l.updated_at && (!max || l.updated_at > max) ? l.updated_at : max),
    null
  );
  
  await writeFile(
    join(OUT_DIR, 'manifest.json'),
    JSON.stringify({ generated_at: new Date().toISOString(), bundle_updated_at: bundleUpdatedAt, leis: manifest }, null, 2)
  );
  
  console.log(`[export-laws] OK — ${manifest.length} leis empacotadas no public/laws-bundle/`);
}

main().catch((e) => {
  console.error('[export-laws] FALHOU:', e);
  process.exit(1);
});
