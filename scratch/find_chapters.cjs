const fs = require('fs');
const docXml = fs.readFileSync('scratch/unpacked_sample/word/document.xml', 'utf8');

const pRegex = /<w:p\b[^>]*>([\s\S]*?)<\/w:p>/g;
let pm;
let idx = 0;
const chapters = [];

while ((pm = pRegex.exec(docXml)) !== null) {
  idx++;
  const pContent = pm[1];
  const textMatches = pContent.match(/<w:t\b[^>]*>(.*?)<\/w:t>/g) || [];
  const text = textMatches.map(t => t.replace(/<[^>]+>/g, '')).join('').trim();
  
  // Detecta se é estilo de heading ou se tem o padrão de capítulo
  const isHeading1 = pContent.includes('w:val="Heading1"') || pContent.includes('w:val="TItulo1"');
  const isHeading2 = pContent.includes('w:val="Heading2"') || pContent.includes('w:val="TItulo2"');
  
  if (text.match(/^(?:CAP[ÍI]TULO\s+\d+|Cap[íi]tulo\s+\d+|\d{2}\s+[-–—•]|CAP[ÍI]TULO)/i) || (isHeading1 && text.length < 120)) {
    chapters.push({ idx, text, isHeading1, isHeading2 });
  }
}

console.log(`Encontrados ${chapters.length} possíveis títulos:`);
chapters.forEach(c => console.log(`[P${c.idx}] (H1=${c.isHeading1}) ${c.text}`));
