const fs = require('fs');
const JSZip = require('jszip');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { createClient } = require('@supabase/supabase-js');

// Espelhamento de log para o terminal do usuário
const USER_LOG_FILE = 'C:\\Users\\ext_wpereira\\.gemini\\antigravity-ide\\brain\\40b2fe2b-fe10-4513-a17e-0b047c5609ef\\.system_generated\\tasks\\task-1571.log';
const LOCAL_LOG_FILE = 'scripts/import.log';
const origLog = console.log;
const origErr = console.error;
function appendLog(line) {
  try { fs.appendFileSync(USER_LOG_FILE, line + '\n', 'utf8'); } catch {}
  try { fs.appendFileSync(LOCAL_LOG_FILE, line + '\n', 'utf8'); } catch {}
}
console.log = function(...args) {
  origLog.apply(console, args);
  appendLog(args.join(' '));
};
console.error = function(...args) {
  origErr.apply(console, args);
  appendLog('[ERRO] ' + args.join(' '));
};

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

const STAGED_FILE = 'scripts/blog_staged_posts.json';

function getStaged() {
  if (fs.existsSync(STAGED_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(STAGED_FILE, 'utf8'));
    } catch {
      return {};
    }
  }
  return {};
}

function saveStaged(data) {
  fs.writeFileSync(STAGED_FILE, JSON.stringify(data, null, 2), 'utf8');
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
      } catch (err) {}
    }
    await new Promise(r => setTimeout(r, 1000 * attempt));
  }
  throw new Error(`Falha ao baixar arquivo Google Drive ${driveId}`);
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

