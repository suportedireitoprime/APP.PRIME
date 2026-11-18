const fs = require('fs');
const path = require('path');

const ROOT_FOLDER_ID = '1faVFeCnA5SlrZTFE88l7zsRRA4XtgBix';

// Sleep helper
const sleep = ms => new Promise(r => setTimeout(r, ms));

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
    } catch (e) {
      if (attempt === 3) throw e;
      await sleep(1000);
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

(async () => {
  console.log('1. Escaneando pasta raiz do Google Drive...');
  const rootItems = await scanDriveFolder(ROOT_FOLDER_ID);
  const folders = rootItems.filter(item => item.mimeType === 'application/vnd.google-apps.folder');
  console.log(`Encontradas ${folders.length} subpastas na raiz.`);

  const bookResults = [];
  const missingFiles = [];

  for (let i = 0; i < folders.length; i++) {
    const f = folders[i];
    console.log(`[${i + 1}/${folders.length}] Escaneando: ${f.name}...`);
    
    // Ignorar pastas auxiliares como "Clássicos possíveis para editar" se houver
    if (f.name.toLowerCase().includes('possiveis para editar')) {
      console.log(`   -> Ignorando pasta de rascunhos: ${f.name}`);
      continue;
    }

    const subItems = await scanDriveFolder(f.id);
    await sleep(250);

    const clara = subItems.find(it => it.name.includes('Clara') && it.name.endsWith('.pdf'));
    const escura = subItems.find(it => it.name.includes('Escura') && it.name.endsWith('.pdf'));
    const otherPdfs = subItems.filter(it => it.name.endsWith('.pdf') && !it.name.includes('Clara') && !it.name.includes('Escura'));

    // Extrai nome do livro e autor a partir do padrão "Título — Autor"
    const parts = f.name.split('—').map(p => p.trim());
    const titulo = parts[0] || f.name;
    const autor = parts[1] || '';
    const slug = slugify(titulo);

    const bookEntry = {
      folderId: f.id,
      folderName: f.name,
      titulo,
      autor,
      slug,
      r2Folder: `classicos/${slug}`,
      clara: clara ? { id: clara.id, name: clara.name } : null,
      escura: escura ? { id: escura.id, name: escura.name } : null,
      otherPdfs: otherPdfs.map(p => ({ id: p.id, name: p.name })),
      subItemsCount: subItems.length
    };

    bookResults.push(bookEntry);

    if (!clara || !escura) {
      missingFiles.push({
        folder: f.name,
        hasClara: Boolean(clara),
        hasEscura: Boolean(escura),
        otherPdfs: otherPdfs.map(p => p.name)
      });
    }
  }

  fs.writeFileSync('books_drive_map.json', JSON.stringify(bookResults, null, 2), 'utf8');
  fs.writeFileSync('books_drive_missing.json', JSON.stringify(missingFiles, null, 2), 'utf8');

  console.log('\n=== RESUMO DO ESCANEAMENTO ===');
  console.log(`Total de livros mapeados: ${bookResults.length}`);
  console.log(`Livros com versões completas (Clara + Escura): ${bookResults.filter(b => b.clara && b.escura).length}`);
  console.log(`Livros com pendências ou ausência de PDF: ${missingFiles.length}`);
  if (missingFiles.length > 0) {
    console.log('\nPendências encontradas:');
    console.log(JSON.stringify(missingFiles, null, 2));
  }
})();
