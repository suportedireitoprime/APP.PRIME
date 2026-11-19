const fs = require('fs');

const html = fs.readFileSync('scripts/pilulas_drive.html', 'utf8');

// Find where "Direito" or "Civil" or "LINDB" appears in html
const words = ['Direito', 'Civil', 'Penal', 'Constitucional', 'Trabalho', 'LINDB', 'Pessoas'];

for (const w of words) {
  const idx = html.indexOf(w);
  console.log(`Word "${w}": index = ${idx}`);
  if (idx !== -1) {
    console.log(`Context around "${w}":`);
    console.log(html.slice(Math.max(0, idx - 150), Math.min(html.length, idx + 250)));
    console.log('---');
  }
}
