const fs = require('fs');
const path = require('path');

const R2_DOMAIN = 'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev';

function main() {
  const inventoryFile = path.join(__dirname, 'pilulas_inventory.json');
  const catalog = JSON.parse(fs.readFileSync(inventoryFile, 'utf8'));
  const outDir = path.join(__dirname, '../src/data/pilulas');

  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const materiasIndex = [];

  for (const mat of catalog) {
    if (!mat.modulos || mat.modulos.length === 0) continue;

    const formattedModules = [];
    let modIndex = 1;

    for (const mod of mat.modulos) {
      const formattedTopicos = [];

      for (const top of mod.topicos) {
        const topicoId = `${mod.slug}_${top.baseName}`;
        formattedTopicos.push({
          id: topicoId,
          baseSlug: top.baseName,
          titulo: top.titulo,
          audioUrl: `${R2_DOMAIN}/${top.mp3.r2Key}`,
          srtUrl: top.srt ? `${R2_DOMAIN}/${top.srt.r2Key}` : null,
          pdfUrl: top.pdf ? `${R2_DOMAIN}/${top.pdf.r2Key}` : null,
          roteiroUrl: top.txt ? `${R2_DOMAIN}/${top.txt.r2Key}` : null,
          driveMp3Id: top.mp3.id,
          driveSrtId: top.srt?.id || null,
          drivePdfId: top.pdf?.id || null,
          driveTxtId: top.txt?.id || null,
          r2Mp3Key: top.mp3.r2Key,
          r2SrtKey: top.srt?.r2Key || null,
          r2PdfKey: top.pdf?.r2Key || null,
          r2TxtKey: top.txt?.r2Key || null,
        });
      }

      formattedModules.push({
        id: mod.slug,
        folderIndex: modIndex++,
        titulo: mod.nome.replace(/^[0-9]+\.\s*/, ''),
        folderName: mod.nome,
        slug: mod.slug,
        totalTopicos: formattedTopicos.length,
        topicos: formattedTopicos,
      });
    }

    const jsonPath = path.join(outDir, `${mat.slug}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(formattedModules, null, 2), 'utf8');
    console.log(`✓ Gerado catálogo: ${mat.slug}.json (${formattedModules.length} módulos)`);

    materiasIndex.push({
      id: mat.slug,
      nome: mat.nome,
      slug: mat.slug,
      totalModulos: formattedModules.length,
      totalTopicos: formattedModules.reduce((acc, m) => acc + m.totalTopicos, 0),
    });
  }

  // Also write an index of all materias
  fs.writeFileSync(path.join(outDir, 'index.json'), JSON.stringify(materiasIndex, null, 2), 'utf8');
  console.log(`\n✓ Gerado index.json com ${materiasIndex.length} matérias ativas!`);
}

main();
