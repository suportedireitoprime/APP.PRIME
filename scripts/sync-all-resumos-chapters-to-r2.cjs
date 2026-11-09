const fs = require('fs');
const path = require('path');
const { S3Client, PutObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');

const s3 = new S3Client({
  region: 'auto',
  endpoint: 'https://f654819db5e99f6d7f9475abf6e3f834.r2.cloudflarestorage.com',
  credentials: {
    accessKeyId: '199f43b3ef1e89db1506e45430cb4660',
    secretAccessKey: '6ac079b15bc8f24d9bbeacdf5bbb7ad9ead1b1caa96eafe1ba1b75d15200c6bc'
  }
});

const BUCKET = 'estudos-juridicos-midias';
const scanPath = path.join(__dirname, '../tmp/resumos_drive_scan.json');
const catalogPath = path.join(__dirname, '../src/data/resumosChaptersCatalog.json');

if (!fs.existsSync(scanPath) || !fs.existsSync(catalogPath)) {
  console.error('Scan ou catalog não encontrados!');
  process.exit(1);
}

const scanData = JSON.parse(fs.readFileSync(scanPath, 'utf8'));
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

// Queue of files to download and upload
const tasks = [];

for (const book of scanData) {
  const cleanName = book.name.replace(/\s*—\s*Diálogo Professora e Aluna/i, '').trim();
  const cat = Object.values(catalog).find(c => c.nome === cleanName);
  if (!cat) continue;
  const slug = cat.slug;

  // Sync all chapters mp3 + srt
  const filesToSync = book.files.filter(f => 
    (f.name.endsWith('.mp3') || f.name.endsWith('.srt'))
  );

  for (const f of filesToSync) {
    const key = `audiobooks/resumos/${slug}/${f.name}`;
    const isSrt = f.name.endsWith('.srt');
    tasks.push({
      slug,
      bookName: cleanName,
      fileName: f.name,
      fileId: f.id,
      key,
      contentType: isSrt ? 'text/plain; charset=utf-8' : 'audio/mpeg'
    });
  }
}

console.log(`Total de arquivos para verificar/sincronizar: ${tasks.length}`);

async function existsInR2(key) {
  try {
    const head = await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
    return (head.ContentLength || 0) > 0;
  } catch {
    return false;
  }
}

async function downloadDriveFile(fileId, retries = 3) {
  const url = `https://drive.google.com/uc?export=download&id=${fileId}`;
  for (let tentativa = 1; tentativa <= retries; tentativa++) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const ab = await res.arrayBuffer();
      return Buffer.from(ab);
    } catch (err) {
      if (tentativa === retries) throw err;
      await new Promise(r => setTimeout(r, 1500));
    }
  }
}

async function uploadToR2(key, buffer, contentType) {
  if (buffer.length > 40 * 1024 * 1024) {
    const tmpFile = path.join(__dirname, `../tmp/stream_${Date.now()}_${Math.random().toString(36).slice(2)}.bin`);
    fs.writeFileSync(tmpFile, buffer);
    try {
      const stream = fs.createReadStream(tmpFile);
      await s3.send(new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: stream,
        ContentLength: buffer.length,
        ContentType: contentType,
        CacheControl: 'public, max-age=31536000'
      }));
    } finally {
      try { fs.unlinkSync(tmpFile); } catch {}
    }
  } else {
    await s3.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000'
    }));
  }
}

// Concurrency pool of 6 workers
const CONCURRENCY = 6;
let cursor = 0;
let completed = 0;
let skipped = 0;
let uploaded = 0;
let failed = 0;

async function worker(workerId) {
  while (cursor < tasks.length) {
    const task = tasks[cursor++];
    const idx = cursor;
    const tag = `[${idx}/${tasks.length}] [${task.slug}] ${task.fileName}`;

    try {
      const already = await existsInR2(task.key);
      if (already) {
        skipped++;
        completed++;
        continue;
      }

      console.log(`[W${workerId}] ${tag} Baixando...`);
      const buf = await downloadDriveFile(task.fileId);
      if (!buf || buf.length === 0) throw new Error('Buffer vazio');

      await uploadToR2(task.key, buf, task.contentType);
      uploaded++;
      completed++;
      console.log(`[W${workerId}] ${tag} Enviado (${(buf.length / 1024 / 1024).toFixed(2)} MB). Progresso: ${completed}/${tasks.length}`);
    } catch (err) {
      failed++;
      completed++;
      console.error(`[W${workerId}] ${tag} FALHOU:`, err.message);
    }
  }
}

async function run() {
  console.log(`Iniciando pool com ${CONCURRENCY} workers paralelos...\n`);
  const start = Date.now();
  const pool = [];
  for (let w = 1; w <= CONCURRENCY; w++) {
    pool.push(worker(w));
  }
  await Promise.all(pool);
  const durSec = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`\n=== FIM DA SINCRONIZAÇÃO EM ${durSec}s ===`);
  console.log(`Total: ${completed} | Já existiam no R2: ${skipped} | Novos uploads: ${uploaded} | Falhas: ${failed}`);
}

run().catch(console.error);
