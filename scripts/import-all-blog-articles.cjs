const fs = require('fs');
const JSZip = require('jszip');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { createClient } = require('@supabase/supabase-js');

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

// Configurações do Supabase
const envContent = fs.readFileSync('.env', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
  }
});
const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY);

const PROGRESS_FILE = 'scripts/blog_import_progress.json';

function getProgress() {
  if (fs.existsSync(PROGRESS_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));
    } catch {
      return { completed: {}, errors: {} };
    }
  }
  return { completed: {}, errors: {} };
}

function saveProgress(prog) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(prog, null, 2), 'utf8');
}

function slugify(text) {
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function mapCategory(folderName, parentFolderName) {
  const clean = folderName.trim();
  if (clean.includes('Direito Administrativo')) return 'Direito Administrativo';
  if (clean.includes('Direito Civil')) return 'Direito Civil';
  if (clean.includes('Direito Constitucional')) return 'Direito Constitucional';
  if (clean.includes('Direito do Trabalho')) return 'Direito do Trabalho';
  if (clean.includes('Direito Penal')) return 'Direito Penal';
  if (clean.includes('Direito Processual')) return 'Direito Processual';
  if (clean.includes('Direito Tributário')) return 'Direito Tributário';
  if (clean.includes('Filosofia do Direito') || clean.includes('Filosofia')) return 'Filosofia do Direito';
  if (clean.includes('Leis - Conceitos Fundamentais')) return 'Leis - Conceitos Fundamentais';
  if (clean.includes('Senado Federal e Instituições')) return 'Senado Federal';
  if (clean.includes('01 - Leis')) return 'Estrutura de Leis';
  if (clean.includes('02 - Processo legislativo')) return 'Processo Legislativo';
  if (clean.includes('03 - Senado Federal')) return 'Senado Federal';
  if (clean.includes('04 - Câmara dos Deputados')) return 'Câmara dos Deputados';
  if (clean.includes('05 - STF')) return 'STF';
  if (clean.includes('Teste de estilos')) return 'Leis';
  return clean;
}

async function downloadDriveFile(driveId, retries = 3) {
  const urls = [
    `https://drive.usercontent.google.com/download?id=${driveId}&export=download&authuser=0`,
    `https://drive.google.com/uc?export=download&id=${driveId}`
  ];

  for (let attempt = 1; attempt <= retries; attempt++) {
    for (const url of urls) {
      try {
        const res = await fetch(url, {
          signal: AbortSignal.timeout(15000),
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          }
        });
        if (res.ok) {
          const ab = await res.arrayBuffer();
          return Buffer.from(ab);
        }
      } catch (err) {
        // timeout ou falha de conexão, continua
      }
    }
    await new Promise(r => setTimeout(r, 1000 * attempt));
  }
  throw new Error(`Falha ao baixar arquivo Google Drive ${driveId}`);
}

async function parseDocx(buf, defaultCategory) {
  const zip = await JSZip.loadAsync(buf);
  const mediaFiles = Object.keys(zip.files).filter(f => f.startsWith('word/media/'));

  const images = [];
  for (const m of mediaFiles) {
    try {
      const data = await zip.files[m].async('nodebuffer');
      const ext = m.split('.').pop().toLowerCase();
      images.push({
        name: m.split('/').pop(),
        ext,
        contentType: ext === 'png' ? 'image/png' : ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/webp',
        data
      });
    } catch {}
  }

  let title = '';
  let category = defaultCategory;
  const paragraphs = [];
  let totalWords = 0;

  if (zip.files['word/document.xml']) {
    const xml = await zip.files['word/document.xml'].async('text');
    const pTags = xml.match(/<w:p(?:\s|>).*?<\/w:p>/g) || [];

    for (const p of pTags) {
      const isH1 = p.includes('w:val="Heading1"') || p.includes('w:val="Title"');
      const isH2 = p.includes('w:val="Heading2"');
      const isH3 = p.includes('w:val="Heading3"');

      const tMatches = p.match(/<w:t(?:\s|>).*?<\/w:t>/g) || [];
      const text = tMatches.map(t => t.replace(/<[^>]+>/g, '')).join('').trim();
      if (!text) continue;

      totalWords += text.split(/\s+/).length;

      if (!title && !text.toLowerCase().startsWith('categoria:')) {
        title = text;
        continue;
      }

      if (text.toLowerCase().startsWith('categoria:')) {
        const catMatch = text.replace(/^categoria:\s*/i, '').trim();
        if (catMatch) category = mapCategory(catMatch, defaultCategory);
        continue;
      }

      if (isH1) {
        paragraphs.push(`\n## ${text}\n`);
      } else if (isH2) {
        paragraphs.push(`\n### ${text}\n`);
      } else if (isH3) {
        paragraphs.push(`\n#### ${text}\n`);
      } else {
        paragraphs.push(text);
      }
    }
  }

  const validParas = paragraphs.filter(p => !p.startsWith('#'));
  const resumo = validParas.length > 0
    ? validParas[0].slice(0, 260) + (validParas[0].length > 260 ? '...' : '')
    : `Artigo completo sobre ${title} com análises práticas e exemplos jurídicos.`;

  const readingTime = Math.max(2, Math.round(totalWords / 160));

  return {
    title,
    resumo,
    category,
    conteudoMd: paragraphs.join('\n\n'),
    readingTime,
    images
  };
}

async function uploadImageToR2(slug, img) {
  const r2Key = `blog/imagens/${slug}/${img.name}`;
  await s3.send(new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: r2Key,
    Body: img.data,
    ContentType: img.contentType
  }));
  return `${R2_PUBLIC_BASE}/${r2Key}`;
}

