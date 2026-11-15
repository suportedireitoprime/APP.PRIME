const fs = require('fs');

const code = fs.readFileSync('src/data/aulasInterativasCatalogoCompleto.ts', 'utf-8');
const sIdx = code.indexOf('export const AULAS_CATALOGO_COMPLETO');
console.log(code.slice(sIdx, sIdx + 1200));

