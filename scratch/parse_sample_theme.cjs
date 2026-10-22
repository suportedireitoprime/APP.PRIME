const fs = require('fs');

const docXml = fs.readFileSync('scratch/unpacked_sample/word/document.xml', 'utf8');
const relsXml = fs.readFileSync('scratch/unpacked_sample/word/_rels/document.xml.rels', 'utf8');

// Mapeia rId -> nome do arquivo de imagem
const relsMap = {};
const relRegex = /Id="([^"]+)"[^>]+Target="media\/([^"]+)"/g;
let rm;
while ((rm = relRegex.exec(relsXml)) !== null) {
  relsMap[rm[1]] = rm[2];
}

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

console.log(`Total de parágrafos: ${rawParagraphs.length}`);

// Identifica inícios de capítulos
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

console.log(`Capítulos detectados: ${chapterStarts.length}`);
chapterStarts.forEach(c => {
  console.log(`Capítulo ${c.numero}: [${c.titulo}] - ${c.subtitulo} (P${c.pIndex})`);
});
