/**
 * SCRIPT MESTRE DE TRANSFERÊNCIA DE MÍDIAS (ÁUDIOS E IMAGENS) DO GOOGLE DRIVE PARA O R2
 * Sincroniza todas as narrações MP3 e ilustrações WEBP das aulas.
 * Escreve logs sem buffer em scripts/media_sync.log e calcula tempo estimado (ETA).
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
  const data = JSON.parse(fs.readFileSync('scripts/4_disciplinas_completo.json', 'utf8'));
  const DISC_MAP = {
    'Direito Penal': 'direito-penal',
    'Direito Administrativo': 'direito-administrativo',
    'Direito Constitucional': 'direito-constitucional',
    'Direito do Trabalho': 'direito-do-trabalho'
  };

  const allAulas = [];
  for (const [discNome, discSlug] of Object.entries(DISC_MAP)) {
    const materias = data[discNome] || [];
    for (const mat of materias) {
      const matSlug = slugify(mat.materiaName);
      for (const aula of mat.aulas) {
        const aulaSlug = slugify(aula.name);
        allAulas.push({
          discNome,
          discSlug,
          matNome: mat.materiaName,
          matSlug,
          aulaName: aula.name,
          aulaSlug,
          folderId: aula.id,
          key: `${discSlug}/${matSlug}/${aulaSlug}`
        });
      }
    }
  }

  const totalAulas = allAulas.length;
  fs.writeFileSync(LOG_FILE, `=== SINCRONIZADOR DE MÍDIAS INICIADO (${totalAulas} aulas) ===\n`, 'utf8');

  log(`======================================================================`);
  log(`>>> INICIANDO TRANSFERÊNCIA MESTRE DE ÁUDIOS E IMAGENS (${totalAulas} aulas)`);
  log(`======================================================================`);

  const startTime = Date.now();
  let completedThisRun = 0;
  let totalAudiosUploaded = 0;
  let totalImagensUploaded = 0;

  for (let i = 0; i < allAulas.length; i++) {
    const item = allAulas[i];
    const currentIndex = i + 1;
    const pctGeral = ((currentIndex / totalAulas) * 100).toFixed(1);

    // Calcular ETA em tempo real
    let etaString = 'calculando...';
    if (completedThisRun >= 2) {
      const elapsed = Date.now() - startTime;
      const avgMsPerAula = elapsed / completedThisRun;
      const remainingCount = totalAulas - currentIndex;
      const remainingMs = remainingCount * avgMsPerAula;
      etaString = formatDuration(remainingMs);
    }

    if (progress[item.key] && progress[item.key].status === 'concluido') {
      log(`[${currentIndex}/${totalAulas} - ${pctGeral}%] [OK - Já sincronizado] ${item.aulaName}`);
      continue;
    }

    log(`\n----------------------------------------------------------------------`);
    log(`[${currentIndex}/${totalAulas} - ${pctGeral}%] [TEMPO ESTIMADO RESTANTE: ${etaString}]`);
    log(`-> ${item.discNome} > ${item.matNome} > ${item.aulaName}`);
    log(`----------------------------------------------------------------------`);

    try {
      const folderItems = await fetchFolderItems(item.folderId);
      const audioFolder = folderItems.find(f => f.name.toLowerCase() === 'audio');
      const imgFolder = folderItems.find(f => f.name.toLowerCase() === 'imagens');

      const aulaPrefix = `aulas-interativas/${item.discSlug}/${item.matSlug}/${item.aulaSlug}`;
      let audioCount = 0;
      let imgCount = 0;

      // Transferir Áudios
      if (audioFolder) {
        const audioItems = await fetchFolderItems(audioFolder.id);
        const seenAudios = new Set();
        const mp3Files = audioItems.filter(a => a.name.endsWith('.mp3'));
        log(`   🎵 Baixando e enviando ${mp3Files.length} áudios MP3 para o R2...`);

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
              log(`      [Áudio ${ai + 1}/${mp3Files.length}] ${a.name} enviado`);
            }
          }
        }
      }

      // Transferir Imagens
      if (imgFolder) {
        const imgItems = await fetchFolderItems(imgFolder.id);
        const seenImgs = new Set();
        const webpFiles = imgItems.filter(img => img.name.endsWith('.webp'));
        log(`   🖼️  Baixando e enviando ${webpFiles.length} imagens WEBP para o R2...`);

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
              log(`      [Imagem ${ii + 1}/${webpFiles.length}] ${img.name} enviada`);
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

    await new Promise(r => setTimeout(r, 400));
  }

  const tempoTotal = formatDuration(Date.now() - startTime);
  log(`\n======================================================================`);
  log(`🎉 SINCRONIZAÇÃO COMPLETA DE TODAS AS MÍDIAS FINALIZADA!`);
  log(`Tempo total: ${tempoTotal} | Áudios: ${totalAudiosUploaded} | Imagens: ${totalImagensUploaded}`);
  log(`======================================================================`);
}

main().catch(err => {
  log(`FALHA CRÍTICA: ${err.message}`);
});
