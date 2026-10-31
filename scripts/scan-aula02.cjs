const fs = require('fs');

async function scanDriveFolder(folderId) {
  const url = `https://drive.google.com/drive/folders/${folderId}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
  });
  const html = await res.text();
  const match = html.match(/window\['_DRIVE_ivd'\]\s*=\s*'([^']+)'/);
  if (!match) return [];
  const raw = match[1];
  const hex = raw.replace(/\\x([0-9A-Fa-f]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
  let data;
  try {
    data = JSON.parse(hex);
  } catch (e) {
    // fallback se houver escapes
    const unescaped = hex.replace(/\\"/g, '"').replace(/\\\\/g, '\\');
    data = JSON.parse(unescaped);
  }
  const items = [];
  function walk(arr) {
    if (!Array.isArray(arr)) return;
    if (arr.length >= 4 && typeof arr[0] === 'string' && arr[0].length >= 20 && typeof arr[2] === 'string') {
      items.push({ id: arr[0], parentId: arr[1], name: arr[2], mimeType: arr[3] });
    }
    for (const el of arr) if (Array.isArray(el)) walk(el);
  }
  walk(data);
  return items;
}

async function main() {
  const aula02FolderId = '1cG6RYcwEhI6TRC99e8IzivYRk8-ogvYl';
  console.log('Escaneando pasta Aula 02...');
  const items = await scanDriveFolder(aula02FolderId);
  console.log(`Itens na Aula 02 (${items.length}):`);
  items.forEach(it => console.log(`- [${it.id}] ${it.name} (${it.mimeType})`));
  fs.writeFileSync('scratch/drive_aula02_files.json', JSON.stringify(items, null, 2), 'utf8');
}

main().catch(console.error);

