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

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function downloadDriveFile(fileId) {
  let url = `https://drive.google.com/uc?export=download&id=${fileId}`;
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      let res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
      });
      
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('text/html')) {
        const text = await res.text();
        const cookies = res.headers.get('set-cookie') || '';
        const formMatch = text.match(/<form[^>]*action="([^"]*)"[^>]*>([\s\S]*?)<\/form>/i);
        if (formMatch) {
          const actionUrl = formMatch[1];
          const inputs = [...formMatch[2].matchAll(/<input[^>]*name="([^"]*)"[^>]*value="([^"]*)"/gi)];
          const params = new URLSearchParams();
          for (const inp of inputs) {
            params.set(inp[1], inp[2]);
          }
          const downloadUrl = `${actionUrl}?${params.toString()}`;
          const res2 = await fetch(downloadUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
              'Cookie': cookies
            }
          });
          const ab = await res2.arrayBuffer();
          return Buffer.from(ab);
        }
      }
      
      const ab = await res.arrayBuffer();
      return Buffer.from(ab);
    } catch (e) {
      if (attempt === 4) throw e;
      await sleep(1000 * attempt);
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

async function processTask(task) {
  const { r2Key, driveId, contentType, label } = task;
  const exists = await existsInR2(r2Key);
  if (exists) {
    return { status: 'skipped', r2Key };
  }
  try {
    const buf = await downloadDriveFile(driveId);
    if (!buf || buf.length === 0) throw new Error('Arquivo vazio recebido');
    await uploadToR2(r2Key, buf, contentType);
    return { status: 'uploaded', r2Key, size: buf.length };
  } catch (err) {
    return { status: 'error', r2Key, error: err.message };
  }
}

async function runQueue(tasks, concurrency = 4, onProgress) {
  let index = 0;
  let active = 0;
  let done = 0;

  return new Promise((resolve) => {
    function next() {
      if (index >= tasks.length && active === 0) {
        return resolve();
      }

      while (active < concurrency && index < tasks.length) {
        const curTask = tasks[index++];
        active++;
        processTask(curTask).then((res) => {
          active--;
          done++;
          onProgress(done, tasks.length, curTask, res);
          next();
        });
      }
    }
    next();
  });
}

async function main() {
  const inventoryFile = path.join(__dirname, 'pilulas_inventory.json');
  if (!fs.existsSync(inventoryFile)) {
    console.error('Arquivo pilulas_inventory.json não encontrado!');
    return;
  }

  const catalog = JSON.parse(fs.readFileSync(inventoryFile, 'utf8'));
  console.log(`=== PREPARANDO SINCRONIZAÇÃO EM MASSA: 26 MATÉRIAS ===`);

  // Build task list
  const tasks = [];
  for (const mat of catalog) {
    for (const mod of (mat.modulos || [])) {
      for (const top of (mod.topicos || [])) {
        if (top.mp3 && top.mp3.id) {
          tasks.push({
            r2Key: top.mp3.r2Key,
            driveId: top.mp3.id,
            contentType: 'audio/mpeg',
            label: `[MP3] ${mat.slug} > ${top.baseName}`
          });
        }
        if (top.srt && top.srt.id) {
          tasks.push({
            r2Key: top.srt.r2Key,
            driveId: top.srt.id,
            contentType: 'text/plain; charset=utf-8',
            label: `[SRT] ${mat.slug} > ${top.baseName}`
          });
        }
        if (top.pdf && top.pdf.id) {
          tasks.push({
            r2Key: top.pdf.r2Key,
            driveId: top.pdf.id,
            contentType: 'application/pdf',
            label: `[PDF] ${mat.slug} > ${top.baseName}`
          });
        }
        if (top.txt && top.txt.id) {
          tasks.push({
            r2Key: top.txt.r2Key,
            driveId: top.txt.id,
            contentType: 'text/plain; charset=utf-8',
            label: `[TXT] ${mat.slug} > ${top.baseName}`
          });
        }
      }
    }
  }

  console.log(`Total de tarefas para checar/enviar: ${tasks.length}`);

  let uploadedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;
  const startTime = Date.now();

  await runQueue(tasks, 5, (done, total, task, res) => {
    if (res.status === 'uploaded') {
      uploadedCount++;
      const mb = (res.size / (1024 * 1024)).toFixed(1);
      console.log(`[${done}/${total}] ✓ Enviado: ${task.r2Key} (${mb} MB)`);
    } else if (res.status === 'skipped') {
      skippedCount++;
      if (skippedCount % 50 === 0 || done === total) {
        process.stdout.write(`[${done}/${total}] ... (${skippedCount} existentes ignorados)\r`);
      }
    } else if (res.status === 'error') {
      errorCount++;
      console.error(`[${done}/${total}] ✗ ERRO: ${task.r2Key} -> ${res.error}`);
    }
  });

  const durationMin = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
  console.log(`\n\n=== SINCRONIZAÇÃO COMPLETA FINALIZADA EM ${durationMin} MINUTOS ===`);
  console.log(`Total analisados: ${tasks.length}`);
  console.log(`Enviados com sucesso: ${uploadedCount}`);
  console.log(`Já existentes no R2: ${skippedCount}`);
  console.log(`Erros: ${errorCount}`);
}

main().catch(console.error);
