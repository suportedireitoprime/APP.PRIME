const fs = require('fs');
const file = 'supabase/functions/asaas-checkout/index.ts';
let content = fs.readFileSync(file, 'utf8');

// Fix baseValue
content = content.replace(/if \(plan === 'vitalicio'\) \{\s+baseValue = 299\.00;\s+\} else if \(plan === 'vitalicio_pix'\) \{\s+baseValue = 250\.00;/g, 
  "if (plan === 'vitalicio') {\n        baseValue = 280.00;\n      } else if (plan === 'vitalicio_pix') {\n        baseValue = 280.00;");

// Fix tax logic: only apply if num > 1
content = content.replace(/if \(isCreditCard\) \{\s+let taxRate = 0;\s+if \(num === 1\) taxRate = 0\.0339;\s+else if \(num <= 6\) taxRate = 0\.0389;\s+else taxRate = 0\.0439;\s+totalWithTax = Number\(\(\(baseValue \+ 0\.29\) \/ \(1 - taxRate\)\)\.toFixed\(2\)\);\s+\}/,
  "if (isCreditCard && num > 1) {\n          let taxRate = 0;\n          if (num <= 6) taxRate = 0.0389;\n          else taxRate = 0.0439;\n          totalWithTax = Number(((baseValue + 0.29) / (1 - taxRate)).toFixed(2));\n        }");

// Fix planoFinal
content = content.replace(/const planoFinal = plan === 'mensal' \? 'mensal' : \(plan === 'promocao' \? 'anual_promocional' : 'anual'\);/,
  "const planoFinal = plan === 'mensal' ? 'mensal' : (plan === 'vitalicio' || plan === 'vitalicio_pix' ? 'vitalicio' : (plan === 'promocao' ? 'anual_promocional' : 'anual'));");

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed asaas-checkout logic');
