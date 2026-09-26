const fs = require('fs');
const p = 'C:/Users/ext_wpereira/OneDrive - Vitamina Work Life S.A/Documentos/APP.PRIME/src/pages/Atualizacoes.tsx';
let c = fs.readFileSync(p, 'utf8');
const lines = c.split('\n');
// Remove lines 442+ that are duplicate imports
const cleaned = lines.filter((l, i) => {
  if (i >= 441 && (l.includes("import { Browser }") || l.includes("import { Capacitor }") || l.trim() === '')) {
    return false;
  }
  return true;
});
fs.writeFileSync(p, cleaned.join('\n'), 'utf8');
console.log('Done');
