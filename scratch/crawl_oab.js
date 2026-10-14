import fs from 'fs';

async function getFolderItems(folderId, title) {
  const url = `https://drive.google.com/drive/folders/${folderId}`;
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    const html = await res.text();
    const match = html.match(/window\['_DRIVE_ivd'\]\s*=\s*'([^']+)'/);
    if (!match) {
      console.log(`No ivd found for ${title} (${folderId})`);
      return [];
    }
    let jsonStr = match[1].replace(/\\x([0-9A-Fa-f]{2})/g, (m, c) => String.fromCharCode(parseInt(c, 16)));
    jsonStr = jsonStr.replace(/\\\//g, '/');
    const data = JSON.parse(jsonStr);

    const items = [];
    function inspect(arr) {
      if (!Array.isArray(arr)) return;
      if (typeof arr[0] === 'string' && arr[0].length >= 25 && typeof arr[2] === 'string') {
        const itemTitle = arr[2];
        const mime = arr[3] || '';
        if (mime.includes('audio') || itemTitle.toLowerCase().endsWith('.mp3')) {
          items.push({
            id: arr[0],
            title: itemTitle,
            mimeType: mime,
            parentTitle: title,
            folderId: folderId
          });
        }
      }
      for (const child of arr) {
        if (Array.isArray(child)) inspect(child);
      }
    }
    inspect(data);
    return items;
  } catch (e) {
    console.error(`Error for ${title}:`, e.message);
    return [];
  }
}

async function run() {
  const folders = JSON.parse(fs.readFileSync('scratch/oab_top_items.json', 'utf8'));
  console.log(`Checking ${folders.length} folders of EOAB...`);

  const allAudios = [];
  for (let i = 0; i < folders.length; i++) {
    const f = folders[i];
    console.log(`[${i+1}/${folders.length}] Fetching ${f.title}...`);
    const files = await getFolderItems(f.id, f.title);
    console.log(`  -> Found ${files.length} audio files`);
    allAudios.push(...files);
    await new Promise(r => setTimeout(r, 250));
  }

  // Ordenar os áudios por número de artigo / título de forma natural
  allAudios.sort((a, b) => {
    // Tentar comparar por número do artigo
    const numA = (a.title.match(/art(?:igo|\.)?\s*([0-9]+)/i) || [])[1];
    const numB = (b.title.match(/art(?:igo|\.)?\s*([0-9]+)/i) || [])[1];
    if (numA && numB && parseInt(numA, 10) !== parseInt(numB, 10)) {
      return parseInt(numA, 10) - parseInt(numB, 10);
    }
    return a.title.localeCompare(b.title, 'pt-BR', { numeric: true });
  });

  console.log(`\n========================================`);
  console.log(`TOTAL DE AUDIOAULAS DO ESTATUTO DA OAB ENCONTRADAS: ${allAudios.length}`);
  console.log(`========================================`);

  fs.writeFileSync('scratch/all_oab_audios.json', JSON.stringify(allAudios, null, 2));
}

run().catch(console.error);
