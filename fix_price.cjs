const fs = require('fs');
const file = 'src/pages/Assinatura.tsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/250,00(.*?)Acesso Vital/g, '280,00 Vital');
fs.writeFileSync(file, content, 'utf8');
console.log('Fixed price in Assinatura.tsx');
