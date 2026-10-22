const JSZip = require('jszip');

async function testParseFile(driveId, slug) {
  const u = `https://drive.usercontent.google.com/download?id=${driveId}&export=download&authuser=0`;
  const res = await fetch(u);
  const zip = await JSZip.loadAsync(await res.arrayBuffer());

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

  const R2_PUBLIC_BASE = 'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev';
  function getImageUrl(fileName) {
    return `${R2_PUBLIC_BASE}/blog/imagens/${slug}/${fileName}`;
  }

  const docXml = await zip.files['word/document.xml'].async('text');
  const pTags = docXml.match(/<w:p(?:\s|>).*?<\/w:p>/g) || [];

  let title = '';
  let category = '';
  let capaUrl = '';
  const markdownBlocks = [];
  let totalWords = 0;

  for (let i = 0; i < pTags.length; i++) {
    const p = pTags[i];

    // Checar imagens no parágrafo
    const blipMatches = [];
    const blipRegex = /(?:r:embed|r:id)="([^"]+)"/g;
    let bm;
    while ((bm = blipRegex.exec(p)) !== null) {
      if (imgRels[bm[1]]) {
        blipMatches.push(imgRels[bm[1]]);
      }
    }

    // Se houver imagem
    if (blipMatches.length > 0) {
      for (const imgFile of blipMatches) {
        const url = getImageUrl(imgFile);
        if (!capaUrl) {
          capaUrl = url;
        } else {
          // Olhar para o próximo parágrafo para ver se é legenda
          let caption = '';
          if (i + 1 < pTags.length) {
            const nextP = pTags[i + 1];
            const isNextHeading = nextP.includes('w:val="Heading');
            const hasNextDrawing = nextP.includes('<w:drawing');
            const nextText = (nextP.match(/<w:t(?:\s|>).*?<\/w:t>/g) || [])
              .map(t => t.replace(/<[^>]+>/g, ''))
              .join('')
              .trim();

            if (!isNextHeading && !hasNextDrawing && nextText && nextText.length < 160) {
              const isItalicOrCenter = nextP.includes('<w:i/>') || nextP.includes('<w:jc w:val="center"/>');
              if (isItalicOrCenter || nextText.toLowerCase().startsWith('figura') || nextText.toLowerCase().startsWith('esquema')) {
                caption = nextText;
                i++; // Consumir o parágrafo de legenda
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

    // Texto do parágrafo atual
    const tMatches = p.match(/<w:t(?:\s|>).*?<\/w:t>/g) || [];
    const text = tMatches.map(t => t.replace(/<[^>]+>/g, '')).join('').trim();
    if (!text) continue;

    totalWords += text.split(/\s+/).length;

    // Detectar categoria
    if (text.toLowerCase().startsWith('categoria:')) {
      category = text.replace(/^categoria:\s*/i, '').trim();
      continue;
    }

    // Detectar título
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

  return {
    title,
    category,
    capaUrl,
    readingTime: Math.max(2, Math.round(totalWords / 160)),
    markdown: markdownBlocks.join('\n\n')
  };
}

async function run() {
  console.log('--- Testando Artigo 1 (Condições da ação) ---');
  const res1 = await testParseFile('1HoaWHDzOLSUFkGmm5TJT57LO9vVxaSaC', 'condicoes-da-acao');
  console.log('Título:', res1.title);
  console.log('Categoria:', res1.category);
  console.log('Capa:', res1.capaUrl);
  console.log('Trecho com Imagens Inline:');
  const lines = res1.markdown.split('\n').filter(l => l.includes('![') || l.includes('###') || l.startsWith('*'));
  console.log(lines.slice(0, 15).join('\n'));
}

run().catch(console.error);
