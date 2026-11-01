/**
 * SCRIPT MESTRE DE SINCRONIZAÇÃO EM MASSA: HTML E JSON PARA O CLOUDFLARE R2
 * Processa disciplinada e ordenadamente todos os blocos das 4 disciplinas.
 * Garante que cada aula tenha no R2 tanto aula.html quanto aula.json.
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
const R2_DOMAIN = 'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev';

const PROGRESS_FILE = path.join(__dirname, 'aulas_full_sync_progress.json');
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

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
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
    } catch (e) {
      if (attempt === retries) return [];
      await new Promise(r => setTimeout(r, 1000 * attempt));
    }
  }
  return [];
}

async function downloadDriveFile(fileId, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const url = `https://drive.usercontent.google.com/download?id=${fileId}&export=download&authuser=0`;
      let res = await fetch(url);
      if (!res.ok) {
        res = await fetch(`https://drive.google.com/uc?export=download&id=${fileId}`);
      }
      if (res.ok) {
        return await res.text();
      }
    } catch (e) {
      if (attempt === retries) throw e;
      await new Promise(r => setTimeout(r, 1000 * attempt));
    }
  }
  return null;
}

function parseSlidesCount(html) {
  const startMarker = 'var SLIDES = [';
  const startIdx = html.indexOf(startMarker);
  if (startIdx === -1) return 0;
  const fromStart = html.substring(startIdx + 'var SLIDES = '.length);
  const endMatch = fromStart.match(/\];\s*(?:\/\*[\s\S]*?\*\/|\s)*(?:var|const|let|\n)/);
  if (!endMatch) return 0;

  try {
    let slidesCode = fromStart.substring(0, endMatch.index + 1);
    slidesCode = slidesCode.replace(/src="([^"]+)"/g, 'src=\\"$1\\"');
    const slides = (new Function(`return ${slidesCode}`))();
    return Array.isArray(slides) ? slides.length : 0;
  } catch {
    const matches = fromStart.substring(0, endMatch.index + 1).match(/tipo\s*:\s*["'][^"']+["']/g);
    return matches ? matches.length : 0;
  }
}

function parseSlidesArray(html) {
  const startMarker = 'var SLIDES = [';
  const startIdx = html.indexOf(startMarker);
  if (startIdx === -1) return [];
  const fromStart = html.substring(startIdx + 'var SLIDES = '.length);
  const endMatch = fromStart.match(/\];\s*(?:\/\*[\s\S]*?\*\/|\s)*(?:var|const|let|\n)/);
  if (!endMatch) return [];
  try {
    let slidesCode = fromStart.substring(0, endMatch.index + 1);
    slidesCode = slidesCode.replace(/src="([^"]+)"/g, 'src=\\"$1\\"');
    return (new Function(`return ${slidesCode}`))();
  } catch {
    return [];
  }
}

async function main() {
  const data = JSON.parse(fs.readFileSync('scripts/4_disciplinas_completo.json', 'utf8'));
  const DISC_MAP = {
    'Direito Penal': 'direito-penal',
    'Direito Administrativo': 'direito-administrativo',
    'Direito Constitucional': 'direito-constitucional',
    'Direito do Trabalho': 'direito-do-trabalho'
  };

  let totalProcessed = 0;
  let totalSuccess = 0;

  for (const [discNome, discSlug] of Object.entries(DISC_MAP)) {
    const materias = data[discNome] || [];
    console.log(`\n==================================================`);
    console.log(`>>> INICIANDO BLOCO: ${discNome.toUpperCase()} (${materias.length} matérias)`);
    console.log(`==================================================`);

    for (let mi = 0; mi < materias.length; mi++) {
      const mat = materias[mi];
      const matSlug = slugify(mat.materiaName);
      console.log(`\n[Matéria ${mi + 1}/${materias.length}] ${mat.materiaName} (${mat.aulas.length} aulas)`);

      for (let ai = 0; ai < mat.aulas.length; ai++) {
        const aula = mat.aulas[ai];
        const aulaSlug = slugify(aula.name);
        const progressKey = `${discSlug}/${matSlug}/${aulaSlug}`;
        totalProcessed++;

        const existing = progress[progressKey];
        if (existing && existing.urlHtmlR2 && existing.urlJsonR2) {
          console.log(`  [OK - HTML e JSON no R2] ${aula.name}`);
          continue;
        }

        try {
          console.log(`  -> [${ai + 1}/${mat.aulas.length}] Verificando Drive: ${aula.name} (${aula.id})...`);
          const items = await fetchFolderItems(aula.id);
          const htmlFile = items.find(f => f.name.toLowerCase() === 'aula.html' || f.name.endsWith('.html'));
          const jsonFile = items.find(f => f.name.toLowerCase() === 'aula.json' || f.name.endsWith('.json'));

          let r2HtmlUrl = existing?.urlHtmlR2;
          let r2JsonUrl = existing?.urlJsonR2;
          let etapasCount = existing?.etapas || 0;
          let htmlContent = null;

          // 1. Upload do HTML se ainda não estiver no R2
          if (!r2HtmlUrl && htmlFile) {
            console.log(`     Baixando ${htmlFile.name}...`);
            htmlContent = await downloadDriveFile(htmlFile.id);
            if (htmlContent && htmlContent.length >= 500) {
              etapasCount = parseSlidesCount(htmlContent);
              const r2HtmlKey = `aulas-interativas/${discSlug}/${matSlug}/${aulaSlug}/aula.html`;
              await s3.send(new PutObjectCommand({
                Bucket: BUCKET,
                Key: r2HtmlKey,
                Body: Buffer.from(htmlContent, 'utf8'),
                ContentType: 'text/html; charset=utf-8',
                CacheControl: 'public, max-age=31536000'
              }));
              r2HtmlUrl = `${R2_DOMAIN}/${r2HtmlKey}`;
              console.log(`     ✅ HTML no R2: ${etapasCount} etapas`);
            }
          }

          // 2. Upload do JSON no R2
          if (!r2JsonUrl) {
            let jsonString = '';
            if (jsonFile) {
              console.log(`     Baixando ${jsonFile.name}...`);
              jsonString = await downloadDriveFile(jsonFile.id);
            }

            // Fallback se o Drive não tiver aula.json direto: extrair do HTML
            if ((!jsonString || jsonString.length < 50) && !htmlContent && r2HtmlUrl) {
              const resH = await fetch(r2HtmlUrl);
              if (resH.ok) htmlContent = await resH.text();
            }

            if ((!jsonString || jsonString.length < 50) && htmlContent) {
              const slides = parseSlidesArray(htmlContent);
              if (slides && slides.length > 0) {
                jsonString = JSON.stringify({
                  aula: aula.name,
                  disciplina: discNome,
                  materia: mat.materiaName,
                  total_etapas: slides.length,
                  etapas: slides
                }, null, 2);
              }
            }

            if (jsonString && jsonString.length > 50) {
              const r2JsonKey = `aulas-interativas/${discSlug}/${matSlug}/${aulaSlug}/aula.json`;
              await s3.send(new PutObjectCommand({
                Bucket: BUCKET,
                Key: r2JsonKey,
                Body: Buffer.from(jsonString, 'utf8'),
                ContentType: 'application/json; charset=utf-8',
                CacheControl: 'public, max-age=31536000'
              }));
              r2JsonUrl = `${R2_DOMAIN}/${r2JsonKey}`;
              console.log(`     ✅ JSON no R2 enviado com sucesso!`);
            }
          }

          progress[progressKey] = {
            urlHtmlR2: r2HtmlUrl || existing?.urlHtmlR2 || '',
            urlJsonR2: r2JsonUrl || existing?.urlJsonR2 || '',
            etapas: etapasCount || existing?.etapas || 30,
            updatedAt: new Date().toISOString()
          };
          saveProgress();
          totalSuccess++;
        } catch (err) {
          console.error(`     ❌ Erro em ${aula.name}:`, err.message);
        }

        // Intervalo de segurança anti rate-limit do Google Drive
        await new Promise(r => setTimeout(r, 600));
      }
    }
  }

  console.log(`\n==================================================`);
  console.log(`PROCESSO FINALIZADO! Total processadas: ${totalProcessed} | Sucesso R2: ${totalSuccess}`);
  console.log(`==================================================`);
}

main().catch(console.error);
