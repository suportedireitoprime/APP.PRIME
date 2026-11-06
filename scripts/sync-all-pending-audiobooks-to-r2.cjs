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
const R2_DOMAIN = 'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev';
const QUEUE_FILE = path.join(__dirname, '../tmp/audiobooks_upload_queue.json');
const PROGRESS_FILE = path.join(__dirname, '../tmp/audiobooks_upload_progress.json');

// Ensure tmp exists
if (!fs.existsSync(path.dirname(QUEUE_FILE))) {
  fs.mkdirSync(path.dirname(QUEUE_FILE), { recursive: true });
}

// Copy from scratch if exists
const scratchQueue = 'C:\\Users\\ext_wpereira\\.gemini\\antigravity\\brain\\71d2fe71-1013-47d3-af98-abf6a18982f5\\scratch\\full_upload_queue.json';
if (!fs.existsSync(QUEUE_FILE) && fs.existsSync(scratchQueue)) {
  fs.copyFileSync(scratchQueue, QUEUE_FILE);
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function downloadDriveFile(fileId, retries = 3) {
  let url = `https://drive.google.com/uc?export=download&id=${fileId}`;
  for (let tentativa = 1; tentativa <= retries; tentativa++) {
    try {
      let res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const ct = res.headers.get('content-type') || '';
      if (ct.includes('text/html')) {
        const text = await res.text();
        const match = text.match(/confirm=([^&"\s]+)/);
        const confirmToken = match ? match[1] : 't';
        url = `https://drive.google.com/uc?export=download&confirm=${confirmToken}&id=${fileId}`;
        res = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            'Cookie': res.headers.get('set-cookie') || ''
          }
        });
      }

      const ab = await res.arrayBuffer();
      return Buffer.from(ab);
    } catch (err) {
      if (tentativa === retries) throw err;
      console.warn(`[Download] Erro no arquivo ${fileId} (${err.message}), retentando em 2s...`);
      await sleep(2000);
    }
  }
}

async function existsInR2(key) {
  try {
    const head = await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
    return (head.ContentLength || 0) > 0;
  } catch (e) {
    return false;
  }
}

async function uploadToR2(key, buffer, contentType) {
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    CacheControl: 'public, max-age=31536000'
  }));
  return `${R2_DOMAIN}/${key}`;
}

function getContentType(filename) {
  const f = filename.toLowerCase();
  if (f.endsWith('.mp3')) return 'audio/mpeg';
  if (f.endsWith('.srt')) return 'text/plain; charset=utf-8';
  if (f.endsWith('.md')) return 'text/markdown; charset=utf-8';
  if (f.endsWith('.webp')) return 'image/webp';
  if (f.endsWith('.jpg') || f.endsWith('.jpeg')) return 'image/jpeg';
  if (f.endsWith('.png')) return 'image/png';
  return 'application/octet-stream';
}

async function main() {
  console.log('=== SINCRONIZADOR MULTI-LIVROS R2 AUDIOBOOKS ===\n');

  if (!fs.existsSync(QUEUE_FILE)) {
    console.error('Arquivo de fila não encontrado:', QUEUE_FILE);
    process.exit(1);
  }

  const queue = JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf8'));
  console.log(`Carregados ${queue.length} arquivos na fila.\n`);

  let progress = { uploaded: 0, skipped: 0, errors: 0, lastIndex: 0 };
  if (fs.existsSync(PROGRESS_FILE)) {
    try {
      progress = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));
    } catch {}
  }

  const CONCURRENCY = 3;
  let currentIndex = 0;
  let activeWorkers = 0;

  async function processItem(item, index) {
    const prog = `[${index + 1}/${queue.length}]`;
    try {
      const exists = await existsInR2(item.r2Key);
      if (exists) {
        console.log(`${prog} [JÁ EXISTE] ${item.r2Key}`);
        progress.skipped++;
        return;
      }

      console.log(`${prog} Baixando ${item.fileName} (${item.bookSlug}/${item.location})...`);
      const buffer = await downloadDriveFile(item.fileId);

      const sizeMb = (buffer.length / 1024 / 1024).toFixed(2);
      console.log(`${prog} Enviando ao R2: ${item.r2Key} (${sizeMb} MB)...`);
      const ct = getContentType(item.fileName);
      await uploadToR2(item.r2Key, buffer, ct);

      progress.uploaded++;
      console.log(`${prog} ✓ CONCLUÍDO: ${item.r2Key}`);
    } catch (err) {
      console.error(`${prog} ✗ ERRO em ${item.r2Key}:`, err.message);
      progress.errors++;
    } finally {
      if ((index + 1) % 10 === 0 || index + 1 === queue.length) {
        progress.lastIndex = index + 1;
        fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
      }
    }
  }

  // Pool de concorrência
  async function runPool() {
    return new Promise((resolve) => {
      function next() {
        if (currentIndex >= queue.length) {
          if (activeWorkers === 0) resolve();
          return;
        }

        while (activeWorkers < CONCURRENCY && currentIndex < queue.length) {
          const idx = currentIndex++;
          const item = queue[idx];
          activeWorkers++;
          processItem(item, idx).then(() => {
            activeWorkers--;
            next();
          });
        }
      }
      next();
    });
  }

  await runPool();

  console.log('\n=== SINCRONIZAÇÃO COMPLETA FINALIZADA! ===');
  console.log(`Enviados com sucesso: ${progress.uploaded}`);
  console.log(`Já existentes (pulados): ${progress.skipped}`);
  console.log(`Erros: ${progress.errors}`);
  console.log(`Total: ${queue.length}`);
}

main().catch(console.error);
