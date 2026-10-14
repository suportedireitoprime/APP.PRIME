const { chromium } = require('playwright');
const fs = require('fs');

async function getSubfoldersAndRootFiles(page, rootFolderId, lawName) {
  const url = `https://drive.google.com/drive/folders/${rootFolderId}`;
  console.log(`\n========================================`);
  console.log(`Explorando Raiz de: ${lawName} (${rootFolderId})`);
  console.log(`========================================`);
  await page.goto(url, { waitUntil: 'networkidle', timeout: 35000 }).catch(() => {});
  await page.waitForTimeout(3000);

  // Scroll down to find all subfolders and files in root
  const subfolderMap = new Map();
  const rootFilesMap = new Map();

  for (let s = 0; s < 12; s++) {
    const rawItems = await page.evaluate(() => {
      const results = [];
      document.querySelectorAll('[data-id]').forEach(el => {
        const id = el.getAttribute('data-id');
        const text = (el.innerText || '').split('\n')[0].trim();
        const role = el.getAttribute('role') || '';
        const isFolder = el.querySelector('svg[aria-label*="pasta" i], svg[aria-label*="folder" i]') !== null ||
          text.includes('Título') || text.includes('Capítulo') || text.includes('Livro') || text.includes('Parte') || text.includes('arts.') || text.includes('art.');
        if (id && text && id.length >= 25) {
          results.push({ id, text, isFolder });
        }
      });
      return results;
    });

    for (const it of rawItems) {
      if (it.text.toLowerCase().endsWith('.mp3')) {
        if (!rootFilesMap.has(it.text)) rootFilesMap.set(it.text, { id: it.id, title: it.text });
      } else {
        if (!subfolderMap.has(it.id)) subfolderMap.set(it.id, { id: it.id, title: it.text });
      }
    }

    await page.keyboard.press('PageDown');
    await page.waitForTimeout(400);
  }

  console.log(`Raiz ${lawName}: ${subfolderMap.size} subpastas, ${rootFilesMap.size} arquivos diretos.`);
  return {
    subfolders: Array.from(subfolderMap.values()),
    rootFiles: Array.from(rootFilesMap.values())
  };
}

async function crawlSubfolder(page, folderId, folderName, lawPrefix) {
  const url = `https://drive.google.com/drive/folders/${folderId}`;
  await page.goto(url, { waitUntil: 'networkidle', timeout: 35000 }).catch(() => {});
  await page.waitForTimeout(2000);

  const foundItems = new Map();

  for (let step = 0; step < 10; step++) {
    const items = await page.evaluate(() => {
      const results = [];
      document.querySelectorAll('[data-id]').forEach(el => {
        const id = el.getAttribute('data-id');
        const text = el.innerText || '';
        // Match article MP3 or general MP3
        const match = text.match(/[A-Za-z0-9\s._–—-]+(?:\.mp3)/i) || text.match(/art(?:igo|\.)?\s*[0-9A-Za-z-]+(?:\.mp3)?/i);
        if (id && id.length >= 25 && (text.includes('.mp3') || text.toLowerCase().includes('art'))) {
          const firstLine = text.split('\n')[0].trim();
          results.push({ id, title: firstLine });
        }
      });
      return results;
    });

    for (const it of items) {
      if (!foundItems.has(it.title)) {
        foundItems.set(it.title, it);
      }
    }

    await page.keyboard.press('PageDown');
    await page.waitForTimeout(400);
  }

  return Array.from(foundItems.values());
}

async function processLaw(page, law) {
  const rootData = await getSubfoldersAndRootFiles(page, law.folderId, law.name);

  const allMap = new Map();

  for (const f of rootData.rootFiles) {
    let clean = f.title.replace(/\.mp3$/i, '').trim() + '.mp3';
    allMap.set(clean, { id: f.id, title: clean, subfolder: 'Root' });
  }

  for (let i = 0; i < rootData.subfolders.length; i++) {
    const sf = rootData.subfolders[i];
    console.log(`[${law.prefix}] Subpasta ${i+1}/${rootData.subfolders.length}: ${sf.title}...`);
    const files = await crawlSubfolder(page, sf.id, sf.title, law.prefix);
    console.log(`   -> ${files.length} arquivos.`);
    for (const f of files) {
      let clean = f.title.replace(/\.mp3$/i, '').trim() + '.mp3';
      allMap.set(clean, { id: f.id, title: clean, subfolder: sf.title });
    }
  }

  const allAudios = Array.from(allMap.values());
  console.log(`\n========================================`);
  console.log(`TOTAL DE ARQUIVOS ${law.prefix} COLETADOS: ${allAudios.length}`);
  console.log(`========================================\n`);

  fs.writeFileSync(law.outputFile, JSON.stringify(allAudios, null, 2));
}

async function main() {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage();

  const laws = [
    {
      prefix: 'CTN',
      name: 'Código Tributário Nacional',
      folderId: '1mXt_3mOuy27rcswMX-Mn1RZd4rAnedQU',
      outputFile: 'scratch/ctn_complete_files.json'
    },
    {
      prefix: 'CE',
      name: 'Código Eleitoral',
      folderId: '1dLQRotWasMhTf5UZ5tuPQ_2pXE0eSfIK',
      outputFile: 'scratch/ce_complete_files.json'
    },
    {
      prefix: 'CPC',
      name: 'Código de Processo Civil',
      folderId: '17NeqUqeAIKKeX2UWFsTMhzWDbYM28DfD',
      outputFile: 'scratch/cpc_complete_files.json'
    }
  ];

  for (const law of laws) {
    try {
      await processLaw(page, law);
    } catch (e) {
      console.error(`Erro ao processar ${law.prefix}:`, e);
    }
  }

  await browser.close();
  console.log('Todos os arquivos coletados com sucesso!');
}

main().catch(console.error);
