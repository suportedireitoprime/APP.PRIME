const fs = require('fs');

async function scanFolder(folderId) {
  const url = `https://drive.google.com/drive/folders/${folderId}`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
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
  const aula01Id = '1Yb8lRHfvBOGm4NIkg71C3x9d7AOCNYYh';
  const itensAula = await scanFolder(aula01Id);
  const audioFolder = itensAula.find(i => i.name === 'audio');
  const imagensFolder = itensAula.find(i => i.name === 'imagens');

  console.log('Pasta audio:', audioFolder);
  console.log('Pasta imagens:', imagensFolder);

  let audios = [];
  let imagens = [];

  if (audioFolder) {
    audios = await scanFolder(audioFolder.id);
    console.log(`Encontrados ${audios.length} arquivos de audio:`, audios.map(a => a.name));
  }

  if (imagensFolder) {
    imagens = await scanFolder(imagensFolder.id);
    console.log(`Encontrados ${imagens.length} arquivos de imagens:`, imagens.map(i => i.name));
  }

  fs.writeFileSync('scratch/aula01_assets.json', JSON.stringify({ itensAula, audios, imagens }, null, 2), 'utf8');
}

main().catch(console.error);

