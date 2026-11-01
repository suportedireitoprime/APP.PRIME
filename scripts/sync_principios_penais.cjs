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

async function fetchFolderItems(folderId, retries = 3) {
  const url = `https://drive.google.com/drive/folders/${folderId}`;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
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
          items.push({ id: arr[0], name: arr[2], mimeType: arr[3] });
        }
        for (const el of arr) if (Array.isArray(el)) walk(el);
      }
      walk(data);
      return items;
    } catch (e) {
      if (attempt === retries) return [];
      await new Promise(r => setTimeout(r, 1000 * attempt));
    }
  }
  return [];
}

async function downloadDriveFile(fileId) {
  const url = `https://drive.usercontent.google.com/download?id=${fileId}&export=download&authuser=0`;
  const res = await fetch(url);
  if (!res.ok) {
    const res2 = await fetch(`https://drive.google.com/uc?export=download&id=${fileId}`);
    return await res2.text();
  }
  return await res.text();
}

function parseAulaHtml(html, aulaId, disciplinaId) {
  let imagens = {};
  const imgMatch = html.match(/var\s+IMG\s*=\s*(\{[\s\S]*?\});/);
  if (imgMatch) {
    try {
      imagens = (new Function(`return ${imgMatch[1]}`))();
    } catch (e) {}
  }

  let audioBaseUrl = '';
  const audioMatch = html.match(/function\s+audioSrc\s*\(\s*i\s*\)\s*\{\s*return\s*["']([^"']+)["']/);
  if (audioMatch) {
    audioBaseUrl = audioMatch[1];
  }

  let slides = [];
  const startMarker = 'var SLIDES = [';
  const startIdx = html.indexOf(startMarker);
  if (startIdx !== -1) {
    const fromStart = html.substring(startIdx + 'var SLIDES = '.length);
    const endMatch = fromStart.match(/\];\s*(?:\/\*[\s\S]*?\*\/|\s)*(?:var|const|let|\n)/);
    if (endMatch) {
      let slidesCode = fromStart.substring(0, endMatch.index + 1);
      slidesCode = slidesCode.replace(/src="([^"]+)"/g, 'src=\\"$1\\"');
      try {
        slides = (new Function(`return ${slidesCode}`))();
      } catch (e) {}
    }
  }

  return {
    aulaId,
    titulo: slides[0]?.titulo || 'Aula Interativa',
    disciplinaId,
    totalEtapas: slides.length,
    slides,
    imagens,
    audioBaseUrl
  };
}

const AULAS = [
  { num: 1, id: 'penal-06-01', folderId: '1dlDmnrCwzrB_pmQfLjjgmIvLDx1XtKyq', slug: 'aula-01-principios-penais-introducao-ao-tema' },
  { num: 2, id: 'penal-06-02', folderId: '1V-Guc8S9efQYP3xtQRN-rbB9oDgKEqK9', slug: 'aula-02-principio-da-reserva-legal-ou-da-estrita-legalidade' },
  { num: 3, id: 'penal-06-03', folderId: '12GdDV0sPVSijNJnHI51Etk4LD7OQmVAX', slug: 'aula-03-principio-da-anterioridade' },
  { num: 4, id: 'penal-06-04', folderId: '1C6_dCTDEfsBdl7vai7WWy_UDpPRPJp4-', slug: 'aula-04-principios-da-alteridade-e-da-confianca' },
  { num: 5, id: 'penal-06-05', folderId: '1ZtsC-_0tPiXkxet5N8U8H9Eqy3J1cTvf', slug: 'aula-05-principio-da-proporcionalidade-ou-razoabilidade' },
  { num: 6, id: 'penal-06-06', folderId: '1e5yjQ34VusB5F8IOawPlOwAHy9d8R1f2', slug: 'aula-06-principio-da-intervencao-minima-ou-da-necessidade' },
  { num: 7, id: 'penal-06-07', folderId: '1cEa6LNtHKpwyJtq2G5xbWF7vkp9nSxTl', slug: 'aula-07-principios-da-intranscendencia-da-responsabilidade-pelo-fato' },
  { num: 8, id: 'penal-06-08', folderId: '1icz5tNoJnZ1-l4Yl0qcYF5hy8FldWGQV', slug: 'aula-08-principio-da-adequacao-social-da-culpabilidade' },
  { num: 9, id: 'penal-06-09', folderId: '1hkH8uCHegftoQM6OACYp88iuerHdsM0P', slug: 'aula-09-principio-da-insignificancia' }
];

async function run() {
  console.log('Iniciando processamento das 9 aulas de Princípios Penais...');
  const results = {};

  for (const item of AULAS) {
    console.log(`\n--- [${item.num}/9] Processando ${item.id} ---`);
    const items = await fetchFolderItems(item.folderId);
    console.log(`Itens na pasta: ${items.length}`);
    const htmlFile = items.find(f => f.name.toLowerCase() === 'aula.html' || f.name.endsWith('.html'));
    
    if (!htmlFile) {
      console.warn(`AVISO: aula.html não encontrado na pasta ${item.folderId}! Itens:`, items.map(i => i.name));
      continue;
    }

    console.log(`Baixando ${htmlFile.name} (${htmlFile.id})...`);
    const htmlContent = await downloadDriveFile(htmlFile.id);
    console.log(`HTML baixado com sucesso! Tamanho: ${htmlContent.length} bytes`);

    const parsed = parseAulaHtml(htmlContent, item.id, 'penal');
    console.log(`Parse concluído! Título: "${parsed.titulo}" | Etapas: ${parsed.totalEtapas}`);

    // Upload para R2
    const r2Key = `aulas-interativas/direito-penal/07-principios-penais/${item.slug}/aula.html`;
    try {
      await s3.send(new PutObjectCommand({
        Bucket: BUCKET,
        Key: r2Key,
        Body: Buffer.from(htmlContent, 'utf8'),
        ContentType: 'text/html; charset=utf-8',
        CacheControl: 'public, max-age=31536000'
      }));
      const r2Url = `${R2_DOMAIN}/${r2Key}`;
      console.log(`Subido para R2 com sucesso: ${r2Url}`);
      parsed.urlHtmlR2 = r2Url;
    } catch (err) {
      console.warn(`Erro no upload R2 para ${item.id}:`, err.message);
    }

    results[item.id] = parsed;
  }

  fs.writeFileSync('scratch/principios_penais_parsed.json', JSON.stringify(results, null, 2), 'utf8');
  console.log(`\nTODAS AS ${Object.keys(results).length} AULAS PROCESSADAS COM SUCESSO! Salvo em scratch/principios_penais_parsed.json`);
}

run().catch(console.error);

