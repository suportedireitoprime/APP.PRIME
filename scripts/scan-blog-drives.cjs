const fs = require('fs');

const FOLDERS = [
  { name: 'Pasta 1', id: '1M56-kQb0XuDrhX0O-cvyiycifHoWGKWT' },
  { name: 'Pasta 2', id: '1Ezz2I_sz9WrnofFAZ_Em87RBDzdLKkYB' }
];

async function fetchFolderItems(folderId, retries = 3) {
  const url = `https://drive.google.com/drive/folders/${folderId}`;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      const html = await res.text();
      const match = html.match(/window\['_DRIVE_ivd'\]\s*=\s*'([^']+)'/);
      if (!match) {
        // Tenta ver o título da página pelo menos
        const titleMatch = html.match(/<title>([^<]+)<\/title>/);
        return { items: [], title: titleMatch ? titleMatch[1] : 'Sem título', rawHtml: html.slice(0, 500) };
      }

      const hexDecoded = match[1].replace(/\\x([0-9A-Fa-f]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
      const data = JSON.parse(hexDecoded);
      const items = [];

      function extract(arr) {
        if (!Array.isArray(arr)) return;
        if (arr.length >= 4 && typeof arr[0] === 'string' && arr[0].length >= 20 && typeof arr[2] === 'string') {
          items.push({
            id: arr[0],
            name: arr[2],
            mime: arr[3]
          });
        }
        for (const el of arr) {
          if (Array.isArray(el)) extract(el);
        }
      }

      extract(data);
      const titleMatch = html.match(/<title>([^<]+)<\/title>/);
      return { items, title: titleMatch ? titleMatch[1] : '' };
    } catch (err) {
      if (attempt === retries) {
        console.error(`Erro ao buscar pasta ${folderId}:`, err.message);
        return { items: [], error: err.message };
      }
      await new Promise(r => setTimeout(r, 1000 * attempt));
    }
  }
  return { items: [] };
}

async function scanRecursive(folderId, path = '') {
  const { items, title } = await fetchFolderItems(folderId);
  console.log(`Buscando [${path || folderId}] -> Título: "${title || ''}" (${items.length} itens encontrados)`);

  const results = {
    folderId,
    title,
    path,
    files: [],
    subfolders: []
  };

  for (const item of items) {
    if (item.mime === 'application/vnd.google-apps.folder') {
      const subPath = path ? `${path}/${item.name}` : item.name;
      const subRes = await scanRecursive(item.id, subPath);
      results.subfolders.push(subRes);
    } else {
      results.files.push({
        id: item.id,
        name: item.name,
        mime: item.mime,
        path: path ? `${path}/${item.name}` : item.name
      });
    }
  }

  return results;
}

async function main() {
  console.log('--- Iniciando análise das pastas do Google Drive ---');
  const fullScan = [];

  for (const f of FOLDERS) {
    console.log(`\n=== Analisando ${f.name} (${f.id}) ===`);
    const res = await scanRecursive(f.id, '');
    fullScan.push({ folderMeta: f, scan: res });
  }

  fs.writeFileSync('scripts/blog_drive_scan.json', JSON.stringify(fullScan, null, 2), 'utf8');
  console.log('\nVarredura concluída! Salvo em scripts/blog_drive_scan.json');
}

main().catch(console.error);
