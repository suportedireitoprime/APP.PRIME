const fs = require('fs');

const folders = [
  { name: 'código', id: '1d6aCiiGhFjFi6IIBRn-R77MXhZYSmrKy' },
  { name: 'constituição', id: '1bzoKpm3z9oedQjstSkyXIWokkoToTQjx' },
  { name: 'estatutos', id: '1k6TKqrGxGwbHb8Ym0b-V3iWLI3IEC8KQ' },
  { name: 'leis especiais', id: '1nIc6SStUZW-A51lVK4R2K9q_-U0xT4p2' },
  { name: 'súmulas', id: '1BcVGtGKp-dxTAnFFNVDgNawdxWUA_CTq' }
];

async function scanFolder(folder) {
  const url = `https://drive.google.com/drive/folders/${folder.id}`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  });

  const html = await res.text();
  const match = html.match(/window\['_DRIVE_ivd'\]\s*=\s*'([^']+)'/);
  if (!match) {
    console.log(`[${folder.name}] Sem _DRIVE_ivd encontrado.`);
    return [];
  }

  const hexDecoded = match[1].replace(/\\x([0-9A-Fa-f]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
  let data;
  try {
    data = JSON.parse(hexDecoded);
  } catch (e) {
    console.log(`[${folder.name}] Erro ao parsear JSON.`);
    return [];
  }

  const items = [];
  function findItems(arr) {
    if (!Array.isArray(arr)) return;
    if (arr.length >= 4 && typeof arr[0] === 'string' && arr[0].length >= 20 && typeof arr[2] === 'string') {
      items.push({
        id: arr[0],
        parentId: arr[1],
        name: arr[2],
        mimeType: arr[3],
        category: folder.name
      });
    }
    for (const el of arr) {
      if (Array.isArray(el)) findItems(el);
    }
  }

  findItems(data);
  return items;
}

async function main() {
  console.log('Iniciando varredura das subpastas do Google Drive...');
  const allResults = {};

  for (const f of folders) {
    console.log(`Verificando pasta: ${f.name} (${f.id})...`);
    const items = await scanFolder(f);
    console.log(`-> Encontrados ${items.length} itens em "${f.name}"`);
    allResults[f.name] = items;
  }

  fs.writeFileSync('scripts/drive_subfolders.json', JSON.stringify(allResults, null, 2), 'utf8');
  console.log('Salvo em scripts/drive_subfolders.json');
}

main().catch(console.error);