async function parseDocxWithInlineImages(buf, defaultCategory, slug) {
  const zip = await JSZip.loadAsync(buf);

  // 1. Extrair e mapear imagens em word/media/
  const mediaFiles = Object.keys(zip.files).filter(f => f.startsWith('word/media/'));
  const images = [];
  const imgUrlMap = {}; // nome -> URL no R2

  for (const m of mediaFiles) {
    try {
      const data = await zip.files[m].async('nodebuffer');
      const ext = m.split('.').pop().toLowerCase();
      const fileName = m.split('/').pop();
      const contentType = ext === 'png' ? 'image/png' : ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/webp';
      const imgObj = { name: fileName, ext, contentType, data };
      images.push(imgObj);

      const uploadedUrl = await uploadImageToR2(slug, imgObj);
      imgUrlMap[fileName] = uploadedUrl;
    } catch (e) {
      console.error(`Erro ao subir imagem ${m}:`, e.message);
    }
  }

  // 2. Mapear relacionamentos do documento (rId -> image.ext)
  const imgRels = {};
  if (zip.files['word/_rels/document.xml.rels']) {
    const relsXml = await zip.files['word/_rels/document.xml.rels'].async('text');
    const relRegex = /<Relationship[^>]+Id="([^"]+)"[^>]+Target="([^"]+)"/g;
    let m;
    while ((m = relRegex.exec(relsXml)) !== null) {
      if (m[2].includes('media/')) {
        imgRels[m[1]] = m[2].split('/').pop();
      }
    }
  }

  // 3. Percorrer os parágrafos do documento respeitando rigorosamente a ordem
  let title = '';
  let category = defaultCategory;
  let capaUrl = '';
  const markdownBlocks = [];
  let totalWords = 0;

  if (zip.files['word/document.xml']) {
    const docXml = await zip.files['word/document.xml'].async('text');
    const pTags = docXml.match(/<w:p(?:\s|>).*?<\/w:p>/g) || [];

    for (let i = 0; i < pTags.length; i++) {
      const p = pTags[i];

      // Detectar se há imagens desenhadas neste parágrafo
      const blipMatches = [];
      const blipRegex = /(?:r:embed|r:id)="([^"]+)"/g;
      let bm;
      while ((bm = blipRegex.exec(p)) !== null) {
        if (imgRels[bm[1]]) {
          blipMatches.push(imgRels[bm[1]]);
        }
      }

      // Inserir imagens inline no exato local
      if (blipMatches.length > 0) {
        for (const imgFileName of blipMatches) {
          const url = imgUrlMap[imgFileName];
          if (!url) continue;

          if (!capaUrl) {
            capaUrl = url; // Primeira imagem do artigo é a capa
          } else {
            // Verificar se o próximo parágrafo é uma legenda
            let caption = '';
            if (i + 1 < pTags.length) {
              const nextP = pTags[i + 1];
              const isNextHeading = nextP.includes('w:val="Heading');
              const hasNextDrawing = nextP.includes('<w:drawing');
              const nextText = (nextP.match(/<w:t(?:\s|>).*?<\/w:t>/g) || [])
                .map(t => t.replace(/<[^>]+>/g, ''))
                .join('')
                .trim();

              if (!isNextHeading && !hasNextDrawing && nextText && nextText.length < 180) {
                const isItalicOrCenter = nextP.includes('<w:i/>') || nextP.includes('<w:jc w:val="center"/>');
                if (isItalicOrCenter || nextText.toLowerCase().startsWith('figura') || nextText.toLowerCase().startsWith('esquema')) {
                  caption = nextText;
                  i++; // Consumir parágrafo de legenda
                }
              }
            }

            if (caption) {
              markdownBlocks.push(`\n\n![${caption}](${url})\n*${caption}*\n\n`);
            } else {
              markdownBlocks.push(`\n\n![Ilustração](${url})\n\n`);
            }
          }
        }
      }

      // Extrair texto do parágrafo
      const tMatches = p.match(/<w:t(?:\s|>).*?<\/w:t>/g) || [];
      const text = tMatches.map(t => t.replace(/<[^>]+>/g, '')).join('').trim();
      if (!text) continue;

      totalWords += text.split(/\s+/).length;

      // Categoria explícita
      if (text.toLowerCase().startsWith('categoria:')) {
        const catMatch = text.replace(/^categoria:\s*/i, '').trim();
        if (catMatch) category = mapCategory(catMatch, defaultCategory);
        continue;
      }

      // Título principal do artigo
      if (!title && !text.toLowerCase().startsWith('palavras-chave:')) {
        title = text;
        continue;
      }

      const isH1 = p.includes('w:val="Heading1"') || p.includes('w:val="Title"');
      const isH2 = p.includes('w:val="Heading2"');
      const isH3 = p.includes('w:val="Heading3"');

      if (isH1) {
        markdownBlocks.push(`\n## ${text}\n`);
      } else if (isH2) {
        markdownBlocks.push(`\n### ${text}\n`);
      } else if (isH3) {
        markdownBlocks.push(`\n#### ${text}\n`);
      } else {
        markdownBlocks.push(text);
      }
    }
  }

  // Fallback de capa caso o artigo não tivesse imagem embutida
  if (!capaUrl) {
    capaUrl = `${R2_PUBLIC_BASE}/blog/capas/padrao-${slugify(category)}.webp`;
  }

  const validParas = markdownBlocks.filter(b => !b.startsWith('#') && !b.startsWith('!['));
  const resumo = validParas.length > 0
    ? validParas[0].slice(0, 260) + (validParas[0].length > 260 ? '...' : '')
    : `Artigo completo sobre ${title} com análises práticas e exemplos jurídicos.`;

  const readingTime = Math.max(2, Math.round(totalWords / 160));

  return {
    title,
    category,
    capaUrl,
    resumo,
    readingTime,
    imagesCount: images.length,
    conteudoMd: markdownBlocks.join('\n\n')
  };
}

