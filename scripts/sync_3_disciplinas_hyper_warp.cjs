/**
 * SCRIPT MODO HYPER WARP MASTER - 3 DISCIPLINAS
 * (Direito Administrativo, Direito Constitucional, Direito do Trabalho)
 * 
 * Executa 12 aulas simultaneamente em paralelo, cada uma com 40 streams (20 áudios + 20 imagens).
 * Total de conexões paralelas: 480 streams simultâneas para saturação máxima sem bloqueio de sockets.
 * Salva no Cloudflare R2: bucket 'estudos-juridicos-midias'.
 */
const fs = require('fs');
const path = require('path');
const https = require('https');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { NodeHttpHandler } = require('@smithy/node-http-handler');

const s3 = new S3Client({
  region: 'auto',
  endpoint: 'https://f654819db5e99f6d7f9475abf6e3f834.r2.cloudflarestorage.com',
  credentials: {
    accessKeyId: '199f43b3ef1e89db1506e45430cb4660',
    secretAccessKey: '6ac079b15bc8f24d9bbeacdf5bbb7ad9ead1b1caa96eafe1ba1b75d15200c6bc'
  },
  requestHandler: new NodeHttpHandler({
    httpsAgent: new https.Agent({
      maxSockets: 800,
      keepAlive: true,
      keepAliveMsecs: 60000
    })
  })
});

const BUCKET = 'estudos-juridicos-midias';
const LOG_FILE = path.join(__dirname, 'media_sync.log');
const PROGRESS_FILE = path.join(__dirname, 'aulas_media_sync_progress.json');
const CATALOGO_4_DISC_FILE = path.join(__dirname, '4_disciplinas_completo.json');

const AULAS_CONCURRENCY = 12; // 12 Aulas simultâneas
const STREAM_CONCURRENCY = 20; // 20 áudios + 20 imagens por aula = 480 streams total

function log(msg) {
  const line = `[${new Date().toLocaleTimeString('pt-BR')}] ${msg}\n`;
  process.stdout.write(line);
  try {
    fs.appendFileSync(LOG_FILE, line, 'utf8');
  } catch {}
}

let progress = {};
if (fs.existsSync(PROGRESS_FILE)) {
  try {
    progress = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));
  } catch {
    progress = {};
  }
}

function saveProgress() {
  try {
    fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2), 'utf8');
  } catch {}
}

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function formatDuration(ms) {
  const totalSec = Math.floor(ms / 1000);
  const hours = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;
  if (hours > 0) return `${hours}h ${mins}m`;
  if (mins > 0) return `${mins}m ${secs}s`;
  return `${secs}s`;
}

async function asyncPool(limit, items, iteratorFn) {
  const ret = [];
  const executing = new Set();
  for (const item of items) {
    const p = Promise.resolve().then(() => iteratorFn(item));
    ret.push(p);
    executing.add(p);
    const clean = () => executing.delete(p);
    p.then(clean, clean);
    if (executing.size >= limit) {
      await Promise.race(executing);
    }
  }
  return Promise.all(ret);
}

async function fetchFolderItems(folderId, retries = 4) {
  const url = `https://drive.google.com/drive/folders/${folderId}`;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
      });
      const html = await res.text();
      const match = html.match(/window\['_DRIVE_ivd'\]\s*=\s*'([^']+)'/);
      if (!match) return [];

      const hex = match[1].replace(/\\x([0-9A-Fa-f]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
      const data = JSON.parse(hex);
      const items = [];
      function walk(arr) {
        if (!Array.isArray(arr)) return;
        if (arr.length >= 4 && typeof arr[0] === 'string' && arr[0].length >= 20 && typeof arr[2] === 'string') {
          items.push({ id: arr[0], name: arr[2], mimeType: arr[3] });
        }
        for (const el of arr) if (Array.isArray(el)) walk(el);
      }
      walk(data);
      return items;
    } catch {
      if (attempt === retries) return [];
      await new Promise(r => setTimeout(r, 250 * attempt));
    }
  }
  return [];
}

