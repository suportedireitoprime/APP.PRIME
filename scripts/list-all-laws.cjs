const fs = require('fs');

const subfolders = JSON.parse(fs.readFileSync('scripts/drive_subfolders.json', 'utf8'));

for (const [category, items] of Object.entries(subfolders)) {
  console.log(`\n=== CATEGORIA: ${category.toUpperCase()} (${items.length} itens) ===`);
  items.forEach((it, idx) => {
    console.log(`  ${idx + 1}. [${it.id}] ${it.name} (${it.mimeType})`);
  });
}
