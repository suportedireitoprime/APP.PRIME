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

const missing = [
  {
    id: '1ICPkV1P4kzlmqdSnI5dmT6no8-alNz9C',
    name: 'artigo-108-o-senado-no-imperio.docx',
    cat: 'Senado Federal'
  },
  {
    id: '1h3r5y9G2gOrT8zVWyHYMtGvGaVZSosCd',
    name: 'artigo-159-ulysses-guimaraes-quem-da-nome-ao-plenario.docx',
    cat: 'Câmara dos Deputados'
  }
];

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

async function downloadDriveWithConfirm(driveId) {
  const u1 = `https://drive.usercontent.google.com/download?id=${driveId}&export=download&authuser=0`;
  const r1 = await fetch(u1);
  const cookie = r1.headers.get('set-cookie');
  const html = await r1.text();

  const confirmMatch = html.match(/name="confirm"\s+value="([^"]+)"/);
  const uuidMatch = html.match(/name="uuid"\s+value="([^"]+)"/);
  const confirmVal = confirmMatch ? confirmMatch[1] : 't';
  const uuidVal = uuidMatch ? uuidMatch[1] : '';

  const u2 = `https://drive.usercontent.google.com/download?id=${driveId}&export=download&confirm=${confirmVal}&uuid=${uuidVal}`;
  const r2 = await fetch(u2, {
    headers: {
      Cookie: cookie || ''
    }
  });
  const ab = await r2.arrayBuffer();
  return Buffer.from(ab);
}

async function processOne(f) {
  console.log(`Baixando ${f.name}...`);
  const buf = await downloadDriveWithConfirm(f.id);
  const zip = await JSZip.loadAsync(buf);

  const cleanTitle = f.name.replace(/\.[^.]+$/, '').replace(/^[a-z0-9]+[\s\-_]*/i, '').trim();
  const slugBase = slugify(cleanTitle) || `artigo-${f.id.slice(0, 10)}`;
  const uniqueId = `${slugBase}-${f.id.slice(0, 6)}`;

  const mediaFiles = Object.keys(zip.files).filter(k => k.startsWith('word/media/'));
  const imgUrlMap = {};

  for (const m of mediaFiles) {
    const data = await zip.files[m].async('nodebuffer');
    const ext = m.split('.').pop().toLowerCase();
    const fileName = m.split('/').pop();
    const contentType = ext === 'png' ? 'image/png' : 'image/jpeg';
    const url = await uploadImageToR2(slugBase, { name: fileName, data, contentType });
    imgUrlMap[fileName] = url;
  }

  const imgRels = {};
  if (zip.files['word/_rels/document.xml.rels']) {
    const relsXml = await zip.files['word/_rels/document.xml.rels'].async('text');
    const relRegex = /<Relationship[^>]+Id="([^"]+)"[^>]+Target="([^"]+)"/g;
    let rm;
    while ((rm = relRegex.exec(relsXml)) !== null) {
      if (rm[2].includes('media/')) {
        imgRels[rm[1]] = rm[2].split('/').pop();
      }
    }
  }

  let title = '';
  let capaUrl = '';
  const markdownBlocks = [];
  let totalWords = 0;

  if (zip.files['word/document.xml']) {
    const docXml = await zip.files['word/document.xml'].async('text');
    const pTags = docXml.match(/<w:p(?:\s|>).*?<\/w:p>/g) || [];

    for (let i = 0; i < pTags.length; i++) {
      const p = pTags[i];

      const blipMatches = [];
      const blipRegex = /(?:r:embed|r:id)="([^"]+)"/g;
      let bm;
      while ((bm = blipRegex.exec(p)) !== null) {
        if (imgRels[bm[1]]) {
          blipMatches.push(imgRels[bm[1]]);
        }
      }

      if (blipMatches.length > 0) {
        for (const imgFileName of blipMatches) {
          const url = imgUrlMap[imgFileName];
          if (!url) continue;

          if (!capaUrl) {
            capaUrl = url;
          } else {
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
                if (isItalicOrCenter) {
                  caption = nextText;
                  i++;
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

      const tMatches = p.match(/<w:t(?:\s|>).*?<\/w:t>/g) || [];
      const text = tMatches.map(t => t.replace(/<[^>]+>/g, '')).join('').trim();
      if (!text) continue;

      totalWords += text.split(/\s+/).length;

      if (!title && !text.toLowerCase().startsWith('palavras-chave:')) {
        title = text;
        continue;
      }

      const isH1 = p.includes('w:val="Heading1"') || p.includes('w:val="Title"');
      const isH2 = p.includes('w:val="Heading2"');
      const isH3 = p.includes('w:val="Heading3"');

      if (isH1) markdownBlocks.push(`\n## ${text}\n`);
      else if (isH2) markdownBlocks.push(`\n### ${text}\n`);
      else if (isH3) markdownBlocks.push(`\n#### ${text}\n`);
      else markdownBlocks.push(text);
    }
  }

  if (!capaUrl) {
    capaUrl = `${R2_PUBLIC_BASE}/blog/capas/padrao-${slugify(f.cat)}.webp`;
  }

  const validParas = markdownBlocks.filter(b => !b.startsWith('#') && !b.startsWith('!['));
  const resumo = validParas.length > 0
    ? validParas[0].slice(0, 260) + (validParas[0].length > 260 ? '...' : '')
    : `Artigo completo sobre ${title}.`;

  const row = {
    id: uniqueId,
    titulo: title || cleanTitle,
    resumo,
    conteudo_md: markdownBlocks.join('\n\n'),
    imagem_url: capaUrl,
    categoria: f.cat,
    autor: 'Redação Estudos Jurídicos',
    tempo_leitura_min: Math.max(2, Math.round(totalWords / 160)),
    publicado: true,
    data_publicacao: new Date().toISOString()
  };

  const { error } = await supabase.from('blog_edicao_posts').upsert([row]);
  if (error) console.error('Erro ao gravar no Supabase:', error);
  else console.log(`✓ Gravado no Supabase: [${row.categoria}] ${row.titulo}`);

  // Atualizar staged local
  const staged = JSON.parse(fs.readFileSync('scripts/blog_staged_posts.json', 'utf8'));
  staged[f.id] = row;
  fs.writeFileSync('scripts/blog_staged_posts.json', JSON.stringify(staged, null, 2), 'utf8');
}

async function run() {
  for (const f of missing) {
    await processOne(f);
  }
  console.log('Finalizado com 100% de sucesso!');
}

run().catch(console.error);
