/**
 * Sincroniza visuais salvos em backup local para a tabela `visuais_juridicos` no Supabase
 * Como rodar:
 *   node scripts/sync-visuais-locais-supabase.cjs
 */
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const envContent = fs.existsSync('.env') ? fs.readFileSync('.env', 'utf8') : '';
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
  }
});

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || env.VITE_SUPABASE_URL || env.SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_PUBLISHABLE_KEY || env.SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const BACKUP_FILE = path.resolve('scripts/mapas_gerados_locais.json');

async function sync() {
  if (!fs.existsSync(BACKUP_FILE)) {
    console.log('Nenhum backup local pendente encontrado.');
    return;
  }

  const backupData = JSON.parse(fs.readFileSync(BACKUP_FILE, 'utf8') || '{}');
  const keys = Object.keys(backupData);
  console.log(`Total de visuais no backup local: ${keys.length}`);

  let synced = 0;
  let errors = 0;

  for (const key of keys) {
    const item = backupData[key];
    const { motivo_fallback, gerado_em, ...payload } = item;

    const { data: existing } = await supabase
      .from('visuais_juridicos')
      .select('id')
      .eq('item_key', payload.item_key)
      .eq('tipo', payload.tipo)
      .maybeSingle();

    let resError = null;
    if (existing?.id) {
      const { error } = await supabase
        .from('visuais_juridicos')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', existing.id);
      resError = error;
    } else {
      const { error } = await supabase
        .from('visuais_juridicos')
        .insert(payload);
      resError = error;
    }

    if (resError) {
      errors++;
      console.error(`Erro ao subir ${key}:`, resError.message);
    } else {
      synced++;
      delete backupData[key];
    }
  }

  fs.writeFileSync(BACKUP_FILE, JSON.stringify(backupData, null, 2), 'utf8');
  console.log(`Sincronização concluída: ${synced} salvos com sucesso no Supabase, ${errors} falhas.`);
}

sync().catch(console.error);
