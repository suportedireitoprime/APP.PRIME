const fs = require('fs');

const raw = fs.readFileSync('scratch/initdata_raw.txt', 'utf8');

// Procura strings dentro de aspas
const stringMatches = raw.match(/"([^"\\]|\\.)*"/g) || [];
console.log('Total de strings no initData:', stringMatches.length);

const cleanStrings = stringMatches
  .map(s => {
    try { return JSON.parse(s); } catch { return s.slice(1, -1); }
  })
  .filter(s => typeof s === 'string' && s.length > 2);

console.log('Exemplos de strings:');
cleanStrings.slice(0, 30).forEach(s => console.log(' -', s.slice(0, 100)));

// Procura por termos jurídicos ou nomes de arquivos
const docxOrFiles = cleanStrings.filter(s => 
  s.includes('.doc') || 
  s.includes('.mp3') || 
  s.includes('Direito') || 
  s.includes('Resumo') || 
  s.includes('Ilustrado')
);
console.log('Strings relevantes:', docxOrFiles);
