const fs = require('fs');

const resumos = JSON.parse(fs.readFileSync('scratch/penal_resumos.json', 'utf8'));
const narracoes = JSON.parse(fs.readFileSync('scratch/penal_narracoes.json', 'utf8'));

function normalize(s) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

console.log('Mapeamento Resumo <-> Pasta de Narração:');
let matches = 0;

for (const r of resumos) {
  const rClean = normalize(r.name.replace(/^[\d\s\-]+resumo\s*[-–]\s*/i, '').replace(/\.docx$/i, ''));
  
  // Procura pasta de narração correspondente
  const match = narracoes.find(n => {
    const nClean = normalize(n.name);
    return rClean.includes(nClean) || nClean.includes(rClean) || 
      (rClean.split(' ').filter(w => w.length > 3).every(w => nClean.includes(w)));
  });
  
  if (match) {
    matches++;
    console.log(`✅ [${r.name}] -> Pasta: [${match.name}] (${match.id})`);
  } else {
    console.log(`⚠️ [${r.name}] -> SEM PASTA EXATA`);
  }
}

console.log(`\nTotal de matches: ${matches}/${resumos.length}`);
