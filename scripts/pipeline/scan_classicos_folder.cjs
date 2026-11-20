const https = require('https');
const fs = require('fs');

const folderId = '1mzuVvEKZE5FziuoG_qMDe0_B9uOD4MKN';

function fetchFolder(id) {
  return new Promise((resolve, reject) => {
    https.get(`https://drive.google.com/embeddedfolderview?id=${id}#list`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    }, (res) => {
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

async function run() {
  console.log('Fetching folder:', folderId);
  const items = await fetchFolder(folderId);
  console.log('Total items found:', items.length);

  const folders = items.filter(i => i.isFolder);
  const files = items.filter(i => !i.isFolder);
  console.log(`Folders: ${folders.length}, Files: ${files.length}`);

  let allFiles = [...files];
  for (const f of folders) {
    console.log(`Scanning subfolder: ${f.name} (${f.id})`);
    const subItems = await fetchFolder(f.id);
    for (const sub of subItems) {
      if (!sub.isFolder) {
        allFiles.push({ ...sub, parentFolder: f.name });
      }
    }
  }

  console.log('Total files across all folders:', allFiles.length);
  fs.writeFileSync('scripts/pipeline/classicos_files_list.json', JSON.stringify(allFiles, null, 2));
  console.log('Saved to scripts/pipeline/classicos_files_list.json');
}

run().catch(console.error);
