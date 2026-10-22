const fs = require('fs');

async function scanDriveFolderById(folderId, folderName) {
  const url = `https://drive.google.com/drive/folders/${folderId}`;
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    const html = await res.text();
    const match = html.match(/window\['_DRIVE_ivd'\]\s*=\s*'([^']+)'/);
    if (!match) return { folderName, folderId, subfolders: [], files: [], error: 'no _DRIVE_ivd' };

    const hexDecoded = match[1].replace(/\\x([0-9A-Fa-f]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
    const data = JSON.parse(hexDecoded);

    const items = [];
    function findItems(arr) {
      if (!Array.isArray(arr)) return;
      if (arr.length >= 4 && typeof arr[0] === 'string' && arr[0].length >= 20 && typeof arr[2] === 'string') {
        items.push({
          id: arr[0],
          name: arr[2],
          mimeType: arr[3]
        });
      }
      for (const el of arr) {
        if (Array.isArray(el)) findItems(el);
      }
    }
    findItems(data);

    const subfolders = items.filter(it => it.mimeType === 'application/vnd.google-apps.folder');
    const files = items.filter(it => it.mimeType !== 'application/vnd.google-apps.folder');

    return { folderName, folderId, subfolders, files };
  } catch (e) {
    return { folderName, folderId, error: e.message };
  }
}

async function run() {
  const targets = [
    { name: 'DIREITO_CIVIL (1)', id: '1GTH6tqarbphOUlJZmJBxhrfLX6XdaWS0' },
    { name: 'DIREITO_CIVIL (2)', id: '11jp7wOR9qSodQy7zfAZx3u2yox7tKrGl' },
    { name: 'DIREITO_PROCESSUAL_CIVIL', id: '1PPO_Al3G-UW1FtzNBmn8my7Ltm32Wvap' },
    { name: 'DIREITO_TRIBUTARIO', id: '1fDkHxU5TUofr_dDXY_NIDzYD8wr6Kp9g' },
    { name: 'CLT', id: '1MSRI2ro2OTqSUEs0hc-uBGVSdVXdKv_t' },
    // Let's also check one that was already uploaded, e.g. DIREITO_ADMINISTRATIVO or DIREITO_CONSTITUCIONAL
    { name: 'DIREITO_ADMINISTRATIVO', id: '1RHqLwhOgiQM8pYHHr9HlXOfJfi_gVn2w' },
    { name: 'DIREITO_PENAL', id: '1GnhklC5TPcefkmZJbi2nfdeBwKOS0bXC' }
  ];

  for (const t of targets) {
    const res = await scanDriveFolderById(t.id, t.name);
    console.log(`\n=== ${t.name} (${t.id}) ===`);
    if (res.error) {
      console.log('Erro:', res.error);
    } else {
      console.log(`Subpastas: ${res.subfolders.length}, Arquivos diretos: ${res.files.length}`);
      if (res.subfolders.length > 0) {
        console.log('Subpastas (amostra):', res.subfolders.slice(0, 5).map(s => s.name));
      }
      if (res.files.length > 0) {
        console.log('Arquivos (amostra):', res.files.slice(0, 5).map(f => f.name));
      }
    }
  }
}

run().catch(console.error);
