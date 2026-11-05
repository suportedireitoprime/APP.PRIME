const fs = require('fs');
const path = require('path');
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
const ROOT_FOLDER_ID = '1N-dD4qrKWjc47U8VUCqPi7qJ-M67RSw8';
const BASE_R2_PREFIX = 'audiobooks/o-mundo-de-sofia';

// Helper de delay
const sleep = ms => new Promise(r => setTimeout(r, ms));

// Scanner de pastas do Google Drive
async function scanDriveFolder(folderId) {
  const url = `https://drive.google.com/drive/folders/${folderId}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
  });
  const html = await res.text();
  const match = html.match(/window\['_DRIVE_ivd'\]\s*=\s*'([^']+)'/);
  if (!match) return [];
  const raw = match[1];
  const hex = raw.replace(/\\x([0-9A-Fa-f]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
  let data;
  try {
    data = JSON.parse(hex);
  } catch (e) {
    const unescaped = hex.replace(/\\\"/g, '\"').replace(/\\\\/g, '\\');
    data = JSON.parse(unescaped);
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

// Download com tratamento de arquivo grande (Google virus scan confirm)
async function downloadDriveFile(fileId, retries = 3) {
  let url = `https://drive.google.com/uc?export=download&id=${fileId}`;
  for (let tentativa = 1; tentativa <= retries; tentativa++) {
    try {
      let res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      // Checa se veio página de confirmação de vírus do Google
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('text/html')) {
        const text = await res.text();
        const match = text.match(/confirm=([^&"\s]+)/);
        const confirmToken = match ? match[1] : 't';
        url = `https://drive.google.com/uc?export=download&confirm=${confirmToken}&id=${fileId}`;
        res = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            'Cookie': res.headers.get('set-cookie') || ''
          }
        });
      }

      const ab = await res.arrayBuffer();
      return Buffer.from(ab);
    } catch (err) {
      if (tentativa === retries) throw err;
      console.warn(`[Download] Erro no arquivo ${fileId} (${err.message}), retentando em 2s...`);
      await sleep(2000);
    }
  }
}

// Verifica se objeto já existe no R2
async function existsInR2(key) {
  try {
    const head = await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
    return (head.ContentLength || 0) > 0;
  } catch (e) {
    return false;
  }
}

// Upload para o R2
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

function getContentType(filename) {
  if (filename.endsWith('.mp3')) return 'audio/mpeg';
  if (filename.endsWith('.srt')) return 'text/plain; charset=utf-8';
  if (filename.endsWith('.md')) return 'text/markdown; charset=utf-8';
  if (filename.endsWith('.webp')) return 'image/webp';
  if (filename.endsWith('.jpg') || filename.endsWith('.jpeg')) return 'image/jpeg';
  if (filename.endsWith('.png')) return 'image/png';
  return 'application/octet-stream';
}

async function main() {
  console.log('=== INICIANDO SINCRONIZAÇÃO COMPLETA: O MUNDO DE SOFIA -> R2 ===\n');

  console.log('1. Varrendo pasta raiz do Google Drive...');
  const rootItems = await scanDriveFolder(ROOT_FOLDER_ID);
  console.log(`Encontrados ${rootItems.length} itens na raiz.`);

  const subfolders = rootItems
    .filter(it => it.mimeType === 'application/vnd.google-apps.folder')
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

  const rootFiles = rootItems.filter(it => it.mimeType !== 'application/vnd.google-apps.folder');

  console.log(`- Arquivos raiz: ${rootFiles.length}`);
  console.log(`- Capítulos (subpastas): ${subfolders.length}`);

  const filaUpload = [];

  // Arquivos raiz
  for (const f of rootFiles) {
    filaUpload.push({
      id: f.id,
      name: f.name,
      r2Key: `${BASE_R2_PREFIX}/${f.name}`,
      folder: 'raiz'
    });
  }

  // Capítulos
  for (let i = 0; i < subfolders.length; i++) {
    const sf = subfolders[i];
    console.log(`Buscando arquivos do ${sf.name}...`);
    const files = await scanDriveFolder(sf.id);
    const numMatch = sf.name.match(/^(\d+)/);
    const num = numMatch ? numMatch[1].padStart(2, '0') : String(i + 1).padStart(2, '0');
    const folderSlug = `capitulo-${num}`;

    for (const f of files) {
      if (f.mimeType === 'application/vnd.google-apps.folder') continue;
      filaUpload.push({
        id: f.id,
        name: f.name,
        r2Key: `${BASE_R2_PREFIX}/${folderSlug}/${f.name}`,
        folder: sf.name,
        capituloNum: num
      });
    }
    await sleep(250); // gentileza com o Drive
  }

  console.log(`\nTOTAL DE ARQUIVOS NA FILA: ${filaUpload.length}\n`);

  let enviados = 0;
  let pulados = 0;

  for (let i = 0; i < filaUpload.length; i++) {
    const item = filaUpload[i];
    const progresso = `[${i + 1}/${filaUpload.length}]`;

    const jaExiste = await existsInR2(item.r2Key);
    if (jaExiste) {
      console.log(`${progresso} [JÁ EXISTE NO R2] ${item.r2Key}`);
      pulados++;
      continue;
    }

    console.log(`${progresso} Baixando ${item.name} (${item.folder})...`);
    const buffer = await downloadDriveFile(item.id);

    console.log(`${progresso} Enviando para R2: ${item.r2Key} (${(buffer.length / 1024 / 1024).toFixed(2)} MB)...`);
    const contentType = getContentType(item.name);
    await uploadToR2(item.r2Key, buffer, contentType);
    enviados++;
    console.log(`${progresso} SUCESSO: ${R2_DOMAIN}/${item.r2Key}`);
  }

  console.log(`\n=== SINCRONIZAÇÃO CONCLUÍDA COM SUCESSO! ===`);
  console.log(`Enviados novos: ${enviados}`);
  console.log(`Já existentes: ${pulados}`);
  console.log(`Total verificado: ${filaUpload.length}`);
}

main().catch(console.error);

