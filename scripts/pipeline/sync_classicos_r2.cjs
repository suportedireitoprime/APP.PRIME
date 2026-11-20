const https = require('https');
const fs = require('fs');
const { S3Client, PutObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const { createClient } = require('@supabase/supabase-js');

const s3 = new S3Client({
  region: 'auto',
  endpoint: 'https://f654819db5e99f6d7f9475abf6e3f834.r2.cloudflarestorage.com',
  credentials: {
    accessKeyId: '199f43b3ef1e89db1506e45430cb4660',
    secretAccessKey: '6ac079b15bc8f24d9bbeacdf5bbb7ad9ead1b1caa96eafe1ba1b75d15200c6bc'
  }
});

const BUCKET = 'estudos-juridicos-midias';
const PUBLIC_BASE = 'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev';
const R2_PREFIX = 'pilulas/classicos-do-direito';

const SUPABASE_URL = 'https://dnjrgpldcwcpoywamorr.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJncGxkY3djcG95d2Ftb3JyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY4NjEzMywiZXhwIjoyMDk4MjYyMTMzfQ.M4cllbXRDvqgCt5T7_yFjnT4seIYU-Va7Bs6PhRDu-w';
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

function getContentType(filename) {
  if (filename.endsWith('.mp3')) return 'audio/mpeg';
  if (filename.endsWith('.pdf')) return 'application/pdf';
  if (filename.endsWith('.srt')) return 'text/plain; charset=utf-8';
  if (filename.endsWith('.txt')) return 'text/plain; charset=utf-8';
  return 'application/octet-stream';
}

function downloadDriveFile(id, retries = 3) {
  return new Promise((resolve, reject) => {
    const url = `https://drive.google.com/uc?export=download&id=${id}`;
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return https.get(res.headers.location, (res2) => {
          const chunks = [];
          res2.on('data', c => chunks.push(c));
          res2.on('end', () => resolve(Buffer.concat(chunks)));
        }).on('error', (err) => {
          if (retries > 0) return resolve(downloadDriveFile(id, retries - 1));
          reject(err);
        });
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', (err) => {
      if (retries > 0) return resolve(downloadDriveFile(id, retries - 1));
      reject(err);
    });
  });
}

const existingKeys = new Set();

async function loadExistingR2Keys() {
  let continuationToken = undefined;
  console.log(`Checking existing keys in R2 (${BUCKET}/${R2_PREFIX}/)...`);
  do {
    const res = await s3.send(new ListObjectsV2Command({
      Bucket: BUCKET,
      Prefix: R2_PREFIX + '/',
      ContinuationToken: continuationToken
    }));
    if (res.Contents) {
      for (const obj of res.Contents) {
        existingKeys.add(obj.Key);
      }
    }
    continuationToken = res.NextContinuationToken;
  } while (continuationToken);
  console.log(`Found ${existingKeys.size} files already on R2.`);
}

async function uploadToR2(key, body, contentType) {
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: body,
    ContentType: contentType,
    CacheControl: 'public, max-age=31536000, immutable'
  }));
}

