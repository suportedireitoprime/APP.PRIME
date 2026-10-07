const fs = require('fs');
let content = fs.readFileSync('src/components/lei-seca/chunks/LeiSecaTrilhaCard.tsx', 'utf8');

content = content.replace(
  '{r ? `${r.concluidas}/${r.total}` : `${trilha.partes?.length ?? 0}p`}',
  '{r ? `${r.concluidas}/${r.total}` : "0 Lições"}'
);

fs.writeFileSync('src/components/lei-seca/chunks/LeiSecaTrilhaCard.tsx', content, 'utf8');