async function upsertWithRetry(row, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const { error } = await supabase.from('blog_edicao_posts').upsert([row]);
    if (!error) return;
    if (attempt === maxRetries) {
      throw new Error(`Supabase Upsert: ${error.message}`);
    }
    await new Promise(r => setTimeout(r, 1200 * attempt));
  }
}

async function main() {
  console.log('=== Iniciando Importação Robusta de Artigos para R2 e Supabase ===');

  const scanData = JSON.parse(fs.readFileSync('scripts/blog_drive_scan.json', 'utf8'));
  const progress = getProgress();

  // Coletar todos os arquivos docx
  const allFiles = [];
  for (const entry of scanData) {
    const parentName = entry.scan.title || entry.folderMeta.name;
    for (const sub of entry.scan.subfolders) {
      const cat = mapCategory(sub.path || sub.title, parentName);
      const docxList = sub.files.filter(f => f.name.toLowerCase().endsWith('.docx') || f.name.toLowerCase().endsWith('.doc'));
      for (const f of docxList) {
        allFiles.push({
          id: f.id,
          name: f.name,
          category: cat,
          parent: parentName
        });
      }
    }
  }

  console.log(`Total de arquivos mapeados: ${allFiles.length}`);
  // Pegar os que ainda não foram completados com sucesso
  const pendentes = allFiles.filter(f => !progress.completed[f.id]);
  console.log(`Já concluídos anteriormente: ${Object.keys(progress.completed).length}`);
  console.log(`Restantes para processar: ${pendentes.length}\n`);

  let count = Object.keys(progress.completed).length;
  const startTime = Date.now();

  async function processFile(fileItem) {
    try {
      // 1. Download docx
      const buf = await downloadDriveFile(fileItem.id);

      // 2. Parse docx
      const parsed = await parseDocx(buf, fileItem.category);
      const rawTitle = parsed.title || fileItem.name.replace(/\.[^.]+$/, '').replace(/^[0-9]+[\s\-_]*/, '');
      const cleanTitle = rawTitle.replace(/^[0-9]+[\s\-_]*/, '').trim();
      const slugBase = slugify(cleanTitle) || `artigo-${fileItem.id.slice(0, 10)}`;
      const uniqueId = `${slugBase}-${fileItem.id.slice(0, 6)}`;

      // 3. Upload das imagens para o Cloudflare R2
      let capaUrl = '';
      const uploadedImgs = [];

      for (const img of parsed.images) {
        try {
          const url = await uploadImageToR2(slugBase, img);
          uploadedImgs.push({ name: img.name, url });
          if (!capaUrl) capaUrl = url;
        } catch (e) {
          console.error(`Erro ao subir imagem ${img.name}:`, e.message);
        }
      }

      if (!capaUrl) {
        capaUrl = `${R2_PUBLIC_BASE}/blog/capas/padrao-${slugify(fileItem.category)}.webp`;
      }

      let fullContent = parsed.conteudoMd;
      if (uploadedImgs.length > 1) {
        const extraImgs = uploadedImgs.slice(1);
        fullContent += '\n\n---\n\n### Galeria e Esquemas Ilustrativos\n\n' +
          extraImgs.map(im => `![Ilustração](${im.url})`).join('\n\n');
      }

      // 4. Inserção no Supabase com retry automático
      const row = {
        id: uniqueId,
        titulo: cleanTitle,
        resumo: parsed.resumo,
        conteudo_md: fullContent,
        imagem_url: capaUrl,
        categoria: parsed.category || fileItem.category,
        autor: 'Redação Estudos Jurídicos',
        tempo_leitura_min: parsed.readingTime || 4,
        publicado: true,
        data_publicacao: new Date().toISOString()
      };

      await upsertWithRetry(row, 3);

      count++;
      progress.completed[fileItem.id] = { id: uniqueId, titulo: cleanTitle, categoria: row.categoria };
      delete progress.errors[fileItem.id];
      saveProgress(progress);

      const elapsedMin = ((Date.now() - startTime) / 60000).toFixed(1);
      console.log(`[${count}/${allFiles.length}] (${elapsedMin}m) ✓ [${row.categoria}] ${cleanTitle} (${uploadedImgs.length} imagens no R2)`);
    } catch (err) {
      console.error(`✗ Erro em "${fileItem.name}":`, err.message);
      progress.errors[fileItem.id] = err.message;
      saveProgress(progress);
    }
  }

  // Fila de workers resiliente
  const CONCURRENCY = 3;
  const queue = [...pendentes];

  async function worker(workerId) {
    while (queue.length > 0) {
      const item = queue.shift();
      if (!item) break;
      await processFile(item);
    }
  }

  const workers = Array.from({ length: CONCURRENCY }, (_, i) => worker(i + 1));
  await Promise.all(workers);

  // Se restaram erros, faz uma segunda passagem sequencial para garantir 100%
  const failedIds = Object.keys(progress.errors);
  if (failedIds.length > 0) {
    console.log(`\n--- Re-tentando ${failedIds.length} artigos que tiveram erro na primeira passagem ---`);
    for (const fid of failedIds) {
      const item = allFiles.find(f => f.id === fid);
      if (item) {
        console.log(`Retentando: ${item.name}...`);
        await processFile(item);
        await new Promise(r => setTimeout(r, 1000));
      }
    }
  }

  console.log('\n================================================================');
  console.log(`🎉 IMPORTAÇÃO TOTAL CONCLUÍDA!`);
  console.log(`Total processado e ativo no banco: ${Object.keys(progress.completed).length} artigos.`);
  console.log(`Erros finais restantes: ${Object.keys(progress.errors).length}`);
  console.log('================================================================');
}

main().catch(console.error);
