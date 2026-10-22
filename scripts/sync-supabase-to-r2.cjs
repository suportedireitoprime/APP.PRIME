const { S3Client, PutObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://dnjrgpldcwcpoywamorr.supabase.co';
const SUPABASE_KEY = 'sb_publishable_fg4Q9U47TMW7voFVPVZb0Q_--H03YrT';
const R2_BUCKET = 'livros-pdf';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const s3 = new S3Client({
  region: 'auto',
  endpoint: 'https://f654819db5e99f6d7f9475abf6e3f834.r2.cloudflarestorage.com',
  credentials: {
    accessKeyId: '9946baad5f56599bbd60f978621f2129',
    secretAccessKey: '23eed9cddfa1428a277e9d5fe5b9b5e5c28ad0aac49fdf4f5720ed85d411b9da'
  }
});

function getContentType(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  switch (ext) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    case 'svg':
      return 'image/svg+xml';
    case 'pdf':
      return 'application/pdf';
    case 'md':
      return 'text/markdown';
    case 'json':
      return 'application/json';
    default:
      return 'application/octet-stream';
  }
}

async function listAllSupabaseFiles(bucket, folder) {
  let allFiles = [];
  let offset = 0;
  const limit = 100;

  while (true) {
    const { data, error } = await supabase.storage.from(bucket).list(folder, {
      limit,
      offset,
      sortBy: { column: 'name', order: 'asc' }
    });

    if (error) {
      console.error(`Erro ao listar ${folder}:`, error.message);
      break;
    }

    if (!data || data.length === 0) break;

    for (const item of data) {
      // Ignora subpastas placeholder
      if (item.id === null && !item.metadata) continue;
      const fullPath = folder ? `${folder}/${item.name}` : item.name;
      allFiles.push({
        name: item.name,
        path: fullPath
      });
    }

    offset += data.length;
    if (data.length < limit) break;
  }

  return allFiles;
}

async function uploadFileToR2(remotePath, buffer, contentType) {
  // Salva tanto no path relativo (capas/...) quanto no path com prefixo do bucket (biblioteca-obras/capas/...)
  // garantindo compatibilidade total com qualquer formato de URL
  const keysToSave = [
    remotePath,
    `biblioteca-obras/${remotePath}`
  ];

  for (const key of keysToSave) {
    await s3.send(new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000, immutable'
    }));
  }
}

async function main() {
  console.log('=== INICIANDO SINCRONIZAÇÃO SUPABASE -> CLOUDFLARE R2 ===');
  console.log('Bucket de destino:', R2_BUCKET);

  const foldersToSync = [
    'capas',
    'capas/pdfs',
    'capas_areas',
    'capas_fixas',
    'areas',
    'pdfs'
  ];

  let filesToProcess = [];

  for (const folder of foldersToSync) {
    process.stdout.write(`Listando ${folder}... `);
    const files = await listAllSupabaseFiles('biblioteca-obras', folder);
    console.log(`Encontrados: ${files.length}`);
    filesToProcess.push(...files);
  }

  console.log(`\nTotal geral de arquivos a migrar: ${filesToProcess.length}`);

  let uploaded = 0;
  let skipped = 0;
  let errors = 0;

  const CONCURRENCY = 8;
  const chunks = [];
  for (let i = 0; i < filesToProcess.length; i += CONCURRENCY) {
    chunks.push(filesToProcess.slice(i, i + CONCURRENCY));
  }

  const startTime = Date.now();

  for (let c = 0; c < chunks.length; c++) {
    const chunk = chunks[c];
    await Promise.all(chunk.map(async (file) => {
      try {
        const fileUrl = `${SUPABASE_URL}/storage/v1/object/public/biblioteca-obras/${file.path}`;
        const res = await fetch(fileUrl);
        if (!res.ok) {
          console.error(`Falha no download (${res.status}): ${file.path}`);
          errors++;
          return;
        }

        const arrayBuffer = await res.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const contentType = getContentType(file.name);

        await uploadFileToR2(file.path, buffer, contentType);
        uploaded++;
      } catch (err) {
        console.error(`Erro ao processar ${file.path}:`, err.message);
        errors++;
      }
    }));

    const progress = Math.round(((c + 1) / chunks.length) * 100);
    const elapsed = Math.round((Date.now() - startTime) / 1000);
    process.stdout.write(`\rProgresso: ${uploaded}/${filesToProcess.length} (${progress}%) | Tempo: ${elapsed}s | Erros: ${errors}`);
  }

  const totalTime = Math.round((Date.now() - startTime) / 1000);
  console.log(`\n\n=== SINCRONIZAÇÃO CONCLUÍDA em ${totalTime}s ===`);
  console.log(`Total enviados: ${uploaded}`);
  console.log(`Total erros: ${errors}`);
}

main().catch(console.error);
