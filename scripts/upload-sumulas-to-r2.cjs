const fs = require('fs');
const path = require('path');
const https = require('https');
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

function downloadBuffer(url, maxRedirects = 5) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        if (maxRedirects <= 0) return reject(new Error('Too many redirects'));
        return resolve(downloadBuffer(res.headers.location, maxRedirects - 1));
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP status ${res.statusCode}`));
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', reject);
  });
}

async function downloadDriveFile(fileId) {
  const url1 = `https://drive.usercontent.google.com/download?id=${fileId}&export=download&authuser=0&confirm=t`;
  const url2 = `https://drive.google.com/uc?export=download&id=${fileId}&confirm=t`;

  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const buf = await downloadBuffer(url1);
      if (buf && buf.length > 0) return buf;
    } catch (e1) {
      try {
        const buf2 = await downloadBuffer(url2);
        if (buf2 && buf2.length > 0) return buf2;
      } catch (e2) {
        if (attempt === 4) throw new Error(`Falha ao baixar ${fileId}: ${e1.message} / ${e2.message}`);
        await sleep(1000 * attempt);
      }
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

const CONTENT_TYPES = {
  mp3: 'audio/mpeg',
  pdf: 'application/pdf',
  srt: 'text/plain; charset=utf-8',
  txt: 'text/plain; charset=utf-8'
};

async function processTask(task) {
  const { r2Key, driveId, extension, name } = task;
  const contentType = CONTENT_TYPES[extension] || 'application/octet-stream';

  const already = await existsInR2(r2Key);
  if (already) {
    return { status: 'skipped', r2Key, url: `${R2_DOMAIN}/${r2Key}` };
  }

  try {
    const buf = await downloadDriveFile(driveId);
    if (!buf || buf.length === 0) throw new Error('Arquivo vazio');
    const url = await uploadToR2(r2Key, buf, contentType);
    return { status: 'uploaded', r2Key, size: buf.length, url };
  } catch (err) {
    return { status: 'error', r2Key, error: err.message };
  }
}

async function runQueue(tasks, concurrency = 5, onProgress) {
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
          if (onProgress) onProgress(done, tasks.length, curTask, res);
          next();
        }).catch((err) => {
          active--;
          done++;
          if (onProgress) onProgress(done, tasks.length, curTask, { status: 'error', error: err.message });
          next();
        });
      }
    }
    next();
  });
}

async function main() {
  const parsedData = JSON.parse(fs.readFileSync('scripts/parsed_sumulas_files.json', 'utf8'));
  const tasks = [];

  for (const f of parsedData.files) {
    const r2Key = `pilulas/sumulas/sumulas-vinculantes/${f.name}`;
    tasks.push({
      driveId: f.id,
      name: f.name,
      extension: f.extension,
      r2Key
    });
  }

  console.log(`Iniciando sincronização de ${tasks.length} arquivos para Cloudflare R2...`);
  let uploadedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  await runQueue(tasks, 5, (done, total, task, res) => {
    if (res.status === 'uploaded') {
      uploadedCount++;
      console.log(`[${done}/${total}] UPLOAD: ${task.name} (${(res.size / 1024).toFixed(1)} KB)`);
    } else if (res.status === 'skipped') {
      skippedCount++;
      if (skippedCount % 10 === 0 || skippedCount === 1) {
        console.log(`[${done}/${total}] JÁ EXISTE NO R2: ${task.name}`);
      }
    } else {
      errorCount++;
      console.error(`[${done}/${total}] ERRO: ${task.name} -> ${res.error}`);
    }
  });

  console.log('\n--- RESULTADO FINAL DO UPLOAD ---');
  console.log(`Total: ${tasks.length}`);
  console.log(`Uploads novos: ${uploadedCount}`);
  console.log(`Pulados (já existiam): ${skippedCount}`);
  console.log(`Erros: ${errorCount}`);
}

main().catch(console.error);
