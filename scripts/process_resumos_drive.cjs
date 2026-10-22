const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

// Configurações do R2
const s3 = new S3Client({
  region: 'auto',
  endpoint: 'https://f654819db5e99f6d7f9475abf6e3f834.r2.cloudflarestorage.com',
  credentials: {
    accessKeyId: '199f43b3ef1e89db1506e45430cb4660',
    secretAccessKey: '6ac079b15bc8f24d9bbeacdf5bbb7ad9ead1b1caa96eafe1ba1b75d15200c6bc'
  }
});
const R2_BUCKET = 'estudos-juridicos-midias';
const R2_PUBLIC_BASE = 'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev';

// Função para fazer upload de buffer para o R2
async function uploadToR2(key, buffer, contentType) {
  await s3.send(new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType
  }));
  return `${R2_PUBLIC_BASE}/${key}`;
}

// Utilitário para slugify
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Download de arquivo do Drive por ID com retry
async function downloadDriveFile(id, retries = 3) {
  const url = `https://drive.google.com/uc?export=download&id=${id}`;
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
      });
      if (res.ok) {
        return Buffer.from(await res.arrayBuffer());
      }
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise(r => setTimeout(r, 1500));
    }
  }
  throw new Error(`Falha ao baixar arquivo ${id}`);
}

// Lista arquivos de pasta do Drive
async function listDriveFolder(folderId) {
  const url = `https://drive.google.com/embeddedfolderview?id=${folderId}#list`;
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } });
  const html = await res.text();
  
  const entries = [];
  const regex = /<a[^>]+href="([^"]+)"[^>]*>(.*?)<\/a>/gi;
  let m;
  while ((m = regex.exec(html)) !== null) {
    const href = m[1];
    const text = m[2].replace(/<[^>]+>/g, '').trim();
    if (href.includes('drive.google.com') || href.includes('file')) {
      const idMatch = href.match(/\/d\/([a-zA-Z0-9_-]+)/);
      if (idMatch) {
        entries.push({ id: idMatch[1], name: text });
      }
    }
  }
  return entries;
}

// Processa um .docx e extrai capítulos estruturados com imagens
async function processDocxBuffer(docxBuffer, areaSlug, temaSlug) {
  const zip = await JSZip.loadAsync(docxBuffer);
  
  // Extrai imagens de word/media/
  const imageR2Urls = {};
  const mediaFiles = Object.keys(zip.files).filter(k => k.startsWith('word/media/'));
  
  for (const mediaPath of mediaFiles) {
    const filename = path.basename(mediaPath);
    const imgData = await zip.file(mediaPath).async('nodebuffer');
    const ext = path.extname(filename).toLowerCase().replace('.', '') || 'png';
    const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : ext === 'webp' ? 'image/webp' : 'image/png';
    const r2Key = `resumos/imagens/${areaSlug}/${temaSlug}/${filename}`;
    
    try {
      const publicUrl = await uploadToR2(r2Key, imgData, mime);
      imageR2Urls[filename] = publicUrl;
    } catch (e) {
      console.error(`Erro ao subir imagem ${filename}:`, e.message);
    }
  }

  // Carrega document.xml e rels
  const docXml = await zip.file('word/document.xml').async('text');
  let relsXml = '';
  if (zip.file('word/_rels/document.xml.rels')) {
    relsXml = await zip.file('word/_rels/document.xml.rels').async('text');
  }

  const relsMap = {};
  const relRegex = /Id="([^"]+)"[^>]+Target="media\/([^"]+)"/g;
  let rm;
  while ((rm = relRegex.exec(relsXml)) !== null) {
    relsMap[rm[1]] = rm[2];
  }

  // Extrai parágrafos
  const pRegex = /<w:p\b[^>]*>([\s\S]*?)<\/w:p>/g;
  let pm;
  const rawParagraphs = [];

  while ((pm = pRegex.exec(docXml)) !== null) {
    const pContent = pm[1];
    const blipMatch = pContent.match(/r:embed="([^"]+)"/);
    const imageFile = blipMatch ? relsMap[blipMatch[1]] : null;
    const textMatches = pContent.match(/<w:t\b[^>]*>(.*?)<\/w:t>/g) || [];
    const text = textMatches.map(t => t.replace(/<[^>]+>/g, '')).join('').trim();
    rawParagraphs.push({ text, image: imageFile });
  }

  // Identifica capítulos
  const chapters = [];
  const chapterStarts = [];

  for (let i = 0; i < rawParagraphs.length; i++) {
    const p = rawParagraphs[i];
    const match = p.text.match(/^CAPÍTULO\s+(\d+)\s+[•\-–]\s+(.*)$/i);
    if (match) {
      const num = parseInt(match[1], 10);
      const subheader = match[2].trim();
      const titulo = rawParagraphs[i + 1]?.text || `Capítulo ${num}`;
      const subtitulo = rawParagraphs[i + 2]?.text || '';
      chapterStarts.push({
        pIndex: i,
        numero: num,
        subheader,
        titulo,
        subtitulo
      });
    }
  }

  // Monta Markdown de cada capítulo
  for (let cIdx = 0; cIdx < chapterStarts.length; cIdx++) {
    const curr = chapterStarts[cIdx];
    const next = chapterStarts[cIdx + 1];
    const startP = curr.pIndex;
    const endP = next ? next.pIndex : rawParagraphs.length;

    // Encontra imagem do capítulo (geralmente nos primeiros 4 parágrafos do capítulo)
    let chapterImgUrl = null;
    for (let j = startP; j < Math.min(startP + 8, endP); j++) {
      if (rawParagraphs[j].image && imageR2Urls[rawParagraphs[j].image]) {
        chapterImgUrl = imageR2Urls[rawParagraphs[j].image];
        break;
      }
    }

    const lines = [];
    lines.push(`# ${curr.numero.toString().padStart(2, '0')}. ${curr.titulo}`);
    if (curr.subtitulo) {
      lines.push(`*${curr.subtitulo}*`);
      lines.push('');
    }

    if (chapterImgUrl) {
      lines.push(`![${curr.titulo}](${chapterImgUrl})`);
      lines.push('');
    }

    let currentSection = '';

    for (let pIdx = startP + 3; pIdx < endP; pIdx++) {
      const p = rawParagraphs[pIdx];
      if (!p.text && !p.image) continue;

      // Se for outra imagem no meio do texto
      if (p.image && imageR2Urls[p.image] && imageR2Urls[p.image] !== chapterImgUrl) {
        lines.push(`![Ilustração explicativa](${imageR2Urls[p.image]})`);
        lines.push('');
        continue;
      }

      const t = p.text;
      if (!t) continue;

      if (['Em linguagem simples', 'Para entender melhor', 'De olho na prova', 'Exemplo prático', 'Ficha do crime', 'Para guardar'].includes(t)) {
        currentSection = t;
        lines.push('');
        if (t === 'De olho na prova') lines.push(`### 🎯 ${t}`);
        else if (t === 'Exemplo prático') lines.push(`### 💡 ${t}`);
        else if (t === 'Ficha do crime') lines.push(`### 📋 ${t}`);
        else if (t === 'Para guardar') lines.push(`### 📌 ${t}`);
        else lines.push(`### ${t}`);
        lines.push('');
        continue;
      }

      if (t.startsWith('⚠')) {
        lines.push('> [!WARNING]');
        lines.push(`> **${t.replace(/^⚠\s*/, '')}**`);
        lines.push('');
        continue;
      }

      if (t.startsWith('✓')) {
        lines.push(`- **${t.replace(/^✓\s*/, '')}**`);
        continue;
      }

      lines.push(t);
      lines.push('');
    }

    chapters.push({
      numero: curr.numero,
      titulo: `${curr.numero.toString().padStart(2, '0')}. ${curr.titulo}`,
      subtitulo: curr.subtitulo,
      markdown: lines.join('\n').trim(),
      imageUrl: chapterImgUrl
    });
  }

  return chapters;
}

