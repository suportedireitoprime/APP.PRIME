import fs from 'fs';

const text = fs.readFileSync('scratch/found_lines.txt', 'utf-8');
const idMatches = text.match(/edicao-[a-zA-Z0-9\-]+/g);
console.log('ID Matches count:', idMatches ? idMatches.length : 0);
if (idMatches) {
  const uniqueIds = Array.from(new Set(idMatches));
  console.log('Unique edicao- IDs:', uniqueIds.length);
  console.log(uniqueIds.slice(0, 20));
}
