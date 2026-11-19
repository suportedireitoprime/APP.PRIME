const fs = require('fs');
const path = require('path');

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function fetchHtml(url) {
  for (let a = 1; a <= 4; a++) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
        }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (e) {
      if (a === 4) throw e;
      await sleep(1000 * a);
    }
  }
}

function parseItemsFromHtml(html) {
  const itemRegex = /aria-label="([^"]+?)"[^>]*ssk='[^']*?:([a-zA-Z0-9_-]{25,45})-0-16'/g;
  let m;
  const items = [];
  const seen = new Set();
  while ((m = itemRegex.exec(html)) !== null) {
    const rawName = m[1].trim();
    const id = m[2];
    if (seen.has(id)) continue;
    seen.add(id);

    // Identify if it is folder or file
    const isFolder = rawName.includes('Shared folder') || rawName.includes('Pasta') || rawName.endsWith(' folder');
    const cleanName = rawName
      .replace(/\s+Shared\s+folder$/i, '')
      .replace(/\s+Shared$/i, '')
      .replace(/\s+folder$/i, '')
      .replace(/\s+PDF$/i, '')
      .replace(/\s+Audio$/i, '')
      .replace(/\s+Text$/i, '')
      .replace(/\s+Unknown$/i, '')
      .trim();

    items.push({ id, rawName, cleanName, isFolder });
  }
  return items;
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
  const rootId = '1fPpkrxjJ2J_teVypzVLvymRYsCx6kxUC';
  console.log('1. Escaneando raiz de Pílulas:', rootId);
  const rootHtml = await fetchHtml(`https://drive.google.com/drive/folders/${rootId}`);
  const materias = parseItemsFromHtml(rootHtml).filter(it => it.isFolder);

  console.log(`Encontradas ${materias.length} matérias / pastas principais.`);

  const catalog = [];
  const inventoryFile = path.join(__dirname, 'pilulas_inventory.json');

  // Resume if existing
  let existingCatalog = [];
  if (fs.existsSync(inventoryFile)) {
    try { existingCatalog = JSON.parse(fs.readFileSync(inventoryFile, 'utf8')); } catch (e) {}
  }

  for (let mIdx = 0; mIdx < materias.length; mIdx++) {
    const mat = materias[mIdx];
    const matSlug = slugify(mat.cleanName);
    console.log(`\n[${mIdx + 1}/${materias.length}] Matéria: ${mat.cleanName} (${mat.id})`);

    // Check if already completely scanned
    const existingMat = existingCatalog.find(c => c.id === mat.id);
    if (existingMat && existingMat.modulos && existingMat.modulos.length > 0) {
      console.log(`   -> Já escaneada anteriormente (${existingMat.modulos.length} módulos).`);
      catalog.push(existingMat);
      continue;
    }

    const matHtml = await fetchHtml(`https://drive.google.com/drive/folders/${mat.id}`);
    const modulosRaw = parseItemsFromHtml(matHtml).filter(it => it.isFolder);
    console.log(`   -> Encontrados ${modulosRaw.length} módulos.`);

    const modulos = [];
    for (let modIdx = 0; modIdx < modulosRaw.length; modIdx++) {
      const mod = modulosRaw[modIdx];
      const modSlug = slugify(mod.cleanName);
      process.stdout.write(`      (${modIdx + 1}/${modulosRaw.length}) ${mod.cleanName}... `);

      try {
        const modHtml = await fetchHtml(`https://drive.google.com/drive/folders/${mod.id}`);
        const filesRaw = parseItemsFromHtml(modHtml).filter(it => !it.isFolder);

        // Group files by base name
        const mp3Files = filesRaw.filter(f => f.cleanName.endsWith('.mp3'));
        const srtFiles = filesRaw.filter(f => f.cleanName.endsWith('.srt'));
        const pdfFiles = filesRaw.filter(f => f.cleanName.endsWith('.pdf'));
        const txtFiles = filesRaw.filter(f => f.cleanName.endsWith('.txt'));

        const topicos = [];
        for (const mp3 of mp3Files) {
          const baseName = mp3.cleanName.replace(/\.mp3$/, '');
          const srt = srtFiles.find(f => f.cleanName.startsWith(baseName));
          const pdf = pdfFiles.find(f => f.cleanName.startsWith(baseName));
          const txt = txtFiles.find(f => f.cleanName.startsWith(baseName));

          topicos.push({
            baseName,
            titulo: baseName.replace(/^[0-9]+-/, '').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            mp3: { id: mp3.id, name: mp3.cleanName, r2Key: `pilulas/${matSlug}/${modSlug}/${mp3.cleanName}` },
            srt: srt ? { id: srt.id, name: srt.cleanName, r2Key: `pilulas/${matSlug}/${modSlug}/${srt.cleanName}` } : null,
            pdf: pdf ? { id: pdf.id, name: pdf.cleanName, r2Key: `pilulas/${matSlug}/${modSlug}/${pdf.cleanName}` } : null,
            txt: txt ? { id: txt.id, name: txt.cleanName, r2Key: `pilulas/${matSlug}/${modSlug}/${txt.cleanName}` } : null,
          });
        }

        console.log(`✓ ${topicos.length} tópicos`);
        modulos.push({
          id: mod.id,
          nome: mod.cleanName,
          slug: modSlug,
          topicos
        });
      } catch (err) {
        console.log(`ERRO: ${err.message}`);
      }

      await sleep(150);
    }

    catalog.push({
      id: mat.id,
      nome: mat.cleanName,
      slug: matSlug,
      modulos
    });

    // Save progress incrementally
    fs.writeFileSync(inventoryFile, JSON.stringify(catalog, null, 2), 'utf8');
  }

  console.log('\n=== VARREDURA COMPLETA FINALIZADA ===');
  console.log(`Inventário salvo em: ${inventoryFile}`);
}

main().catch(console.error);
