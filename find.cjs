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
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      const content = fs.readFileSync(file, 'utf8');
      const flat = content.replace(/\n/g, ' ');
      if (flat.match(/(?<!\.)useState\b/) && !flat.match(/import\s+.*?useState.*?from\s+['"]react['"]/)) {
        results.push(file);
      }
    }
  });
  return results;
}
console.log(walk('src'));
