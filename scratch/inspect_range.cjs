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
let pm, idx = 0;
while ((pm = pRegex.exec(docXml)) !== null) {
  idx++;
  if (idx >= 40 && idx <= 70) {
    const pContent = pm[1];
    const blipMatch = pContent.match(/r:embed="([^"]+)"/);
    const imageFile = blipMatch ? relsMap[blipMatch[1]] : null;
    const textMatches = pContent.match(/<w:t\b[^>]*>(.*?)<\/w:t>/g) || [];
    const text = textMatches.map(t => t.replace(/<[^>]+>/g, '')).join('').trim();
    console.log(`[P${idx}]${imageFile ? ` [IMG: ${imageFile}]` : ''} ${text}`);
  }
}
