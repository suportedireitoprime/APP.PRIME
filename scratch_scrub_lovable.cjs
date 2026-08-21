const fs = require('fs');
const path = require('path');
function scrub(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  for (const f of files) {
    if (f.name === 'node_modules' || f.name === '.git' || f.name === 'dist') continue;
    const fullPath = path.join(dir, f.name);
    if (f.isDirectory()) scrub(fullPath);
    else if (f.name.endsWith('.ts') || f.name.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      if (content.toLowerCase().includes('lovable')) {
        content = content.replace(/lovable/ig, 'Gemini');
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log('Scrubbed: ' + fullPath);
      }
    }
  }
}
scrub('./src');
scrub('./supabase');
