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
  const summary = JSON.parse(fs.readFileSync('gdrive_materias_summary.json', 'utf-8'));
  const ambiental = summary.find(s => s.name === 'Direito Ambiental');
  console.log(`Checking modules of ${ambiental.name}...`);
  for (const mod of ambiental.modules) {
    const aulas = await fetchFolder(mod.id);
    console.log(`  Module: ${mod.name} -> ${aulas.length} aulas`);
    aulas.slice(0, 3).forEach(a => console.log(`     ${a.name} (${a.id})`));
  }
}

main().catch(console.error);

