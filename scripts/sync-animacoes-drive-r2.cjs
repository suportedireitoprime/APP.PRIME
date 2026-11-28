const { S3Client, PutObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ROOT_FOLDER_ID = '1c6OUpK9vEeniPwt0PGusyykEJWDFGy7o';

const R2_CONFIG = {
  endpoint: 'https://f654819db5e99f6d7f9475abf6e3f834.r2.cloudflarestorage.com',
  accessKeyId: '199f43b3ef1e89db1506e45430cb4660',
  secretAccessKey: '6ac079b15bc8f24d9bbeacdf5bbb7ad9ead1b1caa96eafe1ba1b75d15200c6bc',
  bucket: 'estudos-juridicos-midias',
  publicBase: 'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev',
};

const s3 = new S3Client({
  region: 'auto',
  endpoint: R2_CONFIG.endpoint,
  credentials: {
    accessKeyId: R2_CONFIG.accessKeyId,
    secretAccessKey: R2_CONFIG.secretAccessKey,
  },
});

function slugify(str) {
  return String(str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

async function listDriveFolder(folderId) {
  const res = await fetch(`https://drive.google.com/drive/folders/${folderId}`, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
  });
  const html = await res.text();
  const decoded = html
    .replace(/\\x([0-9A-Fa-f]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/\\u([0-9A-Fa-f]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/\\"/g, '"');

  const items = [];
  const seen = new Set();
  const regex = /\["([a-zA-Z0-9_-]{20,45})"\s*,\s*\["[^"]+"\]\s*,\s*"([^"]{1,200})"\s*,\s*"([^"]+)"/g;
  let m;
  while ((m = regex.exec(decoded)) !== null) {
    const [, id, name, mime] = m;
    if (id === folderId || seen.has(id)) continue;
    seen.add(id);
    items.push({ id, name, mime: mime.replace(/\\\//g, '/') });
  }
  return items;
}

async function downloadDriveFileBuffer(fileId, retries = 3) {
  const url = `https://drive.google.com/uc?export=download&id=${fileId}`;
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length > 0) return buf;
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise((r) => setTimeout(r, 800 * (i + 1)));
    }
  }
  return null;
}

async function r2Exists(key) {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: R2_CONFIG.bucket, Key: key }));
    return true;
  } catch {
    return false;
  }
}

async function uploadToR2(key, body, contentType, skipIfExists = true) {
  if (skipIfExists && (await r2Exists(key))) {
    return `${R2_CONFIG.publicBase}/${key}`;
  }
  await s3.send(
    new PutObjectCommand({
      Bucket: R2_CONFIG.bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000',
    })
  );
  return `${R2_CONFIG.publicBase}/${key}`;
}

function detectAudioExt(buf, mimeHint) {
  if (buf.slice(0, 3).toString('ascii') === 'ID3' || (buf[0] === 0xff && (buf[1] & 0xe0) === 0xe0)) {
    return { ext: 'mp3', contentType: 'audio/mpeg' };
  }
  if (buf.slice(0, 4).toString('ascii') === 'RIFF') {
    return { ext: 'wav', contentType: 'audio/wav' };
  }
  if (buf.slice(0, 4).toString('ascii') === 'OggS') {
    return { ext: 'ogg', contentType: 'audio/ogg' };
  }
  if (mimeHint && mimeHint.includes('wav')) return { ext: 'wav', contentType: 'audio/wav' };
  if (mimeHint && mimeHint.includes('mp4')) return { ext: 'm4a', contentType: 'audio/mp4' };
  return { ext: 'mp3', contentType: 'audio/mpeg' };
}

function parseFolderMetadata(folderName, mdText, areaName, temaName) {
  let categoria = areaName || 'Direito';
  if (!areaName) {
    if (/^OAB\b/i.test(folderName)) categoria = 'OAB';
    else if (/^TJSP\b/i.test(folderName)) categoria = 'Concursos';
  }

  const gabaritoMatch = folderName.match(/gab\s+([A-E])/i);
  const gabarito = gabaritoMatch ? gabaritoMatch[1].toUpperCase() : null;

  const artigoMatch = folderName.match(/(?:CP|CF|CC|CPC|CPP|CDC)\s+art\.?\s*([0-9º°A-Za-z-]+)/i);
  const artigoRef = artigoMatch ? artigoMatch[0] : (temaName || null);

  const exameMatch = folderName.match(/^(OAB\s+[0-9XVI.]+(?:\s+Q\d+)?|TJSP\s+\d+(?:\s+Q\d+)?)/i);
  const exameRef = exameMatch ? exameMatch[1] : null;

  // Extrai resumo legível do arquivo .md de tratamento
  let resumo = '';
  if (mdText) {
    const lines = mdText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith('#') && !l.startsWith('---') && !l.startsWith('```'));
    resumo = lines.slice(0, 4).join(' ').slice(0, 260);
  }
  if (!resumo && temaName) {
    resumo = `Tema: ${temaName}`;
  }

  // Título limpo sem sufixo "- gab X"
  const titulo = folderName
    .replace(/\s*-\s*gab\s+[A-E]\s*$/i, '')
    .replace(/\s*-\s*vers[aã]o antiga\s*$/i, '')
    .trim();

  return { categoria, gabarito, artigoRef, exameRef, resumo, titulo };
}

async function processFolder(folder, idx, total, areaName = null, temaName = null) {
  const name = folder.name;
  if (/^TESTE\b/i.test(name) || /\(Instagram\)\s*$/i.test(name)) {
    console.log(`[${idx + 1}/${total}] Ignorando (teste/duplicata): ${name}`);
    return null;
  }

  const slug = slugify([areaName, temaName, name].filter(Boolean).join(' '));
  const subfolders = await listDriveFolder(folder.id);
  const filmeDir = subfolders.find((s) => s.name.startsWith('01'));
  const audiosDir = subfolders.find((s) => s.name.startsWith('02'));
  const descDir = subfolders.find((s) => s.name.startsWith('03'));
  const capaDir = subfolders.find((s) => s.name.startsWith('04'));

  if (!filmeDir) {
    console.log(`[${idx + 1}/${total}] Sem 01 - Filme: ${name}`);
    return null;
  }

  const filmeFiles = await listDriveFolder(filmeDir.id);
  const htmlFile = filmeFiles.find((f) => f.name.toLowerCase().endsWith('.html'));
  if (!htmlFile) {
    console.log(`[${idx + 1}/${total}] Sem HTML exportado em 01 - Filme: ${name}`);
    return null;
  }

  console.log(`[${idx + 1}/${total}] Processando: ${name} (${slug})`);

  // 1. Baixa HTML
  const htmlBuf = await downloadDriveFileBuffer(htmlFile.id);
  let html = htmlBuf.toString('utf8');

  // 2. Extrai áudios embutidos em base64 e envia para o R2
  const dataUriRegex = /data:(application\/octet-stream|audio\/[a-z0-9.+-]+);base64,([A-Za-z0-9+/=\s]+)/gi;
  const hashToUrl = new Map();
  const audiosR2Urls = [];
  const matches = [...html.matchAll(dataUriRegex)];

  let audioCount = 0;
  for (const m of matches) {
    const fullMatch = m[0];
    const mimeHint = m[1];
    const b64Clean = m[2].replace(/\s+/g, '');
    if (b64Clean.length < 200) continue; // ignora placeholders minúsculos

    const buf = Buffer.from(b64Clean, 'base64');
    // Verifica se é áudio real (ID3 / MP3 / RIFF / OggS ou mime audio/*)
    const isAudioHeader =
      mimeHint.startsWith('audio/') ||
      buf.slice(0, 3).toString('ascii') === 'ID3' ||
      (buf[0] === 0xff && (buf[1] & 0xe0) === 0xe0) ||
      buf.slice(0, 4).toString('ascii') === 'RIFF' ||
      buf.slice(0, 4).toString('ascii') === 'OggS';

    if (!isAudioHeader) continue;

    const hash = crypto.createHash('md5').update(buf).digest('hex').slice(0, 12);
    let r2Url = hashToUrl.get(hash);
    if (!r2Url) {
      audioCount += 1;
      const { ext, contentType } = detectAudioExt(buf, mimeHint);
      const r2Key = `animacoes/${slug}/audios/faixa-${audioCount}-${hash}.${ext}`;
      r2Url = await uploadToR2(r2Key, buf, contentType, true);
      hashToUrl.set(hash, r2Url);
      audiosR2Urls.push(r2Url);
    }

    html = html.split(fullMatch).join(r2Url);
  }

  // 3. Baixa áudios separados de 02 - Áudios (se houver)
  if (audiosDir) {
    const audioFiles = await listDriveFolder(audiosDir.id);
    for (const af of audioFiles) {
      if (/\.(mp3|wav|ogg|m4a)$/i.test(af.name)) {
        const aBuf = await downloadDriveFileBuffer(af.id);
        const { ext, contentType } = detectAudioExt(aBuf, af.mime);
        const safeName = slugify(af.name.replace(/\.[^.]+$/, '')) + '.' + ext;
        const r2Key = `animacoes/${slug}/audios/${safeName}`;
        const r2Url = await uploadToR2(r2Key, aBuf, contentType, true);
        if (!audiosR2Urls.includes(r2Url)) audiosR2Urls.push(r2Url);
      }
    }
  }

  // 4. Sobe HTML otimizado para o R2 (sempre atualiza caso tenhamos substituído base64 por R2)
  const htmlKey = `animacoes/${slug}/index.html`;
  const htmlR2Url = await uploadToR2(htmlKey, Buffer.from(html, 'utf8'), 'text/html; charset=utf-8', false);

  // 5. Baixa descrição / tratamento (.md / .txt)
  let tratamentoMd = '';
  if (descDir) {
    const descFiles = await listDriveFolder(descDir.id);
    const mdFile = descFiles.find((f) => /\.(md|txt)$/i.test(f.name));
    if (mdFile) {
      const mdBuf = await downloadDriveFileBuffer(mdFile.id);
      tratamentoMd = mdBuf.toString('utf8');
    }
  }

  // 5b. Baixa capa de 04 - Capa (se houver) e sobe para o R2 em WebP quando possível
  let capaR2Url = null;
  if (capaDir) {
    const capaFiles = await listDriveFolder(capaDir.id);
    const capaFile = capaFiles.find((f) => /\.(png|jpe?g|webp)$/i.test(f.name) || f.mime.startsWith('image/'));
    if (capaFile) {
      let capaBuf = await downloadDriveFileBuffer(capaFile.id);
      let capaExt = (capaFile.name.match(/\.([a-z0-9]+)$/i)?.[1] || 'png').toLowerCase();
      let capaMime = capaExt === 'webp' ? 'image/webp' : capaExt === 'jpg' || capaExt === 'jpeg' ? 'image/jpeg' : 'image/png';
      try {
        const sharp = require('sharp');
        capaBuf = await sharp(capaBuf).resize({ width: 960, withoutEnlargement: true }).webp({ quality: 84 }).toBuffer();
        capaExt = 'webp';
        capaMime = 'image/webp';
      } catch {
        // fallback para formato original caso sharp não esteja instalado
      }
      const capaKey = `animacoes/${slug}/capa.${capaExt}`;
      capaR2Url = await uploadToR2(capaKey, capaBuf, capaMime, false);
    }
  }

  const meta = parseFolderMetadata(name, tratamentoMd, areaName, temaName);
  const titleTagMatch = html.match(/<title>(.*?)<\/title>/i);
  const tituloHtml = titleTagMatch ? titleTagMatch[1].trim() : meta.titulo;

  return {
    slug,
    titulo: meta.titulo,
    tituloHtml,
    categoria: meta.categoria,
    gabarito: meta.gabarito,
    artigoRef: meta.artigoRef,
    exameRef: meta.exameRef,
    resumo: meta.resumo,
    tratamentoMd: tratamentoMd.slice(0, 12000),
    htmlR2Url,
    capaR2Url,
    audiosR2Urls,
    totalAudios: audiosR2Urls.length,
    driveFolderId: folder.id,
  };
}

async function collectCaseFolders(folderId, areaName = null, temaName = null, depth = 0) {
  const items = await listDriveFolder(folderId);
  const subdirs = items.filter((i) => i.mime.includes('folder'));
  const hasFilme = subdirs.some((s) => s.name.startsWith('01'));
  if (hasFilme) {
    return [{ folder: { id: folderId, name: temaName || areaName || 'Animacao' }, areaName, temaName: null }];
  }

  const cases = [];
  for (const sub of subdirs) {
    if (depth === 0) {
      const children = await collectCaseFolders(sub.id, sub.name, null, 1);
      cases.push(...children);
    } else if (depth === 1) {
      const subItems = await listDriveFolder(sub.id);
      const subSubdirs = subItems.filter((i) => i.mime.includes('folder'));
      if (subSubdirs.some((s) => s.name.startsWith('01'))) {
        cases.push({ folder: sub, areaName, temaName: sub.name });
      } else {
        for (const c of subSubdirs) {
          cases.push({ folder: c, areaName, temaName: sub.name });
        }
      }
    }
  }
  return cases;
}

async function main() {
  const cases = await collectCaseFolders(ROOT_FOLDER_ID);
  console.log(`Encontrados ${cases.length} casos de animação no Drive.`);

  const catalog = [];
  for (let i = 0; i < cases.length; i++) {
    const { folder, areaName, temaName } = cases[i];
    try {
      const entry = await processFolder(folder, i, cases.length, areaName, temaName);
      if (entry) catalog.push(entry);
    } catch (err) {
      console.error(`Erro em ${folder.name}:`, err.message);
    }
  }

  const outPath = path.join(process.cwd(), 'src', 'data', 'animacoesCatalog.json');
  fs.writeFileSync(outPath, JSON.stringify(catalog, null, 2), 'utf8');
  console.log(`\nConcluído! ${catalog.length} animações salvas em ${outPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
