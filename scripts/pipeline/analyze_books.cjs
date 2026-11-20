const fs = require('fs');

const files = JSON.parse(fs.readFileSync('scripts/pipeline/classicos_files_list.json', 'utf8'));

// Group by book prefix, e.g. "01-o-caso-dos-irmaos-naves"
const books = {};

files.forEach(f => {
  // Filename format: e.g. "01-o-caso-dos-irmaos-naves.mp3", "01-o-caso-dos-irmaos-naves-ficha-cornell.pdf", etc.
  const name = f.name;
  const match = name.match(/^(\d{2}-[a-z0-9-]+?)(?:-ficha-cornell\.pdf|-roteiro\.txt|\.mp3|\.srt)$/i);
  let baseKey = match ? match[1] : name.replace(/\.(mp3|srt|pdf|txt)$/i, '').replace(/-(ficha-cornell|roteiro)$/i, '');
  
  if (!books[baseKey]) {
    books[baseKey] = {
      baseKey,
      name,
      files: {}
    };
  }

  if (name.endsWith('.mp3')) books[baseKey].files.mp3 = f;
  else if (name.endsWith('.srt')) books[baseKey].files.srt = f;
  else if (name.includes('ficha-cornell') || name.endsWith('.pdf')) books[baseKey].files.pdf = f;
  else if (name.includes('roteiro') || name.endsWith('.txt')) books[baseKey].files.txt = f;
  else books[baseKey].files.other = f;
});

console.log('Total grouped books:', Object.keys(books).length);
console.log('Book keys:');
Object.keys(books).sort().forEach(k => {
  const b = books[k];
  const types = Object.keys(b.files).join(', ');
  console.log(`- ${k}: [${types}]`);
});
