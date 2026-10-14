const fs = require('fs');

async function crawlFolder(folderId, depth = 0) {
  const url = `https://drive.google.com/drive/folders/${folderId}`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  });
  const html = await res.text();
  const match = html.match(/window\['_DRIVE_ivd'\]\s*=\s*'([^']+)'/);
  if (!match) {
    console.log(`[depth ${depth}] No ivd found for ${folderId}`);
    return { subfolders: [], files: [] };
  }
  let jsonStr = match[1].replace(/\\x([0-9A-Fa-f]{2})/g, (m, c) => String.fromCharCode(parseInt(c, 16)));
  jsonStr = jsonStr.replace(/\\\//g, '/');
  const data = JSON.parse(jsonStr);

  const subfolders = [];
  const files = [];

  function inspect(arr) {
    if (!Array.isArray(arr)) return;
    if (typeof arr[0] === 'string' && arr[0].length >= 25 && typeof arr[2] === 'string') {
      const itemTitle = arr[2];
      const mime = arr[3] || '';
      if (mime === 'application/vnd.google-apps.folder') {
        subfolders.push({ id: arr[0], title: itemTitle });
      } else {
        files.push({ id: arr[0], title: itemTitle, mime });
      }
    }
    for (const child of arr) {
      if (Array.isArray(child)) inspect(child);
    }
  }

  inspect(data);
  return { subfolders, files };
}

async function main() {
  console.log("=== CRAWLING CP (1IwO3rzWUCFvmbGIlwLvQQtX4eSXXXYQW) ===");
  const cpRoot = await crawlFolder("1IwO3rzWUCFvmbGIlwLvQQtX4eSXXXYQW");
  console.log(`CP Root: ${cpRoot.subfolders.length} subfolders, ${cpRoot.files.length} direct files`);
  if (cpRoot.subfolders.length > 0) {
    console.log("CP Subfolders:", cpRoot.subfolders.map(s => s.title));
  }
  if (cpRoot.files.length > 0) {
    console.log("CP Direct Files (first 10):", cpRoot.files.slice(0, 10).map(f => f.title));
  }

  console.log("\n=== CRAWLING CDC (1bRB6AYyGKntEKU8QIj6-sP1yikx4VUhZ) ===");
  const cdcRoot = await crawlFolder("1bRB6AYyGKntEKU8QIj6-sP1yikx4VUhZ");
  console.log(`CDC Root: ${cdcRoot.subfolders.length} subfolders, ${cdcRoot.files.length} direct files`);
  if (cdcRoot.subfolders.length > 0) {
    console.log("CDC Subfolders:", cdcRoot.subfolders.map(s => s.title));
  }
  if (cdcRoot.files.length > 0) {
    console.log("CDC Direct Files (first 10):", cdcRoot.files.slice(0, 10).map(f => f.title));
  }

  fs.writeFileSync('scratch/cp_root.json', JSON.stringify(cpRoot, null, 2));
  fs.writeFileSync('scratch/cdc_root.json', JSON.stringify(cdcRoot, null, 2));
}

main().catch(console.error);
