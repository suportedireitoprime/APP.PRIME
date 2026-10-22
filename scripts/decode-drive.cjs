const fs = require('fs');

const content = fs.readFileSync('scripts/script_33.js', 'utf8');
const match = content.match(/window\['_DRIVE_ivd'\]\s*=\s*'([^']+)'/);

if (!match) {
  console.log('No match');
  process.exit(1);
}

// Em vez de eval, desescapa \xNN e \uNN
const hexDecoded = match[1].replace(/\\x([0-9A-Fa-f]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
fs.writeFileSync('scripts/drive_ivd.json', hexDecoded, 'utf8');

const data = JSON.parse(hexDecoded);
console.log('Total items in root:', data.length);

const items = [];
function findItems(arr) {
  if (!Array.isArray(arr)) return;
  // Padrão do drive: [id, [parentId], name, mimeType]
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
console.log('Items found in folder:', items.length);
console.log('Items list:', JSON.stringify(items, null, 2));
