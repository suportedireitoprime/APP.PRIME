/**
 * SCRIPT MESTRE DE TRANSFERÊNCIA DE MÍDIAS - EXCLUSIVO PARA DIREITO PENAL
 * Sincroniza todos os áudios MP3 e ilustrações WEBP de todas as 46 matérias de Direito Penal.
 * Resolve duplicatas no Drive escolhendo automaticamente as pastas completas.
 */
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
const BUCKET = 'estudos-juridicos-midias';
const LOG_FILE = path.join(__dirname, 'media_sync.log');
const PROGRESS_FILE = path.join(__dirname, 'aulas_media_sync_progress.json');

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
      await new Promise(r => setTimeout(r, 1000 * attempt));
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
      await new Promise(r => setTimeout(r, 1000 * attempt));
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

  fs.writeFileSync(LOG_FILE, `=== SINCRONIZADOR DE MÍDIAS - DIREITO PENAL ===\n`, 'utf8');
  log(`======================================================================`);
  log(`>>> INICIANDO PROCESSAMENTO EXCLUSIVO: DIREITO PENAL`);
  log(`======================================================================\n`);

  log(`Buscando matérias de Direito Penal no Drive...`);
  const rawMaterias = await fetchFolderItems(PENAL_ROOT_ID);
  log(`Total de pastas encontradas na raiz de Direito Penal: ${rawMaterias.length}`);

  // Agrupar por nome normalizado para desduplicação inteligente
  const materiasMap = new Map();
  for (const m of rawMaterias) {
    const slug = slugify(m.name);
    if (!materiasMap.has(slug)) {
      materiasMap.set(slug, []);
    }
    materiasMap.get(slug).push(m);
  }

  log(`Matérias únicas em Direito Penal: ${materiasMap.size}`);

  // Obter catálogo de aulas de cada matéria
  const totalAulasList = [];

  for (const [matSlug, folders] of materiasMap.entries()) {
    let chosenFolder = folders[0];
    let aulas = await fetchFolderItems(chosenFolder.id);

    // Se houver pastas duplicadas, escolher a que tem aulas com arquivos
    if (folders.length > 1) {
      for (const f of folders) {
        const testAulas = await fetchFolderItems(f.id);
        if (testAulas.length > 0) {
          // Checar se a primeira aula tem subpastas com arquivos
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

  const totalPenal = totalAulasList.length;
  log(`Total de aulas mapeadas em Direito Penal: ${totalPenal}\n`);

  const startTime = Date.now();
  let completedThisRun = 0;
  let totalAudiosUploaded = 0;
  let totalImagensUploaded = 0;

  for (let i = 0; i < totalAulasList.length; i++) {
    const item = totalAulasList[i];
    const currentIndex = i + 1;
    const pctGeral = ((currentIndex / totalPenal) * 100).toFixed(1);

    let etaString = 'calculando...';
    if (completedThisRun >= 2) {
      const elapsed = Date.now() - startTime;
      const avgMsPerAula = elapsed / completedThisRun;
      const remainingCount = totalPenal - currentIndex;
      const remainingMs = remainingCount * avgMsPerAula;
      etaString = formatDuration(remainingMs);
    }

    if (progress[item.key] && progress[item.key].status === 'concluido' && progress[item.key].audios > 0) {
      log(`[${currentIndex}/${totalPenal} - ${pctGeral}%] [OK - Já no R2] ${item.matNome} > ${item.aulaName}`);
      continue;
    }

    log(`\n----------------------------------------------------------------------`);
    log(`[${currentIndex}/${totalPenal} - ${pctGeral}%] [TEMPO RESTANTE ESTIMADO: ${etaString}]`);
    log(`-> DIREITO PENAL > ${item.matNome} > ${item.aulaName}`);
    log(`----------------------------------------------------------------------`);

    try {
      const folderItems = await fetchFolderItems(item.folderId);
      const audioFolder = folderItems.find(f => f.name.toLowerCase() === 'audio');
      const imgFolder = folderItems.find(f => f.name.toLowerCase() === 'imagens');

      const aulaPrefix = `aulas-interativas/direito-penal/${item.matSlug}/${item.aulaSlug}`;
      let audioCount = 0;
      let imgCount = 0;

      // Transferir Áudios
      if (audioFolder) {
        const audioItems = await fetchFolderItems(audioFolder.id);
        const seenAudios = new Set();
        const mp3Files = audioItems.filter(a => a.name.endsWith('.mp3'));
        if (mp3Files.length > 0) {
          log(`   🎵 Enviando ${mp3Files.length} áudios MP3 para o R2...`);
          for (let ai = 0; ai < mp3Files.length; ai++) {
            const a = mp3Files[ai];
            if (seenAudios.has(a.name)) continue;
            seenAudios.add(a.name);
            const buf = await downloadDriveBuffer(a.id);
            if (buf) {
              const key = `${aulaPrefix}/assets/audio/${a.name}`;
              await uploadToR2(key, buf, 'audio/mpeg');
              audioCount++;
              totalAudiosUploaded++;
              if ((ai + 1) % 5 === 0 || ai === mp3Files.length - 1) {
                log(`      [Áudio ${ai + 1}/${mp3Files.length}] ${a.name} OK`);
              }
            }
          }
        }
      }

      // Transferir Imagens
      if (imgFolder) {
        const imgItems = await fetchFolderItems(imgFolder.id);
        const seenImgs = new Set();
        const webpFiles = imgItems.filter(img => img.name.endsWith('.webp'));
        if (webpFiles.length > 0) {
          log(`   🖼️  Enviando ${webpFiles.length} imagens WEBP para o R2...`);
          for (let ii = 0; ii < webpFiles.length; ii++) {
            const img = webpFiles[ii];
            if (seenImgs.has(img.name)) continue;
            seenImgs.add(img.name);
            const buf = await downloadDriveBuffer(img.id);
            if (buf) {
              const key = `${aulaPrefix}/assets/img/${img.name}`;
              await uploadToR2(key, buf, 'image/webp');
              imgCount++;
              totalImagensUploaded++;
              if ((ii + 1) % 5 === 0 || ii === webpFiles.length - 1) {
                log(`      [Imagem ${ii + 1}/${webpFiles.length}] ${img.name} OK`);
              }
            }
          }
        }
      }

      progress[item.key] = {
        status: 'concluido',
        audios: audioCount,
        imagens: imgCount,
        completedAt: new Date().toISOString()
      };
      saveProgress();
      completedThisRun++;

      log(`   ✅ SUCESSO: ${audioCount} áudios e ${imgCount} imagens vinculados no R2!`);
      log(`   📈 Total acumulado na sessão: ${totalAudiosUploaded} áudios | ${totalImagensUploaded} imagens.`);
    } catch (err) {
      log(`   ❌ Erro em ${item.aulaName}: ${err.message}`);
    }

    await new Promise(r => setTimeout(r, 300));
  }

  const tempoTotal = formatDuration(Date.now() - startTime);
  log(`\n======================================================================`);
  log(`🎉 DIREITO PENAL 100% FINALIZADO NO CLOUDFLARE R2!`);
  log(`Tempo total: ${tempoTotal} | Áudios: ${totalAudiosUploaded} | Imagens: ${totalImagensUploaded}`);
  log(`======================================================================`);
}

main().catch(err => {
  log(`FALHA CRÍTICA: ${err.message}`);
});