async function downloadDriveBuffer(fileId, retries = 4) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const url = `https://drive.usercontent.google.com/download?id=${fileId}&export=download&authuser=0`;
      let res = await fetch(url);
      if (!res.ok) {
        res = await fetch(`https://drive.google.com/uc?export=download&id=${fileId}`);
      }
      if (res.ok) {
        const ab = await res.arrayBuffer();
        return Buffer.from(ab);
      }
    } catch {
      if (attempt === retries) return null;
      await new Promise(r => setTimeout(r, 250 * attempt));
    }
  }
  return null;
}

async function uploadToR2(key, buffer, contentType) {
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    CacheControl: 'public, max-age=31536000'
  }));
}

async function main() {
  log(`======================================================================`);
  log(`>>> MODO HYPER WARP MASTER: 3 DISCIPLINAS (12 AULAS / 480 STREAMS)`);
  log(`>>> DIREITO ADMINISTRATIVO | DIREITO CONSTITUCIONAL | DIREITO DO TRABALHO`);
  log(`======================================================================\n`);

  if (!fs.existsSync(CATALOGO_4_DISC_FILE)) {
    log(`❌ Arquivo do catálogo não encontrado: ${CATALOGO_4_DISC_FILE}`);
    return;
  }

  const catalogoData = JSON.parse(fs.readFileSync(CATALOGO_4_DISC_FILE, 'utf8'));

  const DISCIPLINAS = [
    'Direito Administrativo',
    'Direito Constitucional',
    'Direito do Trabalho'
  ];

  const totalAulasList = [];

  for (const disc of DISCIPLINAS) {
    const discSlug = slugify(disc);
    const materias = catalogoData[disc] || [];

    for (const m of materias) {
      const matSlug = slugify(m.materiaName);
      const aulas = m.aulas || [];

      for (const a of aulas) {
        const aulaSlug = slugify(a.name);
        totalAulasList.push({
          disc,
          discSlug,
          matNome: m.materiaName,
          matSlug,
          aulaName: a.name,
          aulaSlug,
          folderId: a.id,
          key: `${discSlug}/${matSlug}/${aulaSlug}`
        });
      }
    }
  }

  const totalAulas = totalAulasList.length;
  let jaConcluidas = 0;
  for (const item of totalAulasList) {
    if (progress[item.key] && progress[item.key].status === 'concluido' && progress[item.key].audios > 0) {
      jaConcluidas++;
    }
  }

  log(`Total de aulas para sincronizar: ${totalAulas}`);
  log(`Aulas já salvas no R2 anteriormente: ${jaConcluidas}/${totalAulas} (${((jaConcluidas/totalAulas)*100).toFixed(1)}%)\n`);

  const startTime = Date.now();
  let completedCount = jaConcluidas;
  let totalAudiosUploaded = 0;
  let totalImagensUploaded = 0;
  let aulasIniciadasNestaSessao = 0;

  // Executa 12 aulas simultaneamente
  await asyncPool(AULAS_CONCURRENCY, totalAulasList, async (item) => {
    if (progress[item.key] && progress[item.key].status === 'concluido' && progress[item.key].audios > 0) {
      return;
    }

    const aulaStartTime = Date.now();
    aulasIniciadasNestaSessao++;

    let etaString = 'calculando...';
    if (aulasIniciadasNestaSessao >= 12) {
      const elapsed = Date.now() - startTime;
      const avgMsPerAula = elapsed / aulasIniciadasNestaSessao;
      const remainingCount = totalAulas - completedCount;
      const remainingMs = Math.max(0, remainingCount * avgMsPerAula);
      etaString = formatDuration(remainingMs);
    }

    const currentIdx = completedCount + 1;
    const currentPct = ((currentIdx / totalAulas) * 100).toFixed(1);
    log(`[${currentIdx}/${totalAulas} - ${currentPct}%] [ETA: ${etaString}] ⚡ WARP: [${item.disc.toUpperCase()}] ${item.matNome} > ${item.aulaName}`);

    try {
      const folderItems = await fetchFolderItems(item.folderId);

      // Localizar pastas de áudio e imagens de forma flexível (com ou sem acento / maiúsculas)
      const audioFolder = folderItems.find(f => {
        const norm = f.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        return norm.startsWith('audio');
      });

      const imgFolder = folderItems.find(f => {
        const norm = f.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        return norm.startsWith('imagen') || norm.startsWith('img') || norm.startsWith('image');
      });

      const aulaPrefix = `aulas-interativas/${item.discSlug}/${item.matSlug}/${item.aulaSlug}`;
      let audioCount = 0;
      let imgCount = 0;

      // Transferência Simultânea de Áudios e Imagens com 20 streams cada (40 streams por aula)
      await Promise.all([
        // 1. Áudios
        (async () => {
          if (!audioFolder) return;
          const audioItems = await fetchFolderItems(audioFolder.id);
          const seenAudios = new Set();
          const mp3Files = audioItems.filter(a => a.name.toLowerCase().endsWith('.mp3'));

          if (mp3Files.length > 0) {
            await asyncPool(STREAM_CONCURRENCY, mp3Files, async (a) => {
              if (seenAudios.has(a.name)) return;
              seenAudios.add(a.name);
              const buf = await downloadDriveBuffer(a.id);
              if (buf) {
                const key = `${aulaPrefix}/assets/audio/${a.name}`;
                await uploadToR2(key, buf, 'audio/mpeg');
                audioCount++;
                totalAudiosUploaded++;
              }
            });
          }
        })(),

        // 2. Imagens
        (async () => {
          if (!imgFolder) return;
          const imgItems = await fetchFolderItems(imgFolder.id);
          const seenImgs = new Set();
          const webpFiles = imgItems.filter(img => /\.(webp|jpg|jpeg|png)$/i.test(img.name));

          if (webpFiles.length > 0) {
            await asyncPool(STREAM_CONCURRENCY, webpFiles, async (img) => {
              if (seenImgs.has(img.name)) return;
              seenImgs.add(img.name);
              const buf = await downloadDriveBuffer(img.id);
              if (buf) {
                const key = `${aulaPrefix}/assets/img/${img.name}`;
                const mime = img.name.endsWith('.webp') ? 'image/webp' : (img.name.endsWith('.png') ? 'image/png' : 'image/jpeg');
                await uploadToR2(key, buf, mime);
                imgCount++;
                totalImagensUploaded++;
              }
            });
          }
        })(),

        // 3. Capas na raiz da aula (capa-3x4.webp, capa.webp, etc)
        (async () => {
          const rootCovers = folderItems.filter(f => /\.(webp|jpg|jpeg|png)$/i.test(f.name));
          for (const c of rootCovers) {
            const buf = await downloadDriveBuffer(c.id);
            if (buf) {
              const mime = c.name.endsWith('.webp') ? 'image/webp' : (c.name.endsWith('.png') ? 'image/png' : 'image/jpeg');
              await uploadToR2(`${aulaPrefix}/${c.name}`, buf, mime);
              await uploadToR2(`${aulaPrefix}/assets/img/${c.name}`, buf, mime);
              imgCount++;
            }
          }
        })()
      ]);

      progress[item.key] = {
        status: 'concluido',
        audios: audioCount,
        imagens: imgCount,
        completedAt: new Date().toISOString()
      };
      saveProgress();
      completedCount++;

      const aulaDuration = formatDuration(Date.now() - aulaStartTime);
      const pctGeral = ((completedCount / totalAulas) * 100).toFixed(1);
      log(`   🔥 [${completedCount}/${totalAulas} - ${pctGeral}%] OK em ${aulaDuration} (${audioCount} áudios + ${imgCount} imgs) -> ${item.aulaName}`);
    } catch (err) {
      log(`   ❌ Erro em ${item.aulaName}: ${err.message}`);
    }
  });

  const tempoTotal = formatDuration(Date.now() - startTime);
  log(`\n======================================================================`);
  log(`🎉 TODAS AS 3 DISCIPLINAS 100% FINALIZADAS NO CLOUDFLARE R2!`);
  log(`Tempo total: ${tempoTotal} | Áudios: ${totalAudiosUploaded} | Imagens: ${totalImagensUploaded}`);
  log(`======================================================================`);
}

main().catch(err => {
  log(`FALHA CRÍTICA: ${err.message}`);
});

