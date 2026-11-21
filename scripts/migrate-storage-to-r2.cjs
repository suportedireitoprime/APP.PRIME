const { S3Client, PutObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
const { createClient } = require('@supabase/supabase-js');

// Configuração R2 Cloudflare (Zero Egress Cost)
const R2_CONFIG = {
  endpoint: 'https://f654819db5e99f6d7f9475abf6e3f834.r2.cloudflarestorage.com',
  accessKeyId: '199f43b3ef1e89db1506e45430cb4660',
  secretAccessKey: '6ac079b15bc8f24d9bbeacdf5bbb7ad9ead1b1caa96eafe1ba1b75d15200c6bc',
};

const s3 = new S3Client({
  region: 'auto',
  endpoint: R2_CONFIG.endpoint,
  credentials: {
    accessKeyId: R2_CONFIG.accessKeyId,
    secretAccessKey: R2_CONFIG.secretAccessKey,
  },
});

// Configuração Supabase
const SUPABASE_URL = 'https://dnjrgpldcwcpoywamorr.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJncGxkY3djcG95d2Ftb3JyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY4NjEzMywiZXhwIjoyMDk4MjYyMTMzfQ.M4cllbXRDvqgCt5T7_yFjnT4seIYU-Va7Bs6PhRDu-w';
const sb = createClient(SUPABASE_URL, SERVICE_KEY);

// Mapeamento Canônico de Buckets Supabase -> Cloudflare R2
const BUCKET_MAPPING = {
  'biblioteca-obras': {
    targetR2Bucket: 'livros-pdf',
    publicBaseUrl: 'https://pub-9cd49875afe549788617b01e97309a55.r2.dev',
    r2Prefix: 'biblioteca-obras',
  },
  'blog-capas': {
    targetR2Bucket: 'estudos-juridicos-midias',
    publicBaseUrl: 'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev',
    r2Prefix: 'blog-capas',
  },
  'push-covers': {
    targetR2Bucket: 'estudos-juridicos-midias',
    publicBaseUrl: 'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev',
    r2Prefix: 'push-covers',
  },
  'offline-bundles': {
    targetR2Bucket: 'estudos-juridicos-midias',
    publicBaseUrl: 'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev',
    r2Prefix: 'offline-bundles',
  },
  'imagens': {
    targetR2Bucket: 'estudos-juridicos-midias',
    publicBaseUrl: 'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev',
    r2Prefix: 'imagens',
  },
  'narracoes-conteudo': {
    targetR2Bucket: 'vacatio-midias',
    publicBaseUrl: 'https://pub-0c1a0e4ebbdd44dfa883dd36c269f19f.r2.dev',
    r2Prefix: 'narracoes-conteudo',
  },
  'audios': {
    targetR2Bucket: 'vacatio-midias',
    publicBaseUrl: 'https://pub-0c1a0e4ebbdd44dfa883dd36c269f19f.r2.dev',
    r2Prefix: 'audios',
  },
};

function getMimeType(filePath) {
  const lower = filePath.toLowerCase();
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.gif')) return 'image/gif';
  if (lower.endsWith('.svg')) return 'image/svg+xml';
  if (lower.endsWith('.mp3')) return 'audio/mpeg';
  if (lower.endsWith('.m4a')) return 'audio/mp4';
  if (lower.endsWith('.wav')) return 'audio/wav';
  if (lower.endsWith('.pdf')) return 'application/pdf';
  if (lower.endsWith('.json')) return 'application/json';
  if (lower.endsWith('.srt') || lower.endsWith('.txt') || lower.endsWith('.md')) return 'text/plain; charset=utf-8';
  return 'application/octet-stream';
}

// Lista recursivamente todos os arquivos de um bucket no Supabase Storage
async function listAllFilesRecursively(bucketName, folder = '') {
  const results = [];
  const limit = 100;
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const { data: items, error } = await sb.storage.from(bucketName).list(folder, {
      limit,
      offset,
      sortBy: { column: 'name', order: 'asc' },
    });

    if (error) {
      console.error(`[Supabase Storage] Erro ao listar ${bucketName}/${folder}:`, error.message);
      break;
    }

    if (!items || items.length === 0) {
      hasMore = false;
      break;
    }

    for (const item of items) {
      const fullPath = folder ? `${folder}/${item.name}` : item.name;
      // Pastas no Supabase possuem id === null
      if (item.id === null) {
        const subFiles = await listAllFilesRecursively(bucketName, fullPath);
        results.push(...subFiles);
      } else {
        results.push({
          bucket: bucketName,
          path: fullPath,
          name: item.name,
          size: item.metadata?.size || 0,
          updatedAt: item.updated_at,
        });
      }
    }

    if (items.length < limit) {
      hasMore = false;
    } else {
      offset += limit;
    }
  }

  return results;
}

