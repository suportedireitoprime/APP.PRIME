const fs = require('fs');

const docXml = fs.readFileSync('scratch/unpacked_sample/word/document.xml', 'utf8');
const relsXml = fs.readFileSync('scratch/unpacked_sample/word/_rels/document.xml.rels', 'utf8');

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

function buildChapterMarkdown(startIdx, endIdx, chapterInfo, imageUrl, audioUrl) {
  const lines = [];
  
  lines.push(`# ${chapterInfo.titulo}`);
  if (chapterInfo.subtitulo) {
    lines.push(`*${chapterInfo.subtitulo}*`);
    lines.push('');
  }
  
  if (imageUrl) {
    lines.push(`![${chapterInfo.titulo}](${imageUrl})`);
    lines.push('');
  }
  
  let currentSection = '';
  
  for (let i = startIdx + 3; i < endIdx; i++) {
    const p = rawParagraphs[i];
    if (!p.text && !p.image) continue;
    
    // Ignora se for o próprio heading ou imagem já colocada no topo
    if (p.image) continue;
    
    const t = p.text;
    
    if (t === 'Em linguagem simples' || t === 'Para entender melhor' || t === 'De olho na prova' || t === 'Exemplo prático' || t === 'Ficha do crime' || t === 'Para guardar') {
      currentSection = t;
      lines.push('');
      if (t === 'De olho na prova') {
        lines.push(`### 🎯 ${t}`);
      } else if (t === 'Exemplo prático') {
        lines.push(`### 💡 ${t}`);
      } else if (t === 'Ficha do crime') {
        lines.push(`### 📋 ${t}`);
      } else if (t === 'Para guardar') {
        lines.push(`### 📌 ${t}`);
      } else {
        lines.push(`### ${t}`);
      }
      lines.push('');
      continue;
    }
    
    if (t.startsWith('⚠')) {
      lines.push(`> [!WARNING]`);
      lines.push(`> **${t.replace(/^⚠\s*/, '')}**`);
      lines.push('');
      continue;
    }
    
    if (currentSection === 'De olho na prova' && t.includes(':')) {
      lines.push(`- **${t}**`);
      continue;
    }
    
    lines.push(t);
    lines.push('');
  }
  
  return lines.join('\n');
}

// Testa Capítulo 1
const md = buildChapterMarkdown(
  40,
  87,
  {
    titulo: '01. Introdução aos Crimes Funcionais',
    subtitulo: 'A traição funcional: quem deveria proteger a Administração a ataca (Arts. 312 a 326)'
  },
  'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/resumos/imagens/direito-penal/crimes-funcionario-publico/cap01-introducao.png',
  'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/resumos/audio/direito-penal/crimes-funcionario-publico/cap01-introducao.mp3'
);

console.log('--- MARKDOWN GERADO ---');
console.log(md.slice(0, 800));
console.log('\n...\n');
console.log(md.slice(-400));
