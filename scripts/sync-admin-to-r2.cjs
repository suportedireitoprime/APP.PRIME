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

async function uploadBufferToR2(key, buffer, contentType) {
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    CacheControl: 'public, max-age=31536000'
  }));
  return `${R2_DOMAIN}/${key}`;
}

async function uploadLocalFileToR2(localPath, key, contentType) {
  const buf = fs.readFileSync(localPath);
  return await uploadBufferToR2(key, buf, contentType);
}

async function downloadBuffer(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
  });
  if (!res.ok) throw new Error(`Falha download: ${res.status} para ${url}`);
  const ab = await res.arrayBuffer();
  return Buffer.from(ab);
}

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
    const unescaped = hex.replace(/\\"/g, '"').replace(/\\\\/g, '\\');
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

async function main() {
  console.log('=== SINCRONIZANDO DIREITO ADMINISTRATIVO COM O R2 ===');

  const basePath01 = 'aulas-interativas/direito-administrativo/01-origens-e-definicoes/aula-01-origens';
  const basePath02 = 'aulas-interativas/direito-administrativo/01-origens-e-definicoes/aula-02-definicoes';

  // 1. UPLOAD DE TODAS AS IMAGENS LOCAIS DE AULA 01 PARA O R2
  const aula01Imgs = [
    'capa.webp', 'roteiro.webp', 'questao.webp', 'flashcards.webp',
    'ligar.webp', 'timeline.webp', 'norma.webp', 'explorar.webp',
    'franca.webp', 'estadodireito.webp', 'legalidade.webp', 'conselho.webp',
    'patrimonial.webp', 'burocracia.webp'
  ];

  console.log('\n--- Fazendo upload das imagens da Aula 01 para R2 ---');
  for (const imgName of aula01Imgs) {
    const local = `public/assets/img/${imgName}`;
    const r2Key = `${basePath01}/imagens/${imgName}`;
    if (fs.existsSync(local)) {
      const url = await uploadLocalFileToR2(local, r2Key, 'image/webp');
      console.log(`[Aula 01] Imagem ${imgName} -> ${url}`);
    }
  }

  // Upload Capa 3x4 Aula 01
  const capa01Local = 'src/assets/aulas-interativas/direito-administrativo/capa-aula-01-origens.webp';
  if (fs.existsSync(capa01Local)) {
    const urlCapa01 = await uploadLocalFileToR2(capa01Local, `${basePath01}/capa-3x4.webp`, 'image/webp');
    console.log(`[Aula 01] Capa 3x4 -> ${urlCapa01}`);
  }

  // 2. UPLOAD DE TODAS AS IMAGENS LOCAIS DE AULA 02 PARA O R2
  const aula02Imgs = [
    'roteiro.webp', 'questao.webp', 'flashcards.webp', 'ligar.webp',
    'timeline.webp', 'explorar.webp', 'definicao.webp', 'criterios.webp',
    'puissance.webp', 'service.webp', 'executivo.webp', 'relacoes.webp',
    'teleologico.webp', 'residual.webp', 'adotado.webp', 'objetivo.webp', 'subjetivo.webp'
  ];

  console.log('\n--- Fazendo upload das imagens da Aula 02 para R2 ---');
  for (const imgName of aula02Imgs) {
    const local = `public/assets/img/${imgName}`;
    const r2Key = `${basePath02}/imagens/${imgName}`;
    if (fs.existsSync(local)) {
      const url = await uploadLocalFileToR2(local, r2Key, 'image/webp');
      console.log(`[Aula 02] Imagem ${imgName} -> ${url}`);
    }
  }

  // Upload Capa específica de Aula 02
  const capa02Slide = 'public/assets/img/capa-aula-02.webp';
  if (fs.existsSync(capa02Slide)) {
    const urlCapa02Slide = await uploadLocalFileToR2(capa02Slide, `${basePath02}/imagens/capa.webp`, 'image/webp');
    console.log(`[Aula 02] Slide Capa -> ${urlCapa02Slide}`);
  }

  // Upload Capa 3x4 Aula 02
  const capa02Local = 'src/assets/aulas-interativas/direito-administrativo/capa-aula-02-definicoes.webp';
  if (fs.existsSync(capa02Local)) {
    const urlCapa02 = await uploadLocalFileToR2(capa02Local, `${basePath02}/capa-3x4.webp`, 'image/webp');
    console.log(`[Aula 02] Capa 3x4 -> ${urlCapa02}`);
  }

  // 3. BAIXAR E SUBIR ÁUDIOS DE AULA 01 DO GOOGLE DRIVE PARA O R2
  // Folder ID de áudio da Aula 01: 19PO7Yu47LGWnhwNtuKEeC4zp-RSPw8-9
  console.log('\n--- Escaneando e subindo áudios da Aula 01 do Drive para R2 ---');
  const audios01 = await scanDriveFolder('19PO7Yu47LGWnhwNtuKEeC4zp-RSPw8-9');
  console.log(`Encontrados ${audios01.length} áudios na Aula 01.`);

  for (let i = 0; i < audios01.length; i++) {
    const a = audios01[i];
    const r2Key = `${basePath01}/audio/${a.name}`;
    console.log(`[${i+1}/${audios01.length}] Baixando áudio ${a.name}...`);
    try {
      const buf = await downloadBuffer(`https://drive.usercontent.google.com/download?id=${a.id}&export=download&authuser=0`);
      const r2Url = await uploadBufferToR2(r2Key, buf, 'audio/mpeg');
      console.log(`  -> Salvo no R2: ${r2Url} (${(buf.length / 1024).toFixed(1)} KB)`);
    } catch (e) {
      console.error(`  Erro no áudio ${a.name}:`, e.message);
    }
  }

  // 4. ESCANEAR SUBPASTAS DA AULA 02 (1534IibhSbhTMboijFavmfERw5U3GUP17)
  console.log('\n--- Escaneando pasta de Aula 02 no Drive ---');
  const items02 = await scanDriveFolder('1534IibhSbhTMboijFavmfERw5U3GUP17');
  console.log(`Itens em Aula 02: ${items02.map(it => it.name).join(', ')}`);

  const audioFolder02 = items02.find(it => it.name === 'audio');
  if (audioFolder02) {
    console.log(`Pasta audio da Aula 02 encontrada: ${audioFolder02.id}`);
    const audios02 = await scanDriveFolder(audioFolder02.id);
    console.log(`Encontrados ${audios02.length} áudios na Aula 02.`);
    for (let i = 0; i < audios02.length; i++) {
      const a = audios02[i];
      const r2Key = `${basePath02}/audio/${a.name}`;
      console.log(`[${i+1}/${audios02.length}] Baixando áudio ${a.name}...`);
      try {
        const buf = await downloadBuffer(`https://drive.usercontent.google.com/download?id=${a.id}&export=download&authuser=0`);
        const r2Url = await uploadBufferToR2(r2Key, buf, 'audio/mpeg');
        console.log(`  -> Salvo no R2: ${r2Url} (${(buf.length / 1024).toFixed(1)} KB)`);
      } catch (e) {
        console.error(`  Erro no áudio ${a.name}:`, e.message);
      }
    }
  }

  // 5. ATUALIZAR OS HTMLS COM AS URLs DO R2 E SUBIR OS PRÓPRIOS HTMLs PARA O R2!
  console.log('\n--- Atualizando e linkando os HTMLs com R2 ---');

  // Aula 01
  let html01 = fs.readFileSync('src/assets/aulas-interativas/direito-administrativo/aula-01.html', 'utf8');
  // Substituir IMG map com R2 URLs
  const r2ImgBase01 = `${R2_DOMAIN}/${basePath01}/imagens`;
  const r2AudioBase01 = `${R2_DOMAIN}/${basePath01}/audio`;

  for (const imgName of aula01Imgs) {
    const key = imgName.replace('.webp', '');
    html01 = html01.replace(
      new RegExp(`"${key}":\\s*"[^"]+"`),
      `"${key}": "${r2ImgBase01}/${imgName}"`
    );
  }
  // AudioSrc function
  html01 = html01.replace(
    /function audioSrc\(i\)\{[\s\S]*?\}/,
    `function audioSrc(i){ return "${r2AudioBase01}/s" + pad(i+1) + ".mp3"; }`
  );

  fs.writeFileSync('src/assets/aulas-interativas/direito-administrativo/aula-01.html', html01, 'utf8');
  fs.writeFileSync('public/aulas-interativas/direito-administrativo/01-origens-e-definicoes/aula-01.html', html01, 'utf8');
  await uploadBufferToR2(`${basePath01}/aula.html`, Buffer.from(html01, 'utf8'), 'text/html; charset=utf-8');
  console.log(`Aula 01 HTML subido para R2: ${R2_DOMAIN}/${basePath01}/aula.html`);

  // Aula 02
  let html02 = fs.readFileSync('src/assets/aulas-interativas/direito-administrativo/aula-02.html', 'utf8');
  const r2ImgBase02 = `${R2_DOMAIN}/${basePath02}/imagens`;
  const r2AudioBase02 = `${R2_DOMAIN}/${basePath02}/audio`;

  html02 = html02.replace(
    /"capa":\s*"[^"]+"/,
    `"capa": "${r2ImgBase02}/capa.webp"`
  );

  for (const imgName of aula02Imgs) {
    const key = imgName.replace('.webp', '');
    html02 = html02.replace(
      new RegExp(`"${key}":\\s*"[^"]+"`),
      `"${key}": "${r2ImgBase02}/${imgName}"`
    );
  }
  // AudioSrc function
  html02 = html02.replace(
    /function audioSrc\(i\)\{[\s\S]*?\}/,
    `function audioSrc(i){ return "${r2AudioBase02}/s" + pad(i+1) + ".mp3"; }`
  );

  fs.writeFileSync('src/assets/aulas-interativas/direito-administrativo/aula-02.html', html02, 'utf8');
  fs.writeFileSync('public/aulas-interativas/direito-administrativo/01-origens-e-definicoes/aula-02.html', html02, 'utf8');
  await uploadBufferToR2(`${basePath02}/aula.html`, Buffer.from(html02, 'utf8'), 'text/html; charset=utf-8');
  console.log(`Aula 02 HTML subido para R2: ${R2_DOMAIN}/${basePath02}/aula.html`);

  console.log('\n=== TUDO SINCRONIZADO E LINKADO COM SUCESSO NO R2! ===');
}

main().catch(console.error);