// Checa se o arquivo já existe no Cloudflare R2 com tamanho compatível
async function existsInR2(targetBucket, r2Key, expectedSize) {
  try {
    const head = await s3.send(new HeadObjectCommand({
      Bucket: targetBucket,
      Key: r2Key,
    }));
    if (expectedSize && head.ContentLength && head.ContentLength === expectedSize) {
      return true;
    }
    return (head.ContentLength || 0) > 0;
  } catch (err) {
    if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) {
      return false;
    }
    return false;
  }
}

async function migrateFile(file, mapping, options = {}) {
  const { dryRun = false, deleteAfter = false } = options;
  const r2Key = mapping.r2Prefix ? `${mapping.r2Prefix}/${file.path}` : file.path;
  const targetBucket = mapping.targetR2Bucket;
  const sizeMb = (file.size / 1024 / 1024).toFixed(2);

  // 1. Arquivos .wav gigantes desnecessários em audios
  if (file.name.toLowerCase().endsWith('.wav')) {
    if (deleteAfter && !dryRun) {
      console.log(`🗑️ [Deletando .WAV bruto] ${file.bucket}/${file.path} (${sizeMb} MB)`);
      await sb.storage.from(file.bucket).remove([file.path]);
      return { status: 'deleted_raw', bytes: file.size };
    }
    return { status: 'skipped_raw', bytes: 0 };
  }

  // 2. Verificar se já existe no R2
  const alreadyInR2 = await existsInR2(targetBucket, r2Key, file.size);
  if (alreadyInR2) {
    if (deleteAfter && !dryRun) {
      await sb.storage.from(file.bucket).remove([file.path]);
      return { status: 'deleted_existing', bytes: file.size };
    }
    return { status: 'already_exists', bytes: 0 };
  }

  if (dryRun) {
    return { status: 'dry_run', bytes: file.size };
  }

  // 3. Download do Supabase
  const { data: blob, error: dlError } = await sb.storage.from(file.bucket).download(file.path);
  if (dlError || !blob) {
    console.error(`❌ Erro no download do Supabase ${file.bucket}/${file.path}:`, dlError?.message);
    return { status: 'error_download', bytes: 0 };
  }

  const arrayBuffer = await blob.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const mimeType = getMimeType(file.path);

  // 4. Upload para o Cloudflare R2 com Cache-Control de 1 ano
  await s3.send(new PutObjectCommand({
    Bucket: targetBucket,
    Key: r2Key,
    Body: buffer,
    ContentType: mimeType,
    CacheControl: 'public, max-age=31536000, immutable',
  }));

  // 5. Deletar do Supabase se solicitado e upload confirmado
  if (deleteAfter) {
    const verified = await existsInR2(targetBucket, r2Key, buffer.length);
    if (verified) {
      await sb.storage.from(file.bucket).remove([file.path]);
      return { status: 'migrated_and_deleted', bytes: buffer.length };
    }
  }

  return { status: 'migrated', bytes: buffer.length };
}

