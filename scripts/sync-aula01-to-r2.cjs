const fs = require('fs');
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

async function downloadBuffer(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
  });
  if (!res.ok) throw new Error(`Falha download: ${res.status}`);
  const ab = await res.arrayBuffer();
  return Buffer.from(ab);
}

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

async function scanDriveFolder(folderId) {
  const url = `https://drive.google.com/drive/folders/${folderId}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
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
      items.push({ id: arr[0], parentId: arr[1], name: arr[2], mimeType: arr[3] });
    }
    for (const el of arr) if (Array.isArray(el)) walk(el);
  }
  walk(data);
  return items;
}

async function main() {
  const materiaSlug = '01-crimes-contra-a-familia';
  const aulaSlug = 'aula-01-crimes-contra-a-familia';
  const prefix = `aulas-interativas/direito-penal/${materiaSlug}/${aulaSlug}`;

  const assets = JSON.parse(fs.readFileSync('scratch/aula01_assets.json', 'utf8'));
  const itensAula = assets.itensAula;
  const audios = assets.audios;
  const imagens = assets.imagens;

  console.log(`Iniciando sincronização de ${audios.length} áudios e ${imagens.length} imagens para R2...`);

  const mediaMap = {
    audios: {},
    imagens: {}
  };

  // Upload audios
  for (let i = 0; i < audios.length; i++) {
    const a = audios[i];
    const key = `${prefix}/audio/${a.name}`;
    console.log(`[${i+1}/${audios.length}] Baixando áudio ${a.name} (${a.id})...`);
    try {
      const buf = await downloadBuffer(`https://drive.usercontent.google.com/download?id=${a.id}&export=download&authuser=0`);
      const r2Url = await uploadToR2(key, buf, 'audio/mpeg');
      mediaMap.audios[a.name] = r2Url;
      console.log(`  -> Salvo no R2: ${r2Url} (${(buf.length / 1024).toFixed(1)} KB)`);
    } catch (e) {
      console.error(`  Erro no áudio ${a.name}:`, e.message);
    }
  }

  // Upload imagens
  for (let i = 0; i < imagens.length; i++) {
    const img = imagens[i];
    const key = `${prefix}/imagens/${img.name}`;
    console.log(`[${i+1}/${imagens.length}] Baixando imagem ${img.name} (${img.id})...`);
    try {
      const buf = await downloadBuffer(`https://drive.usercontent.google.com/download?id=${img.id}&export=download&authuser=0`);
      const r2Url = await uploadToR2(key, buf, 'image/webp');
      mediaMap.imagens[img.name] = r2Url;
      console.log(`  -> Salvo no R2: ${r2Url} (${(buf.length / 1024).toFixed(1)} KB)`);
    } catch (e) {
      console.error(`  Erro na imagem ${img.name}:`, e.message);
    }
  }

  // Upload capa-3x4.webp se existir na raiz da aula
  const capaFile = itensAula.find(it => it.name === 'capa-3x4.webp');
  if (capaFile) {
    console.log('Baixando capa-3x4.webp...');
    const buf = await downloadBuffer(`https://drive.usercontent.google.com/download?id=${capaFile.id}&export=download&authuser=0`);
    const r2Url = await uploadToR2(`${prefix}/capa-3x4.webp`, buf, 'image/webp');
    mediaMap.capa = r2Url;
    console.log('Capa salva no R2:', r2Url);
  }

  fs.writeFileSync('scratch/media_map_aula01.json', JSON.stringify(mediaMap, null, 2), 'utf8');
  console.log('Concluído! media_map_aula01.json gerado com sucesso.');
}

main().catch(console.error);

