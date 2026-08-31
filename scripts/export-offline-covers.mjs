#!/usr/bin/env node
/**
 * Exporta as capas dos livros para public/offline-covers/.
 * Consumido pelo app em modo offline para não depender do Supabase/CDN.
 */
import { createClient } from '@supabase/supabase-js';
import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const abortController = typeof AbortController !== 'undefined' ? AbortController : require('abort-controller');

// Carrega .env local se existir (dev)
try {
  if (existsSync('.env')) {
    for (const line of readFileSync('.env', 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  }
} catch {}

const URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!URL || !KEY) {
  console.error('[offline-covers] SUPABASE_URL / KEY ausentes — pulando export.');
  process.exit(0);
}

const supabase = createClient(URL, KEY, { auth: { persistSession: false } });
const OUT = path.resolve('public/offline-covers');
await mkdir(OUT, { recursive: true });

function safeName(url) {
  const clean = url.split('?')[0].split('#')[0];
  const base = clean.substring(clean.lastIndexOf('/') + 1) || 'cover';
  
  let h = 0;
  for (let i = 0; i < url.length; i++) h = (h << 5) - h + url.charCodeAt(i);
  const hash = Math.abs(h).toString(36);
  
  const extMatch = base.match(/\.(webp|jpg|jpeg|png|gif)$/i);
  const ext = (extMatch ? extMatch[1] : 'webp').toLowerCase();
  
  return `${hash}.${ext}`;
}

const proxied = (url, w) => `https://wsrv.nl/?url=${encodeURIComponent(url)}&w=${w}&q=80&output=webp`;

async function downloadCover(url, index) {
  if (!url) return;
  const name = safeName(url);
  if (index[url]) {
    if (existsSync(path.join(OUT, name))) return; // Already on disk
  }
  
  const fetchUrl = url.startsWith('http') ? proxied(url, 500) : url;
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000); // 4s timeout
    const res = await fetch(fetchUrl, { signal: controller.signal });
    clearTimeout(timeoutId);
    
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buffer = await res.arrayBuffer();
    await writeFile(path.join(OUT, name), Buffer.from(buffer));
    index[url] = name;
  } catch (e) {
    console.warn(`[offline-covers] Falha ao baixar ${url}: ${e.message}`);
  }
}

const TARGETS = [
  { table: 'biblioteca_classicos', capa: 'imagem', capa_hor: 'capa_horizontal' },
  { table: 'biblioteca_oab', capa: 'capa_livro', capa_hor: 'capa_horizontal' },
  { table: 'biblioteca_estudos', capa: 'capa_livro', capa_hor: 'capa_horizontal' },
  { table: 'biblioteca_portugues', capa: 'imagem', capa_hor: 'capa_horizontal' },
  { table: 'biblioteca_lideranca', capa: 'imagem', capa_hor: 'capa_horizontal' },
  { table: 'biblioteca_fora_da_toga', capa: 'capa_livro', capa_hor: 'capa_horizontal' },
  { table: 'biblioteca_pesquisa_cientifica', capa: 'imagem', capa_hor: 'capa_horizontal' },
  { table: 'biblioteca_oratoria', capa: 'capa_livro', capa_hor: 'capa_horizontal' },
];

async function main() {
  let index = {};
  const manifestPath = path.join(OUT, 'manifest.json');
  if (existsSync(manifestPath)) {
    try {
      index = JSON.parse(readFileSync(manifestPath, 'utf8'));
    } catch {}
  }
  
  let count = 0;
  
  for (const t of TARGETS) {
    console.log(`[offline-covers] Processando ${t.table}...`);
    let from = 0;
    const step = 1000;
    while (true) {
      const { data, error } = await supabase.from(t.table).select(`${t.capa}, ${t.capa_hor}`).range(from, from + step - 1);
      if (error) {
        console.warn(`[offline-covers] Erro na tabela ${t.table}:`, error.message);
        break;
      }
      if (!data || data.length === 0) break;
      
      let promises = [];
      for (const row of data) {
        if (row[t.capa]) promises.push(downloadCover(row[t.capa], index));
        if (row[t.capa_hor]) promises.push(downloadCover(row[t.capa_hor], index));
        
        if (promises.length >= 20) {
          await Promise.all(promises);
          count += promises.length;
          promises = [];
        }
      }
      if (promises.length > 0) {
        await Promise.all(promises);
        count += promises.length;
      }
      
      // Save manifest periodically
      await writeFile(manifestPath, JSON.stringify(index, null, 2));
      
      if (data.length < step) break;
      from += step;
    }
  }

  await writeFile(manifestPath, JSON.stringify(index, null, 2));
  console.log(`[offline-covers] Concluído! ${Object.keys(index).length} capas no índice.`);
}

main().catch(console.error);
