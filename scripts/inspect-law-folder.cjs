const fs = require('fs');

async function testFolder(id, name) {
  const url = 'https://drive.google.com/drive/folders/' + id;
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } });
  const html = await res.text();
  const match = html.match(/window\['_DRIVE_ivd'\]\s*=\s*'([^']+)'/);
  if (!match) return console.log(name, 'No match for _DRIVE_ivd');

  const hexDecoded = match[1].replace(/\\x([0-9A-Fa-f]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
  const data = JSON.parse(hexDecoded);
  const items = [];
  function f(arr) {
    if (!Array.isArray(arr)) return;
    if (arr.length >= 4 && typeof arr[0] === 'string' && arr[0].length >= 20 && typeof arr[2] === 'string') {
      items.push({ id: arr[0], name: arr[2], mime: arr[3] });
    }
    for (const x of arr) if (Array.isArray(x)) f(x);
  }
  f(data);
  console.log(`[${name}] Total items: ${items.length}`);
  console.log('Sample items:', items.slice(0, 10));
}

const id = process.argv[2] || '1J0QOxM_ANpmzujTCLZutv24uozpq58tj';
const name = process.argv[3] || 'CDC Arts 1-60';
testFolder(id, name);
