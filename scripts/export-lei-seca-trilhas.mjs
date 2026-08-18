import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("❌ Faltando VITE_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY no .env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const BUCKET_NAME = 'offline-bundles';

async function exportTrilhas() {
  console.log('📦 Exportando lei_seca_trilhas...');
  const { data, error } = await supabase
    .from('lei_seca_trilhas')
    .select('*')
    .eq('ativa', true)
    .order('ordem', { ascending: true });

  if (error) {
    console.error('❌ Erro ao exportar:', error);
    return;
  }

  const outDir = path.join(root, 'public/offline-bundle');
  await fs.mkdir(outDir, { recursive: true });

  const fileName = 'lei-seca-trilhas.json';
  const filePath = path.join(outDir, fileName);
  await fs.writeFile(filePath, JSON.stringify(data));
  console.log(`✅ Escrito em ${filePath} (${data.length} trilhas)`);

  // Fazer upload para o Storage se BUCKET_NAME existir
  console.log(`⏳ Fazendo upload para bucket '${BUCKET_NAME}'...`);
  const fileBuffer = await fs.readFile(filePath);
  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(fileName, fileBuffer, {
      cacheControl: '3600',
      upsert: true,
      contentType: 'application/json'
    });

  if (uploadError) {
    console.error(`❌ Erro no upload:`, uploadError.message);
  } else {
    console.log(`✅ Upload concluído.`);
  }
}

exportTrilhas();
