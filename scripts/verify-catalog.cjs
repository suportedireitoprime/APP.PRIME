const fs = require('fs');

const audios = JSON.parse(fs.readFileSync('scripts/all_drive_audios.json', 'utf8'));

console.log(`Total de áudios escaneados: ${audios.length}`);

const byCat = {};
const byLaw = {};
const seenKeys = new Set();
let duplicates = 0;

for (const a of audios) {
  byCat[a.category] = (byCat[a.category] || 0) + 1;
  byLaw[a.lawName] = (byLaw[a.lawName] || 0) + 1;

  const key = `${a.tabelaNome}/${a.fileName}`;
  if (seenKeys.has(key)) {
    duplicates++;
  } else {
    seenKeys.add(key);
  }
}

console.log('\nPor Categoria:');
for (const [c, n] of Object.entries(byCat)) {
  console.log(`- ${c}: ${n} áudios`);
}

console.log(`\nTotal de Leis escaneadas: ${Object.keys(byLaw).length}`);
console.log(`Chaves únicas de destino: ${seenKeys.size}`);
console.log(`Duplicatas de chave: ${duplicates}`);