async function main() {
  console.log('========================================================================');
  console.log('  IMPORTAÇÃO DE ARTIGOS COM POSICIONAMENTO 100% INLINE DE IMAGENS');
  console.log('========================================================================\n');

  const scanData = JSON.parse(fs.readFileSync('scripts/blog_drive_scan.json', 'utf8'));
  
  // Limpar staged anterior para refazer com ordem inline garantida
  const staged = {};

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

  console.log(`Total de artigos a processar com imagens inline: ${allFiles.length}`);

  let count = 0;
  const startTime = Date.now();

  async function processOne(fileItem) {
    try {
      const rawTitle = fileItem.name.replace(/\.[^.]+$/, '').replace(/^[0-9]+[\s\-_]*/, '');
      const cleanTitle = rawTitle.replace(/^[0-9]+[\s\-_]*/, '').trim();
      const slugBase = slugify(cleanTitle) || `artigo-${fileItem.id.slice(0, 10)}`;
      const uniqueId = `${slugBase}-${fileItem.id.slice(0, 6)}`;

      const buf = await downloadDriveFile(fileItem.id);
      const parsed = await parseDocxWithInlineImages(buf, fileItem.category, slugBase);

      const finalTitle = parsed.title || cleanTitle;

      const row = {
        id: uniqueId,
        titulo: finalTitle,
        resumo: parsed.resumo,
        conteudo_md: parsed.conteudoMd,
        imagem_url: parsed.capaUrl,
        categoria: parsed.category || fileItem.category,
        autor: 'Redação Estudos Jurídicos',
        tempo_leitura_min: parsed.readingTime || 4,
        publicado: true,
        data_publicacao: new Date().toISOString()
      };

      staged[fileItem.id] = row;
      saveStaged(staged);

      count++;
      const elapsedMin = ((Date.now() - startTime) / 60000).toFixed(1);
      console.log(`[${count}/${allFiles.length}] (${elapsedMin}m) ✓ [${row.categoria}] ${finalTitle} (${parsed.imagesCount} imgs inline no R2)`);
    } catch (err) {
      console.error(`✗ Erro em "${fileItem.name}":`, err.message);
    }
  }

  // 4 workers paralelos
  const CONCURRENCY = 4;
  const queue = [...allFiles];

  async function worker() {
    while (queue.length > 0) {
      const item = queue.shift();
      if (!item) break;
      await processOne(item);
    }
  }

  const workers = Array.from({ length: CONCURRENCY }, () => worker());
  await Promise.all(workers);

  console.log('\n========================================================================');
  console.log(`🎉 FASE 1 CONCLUÍDA: ${Object.keys(staged).length} ARTIGOS FORMATADOS COM IMAGENS INLINE!`);
  console.log('========================================================================\n');

  // Fase 2: Batch Insert no Supabase
  console.log('=== Fase 2: Gravando Artigos no Supabase ===');
  const allRows = Object.values(staged);
  const BATCH_SIZE = 20;
  let inserted = 0;

  for (let i = 0; i < allRows.length; i += BATCH_SIZE) {
    const chunk = allRows.slice(i, i + BATCH_SIZE);
    let success = false;
    for (let attempt = 1; attempt <= 4; attempt++) {
      try {
        const { error } = await supabase.from('blog_edicao_posts').upsert(chunk);
        if (!error) {
          success = true;
          inserted += chunk.length;
          console.log(`[${inserted}/${allRows.length}] Lote gravado no Supabase com sucesso.`);
          break;
        } else {
          console.warn(`Tentativa ${attempt} falhou no lote ${i}:`, error.message);
        }
      } catch (e) {
        console.warn(`Tentativa ${attempt} erro:`, e.message);
      }
      await new Promise(r => setTimeout(r, 2000 * attempt));
    }
    if (!success) {
      console.error(`Falha no lote a partir de ${i}`);
    }
    await new Promise(r => setTimeout(r, 300));
  }

  console.log('\n========================================================================');
  console.log(`🎉 IMPORTAÇÃO 100% FINALIZADA!`);
  console.log(`Total de artigos ativos no Supabase com imagens inline: ${inserted}`);
  console.log('========================================================================');
}

main().catch(console.error);