// Pool de execução com concorrência limitada (ex: 12 workers paralelos)
async function runWithConcurrency(items, concurrency, fn) {
  const results = [];
  let index = 0;

  async function worker() {
    while (index < items.length) {
      const i = index++;
      const item = items[i];
      try {
        const res = await fn(item, i, items.length);
        results[i] = res;
      } catch (err) {
        console.error(`[Worker Error] item ${i}:`, err.message);
        results[i] = { status: 'error', error: err.message };
      }
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

// Limpeza de tabelas de log do banco
async function cleanDatabaseLogs() {
  console.log('\n🧹 Limpando logs antigos e registros expirados do Supabase...');
  try {
    // 1. horus_qr_cache expirados
    const { error: qrErr } = await sb
      .from('horus_qr_cache')
      .delete()
      .lt('expires_at', new Date().toISOString());
    console.log('✓ horus_qr_cache expirados limpos:', qrErr ? qrErr.message : 'Sucesso');

    // 2. horus_outbound_log > 30 dias
    const d30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { error: outErr } = await sb
      .from('horus_outbound_log')
      .delete()
      .lt('created_at', d30);
    console.log('✓ horus_outbound_log (> 30 dias) limpos:', outErr ? outErr.message : 'Sucesso');

    // 3. ai_usage_log > 60 dias
    const d60 = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
    const { error: aiErr } = await sb
      .from('ai_usage_log')
      .delete()
      .lt('created_at', d60);
    console.log('✓ ai_usage_log (> 60 dias) limpos:', aiErr ? aiErr.message : 'Sucesso');
  } catch (err) {
    console.error('Erro na limpeza do banco:', err.message);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const deleteAfter = args.includes('--delete-after');
  const cleanLogs = args.includes('--clean-db-logs');
  const bucketArg = args.find(a => a.startsWith('--bucket='))?.split('=')[1];
  const concurrency = parseInt(args.find(a => a.startsWith('--concurrency='))?.split('=')[1] || '12', 10);

  console.log('====================================================');
  console.log('  MIGRAÇÃO E LIMPEZA SUPABASE STORAGE -> CLOUDFLARE R2');
  console.log('====================================================');
  console.log(`Modo: ${dryRun ? 'DRY-RUN (Simulação)' : deleteAfter ? 'MIGRAÇÃO COM PURGA (--delete-after)' : 'APENAS CÓPIA PARA R2'}`);
  console.log(`Concorrência: ${concurrency} workers paralelos`);

  if (cleanLogs && !dryRun) {
    await cleanDatabaseLogs();
  }

  const bucketsToProcess = bucketArg ? [bucketArg] : Object.keys(BUCKET_MAPPING);

  let grandTotalFiles = 0;
  let grandMigratedCount = 0;
  let grandDeletedCount = 0;
  let grandTotalBytes = 0;

  for (const bucket of bucketsToProcess) {
    const mapping = BUCKET_MAPPING[bucket];
    if (!mapping) {
      console.warn(`Bucket "${bucket}" não possui mapeamento configurado.`);
      continue;
    }

    console.log(`\n📂 Varrando Supabase "${bucket}" -> R2 "${mapping.targetR2Bucket}/${mapping.r2Prefix}"...`);
    const files = await listAllFilesRecursively(bucket);
    console.log(`Total encontrado em "${bucket}": ${files.length} arquivos.`);

    if (files.length === 0) continue;

    let processedInBucket = 0;
    let bucketMigrated = 0;
    let bucketDeleted = 0;
    let bucketBytes = 0;

    await runWithConcurrency(files, concurrency, async (f, i, total) => {
      const res = await migrateFile(f, mapping, { dryRun, deleteAfter });
      processedInBucket++;

      if (res.status === 'migrated' || res.status === 'migrated_and_deleted') {
        bucketMigrated++;
        bucketBytes += res.bytes;
      }
      if (res.status && (res.status.startsWith('deleted') || res.status === 'migrated_and_deleted')) {
        bucketDeleted++;
      }

      if (processedInBucket % 50 === 0 || processedInBucket === total) {
        process.stdout.write(`  [${bucket}] Progresso: ${processedInBucket}/${total} (${((processedInBucket / total) * 100).toFixed(0)}%)\r`);
      }
      return res;
    });

    console.log(`\n✓ Concluído "${bucket}": Migrados: ${bucketMigrated} (${(bucketBytes / 1024 / 1024).toFixed(2)} MB) | Excluídos: ${bucketDeleted}`);

    grandTotalFiles += files.length;
    grandMigratedCount += bucketMigrated;
    grandDeletedCount += bucketDeleted;
    grandTotalBytes += bucketBytes;
  }

  console.log('\n====================================================');
  console.log('RELATÓRIO CONSOLIDADO:');
  console.log(`- Arquivos escaneados: ${grandTotalFiles}`);
  console.log(`- Arquivos migrados para Cloudflare R2: ${grandMigratedCount} (${(grandTotalBytes / 1024 / 1024).toFixed(2)} MB)`);
  console.log(`- Arquivos liberados/excluídos do Supabase: ${grandDeletedCount}`);
  console.log('====================================================\n');
}

main().catch(console.error);
