const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('src');
let found = 0;
for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  const identifiers = new Set();
  const duplicates = new Set();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check standard import Default from '...'
    const match1 = line.match(/^import\s+([A-Za-z0-9_]+)\s+from\s+['"]/);
    if (match1) {
      if (identifiers.has(match1[1])) duplicates.add(match1[1]);
      identifiers.add(match1[1]);
    }
    
    // Check named imports import { A, B } from '...'
    const match2 = line.match(/^import\s+{[^}]+}/);
    if (match2) {
      const names = match2[0].replace(/import\s+{/, '').replace(/}/, '').split(',');
      for (let n of names) {
        n = n.trim().split(' as ')[1] || n.trim().split(' as ')[0];
        if (n && identifiers.has(n)) duplicates.add(n);
        if (n) identifiers.add(n);
      }
    }
  }
  if (duplicates.size > 0) {
    console.log(file + ' => ' + Array.from(duplicates).join(', '));
    found++;
  }
}
if (found === 0) console.log('No duplicate imports found!');
