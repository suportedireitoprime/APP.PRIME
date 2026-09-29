const fs = require('fs');
const file = 'src/components/admin/AdminHojeCards.tsx';
let content = fs.readFileSync(file, 'utf8');

// Remove totalTrial += m.trial || 0;
content = content.replace(/totalTrial \+= m\.trial \|\| 0;/g, '// totalTrial += m.trial || 0; // Ignorado, vamos usar apenas subUsers.size');

// Replace Math.max logic
content = content.replace(/totalTrial = Math\.max\(totalTrial, subUsers\.size\);/g, 'totalTrial = subUsers.size;');

// Replace if (totalTrial > subUsers.size) logic
content = content.replace(/if \(totalTrial > subUsers\.size\) \{\s+somaValores \+= \(totalTrial - subUsers\.size\) \* 29\.90;\s+\}/g, '');

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed totalTrial metric');
