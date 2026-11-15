const fs = require('fs');

const code = fs.readFileSync('src/data/aulasInterativasCatalogoCompleto.ts', 'utf-8');
const discMatches = [...code.matchAll(/"disciplinaId":\s*"([^"]+)"/g)];
const discCounts = {};
discMatches.forEach(m => {
  discCounts[m[1]] = (discCounts[m[1]] || 0) + 1;
});
console.log('Disciplinas in MATERIAS_CATALOGO_COMPLETO:', discCounts);

const aulaMatches = [...code.matchAll(/export const AULAS_CATALOGO_COMPLETO: AulaItem\[\] = ([\s\S]*?);\n\nexport const/g)];
console.log('Found AULAS_CATALOGO_COMPLETO');

