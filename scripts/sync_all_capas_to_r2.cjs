const fs = require('fs');
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

async function scanDrive(folderId) {
  const url = 'https://drive.google.com/drive/folders/' + folderId;
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const html = await res.text();
  const match = html.match(/window\['_DRIVE_ivd'\]\s*=\s*'([^']+)'/);
  if (!match) return [];
  const hex = match[1].replace(/\\x([0-9A-Fa-f]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
  let data;
  try {
    data = JSON.parse(hex);
  } catch (e) {
    const un = hex.replace(/\\"/g, '"').replace(/\\\\/g, '\\');
    data = JSON.parse(un);
  }
  const items = [];
  function walk(arr) {
    if (!Array.isArray(arr)) return;
    if (arr.length >= 4 && typeof arr[0] === 'string' && arr[0].length >= 20 && typeof arr[2] === 'string') {
      items.push({ id: arr[0], parentId: arr[1], name: arr[2], mimeType: arr[3] });
    }
    for (const el of arr) if (Array.isArray(el)) walk(el);
  }
  walk(data);
  return items;
}

async function downloadBuffer(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
  });
  if (!res.ok) throw new Error(`Falha download: ${res.status}`);
  const ab = await res.arrayBuffer();
  return Buffer.from(ab);
}

function cleanFilename(str) {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_\-\.]+/g, '_')
    .toLowerCase();
}

const CAPAS_FOLDERS = {
  administrativo: '1omG1JdgezPqN-i4NJ594uXmHKRtoJFCr',
  constitucional: '1aRu2R_5gj99-j75jsLpW_vWRa-Hjkwlv',
  trabalho: '1g17C2u_ztEhsPzd3uAmjUhILe0tPnWQp',
  penal: '1EweT0nhfQNeMzKEEXsCljGPao6RdR51h'
};

async function run() {
  console.log('=== SINCRONIZANDO TODAS AS CAPAS INDIVIDUAIS NO R2 ===\n');
  const capasManifest = {};

  for (const [discKey, folderId] of Object.entries(CAPAS_FOLDERS)) {
    console.log(`\n--- Processando Capas de: ${discKey.toUpperCase()} ---`);
    const items = await scanDrive(folderId);
    const webpFiles = items.filter(it => it.name.endsWith('.webp'));
    console.log(`Encontradas ${webpFiles.length} capas.`);
    capasManifest[discKey] = {};

    for (let i = 0; i < webpFiles.length; i++) {
      const item = webpFiles[i];
      const safeName = cleanFilename(item.name);
      const r2Key = `aulas-interativas/capas/${discKey}/${safeName}`;
      const r2Url = `${R2_DOMAIN}/${r2Key}`;
      
      try {
        const buf = await downloadBuffer(`https://drive.usercontent.google.com/download?id=${item.id}&export=download&authuser=0`);
        await s3.send(new PutObjectCommand({
          Bucket: BUCKET,
          Key: r2Key,
          Body: buf,
          ContentType: 'image/webp',
          CacheControl: 'public, max-age=31536000'
        }));
        console.log(`[${i+1}/${webpFiles.length}] ${item.name} -> ${(buf.length/1024).toFixed(1)} KB`);
        
        // Guardar mapeamento pelo nome original limpo para lookup
        capasManifest[discKey][item.name] = r2Url;
      } catch (e) {
        console.error(`Erro ao subir ${item.name}:`, e.message);
      }
    }
  }

  fs.writeFileSync('scripts/capas_manifest.json', JSON.stringify(capasManifest, null, 2), 'utf8');
  console.log('\n=== TODAS AS CAPAS SINCRONIZADAS NO R2 E SALVAS EM scripts/capas_manifest.json! ===');
}

run().catch(console.error);

