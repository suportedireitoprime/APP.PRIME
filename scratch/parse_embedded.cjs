const fs = require('fs');
const html = fs.readFileSync('scratch/embedded_drive.html', 'utf8');

// Procura nomes e links de arquivos no embeddedfolderview
const fileEntries = [];
const regex = /<a[^>]+href="([^"]+)"[^>]*>(.*?)<\/a>/gi;
let m;
while ((m = regex.exec(html)) !== null) {
  const href = m[1];
  const text = m[2].replace(/<[^>]+>/g, '').trim();
  if (href.includes('drive.google.com') || href.includes('folders') || href.includes('file')) {
    fileEntries.push({ href, text });
  }
}

console.log('Links encontrados no embedded view:', fileEntries.length);
fileEntries.forEach((f, idx) => {
  console.log(`${idx + 1}. [${f.text}] -> ${f.href}`);
});

// Procura também por dados estruturados ou divs de itens
const entryRegex = /class="flip-entry-info"[^>]*>([\s\S]*?)<\/div>/gi;
let em;
const names = [];
while ((em = entryRegex.exec(html)) !== null) {
  const clean = em[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  names.push(clean);
}
console.log('\nNomes em flip-entry-info:', names.length);
names.forEach((n, idx) => console.log(`${idx + 1}. ${n}`));
