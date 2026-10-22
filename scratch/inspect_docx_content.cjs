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
console.log('Mapeamento de imagens rels:', relsMap);

// Extrai parágrafos <w:p>
const pRegex = /<w:p\b[^>]*>([\s\S]*?)<\/w:p>/g;
let pm;
let count = 0;
const blocks = [];

while ((pm = pRegex.exec(docXml)) !== null) {
  const pContent = pm[1];
  
  // Procura imagem dentro do parágrafo
  const blipMatch = pContent.match(/r:embed="([^"]+)"/);
  const imageFile = blipMatch ? relsMap[blipMatch[1]] : null;

  // Extrai texto dos nós <w:t>
  const textMatches = pContent.match(/<w:t\b[^>]*>(.*?)<\/w:t>/g) || [];
  const text = textMatches.map(t => t.replace(/<[^>]+>/g, '')).join('').trim();

  // Verifica se é título (heading)
  const isHeading = pContent.includes('<w:pStyle w:val="Heading') || pContent.includes('<w:pStyle w:val="T') || pContent.includes('w:b/>');

  if (imageFile || text) {
    blocks.push({ text, image: imageFile, isHeading });
  }
}

console.log(`\nTotal de blocos extraídos: ${blocks.length}`);
console.log('\nPrimeiros 20 blocos:');
blocks.slice(0, 20).forEach((b, i) => {
  if (b.image) console.log(`[${i+1}] 🖼️ IMAGEM: ${b.image}`);
  if (b.text) console.log(`[${i+1}] ${b.isHeading ? '🏷️ [TÍTULO] ' : ''}${b.text.slice(0, 100)}`);
});
