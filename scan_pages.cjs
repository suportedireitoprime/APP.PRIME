const fs = require('fs');
const path = require('path');

const pagesDir = 'src/pages';
const pages = fs.readdirSync(pagesDir).filter(f => f.endsWith('.tsx') || f.endsWith('.ts'));

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
      if (exts.includes(path.extname(full))) {
        res.push(full);
      }
    }
  }
  return res;
}

const allFiles = getAllFiles('src');

const unusedPages = [];

for (const page of pages) {
  const baseName = path.basename(page, path.extname(page));
  // check references in other files
  let count = 0;
  for (const f of allFiles) {
    if (f.endsWith(page)) continue; // skip self
    const content = fs.readFileSync(f, 'utf8');
    if (content.includes(baseName)) {
      count++;
    }
  }
  if (count === 0) {
    unusedPages.push({ page, baseName });
  }
}

console.log('Unused pages count:', unusedPages.length);
console.log(JSON.stringify(unusedPages, null, 2));
