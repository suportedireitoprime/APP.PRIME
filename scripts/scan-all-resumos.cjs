const fs = require('fs');
const path = require('path');

const ROOT_FOLDER_ID = '189P9bzeF6lUEtoP3dilDPSr_WzKc73Zt';

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
    const unescaped = hex.replace(/\\\"/g, '\"').replace(/\\\\/g, '\\');
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
  console.log('Varrendo pasta raiz dos resumos:', ROOT_FOLDER_ID);
  const rootItems = await scanDriveFolder(ROOT_FOLDER_ID);
  console.log(`Encontrados ${rootItems.length} itens na raiz.`);
  
  const books = rootItems.filter(it => it.mimeType === 'application/vnd.google-apps.folder');
  console.log(`Pastas de livros encontradas: ${books.length}`);
  
  const results = [];
  
  for (let i = 0; i < books.length; i++) {
    const b = books[i];
    console.log(`[${i+1}/${books.length}] Varrendo ${b.name} (${b.id})...`);
    try {
      const files = await scanDriveFolder(b.id);
      const audioFiles = files.filter(f => f.name.endsWith('.mp3'));
      const srtFiles = files.filter(f => f.name.endsWith('.srt'));
      const subfolders = files.filter(f => f.mimeType === 'application/vnd.google-apps.folder');
      
      console.log(`   -> ${files.length} arquivos (${audioFiles.length} mp3, ${srtFiles.length} srt, ${subfolders.length} subpastas)`);
      
      results.push({
        name: b.name,
        id: b.id,
        files: files.map(f => ({ id: f.id, name: f.name, mimeType: f.mimeType }))
      });
    } catch (err) {
      console.error(`Erro ao varrer ${b.name}:`, err.message);
    }
  }
  
  const outPath = path.join(__dirname, '../tmp/resumos_drive_scan.json');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2));
  console.log(`\nSalvo em ${outPath} com ${results.length} livros!`);
}

main().catch(console.error);
