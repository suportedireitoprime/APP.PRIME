const fs = require('fs');

async function scanFolder(folderId) {
  const url = `https://drive.google.com/drive/folders/${folderId}`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  });

  const html = await res.text();
  const match = html.match(/window\['_DRIVE_ivd'\]\s*=\s*'([^']+)'/);
  if (!match) return [];

  const hexDecoded = match[1].replace(/\\x([0-9A-Fa-f]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
  let data;
  try {
    data = JSON.parse(hexDecoded);
  } catch (e) {
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
        mimeType: arr[3]
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
  const rootId = '154MS3sz9EWZlSmsVfRvxsl3RX4P4c78c';
  console.log('Varrendo pasta raiz do Google Drive:', rootId);
  const items = await scanFolder(rootId);
  console.log(`Encontrados ${items.length} itens na raiz:`);
  items.forEach(it => {
    console.log(`- ${it.name} (${it.id}) [${it.mimeType}]`);
  });
  fs.writeFileSync('scratch/drive_root_folders.json', JSON.stringify(items, null, 2), 'utf8');
}

main().catch(console.error);
