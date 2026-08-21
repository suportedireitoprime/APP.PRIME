import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

// 1. Pegar variáveis de ambiente locais do .env
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

// Vamos ler os JSONs que sobraram dentro do APK antes da limpeza total
const srcDir = path.join(root, 'public/offline-bundle');

async function ensureBucket() {
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  if (listError) throw listError;
  
  if (!buckets.find(b => b.name === BUCKET_NAME)) {
    console.log(`📦 Criando bucket publico '${BUCKET_NAME}'...`);
    const { error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
      public: true,
      allowedMimeTypes: ['application/json', 'application/gzip', 'application/brotli']
    });
    if (createError) throw createError;
  }
}

async function uploadFiles() {
  await ensureBucket();
  
  try {
    const files = await fs.readdir(srcDir);
    // Filtrar apenas JSON (ignorar .gz e .br para o upload principal, ou podemos subir tudo)
    // O ideal é subir o .json para o fallback fetch funcionar sem problema
    const jsonFiles = files.filter(f => f.endsWith('.json'));
    
    console.log(`🚀 Encontrados ${jsonFiles.length} pacotes JSON para upload.`);
    
    for (const file of jsonFiles) {
      const filePath = path.join(srcDir, file);
      const stats = await fs.stat(filePath);
      console.log(`⏳ Fazendo upload de ${file} (${(stats.size / 1024 / 1024).toFixed(2)} MB)...`);
      
      const fileBuffer = await fs.readFile(filePath);
      
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(file, fileBuffer, {
          cacheControl: '3600',
          upsert: true,
          contentType: 'application/json'
        });
        
      if (error) {
        console.error(`❌ Erro no upload de ${file}:`, error.message);
      } else {
        console.log(`✅ Upload de ${file} concluído.`);
      }
    }
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.error(`❌ Diretório de origem não encontrado: ${srcDir}`);
    } else {
      console.error('❌ Erro inesperado:', err);
    }
  }
}

uploadFiles().then(() => console.log('🎉 Finalizado.'));
