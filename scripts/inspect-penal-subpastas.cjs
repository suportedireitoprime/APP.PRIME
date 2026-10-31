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
  const direitoPenalFolderId = '13NRXMToFSblGbd3bL6Ut9-q2HQRMDSe4';
  console.log('Varrendo pasta de Direito Penal (conteúdos):', direitoPenalFolderId);
  const items = await scanFolder(direitoPenalFolderId);
  console.log(`Encontradas ${items.length} pastas/itens em Direito Penal:`);
  items.forEach(it => {
    console.log(`- ${it.name} (${it.id}) [${it.mimeType}]`);
  });
  fs.writeFileSync('scratch/drive_direito_penal_subpastas.json', JSON.stringify(items, null, 2), 'utf8');

  // Se houver matérias, vamos inspecionar a primeira matéria (ex: 01. Crimes Contra a Família)
  if (items.length > 0) {
    const primeiraMateria = items[0];
    console.log('\nVarrendo primeira matéria:', primeiraMateria.name, primeiraMateria.id);
    const aulasMateria = await scanFolder(primeiraMateria.id);
    console.log(`Encontradas ${aulasMateria.length} aulas na matéria ${primeiraMateria.name}:`);
    aulasMateria.forEach(a => console.log(`  * ${a.name} (${a.id})`));

    if (aulasMateria.length > 0) {
      const primeiraAula = aulasMateria[0];
      console.log('\nVarrendo arquivos da primeira aula:', primeiraAula.name, primeiraAula.id);
      const arquivosAula = await scanFolder(primeiraAula.id);
      console.log(`Encontrados ${arquivosAula.length} arquivos na aula:`);
      arquivosAula.forEach(f => console.log(`    > ${f.name} (${f.id}) [${f.mimeType}]`));
      fs.writeFileSync('scratch/drive_primeira_aula_arquivos.json', JSON.stringify(arquivosAula, null, 2), 'utf8');
    }
  }
}

main().catch(console.error);

