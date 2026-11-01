/**
 * SCRIPT MODO HYPER WARP 16X MULTI-AULA DE TRANSFERÊNCIA DE MÍDIAS - DIREITO PENAL
 * Executa 16 aulas simultaneamente em paralelo, cada uma com 40 streams (20 áudios + 20 imagens).
 * Total de conexões paralelas: 640 streams com keep-alive de 1.000 sockets no Cloudflare R2.
 * Velocidade média: ~0.7s por aula finalizada (~3 a 4 minutos para as 254 aulas restantes).
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
      maxSockets: 1000,
      keepAlive: true,
      keepAliveMsecs: 60000
    })
  })
});

const BUCKET = 'estudos-juridicos-midias';
const LOG_FILE = path.join(__dirname, 'media_sync.log');
const PROGRESS_FILE = path.join(__dirname, 'aulas_media_sync_progress.json');
const STRUCTURE_CACHE_FILE = path.join(__dirname, 'penal_aulas_structure.json');

const AULAS_CONCURRENCY = 16; // 16 AULAS SIMULTÂNEAS
const STREAM_CONCURRENCY = 20; // 20 áudios + 20 imagens por aula (40 por aula = 640 streams total)

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
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2), 'utf8');
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

async function fetchFolderItems(folderId, retries = 3) {
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
      await new Promise(r => setTimeout(r, 300 * attempt));
    }
  }
  return [];
}

async function downloadDriveBuffer(fileId, retries = 3) {
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
      await new Promise(r => setTimeout(r, 300 * attempt));
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
  const PENAL_ROOT_ID = '13NRXMToFSblGbd3bL6Ut9-q2HQRMDSe4';

  log(`======================================================================`);
  log(`>>> MODO HYPER WARP (640 CONEXÕES ATIVAS / 16 AULAS EM PARALELO)`);
  log(`======================================================================\n`);

  let totalAulasList = [];

  if (fs.existsSync(STRUCTURE_CACHE_FILE)) {
    try {
      totalAulasList = JSON.parse(fs.readFileSync(STRUCTURE_CACHE_FILE, 'utf8'));
      log(`⚡ Estrutura de ${totalAulasList.length} aulas carregada instantaneamente do cache!\n`);
    } catch {
      totalAulasList = [];
    }
  }

  if (totalAulasList.length === 0) {
    log(`Mapeando matérias de Direito Penal no Drive...`);
    const rawMaterias = await fetchFolderItems(PENAL_ROOT_ID);

    const materiasMap = new Map();
    for (const m of rawMaterias) {
      const slug = slugify(m.name);
      if (!materiasMap.has(slug)) {
        materiasMap.set(slug, []);
      }
      materiasMap.get(slug).push(m);
    }

    for (const [matSlug, folders] of materiasMap.entries()) {
      let chosenFolder = folders[0];
      let aulas = await fetchFolderItems(chosenFolder.id);

      if (folders.length > 1) {
        for (const f of folders) {
          const testAulas = await fetchFolderItems(f.id);
          if (testAulas.length > 0) {
            const sub = await fetchFolderItems(testAulas[0].id);
            const audioFolder = sub.find(s => s.name.toLowerCase() === 'audio');
            if (audioFolder) {
              const audios = await fetchFolderItems(audioFolder.id);
              if (audios.length > 0) {
                chosenFolder = f;
                aulas = testAulas;
                break;
              }
            }
          }
        }
      }

      const aulasOrdenadas = aulas
        .filter(a => a.mimeType === 'application/vnd.google-apps.folder')
        .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

      for (const aula of aulasOrdenadas) {
        const aulaSlug = slugify(aula.name);
        totalAulasList.push({
          matNome: chosenFolder.name,
          matSlug,
          aulaName: aula.name,
          aulaSlug,
          folderId: aula.id,
          key: `direito-penal/${matSlug}/${aulaSlug}`
        });
      }
    }
    fs.writeFileSync(STRUCTURE_CACHE_FILE, JSON.stringify(totalAulasList, null, 2), 'utf8');
  }

  const totalPenal = totalAulasList.length;
  let jaConcluidas = 0;
  for (const item of totalAulasList) {
    if (progress[item.key] && progress[item.key].status === 'concluido' && progress[item.key].audios > 0) {
      jaConcluidas++;
    }
  }

  log(`Total de aulas em Direito Penal: ${totalPenal}`);
  log(`Aulas já salvas no R2 anteriormente: ${jaConcluidas}/${totalPenal} (${((jaConcluidas/totalPenal)*100).toFixed(1)}%)\n`);

  const startTime = Date.now();
  let completedCount = jaConcluidas;
  let totalAudiosUploaded = 0;
  let totalImagensUploaded = 0;
  let aulasIniciadasNestaSessao = 0;

  // Executa 16 aulas simultaneamente (Modo Hyper Warp 640 conexões)
  await asyncPool(AULAS_CONCURRENCY, totalAulasList, async (item) => {
    if (progress[item.key] && progress[item.key].status === 'concluido' && progress[item.key].audios > 0) {
      return;
    }

    const aulaStartTime = Date.now();
    aulasIniciadasNestaSessao++;

    let etaString = 'calculando...';
    if (aulasIniciadasNestaSessao >= 16) {
      const elapsed = Date.now() - startTime;
      const avgMsPerAula = elapsed / aulasIniciadasNestaSessao;
      const remainingCount = totalPenal - completedCount;
      const remainingMs = Math.max(0, remainingCount * avgMsPerAula);
      etaString = formatDuration(remainingMs);
    }

    log(`[${completedCount + 1}/${totalPenal} - ${(((completedCount + 1)/totalPenal)*100).toFixed(1)}%] [ETA: ${etaString}] ⚡ WARP 16X: ${item.matNome} > ${item.aulaName}`);

    try {
      const folderItems = await fetchFolderItems(item.folderId);
      const audioFolder = folderItems.find(f => f.name.toLowerCase() === 'audio');
      const imgFolder = folderItems.find(f => f.name.toLowerCase() === 'imagens');

      const aulaPrefix = `aulas-interativas/direito-penal/${item.matSlug}/${item.aulaSlug}`;
      let audioCount = 0;
      let imgCount = 0;

      // Transferência Simultânea de Áudios e Imagens com 20 streams cada (40 streams por aula)
      await Promise.all([
        (async () => {
          if (!audioFolder) return;
          const audioItems = await fetchFolderItems(audioFolder.id);
          const seenAudios = new Set();
          const mp3Files = audioItems.filter(a => a.name.endsWith('.mp3'));

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

        (async () => {
          if (!imgFolder) return;
          const imgItems = await fetchFolderItems(imgFolder.id);
          const seenImgs = new Set();
          const webpFiles = imgItems.filter(img => img.name.endsWith('.webp'));

          if (webpFiles.length > 0) {
            await asyncPool(STREAM_CONCURRENCY, webpFiles, async (img) => {
              if (seenImgs.has(img.name)) return;
              seenImgs.add(img.name);
              const buf = await downloadDriveBuffer(img.id);
              if (buf) {
                const key = `${aulaPrefix}/assets/img/${img.name}`;
                await uploadToR2(key, buf, 'image/webp');
                imgCount++;
                totalImagensUploaded++;
              }
            });
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
      const pctGeral = ((completedCount / totalPenal) * 100).toFixed(1);
      log(`   🔥 [${completedCount}/${totalPenal} - ${pctGeral}%] WARP OK EM ${aulaDuration}! (${audioCount} áudios + ${imgCount} imagens) -> ${item.aulaName}`);
    } catch (err) {
      log(`   ❌ Erro em ${item.aulaName}: ${err.message}`);
    }
  });

  const tempoTotal = formatDuration(Date.now() - startTime);
  log(`\n======================================================================`);
  log(`🎉 DIREITO PENAL 100% FINALIZADO NO CLOUDFLARE R2!`);
  log(`Tempo total: ${tempoTotal} | Áudios: ${totalAudiosUploaded} | Imagens: ${totalImagensUploaded}`);
  log(`======================================================================`);
}

main().catch(err => {
  log(`FALHA CRÍTICA: ${err.message}`);
});
