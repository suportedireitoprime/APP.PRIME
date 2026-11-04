const fs = require('fs');
const path = require('path');

const tables = JSON.parse(fs.readFileSync('tabelas_types.json', 'utf8'));

function getAllFiles(dir, exts = ['.ts', '.tsx', '.js', '.jsx']) {
  let res = [];
  if (!fs.existsSync(dir)) return res;
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== 'dist') {
        res = res.concat(getAllFiles(full, exts));
      }
    } else {
      if (exts.includes(path.extname(full)) && !full.includes('types.ts')) {
        res.push(full);
      }
    }
  }
  return res;
}

const files = getAllFiles('src').concat(getAllFiles('supabase/functions'));
console.log('Total files scanned:', files.length);

const fileContents = files.map(f => fs.readFileSync(f, 'utf8'));

const unreferenced = [];
const tableUsage = {};

for (const t of tables) {
  let count = 0;
  const regex = new RegExp(`['"\`]${t}['"\`]`, 'g');
  for (const c of fileContents) {
    const matches = c.match(regex);
    if (matches) count += matches.length;
  }
  tableUsage[t] = count;
  if (count === 0) unreferenced.push(t);
}

console.log('Unreferenced tables count:', unreferenced.length);
fs.writeFileSync('tabelas_sem_referencia.json', JSON.stringify(unreferenced, null, 2));
console.log('Sample:', unreferenced.slice(0, 30));
