const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// R2 Client
const s3 = new S3Client({
  region: 'auto',
  endpoint: 'https://f654819db5e99f6d7f9475abf6e3f834.r2.cloudflarestorage.com',
  credentials: {
    accessKeyId: '199f43b3ef1e89db1506e45430cb4660',
    secretAccessKey: '6ac079b15bc8f24d9bbeacdf5bbb7ad9ead1b1caa96eafe1ba1b75d15200c6bc'
  }
});
const R2_BUCKET = 'narracoes-leis';
const R2_PUBLIC_BASE = 'https://pub-3e6045d435904ae1916a15ad03bd222b.r2.dev';

// Supabase Client
const envContent = fs.readFileSync('.env', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
  }
});
const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY);

const audios = JSON.parse(fs.readFileSync('scripts/all_drive_audios.json', 'utf8'));
const PROGRESS_FILE = 'scripts/sync_r2_progress.json';

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
    Bucket: R2_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: 'audio/mpeg'
  });
  return await s3.send(cmd);
}

async function upsertDbBatch(rows) {
  if (rows.length === 0) return;
  // Supabase upsert on (tabela_nome, artigo_numero)
  // Let's first check if there is an existing record with matching (tabela_nome, artigo_numero)
  const { error } = await supabase.from('narracoes_artigos').upsert(rows, {
    onConflict: 'tabela_nome,artigo_numero'
  });
  if (error) {
    console.warn('DB Upsert notice:', error.message);
  }
}

async function run() {
  console.log(`=== INICIANDO SINCRONIZAÇÃO COMPLETA: GOOGLE DRIVE -> CLOUDFLARE R2 -> SUPABASE ===`);
  console.log(`Total de arquivos mapeados: ${audios.length}`);
  const alreadyDone = Object.keys(progress).length;
  console.log(`Já concluídos anteriormente: ${alreadyDone}`);

  const pending = audios.filter(a => {
    const key = `${a.tabelaNome}/${a.fileName}`;
    return !progress[key];
  });
  console.log(`Restantes a sincronizar: ${pending.length}`);

  const CONCURRENCY = 12;
  let currentIndex = 0;
  let completed = alreadyDone;
  let dbBuffer = [];
  const startTime = Date.now();

  async function worker(workerId) {
    while (currentIndex < pending.length) {
      const idx = currentIndex++;
      const item = pending[idx];
      const key = `${item.tabelaNome}/${item.fileName}`;
      const audioUrl = `${R2_PUBLIC_BASE}/${encodeURIComponent(item.tabelaNome)}/${encodeURIComponent(item.fileName)}`;

      try {
        const buf = await downloadDriveFile(item.driveId);
        await uploadToR2(key, buf);

        progress[key] = {
          size: buf.length,
          uploadedAt: new Date().toISOString()
        };

        dbBuffer.push({
          tabela_nome: item.tabelaNome,
          artigo_numero: item.artigoNumero,
          lei_nome: item.lawName,
          audio_url: audioUrl,
          r2_key: key,
          titulo_artigo: `Art. ${item.artigoNumero}`
        });

        completed++;

        if (completed % 25 === 0 || completed === audios.length) {
          const elapsed = (Date.now() - startTime) / 1000;
          const rate = (completed - alreadyDone) / Math.max(elapsed, 1);
          const etaSecs = rate > 0 ? (audios.length - completed) / rate : 0;
          const pct = ((completed / audios.length) * 100).toFixed(1);
          console.log(`[${pct}%] Concluídos: ${completed}/${audios.length} | Velocidade: ${rate.toFixed(1)} audios/s | ETA: Math.round(${etaSecs / 60}) min | Último: ${key}`);
          saveProgress();

          if (dbBuffer.length >= 100) {
            const toSend = [...dbBuffer];
            dbBuffer = [];
            await upsertDbBatch(toSend);
          }
        }
      } catch (err) {
        console.error(`Erro ao sincronizar ${key} (${item.driveId}):`, err.message);
      }
    }
  }

  const workers = Array.from({ length: CONCURRENCY }, (_, i) => worker(i + 1));
  await Promise.all(workers);

  if (dbBuffer.length > 0) {
    await upsertDbBatch(dbBuffer);
  }
  saveProgress();

  console.log(`\n🎉 SINCRONIZAÇÃO COMPLETA FINALIZADA COM SUCESSO!`);
  console.log(`Total sincronizado no Cloudflare R2 e no Supabase: ${completed}/${audios.length}`);
}

run().catch(console.error);
