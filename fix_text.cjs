const fs = require('fs');
const file = 'src/components/assinatura/PricingCards.tsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/ou R\$ 199,90 (.*?)vista \(pagamento(.*?)\)/g, 'ou R$ 199,90 à vista');
fs.writeFileSync(file, content, 'utf8');
console.log('Fixed text in PricingCards.tsx');
