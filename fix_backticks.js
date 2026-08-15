const fs = require('fs');
['src/data/biografias/maquiavel.ts', 'src/data/biografias/santoAgostinho.ts'].forEach(f => {
  let txt = fs.readFileSync(f, 'utf8');
  txt = txt.replace(/```/g, '\\`\\`\\`');
  fs.writeFileSync(f, txt);
  console.log('Fixed', f);
});
