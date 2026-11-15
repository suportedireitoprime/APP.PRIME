const https = require('https');
const fs = require('fs');

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, (res) => {
      let data = '';
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(fetchUrl(res.headers.location));
      }
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    }).on('error', reject);
  });
}

async function main() {
  const folderId = '1y-uJSUw_MMP29rQjsFXKlNqVv5EVNXwl';
  const res = await fetchUrl('https://drive.google.com/drive/folders/' + folderId);
  console.log('Status:', res.status, 'Length:', res.data.length);
  if (res.data.includes('accounts.google.com/ServiceLogin')) {
    console.log('Access restricted! Requires permission or public link.');
    return;
  }
  
  fs.writeFileSync('gdrive_raw.html', res.data, 'utf-8');
  console.log('Saved raw HTML to gdrive_raw.html');

  // Try to find initialData or JSON payload inside script tags
  const regex = /\["([a-zA-Z0-9_-]{28,35})",\["([^"]+)"/g;
  let m;
  const items = [];
  while ((m = regex.exec(res.data)) !== null) {
    items.push({ id: m[1], name: m[2] });
  }
  console.log(`Found ${items.length} items with basic pattern`);
  
  // Also look for data-id or drive data array
  const matchesFolder = [...res.data.matchAll(/data-id="([a-zA-Z0-9_-]+)"/g)];
  console.log(`Found ${matchesFolder.length} data-id matches`);

  items.slice(0, 30).forEach(i => console.log(i.id, '-->', i.name));
}

main().catch(console.error);

