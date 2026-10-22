const fs = require('fs');
const driveData = JSON.parse(fs.readFileSync('scripts/drive_subfolders.json', 'utf8'));

// Import catalog
const catalogPath = 'src/data/leisCatalog.ts';
const catalogContent = fs.readFileSync(catalogPath, 'utf8');

// Extrair tabela_nome, sigla, nome
const catalogItems = [];
const itemRegex = /{\s*id:\s*'([^']+)',\s*nome:\s*'([^']+)',\s*sigla:\s*'([^']+)',\s*descricao:[^,]+,\s*tipo:\s*'([^']+)',\s*tabela_nome:\s*'([^']+)'/g;
let m;
while ((m = itemRegex.exec(catalogContent)) !== null) {
  catalogItems.push({
    id: m[1],
    nome: m[2],
    sigla: m[3],
    tipo: m[4],
    tabela_nome: m[5]
  });
}

console.log('Catalog items parsed:', catalogItems.length);

// Normalize text for comparison
function norm(str) {
  return str.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

const mappings = [];
const unmapped = [];

for (const cat of ['código', 'estatutos', 'leis especiais']) {
  const folders = driveData[cat] || [];
  for (const f of folders) {
    const fNorm = norm(f.name);
    // Find best match in catalogItems
    let match = catalogItems.find(c => {
      const cNorm = norm(c.nome);
      const cSigla = norm(c.sigla);
      const cTab = norm(c.tabela_nome);
      return fNorm.includes(cNorm) || cNorm.includes(fNorm) ||
             fNorm.startsWith(cSigla) || fNorm.includes(cSigla) ||
             fNorm.includes(cTab);
    });

    if (match) {
      mappings.push({ drive: f, match: match.tabela_nome, lei: match.nome, cat });
    } else {
      unmapped.push({ drive: f, cat });
    }
  }
}

console.log(`Mapped: ${mappings.length}, Unmapped: ${unmapped.length}`);
if (unmapped.length > 0) {
  console.log('Unmapped folders:');
  unmapped.forEach(u => console.log(`[${u.cat}] ${u.drive.name}`));
}

fs.writeFileSync('scripts/drive_law_mapping.json', JSON.stringify({ mappings, unmapped }, null, 2));
