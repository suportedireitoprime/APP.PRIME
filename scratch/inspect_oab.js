import fs from 'fs';

async function inspectFolder(folderId) {
  const url = `https://drive.google.com/drive/folders/${folderId}`;
  console.log('Fetching Google Drive folder:', url);

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  });

  const html = await res.text();
  console.log('HTML size:', html.length);

  const match = html.match(/window\['_DRIVE_ivd'\]\s*=\s*'([^']+)'/);
  if (!match) {
    console.log('No window._DRIVE_ivd found! Let us check for other markers...');
    const matchInit = html.match(/AF_initDataCallback\((.*?)\);<\/script>/gs);
    console.log('Found AF_initDataCallback scripts:', matchInit ? matchInit.length : 0);
    fs.writeFileSync('scratch/oab_drive.html', html);
    return;
  }

  let jsonStr = match[1].replace(/\\x([0-9A-Fa-f]{2})/g, (m, c) => String.fromCharCode(parseInt(c, 16)));
  jsonStr = jsonStr.replace(/\\\//g, '/');
  const data = JSON.parse(jsonStr);

  const items = [];
  function inspect(arr) {
    if (!Array.isArray(arr)) return;
    if (typeof arr[0] === 'string' && arr[0].length >= 25 && typeof arr[2] === 'string') {
      items.push({
        id: arr[0],
        title: arr[2],
        mimeType: arr[3],
      });
    }
    for (const child of arr) {
      if (Array.isArray(child)) inspect(child);
    }
  }
  inspect(data);

  console.log(`Found ${items.length} top-level items:`);
  console.log(items.slice(0, 15));
  fs.writeFileSync('scratch/oab_top_items.json', JSON.stringify(items, null, 2));
}

inspectFolder('1ipBkQi7VP5XTcfhpDjvfGx8J4DH4USp8').catch(console.error);
