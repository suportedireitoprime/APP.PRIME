const fs = require('fs');

async function getFolderContents(folderId) {
  const url = `https://drive.google.com/drive/folders/${folderId}`;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      const html = await res.text();
      const match = html.match(/window\['_DRIVE_ivd'\]\s*=\s*'([^']+)'/);
      if (!match) return [];
      const hexDecoded = match[1].replace(/\\x([0-9A-Fa-f]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
      const data = JSON.parse(hexDecoded);

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
    } catch (e) {
      if (attempt === 3) throw e;
      await new Promise(r => setTimeout(r, 1000 * attempt));
    }
  }
}

async function crawlArea(areaName, areaSlug, folderId) {
  console.log(`\n========================================`);
  console.log(`Rastreando Área: ${areaName} (ID: ${folderId})`);
  console.log(`========================================`);

  const topItems = await getFolderContents(folderId);
  const themeFolders = topItems.filter(it => it.mimeType === 'application/vnd.google-apps.folder');
  console.log(`Total de temas (subpastas): ${themeFolders.length}`);

  const allAudios = [];

  for (let i = 0; i < themeFolders.length; i++) {
    const theme = themeFolders[i];
    const themeItems = await getFolderContents(theme.id);
    const audioFiles = themeItems.filter(it => {
      return it.mimeType.startsWith('audio/') || it.name.endsWith('.mp3') || it.name.endsWith('.m4a') || it.name.endsWith('.wav');
    });

    console.log(` [${i + 1}/${themeFolders.length}] Tema: "${theme.name}" -> ${audioFiles.length} áudios`);

    for (const af of audioFiles) {
      // Extract title and sequence
      // E.g. name: "01. Pessoas Naturais.mp3"
      let cleanTitle = af.name.replace(/\.(mp3|m4a|wav)$/i, '').trim();
      let seqMatch = cleanTitle.match(/^(\d+)[\s._-]+(.*)/);
      let seqNum = null;
      let displayTitle = cleanTitle;
      if (seqMatch) {
        seqNum = parseInt(seqMatch[1], 10);
        displayTitle = seqMatch[2].trim();
      }

      const r2Key = `narracoes/areas/${areaSlug}/${theme.name}/${af.name}`;
      const r2Url = `https://pub-0c1a0e4ebbdd44dfa883dd36c269f19f.r2.dev/narracoes/areas/${encodeURIComponent(areaSlug)}/${encodeURIComponent(theme.name)}/${encodeURIComponent(af.name)}`;

      allAudios.push({
        area: areaName,
        areaSlug,
        tema: theme.name,
        titulo: displayTitle || cleanTitle,
        fileName: af.name,
        driveId: af.id,
        sequencia: seqNum,
        r2Key,
        r2Url
      });
    }

    // small pause to not spam Google Drive
    await new Promise(r => setTimeout(r, 200));
  }

  console.log(`Total de áudios encontrados em ${areaName}: ${allAudios.length}`);
  return allAudios;
}

async function main() {
  // Check the two DIREITO_CIVIL folders first
  console.log('Verificando os dois IDs de DIREITO_CIVIL...');
  const dc1 = await getFolderContents('1GTH6tqarbphOUlJZmJBxhrfLX6XdaWS0');
  const dc2 = await getFolderContents('11jp7wOR9qSodQy7zfAZx3u2yox7tKrGl');
  console.log('DC1 temas:', dc1.filter(x => x.mimeType === 'application/vnd.google-apps.folder').length);
  console.log('DC2 temas:', dc2.filter(x => x.mimeType === 'application/vnd.google-apps.folder').length);

  // We can crawl Direito Civil, Direito Processual Civil, and Direito Tributario
  const civilAudios = await crawlArea('Direito Civil', 'direito-civil', '1GTH6tqarbphOUlJZmJBxhrfLX6XdaWS0');
  const procCivilAudios = await crawlArea('Direito Processual Civil', 'direito-processual-civil', '1PPO_Al3G-UW1FtzNBmn8my7Ltm32Wvap');
  const tributarioAudios = await crawlArea('Direito Tributário', 'direito-tributario', '1fDkHxU5TUofr_dDXY_NIDzYD8wr6Kp9g');

  const totalMap = {
    civil: civilAudios,
    procCivil: procCivilAudios,
    tributario: tributarioAudios,
    totalCount: civilAudios.length + procCivilAudios.length + tributarioAudios.length
  };

  fs.writeFileSync('scripts/pending_audioaulas_manifest.json', JSON.stringify(totalMap, null, 2), 'utf8');
  console.log(`\n🎉 Rastreamento concluído com sucesso! Total de áudios mapeados: ${totalMap.totalCount}`);
}

main().catch(console.error);
