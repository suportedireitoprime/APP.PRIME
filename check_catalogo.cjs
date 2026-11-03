const fs = require('fs');
const code = fs.readFileSync('src/data/aulasInterativasCatalogoCompleto.ts', 'utf-8');
const regex = /areaId:\s*['"]([^'"]+)['"]/g;
let m;
const set = new Set();
while ((m = regex.exec(code)) !== null) {
  set.add(m[1]);
}
console.log('Unique areaId count:', set.size);
console.log('Areas:', Array.from(set));

// Check total lessons count
const idRegex = /id:\s*['"]([^'"]+)['"]/g;
let idCount = 0;
while ((m = idRegex.exec(code)) !== null) {
  idCount++;
}
console.log('Approx items count in aulasInterativasCatalogoCompleto:', idCount);

