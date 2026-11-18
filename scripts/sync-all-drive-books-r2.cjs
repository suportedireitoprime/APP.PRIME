const fs = require('fs');
const path = require('path');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const s3 = new S3Client({
  region: 'auto',
  endpoint: 'https://f654819db5e99f6d7f9475abf6e3f834.r2.cloudflarestorage.com',
  credentials: {
    accessKeyId: '199f43b3ef1e89db1506e45430cb4660',
    secretAccessKey: '6ac079b15bc8f24d9bbeacdf5bbb7ad9ead1b1caa96eafe1ba1b75d15200c6bc'
  }
});

const BUCKET = 'livros-pdf';
const R2_DOMAIN = 'https://pub-9cd49875afe549788617b01e97309a55.r2.dev';
const PROGRESS_FILE = path.join(__dirname, '..', 'upload_progress.json');

let progress = {};
if (fs.existsSync(PROGRESS_FILE)) {
  try {
    progress = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));
  } catch (e) {
    progress = {};
  }
}

function saveProgress() {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2), 'utf8');
}

async function downloadDriveFile(fileId, retries = 3) {
  let url = `https://drive.google.com/uc?export=download&id=${fileId}`;
  let cookies = '';

  for (let tentativa = 1; tentativa <= retries; tentativa++) {
    try {
      let res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          ...(cookies ? { 'Cookie': cookies } : {})
        }
      });

      const setCookie = res.headers.get('set-cookie');
      if (setCookie) cookies = setCookie;

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const ct = res.headers.get('content-type') || '';
      if (ct.includes('text/html')) {
        const text = await res.text();
        
        // 1. Extração do formulário moderno de download grande do Google Drive
        const formMatch = text.match(/<form id="download-form" action="([^"]+)"/);
        if (formMatch) {
          const action = formMatch[1];
          const inputs = [...text.matchAll(/<input type="hidden" name="([^"]+)" value="([^"]*)"/g)];
          const params = new URLSearchParams();
          for (const [, name, val] of inputs) {
            params.set(name, val);
          }
          url = action + '?' + params.toString();
        } else {
          // 2. Fallbacks tradicionais
          const linkMatch = text.match(/href="(\/uc\?export=download[^"]+)"/i) || text.match(/action="(\/uc\?export=download[^"]+)"/i);
          if (linkMatch) {
            const rawLink = linkMatch[1].replace(/&amp;/g, '&');
            url = `https://drive.google.com${rawLink}`;
          } else {
            const tokenMatch = text.match(/confirm=([^&"'\s]+)/i);
            const confirmToken = tokenMatch ? tokenMatch[1] : 't';
            url = `https://drive.google.com/uc?export=download&confirm=${confirmToken}&id=${fileId}`;
          }
        }

        res = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            ...(cookies ? { 'Cookie': cookies } : {})
          }
        });
      }

      const ab = await res.arrayBuffer();
      const buf = Buffer.from(ab);

      if (buf.slice(0, 4).toString('ascii') !== '%PDF') {
        const preview = buf.slice(0, 200).toString('utf8');
        throw new Error(`Arquivo retornado não é PDF! Início: ${preview}`);
      }

      return buf;
    } catch (err) {
      if (tentativa === retries) throw err;
      console.warn(`[Tentativa ${tentativa}/${retries} falhou para ${fileId}]: ${err.message}. Aguardando 3s...`);
      await new Promise(r => setTimeout(r, 3000));
    }
  }
}

async function uploadToR2(key, buffer) {
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: 'application/pdf',
    CacheControl: 'public, max-age=31536000, immutable'
  }));
}

async function processFile(fileInfo, key) {
  if (progress[key] && progress[key].status === 'done') {
    return { key, status: 'already_done', size: progress[key].size };
  }

  const startTime = Date.now();
  console.log(`[START] Baixando: ${fileInfo.name} (${fileInfo.id})...`);
  const buf = await downloadDriveFile(fileInfo.id);
  const downloadElapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  const sizeMB = (buf.length / 1024 / 1024).toFixed(2);
  console.log(`[DOWNLOAD OK] ${fileInfo.name} (${sizeMB} MB em ${downloadElapsed}s). Subindo para R2: ${key}...`);

  const uploadStart = Date.now();
  await uploadToR2(key, buf);
  const uploadElapsed = ((Date.now() - uploadStart) / 1000).toFixed(1);
  console.log(`[R2 OK] ${key} (${sizeMB} MB em ${uploadElapsed}s) -> ${R2_DOMAIN}/${key}`);

  progress[key] = {
    status: 'done',
    fileId: fileInfo.id,
    fileName: fileInfo.name,
    size: buf.length,
    sizeMB: parseFloat(sizeMB),
    uploadedAt: new Date().toISOString(),
    url: `${R2_DOMAIN}/${key}`
  };
  saveProgress();

  return { key, status: 'uploaded', sizeMB };
}

async function main() {
  const books = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'books_drive_map.json'), 'utf8'))
    .filter(b => b.folderName !== 'Clássicos possíveis para editar' && b.clara && b.escura);

  console.log(`Iniciando sincronização de ${books.length} livros (${books.length * 2} PDFs) para Cloudflare R2...`);

  const queue = [];
  for (const book of books) {
    const claraKey = `classicos/${book.slug}/${book.slug}-versao-clara.pdf`;
    const escuraKey = `classicos/${book.slug}/${book.slug}-versao-escura.pdf`;
    queue.push({ book, file: book.clara, key: claraKey, versao: 'clara' });
    queue.push({ book, file: book.escura, key: escuraKey, versao: 'escura' });
  }

  console.log(`Total de tarefas na fila: ${queue.length}`);
  const pending = queue.filter(q => !progress[q.key] || progress[q.key].status !== 'done');
  console.log(`Tarefas pendentes: ${pending.length} (Já concluídas anteriormente: ${queue.length - pending.length})`);

  // Concorrência de 3 downloads/uploads paralelos
  const CONCURRENCY = 3;
  let running = 0;
  let completed = queue.length - pending.length;
  const errors = [];

  async function next() {
    if (pending.length === 0) return;
    const item = pending.shift();
    running++;
    try {
      await processFile(item.file, item.key);
      completed++;
      console.log(`>>> Progresso: ${completed}/${queue.length} (${((completed / queue.length) * 100).toFixed(1)}%)`);
    } catch (err) {
      console.error(`[ERRO FALHA] ${item.key}:`, err.message);
      errors.push({ key: item.key, error: err.message, file: item.file });
    } finally {
      running--;
      await next();
    }
  }

  const workers = [];
  for (let i = 0; i < CONCURRENCY; i++) {
    workers.push(next());
  }
  await Promise.all(workers);

  console.log('\n========================================');
  console.log(`SINCRONIZAÇÃO FINALIZADA!`);
  console.log(`Concluídos com sucesso: ${completed}/${queue.length}`);
  if (errors.length > 0) {
    console.error(`Erros (${errors.length}):`, JSON.stringify(errors, null, 2));
  } else {
    console.log('Todos os 100 arquivos foram baixados do Drive e subidos para o Cloudflare R2 com sucesso!');
  }
  console.log('========================================\n');
}

main().catch(err => {
  console.error('Erro fatal no script principal:', err);
  process.exit(1);
});