async function run() {
  await loadExistingR2Keys();

  const allFiles = JSON.parse(fs.readFileSync('scripts/pipeline/classicos_files_list.json', 'utf8'));
  const validFiles = allFiles.filter(f => !f.name.startsWith('Controle'));
  console.log(`Total files to process: ${validFiles.length}`);

  // Download & upload with concurrency 4
  const CONCURRENCY = 4;
  let idx = 0;
  let uploadedCount = 0;
  let skippedCount = 0;

  async function worker() {
    while (idx < validFiles.length) {
      const current = validFiles[idx++];
      const r2Key = `${R2_PREFIX}/${current.name}`;

      if (existingKeys.has(r2Key)) {
        skippedCount++;
        // console.log(`[SKIP] Already on R2: ${current.name}`);
        continue;
      }

      try {
        console.log(`[DOWNLOADING ${idx}/${validFiles.length}] ${current.name}...`);
        const buffer = await downloadDriveFile(current.id);
        const ct = getContentType(current.name);
        console.log(`[UPLOADING] ${current.name} (${(buffer.length / 1024 / 1024).toFixed(2)} MB)...`);
        await uploadToR2(r2Key, buffer, ct);
        existingKeys.add(r2Key);
        uploadedCount++;
        console.log(`[OK ${uploadedCount}] Uploaded ${current.name}`);
      } catch (err) {
        console.error(`[ERROR] Failed ${current.name}:`, err.message);
      }
    }
  }

  const workers = [];
  for (let i = 0; i < CONCURRENCY; i++) {
    workers.push(worker());
  }
  await Promise.all(workers);
  console.log(`Upload complete! Uploaded: ${uploadedCount}, Skipped: ${skippedCount}`);

  // Now, update Supabase and create local JSON files
  console.log('Now updating Supabase biblioteca_classicos and local catalogs...');
  const matched = JSON.parse(fs.readFileSync('scripts/pipeline/classicos_matched.json', 'utf8'));

  // Group files by book key
  const booksMap = {};
  validFiles.forEach(f => {
    const m = f.name.match(/^(\d{2}-[a-z0-9-]+?)(?:-ficha-cornell\.pdf|-roteiro\.txt|\.mp3|\.srt)$/i);
    const key = m ? m[1] : f.name.replace(/\.[^.]+$/, '');
    if (!booksMap[key]) booksMap[key] = {};
    if (f.name.endsWith('.mp3')) booksMap[key].mp3 = f.name;
    if (f.name.endsWith('.srt')) booksMap[key].srt = f.name;
    if (f.name.includes('ficha-cornell') || f.name.endsWith('.pdf')) booksMap[key].pdf = f.name;
    if (f.name.includes('roteiro') || f.name.endsWith('.txt')) booksMap[key].txt = f.name;
  });

  const catalogTopicos = [];

  for (const m of matched) {
    const bookFiles = booksMap[m.key] || {};
    const audioUrl = bookFiles.mp3 ? `${PUBLIC_BASE}/${R2_PREFIX}/${bookFiles.mp3}` : null;
    const srtUrl = bookFiles.srt ? `${PUBLIC_BASE}/${R2_PREFIX}/${bookFiles.srt}` : null;
    const pdfUrl = bookFiles.pdf ? `${PUBLIC_BASE}/${R2_PREFIX}/${bookFiles.pdf}` : null;
    const roteiroUrl = bookFiles.txt ? `${PUBLIC_BASE}/${R2_PREFIX}/${bookFiles.txt}` : null;

    catalogTopicos.push({
      id: m.key,
      dbId: m.dbId,
      baseSlug: m.key,
      titulo: m.dbLivro,
      autor: m.dbAutor,
      audioUrl,
      srtUrl,
      pdfUrl,
      roteiroUrl
    });

    // Update in Supabase
    if (audioUrl) {
      // First fetch current curiosidades
      const { data: curRow } = await supabase
        .from('biblioteca_classicos')
        .select('curiosidades')
        .eq('id', m.dbId)
        .single();

      const existingCuriosidades = curRow?.curiosidades && typeof curRow.curiosidades === 'object' ? curRow.curiosidades : {};
      const updatedCuriosidades = {
        ...existingCuriosidades,
        ficha_cornell_pdf: pdfUrl,
        srt_url: srtUrl,
        roteiro_url: roteiroUrl,
        pilula_slug: m.key
      };

      const { error: upErr } = await supabase
        .from('biblioteca_classicos')
        .update({
          audio_resumo_url: audioUrl,
          curiosidades: updatedCuriosidades
        })
        .eq('id', m.dbId);

      if (upErr) {
        console.error(`Failed to update DB for ${m.dbLivro} (ID ${m.dbId}):`, upErr);
      } else {
        console.log(`[DB UPDATED] ID ${m.dbId}: ${m.dbLivro} -> ${audioUrl}`);
      }
    }
  }

  // Create full ModuloItem JSON for src/data/pilulas/classicos-do-direito.json
  const moduloItem = [{
    id: 'classicos-do-direito',
    folderIndex: 1,
    titulo: 'Clássicos do Direito',
    folderName: 'Clássicos do Direito',
    slug: 'classicos-do-direito',
    totalTopicos: catalogTopicos.length,
    topicos: catalogTopicos
  }];

  fs.writeFileSync('src/data/pilulas/classicos-do-direito.json', JSON.stringify(moduloItem, null, 2));
  console.log('Saved src/data/pilulas/classicos-do-direito.json with', catalogTopicos.length, 'topicos.');
}

run().catch(console.error);
