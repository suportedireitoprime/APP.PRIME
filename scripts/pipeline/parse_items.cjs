const fs = require('fs');

const html = fs.readFileSync('embedded_folderview.html', 'utf-8');

const regex = /<div class="flip-entry" id="entry-([a-zA-Z0-9_-]+)"[\s\S]*?href="([^"]+)"[\s\S]*?<div class="flip-entry-title">([^<]+)<\/div>/g;

let m;
const items = [];
while ((m = regex.exec(html)) !== null) {
  items.push({
    id: m[1],
    url: m[2],
    name: m[3].trim(),
    isFolder: m[2].includes('/folders/')
  });
}

console.log(`Found ${items.length} folders/files inside "Aulas Produzidas":`);
items.forEach(it => {
  console.log(`${it.isFolder ? '[PASTA]' : '[ARQUIVO]'} ${it.name} | id: ${it.id}`);
});

fs.writeFileSync('gdrive_items.json', JSON.stringify(items, null, 2), 'utf-8');

