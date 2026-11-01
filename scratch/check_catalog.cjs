const fs = require('fs');
const content = fs.readFileSync('src/data/aulasInterativasCatalogoCompleto.ts', 'utf8');
const count = (content.match(/"numeroAula":/g) || []).length;
console.log('Total de aulas cadastradas no catalogo:', count);

