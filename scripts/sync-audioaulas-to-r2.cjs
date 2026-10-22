const { S3Client, PutObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');

const s3 = new S3Client({
  region: 'auto',
  endpoint: 'https://f654819db5e99f6d7f9475abf6e3f834.r2.cloudflarestorage.com',
  credentials: {
    accessKeyId: '199f43b3ef1e89db1506e45430cb4660',
    secretAccessKey: '6ac079b15bc8f24d9bbeacdf5bbb7ad9ead1b1caa96eafe1ba1b75d15200c6bc'
  }
});
const BUCKET = 'vacatio-midias';
const PROGRESS_FILE = 'scripts/sync_audioaulas_progress.json';

const manifest = JSON.parse(fs.readFileSync('scripts/pending_audioaulas_manifest.json', 'utf8'));
const allAudios = [...manifest.civil, ...manifest.procCivil, ...manifest.tributario];

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

async function downloadDriveFile(driveId, retries = 3) {
  const url = `https://drive.usercontent.google.com/download?id=${driveId}&export=download&authuser=0`;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const arrayBuffer = await res.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (err) {
      if (attempt === retries) throw err;
      await new Promise(r => setTimeout(r, 1000 * attempt));
    }
  }
}

async function uploadToR2(key, buffer) {
  const cmd = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: 'audio/mpeg'
  });
  return await s3.send(cmd);
}

async function run() {
  console.log(`=== INICIANDO SINCRONIZAÇÃO DAS ÁUDIOAULAS FALTANTES: DRIVE -> R2 (vacatio-midias) ===`);
  console.log(`Total de áudioaulas a processar: ${allAudios.length}`);

  const alreadyDone = Object.keys(progress).length;
  console.log(`Já gravadas no progresso: ${alreadyDone}`);

  const pending = allAudios.filter(a => !progress[a.r2Key]);
  console.log(`Restantes a baixar e enviar: ${pending.length}`);

  const CONCURRENCY = 10;
  let currentIndex = 0;
  let completed = alreadyDone;
  const startTime = Date.now();

  async function worker(workerId) {
    while (currentIndex < pending.length) {
      const idx = currentIndex++;
      const item = pending[idx];

      try {
        const buf = await downloadDriveFile(item.driveId);
        await uploadToR2(item.r2Key, buf);

        progress[item.r2Key] = {
          size: buf.length,
          uploadedAt: new Date().toISOString()
        };

        completed++;

        if (completed % 10 === 0 || completed === allAudios.length) {
          const elapsed = (Date.now() - startTime) / 1000;
          const rate = (completed - alreadyDone) / Math.max(elapsed, 1);
          const etaSecs = rate > 0 ? (allAudios.length - completed) / rate : 0;
          const pct = ((completed / allAudios.length) * 100).toFixed(1);
          console.log(`[${pct}%] Concluídos: ${completed}/${allAudios.length} | Velocidade: ${rate.toFixed(1)} audios/s | ETA: ${Math.round(etaSecs / 60)} min | Último: ${item.titulo}`);
          saveProgress();
        }
      } catch (err) {
        console.error(`[Worker ${workerId}] Erro ao sincronizar ${item.r2Key} (${item.driveId}):`, err.message);
      }
    }
  }

  const workers = Array.from({ length: CONCURRENCY }, (_, i) => worker(i + 1));
  await Promise.all(workers);
  saveProgress();

  console.log(`\n🎉 TODAS AS 1000 ÁUDIOAULAS FORAM ENVIADAS COM SUCESSO AO CLOUDFLARE R2!`);
}

run().catch(console.error);
