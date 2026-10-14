const fs = require('fs');

async function crawlFolder(folderId) {
  const url = `https://drive.google.com/drive/folders/${folderId}`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  });
  const html = await res.text();
  const match = html.match(/window\['_DRIVE_ivd'\]\s*=\s*'([^']+)'/);
  if (!match) return { subfolders: [], files: [] };
  let jsonStr = match[1].replace(/\\x([0-9A-Fa-f]{2})/g, (m, c) => String.fromCharCode(parseInt(c, 16)));
  jsonStr = jsonStr.replace(/\\\//g, '/');
  const data = JSON.parse(jsonStr);

  const subfolders = [];
  const files = [];

  function inspect(arr) {
    if (!Array.isArray(arr)) return;
    if (typeof arr[0] === 'string' && arr[0].length >= 25 && typeof arr[2] === 'string') {
      const itemTitle = arr[2];
      const mime = arr[3] || '';
      if (mime === 'application/vnd.google-apps.folder') {
        subfolders.push({ id: arr[0], title: itemTitle });
      } else {
        files.push({ id: arr[0], title: itemTitle, mime });
      }
    }
    for (const child of arr) {
      if (Array.isArray(child)) inspect(child);
    }
  }

  inspect(data);
  return { subfolders, files };
}

async function run() {
  const cpRootId = '1IwO3rzWUCFvmbGIlwLvQQtX4eSXXXYQW';
  console.log('Crawling CP Root...');
  const root = await crawlFolder(cpRootId);

  const allFiles = [...root.files];
  console.log(`Root has ${root.files.length} direct files and ${root.subfolders.length} subfolders.`);

  for (const sf of root.subfolders) {
    console.log(`Crawling subfolder ${sf.title} (${sf.id})...`);
    const sub = await crawlFolder(sf.id);
    console.log(`  -> Found ${sub.files.length} files`);
    allFiles.push(...sub.files);
    await new Promise(r => setTimeout(r, 300));
  }

  console.log(`\nTOTAL CP FILES FOUND: ${allFiles.length}`);

  // Sort by article number
  allFiles.sort((a, b) => {
    const numA = (a.title.match(/art(?:igo|\.)?\s*([0-9]+)/i) || [])[1];
    const numB = (b.title.match(/art(?:igo|\.)?\s*([0-9]+)/i) || [])[1];
    if (numA && numB) {
      const diff = parseInt(numA, 10) - parseInt(numB, 10);
      if (diff !== 0) return diff;
    }
    return a.title.localeCompare(b.title, 'pt-BR', { numeric: true });
  });

  fs.writeFileSync('scratch/all_cp_audios.json', JSON.stringify(allFiles, null, 2));
  console.log('Saved to scratch/all_cp_audios.json');
}

run().catch(console.error);
