const fs = require('fs');

const html = fs.readFileSync('embedded_folderview.html', 'utf-8');
const title = html.match(/<title>(.*?)<\/title>/);
console.log('Title:', title ? title[1] : 'No title');

const entries = [];
const regex = /class="flip-entry"[^>]*>([\s\S]*?)<\/div><\/div><\/div>/g;
let match;
while ((match = regex.exec(html)) !== null) {
  const block = match[1];
  const nameMatch = block.match(/entry-name">([^<]+)<\/div>/);
  const idMatch = block.match(/id="entry-([a-zA-Z0-9_-]+)"/);
  const isFolder = block.includes('folder') || block.includes('drive/folders');
  if (nameMatch) {
    entries.push({
      name: nameMatch[1],
      id: idMatch ? idMatch[1] : null,
      isFolder
    });
  }
}

console.log('Total entries found:', entries.length);
entries.forEach(e => console.log(e.isFolder ? '[FOLDER]' : '[FILE]', e.id, '-->', e.name));

