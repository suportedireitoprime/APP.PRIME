const https = require('https');
const fs = require('fs');

function fetchFolder(id) {
  return new Promise((resolve, reject) => {
    https.get(`https://drive.google.com/embeddedfolderview?id=${id}#list`, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        const regex = /<div class="flip-entry" id="entry-([a-zA-Z0-9_-]+)"[\s\S]*?href="([^"]+)"[\s\S]*?<div class="flip-entry-title">([^<]+)<\/div>/g;
        let m;
        const items = [];
        while ((m = regex.exec(d)) !== null) {
          items.push({
            id: m[1],
            url: m[2],
            name: m[3].trim(),
            isFolder: m[2].includes('/folders/')
          });
        }
        resolve(items);
      });
    }).on('error', reject);
  });
}

async function main() {
  const allFolders = JSON.parse(fs.readFileSync('gdrive_items.json', 'utf-8'));
  const materias = allFolders.filter(f => !f.name.startsWith('Capas das Aulas:'));
  console.log(`Checking ${materias.length} materias folders in Drive...`);

  const summary = [];
  for (const mat of materias) {
    try {
      const subItems = await fetchFolder(mat.id);
      console.log(`[${mat.name}] id: ${mat.id} -> ${subItems.length} subitems (modules)`);
      summary.push({
        name: mat.name,
        id: mat.id,
        modulesCount: subItems.length,
        modules: subItems
      });
    } catch (e) {
      console.error(`Error fetching ${mat.name}:`, e.message);
    }
  }

  fs.writeFileSync('gdrive_materias_summary.json', JSON.stringify(summary, null, 2), 'utf-8');
  console.log('Saved gdrive_materias_summary.json');
}

main().catch(console.error);

