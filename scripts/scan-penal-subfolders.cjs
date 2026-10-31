const fs = require('fs');

async function scanDriveFolder(folderId) {
  const url = `https://drive.google.com/drive/folders/${folderId}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
  });
  const html = await res.text();
  const match = html.match(/window\['_DRIVE_ivd'\]\s*=\s*'([^']+)'/);
  if (!match) return [];
  const hex = match[1].replace(/\\x([0-9A-Fa-f]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
  const data = JSON.parse(hex);
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
  const penalFolderId = '13NRXMToFSblGbd3bL6Ut9-q2HQRMDSe4';
  console.log('Escaneando pasta Direito Penal...');
  const penalItems = await scanDriveFolder(penalFolderId);
  console.log('Subpastas de Direito Penal:', penalItems.length);
  penalItems.forEach(it => console.log(`- [${it.id}] ${it.name}`));
  fs.writeFileSync('scratch/drive_penal_subfolders.json', JSON.stringify(penalItems, null, 2), 'utf8');
}

main().catch(console.error);

