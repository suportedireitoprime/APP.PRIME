const fs = require('fs');
const JSZip = require('jszip');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { createClient } = require('@supabase/supabase-js');

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

const envContent = fs.readFileSync('.env', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
  }
});
const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY);

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

async function parseDocx(buf, defaultCategory = 'Leis') {
  const zip = await JSZip.loadAsync(buf);
  const mediaFiles = Object.keys(zip.files).filter(f => f.startsWith('word/media/'));
  
  const images = [];
  for (const m of mediaFiles) {
    const data = await zip.files[m].async('nodebuffer');
    const ext = m.split('.').pop().toLowerCase();
    images.push({
      originalPath: m,
      name: m.split('/').pop(),
      ext,
      contentType: ext === 'png' ? 'image/png' : ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/webp',
      data
    });
  }

  // Parse document.xml
  let title = '';
  let subtitle = '';
  let category = defaultCategory;
  const paragraphs = [];

  if (zip.files['word/document.xml']) {
    const xml = await zip.files['word/document.xml'].async('text');
    const pTags = xml.match(/<w:p(?:\s|>).*?<\/w:p>/g) || [];

    for (const p of pTags) {
      // Verificar se é heading
      const isH1 = p.includes('w:val="Heading1"') || p.includes('w:val="Title"');
      const isH2 = p.includes('w:val="Heading2"');
      const isH3 = p.includes('w:val="Heading3"');
      
      const tMatches = p.match(/<w:t(?:\s|>).*?<\/w:t>/g) || [];
      const text = tMatches.map(t => t.replace(/<[^>]+>/g, '')).join('').trim();
      if (!text) continue;

      if (!title && !text.toLowerCase().startsWith('categoria:')) {
        title = text;
        continue;
      }

      if (text.toLowerCase().startsWith('categoria:')) {
        const catMatch = text.replace(/^categoria:\s*/i, '').trim();
        if (catMatch) category = catMatch;
        continue;
      }

      if (isH1) {
        paragraphs.push(`\n# ${text}\n`);
      } else if (isH2) {
        paragraphs.push(`\n## ${text}\n`);
      } else if (isH3) {
        paragraphs.push(`\n### ${text}\n`);
      } else {
        paragraphs.push(text);
      }
    }
  }

  // Resumo
  const validParas = paragraphs.filter(p => !p.startsWith('#'));
  const resumo = validParas.length > 0 ? validParas[0].slice(0, 280) + '...' : 'Artigo sobre ' + title;

  return {
    title,
    resumo,
    category,
    paragraphs,
    images
  };
}

async function testPipeline() {
  console.log('--- Testando conversão de sample1.docx ---');
  const buf = fs.readFileSync('scripts/sample1.docx');
  const parsed = await parseDocx(buf, 'Direito Administrativo');
  console.log('Título:', parsed.title);
  console.log('Categoria:', parsed.category);
  console.log('Resumo:', parsed.resumo);
  console.log('Total imagens:', parsed.images.length);

  const slug = slugify(parsed.title || 'direito-administrativo-01');
  console.log('Slug:', slug);

  // Subir uma imagem de teste para o R2
  if (parsed.images.length > 0) {
    const cover = parsed.images[0];
    const r2Key = `blog/imagens/${slug}/${cover.name}`;
    console.log(`Enviando capa para R2: ${r2Key}...`);
    await s3.send(new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: r2Key,
      Body: cover.data,
      ContentType: cover.contentType
    }));
    const r2Url = `${R2_PUBLIC_BASE}/${r2Key}`;
    console.log('URL R2 Capa:', r2Url);

    // Testar fetch da URL pública
    const check = await fetch(r2Url, { method: 'HEAD' });
    console.log('Check HEAD status:', check.status);
  }
}

testPipeline().catch(console.error);
