const fs = require('fs');

async function scanDriveFolder(folderId) {
  const url = `https://drive.google.com/drive/folders/${folderId}`;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
      });
      const html = await res.text();
      const match = html.match(/window\['_DRIVE_ivd'\]\s*=\s*'([^']+)'/);
      if (!match) return [];
      const hex = match[1].replace(/\\x([0-9A-Fa-f]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
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
    } catch (e) {
      if (attempt === 3) throw e;
      await new Promise(r => setTimeout(r, 1000));
    }
  }
  return [];
}

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

async function main() {
  const cdpData = JSON.parse(fs.readFileSync('all_drive_folders_cdp.json', 'utf8'));
  const allFolders = cdpData.items.filter(it => it.id !== '1faVFeCnA5SlrZTFE88l7zsRRA4XtgBix' && !it.name.includes('Clássicos possíveis para editar'));

  // Carregar livros já mapeados anteriormente
  const alreadyMapped = JSON.parse(fs.readFileSync('books_drive_map.json', 'utf8'));
  const alreadyIds = new Set(alreadyMapped.map(b => b.folderId));

  const newFolders = allFolders.filter(f => !alreadyIds.has(f.id));
  console.log(`Novas pastas identificadas no CDP: ${newFolders.length}`);

  const newBooks = [];
  for (let i = 0; i < newFolders.length; i++) {
    const f = newFolders[i];
    console.log(`[${i + 1}/${newFolders.length}] Escaneando pasta: ${f.name.split('Proprietário')[0]} (${f.id})...`);
    const subItems = await scanDriveFolder(f.id);

    const clara = subItems.find(it => it.name.includes('Clara') && (it.name.endsWith('.pdf') || it.mimeType === 'application/pdf'));
    const escura = subItems.find(it => it.name.includes('Escura') && (it.name.endsWith('.pdf') || it.mimeType === 'application/pdf'));

    const rawName = f.name.split('Proprietário')[0].trim();
    const parts = rawName.split('—').map(p => p.trim());
    const titulo = parts[0] || rawName;
    const autor = parts[1] || '';
    const slug = slugify(titulo);

    console.log(`   -> ${titulo} (${autor}): Clara=${Boolean(clara)}, Escura=${Boolean(escura)}`);

    newBooks.push({
      folderId: f.id,
      folderName: rawName,
      titulo,
      autor,
      slug,
      r2Folder: `classicos/${slug}`,
      clara: clara ? { id: clara.id, name: clara.name } : null,
      escura: escura ? { id: escura.id, name: escura.name } : null,
      subItemsCount: subItems.length
    });
  }

  // Combinar livros
  const fullBookList = [...alreadyMapped, ...newBooks];
  fs.writeFileSync('books_drive_map_all.json', JSON.stringify(fullBookList, null, 2), 'utf8');
  console.log(`\nTotal consolidado de pastas de livros: ${fullBookList.length}`);
  console.log(`Novos livros prontos para download: ${newBooks.length}`);
}

main().catch(console.error);