// Processa um tema completo (Docx + Áudios)
async function processTheme(areaName, docxItem, audioFolderItem) {
  const areaSlug = slugify(areaName);
  const cleanTemaName = docxItem.name.replace(/^[\d\s\-]+resumo\s*[-–]\s*/i, '').replace(/\.docx$/i, '');
  const temaSlug = slugify(cleanTemaName);

  console.log(`\n==================================================`);
  console.log(`PROCESSANDO TEMA: [${cleanTemaName}]`);
  console.log(`Área: ${areaName}`);
  console.log(`==================================================`);

  // 1. Baixa o .docx do Google Drive
  console.log(`Baixando .docx do Drive (id: ${docxItem.id})...`);
  const docxBuffer = await downloadDriveFile(docxItem.id);
  console.log(`Docx baixado: ${docxBuffer.length} bytes`);

  // 2. Extrai imagens e capítulos
  console.log(`Extraindo imagens e capítulos do Word...`);
  const chapters = await processDocxBuffer(docxBuffer, areaSlug, temaSlug);
  console.log(`Total de capítulos extraídos: ${chapters.length}`);

  // 3. Baixa e sobe os áudios correspondentes
  const audioMap = {};
  if (audioFolderItem && audioFolderItem.id) {
    console.log(`Listando arquivos de áudio na pasta [${audioFolderItem.name}]...`);
    const audioFiles = await listDriveFolder(audioFolderItem.id);
    console.log(`Encontrados ${audioFiles.length} arquivos de áudio`);

    for (const af of audioFiles) {
      if (!af.name.endsWith('.mp3')) continue;
      // Extrai número do capítulo do nome do arquivo (ex: cap01-..., cap12-...)
      const numMatch = af.name.match(/cap0?(\d+)/i);
      const capNum = numMatch ? parseInt(numMatch[1], 10) : null;

      console.log(`Baixando áudio: ${af.name} (Capítulo ${capNum})...`);
      try {
        const audioBuf = await downloadDriveFile(af.id);
        const r2Key = `resumos/audio/${areaSlug}/${temaSlug}/${af.name}`;
        const audioUrl = await uploadToR2(r2Key, audioBuf, 'audio/mpeg');
        console.log(`  -> Áudio enviado para R2: ${audioUrl}`);
        if (capNum != null) {
          audioMap[capNum] = audioUrl;
        }
      } catch (e) {
        console.error(`Erro ao processar áudio ${af.name}:`, e.message);
      }
    }
  }

  // 4. Vincula o áudio ao Markdown do capítulo
  const subtemas = [];
  for (const c of chapters) {
    const audioUrl = audioMap[c.numero] || null;
    let finalMarkdown = c.markdown;
    if (audioUrl) {
      finalMarkdown = `<!-- audio: ${audioUrl} -->\n\n` + finalMarkdown;
    }

    subtemas.push({
      id: `${areaSlug}_${temaSlug}_cap${c.numero}`,
      subtema: c.titulo,
      ordem: c.numero,
      markdown: finalMarkdown,
      audio_url: audioUrl,
      imageUrl: c.imageUrl
    });
  }

  return {
    tema: cleanTemaName,
    total: subtemas.length,
    subtemas
  };
}

module.exports = {
  processTheme,
  slugify,
  uploadToR2
};
