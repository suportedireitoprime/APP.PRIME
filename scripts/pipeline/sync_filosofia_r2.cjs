const https = require('https');
const fs = require('fs');
const path = require('path');
const { S3Client, PutObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');

const s3 = new S3Client({
  region: 'auto',
  endpoint: 'https://f654819db5e99f6d7f9475abf6e3f834.r2.cloudflarestorage.com',
  credentials: {
    accessKeyId: '199f43b3ef1e89db1506e45430cb4660',
    secretAccessKey: '6ac079b15bc8f24d9bbeacdf5bbb7ad9ead1b1caa96eafe1ba1b75d15200c6bc'
  }
});

const BUCKET = 'estudos-juridicos-midias';
const MATERIA_SLUG = 'teoria-e-filosofia-do-direito';
const DISCIPLINA_ID = 'filosofia';

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

function fetchFolder(id) {
  return new Promise((resolve, reject) => {
    https.get(`https://drive.google.com/embeddedfolderview?id=${id}#list`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        const regex = /<div class="flip-entry" id="entry-([a-zA-Z0-9_-]+)"[\s\S]*?href="([^"]+)"[\s\S]*?<div class="flip-entry-title">([^<]+)<\/div>/g;
        let m;
        const items = [];
        while ((m = regex.exec(d)) !== null) {
          items.push({
            id: m[1],
            url: m[2],
            name: m[3].trim(),
            isFolder: m[2].includes('/folders/')
          });
        }
        resolve(items);
      });
    }).on('error', reject);
  });
}

function downloadDriveFile(id, retries = 3) {
  return new Promise((resolve, reject) => {
    const url = `https://drive.google.com/uc?export=download&id=${id}`;
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return https.get(res.headers.location, (res2) => {
          const chunks = [];
          res2.on('data', c => chunks.push(c));
          res2.on('end', () => resolve(Buffer.concat(chunks)));
        }).on('error', (err) => {
          if (retries > 0) return resolve(downloadDriveFile(id, retries - 1));
          reject(err);
        });
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', (err) => {
      if (retries > 0) return resolve(downloadDriveFile(id, retries - 1));
      reject(err);
    });
  });
}

const existingKeys = new Set();

async function loadExistingR2Keys() {
  console.log('Loading existing R2 keys for Teoria e Filosofia do Direito...');
  let continuationToken = undefined;
  do {
    const res = await s3.send(new ListObjectsV2Command({
      Bucket: BUCKET,
      Prefix: `aulas-interativas/${MATERIA_SLUG}/`,
      ContinuationToken: continuationToken
    }));
    if (res.Contents) {
      res.Contents.forEach(c => existingKeys.add(c.Key));
    }
    continuationToken = res.NextContinuationToken;
  } while (continuationToken);
  console.log(`Loaded ${existingKeys.size} existing keys from R2.`);
}

async function uploadToR2IfMissing(key, fileId, contentType) {
  if (existingKeys.has(key)) return false;
  try {
    const buf = await downloadDriveFile(fileId);
    if (buf && buf.length > 0) {
      await s3.send(new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: buf,
        ContentType: contentType
      }));
      existingKeys.add(key);
      return true;
    }
  } catch (e) {
    console.error(`\nError uploading ${key}:`, e.message);
  }
  return false;
}

async function processAula(moduloSlug, aulaFolder) {
  const aulaSlug = slugify(aulaFolder.name);
  const aulaBasePath = `aulas-interativas/${MATERIA_SLUG}/${moduloSlug}/${aulaSlug}`;
  const aulaItems = await fetchFolder(aulaFolder.id);

  const htmlFile = aulaItems.find(i => i.name === 'aula.html');
  const jsonFile = aulaItems.find(i => i.name === 'aula.json');
  const capaFile = aulaItems.find(i => i.name.startsWith('capa-') || i.name === 'capa.webp');
  const audioFolder = aulaItems.find(i => i.name === 'audio' && i.isFolder);
  const imgFolder = aulaItems.find(i => i.name === 'imagens' && i.isFolder);

  // 1. Capa
  if (capaFile) {
    await uploadToR2IfMissing(`${aulaBasePath}/capa-3x4.webp`, capaFile.id, 'image/webp');
  }

  // 2. HTML & JSON
  if (htmlFile) {
    await uploadToR2IfMissing(`${aulaBasePath}/aula.html`, htmlFile.id, 'text/html; charset=utf-8');
  }
  if (jsonFile) {
    await uploadToR2IfMissing(`${aulaBasePath}/aula.json`, jsonFile.id, 'application/json; charset=utf-8');
  }

  // 3. Audio folder
  if (audioFolder) {
    const audioFiles = await fetchFolder(audioFolder.id);
    for (let i = 0; i < audioFiles.length; i += 6) {
      const batch = audioFiles.slice(i, i + 6);
      await Promise.all(batch.map(async (a) => {
        const k1 = `${aulaBasePath}/assets/audio/${a.name}`;
        const k2 = `${aulaBasePath}/audio/${a.name}`;
        const up1 = await uploadToR2IfMissing(k1, a.id, 'audio/mpeg');
        if (up1) process.stdout.write('a');
        if (!existingKeys.has(k2)) {
          // Upload copy or alias
          const up2 = await uploadToR2IfMissing(k2, a.id, 'audio/mpeg');
          if (up2) process.stdout.write('a');
        }
      }));
    }
  }

  // 4. Imagens folder
  if (imgFolder) {
    const imgFiles = await fetchFolder(imgFolder.id);
    for (let i = 0; i < imgFiles.length; i += 6) {
      const batch = imgFiles.slice(i, i + 6);
      await Promise.all(batch.map(async (im) => {
        const ext = im.name.endsWith('.png') ? 'image/png' : 'image/webp';
        const k1 = `${aulaBasePath}/assets/img/${im.name}`;
        const k2 = `${aulaBasePath}/imagens/${im.name}`;
        const up1 = await uploadToR2IfMissing(k1, im.id, ext);
        if (up1) process.stdout.write('i');
        if (!existingKeys.has(k2)) {
          const up2 = await uploadToR2IfMissing(k2, im.id, ext);
          if (up2) process.stdout.write('i');
        }
      }));
    }
  }
}

async function main() {
  await loadExistingR2Keys();

  const summaryPath = path.join(__dirname, 'checkpoints', 'gdrive_materias_summary.json');
  const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf-8'));
  const fil = summary.find(s => s.name.toLowerCase().includes('filosofia'));

  if (!fil) {
    console.error('Filosofia not found in summary!');
    return;
  }

  console.log(`\n======================================================`);
  console.log(`SYNCHRONIZING FILOSOFIA TO R2: ${fil.name}`);
  console.log(`Total Modules: ${fil.modules.length}`);
  console.log(`======================================================\n`);

  for (let mIdx = 0; mIdx < fil.modules.length; mIdx++) {
    const mod = fil.modules[mIdx];
    const modSlug = slugify(mod.name);
    console.log(`\nModule ${mIdx + 1}/${fil.modules.length}: ${mod.name} (${modSlug})`);

    const aulas = await fetchFolder(mod.id);
    console.log(`  Found ${aulas.length} aulas.`);

    for (let aIdx = 0; aIdx < aulas.length; aIdx++) {
      const aula = aulas[aIdx];
      process.stdout.write(`  [${aIdx + 1}/${aulas.length}] ${aula.name} `);
      await processAula(modSlug, aula);
      console.log(' -> OK');
    }
  }

  console.log('\nAll modules of Filosofia synchronized to Cloudflare R2!');
}

main().catch(console.error);
