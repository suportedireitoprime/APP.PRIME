const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  for (const f of files) {
    const fullPath = path.join(dir, f.name);
    if (f.isDirectory()) processDir(fullPath);
    else if (f.name.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let originalContent = content;
      let changed = false;

      if (content.includes('LOVABLE_API_KEY') || content.includes('Lovable-API-Key') || content.includes('Lovable AI Gateway')) {
        // Replace Lovable API Key fetches
        content = content.replace(/const\s+LOVABLE_API_KEY\s*=\s*undefined;?\n?/g, '');
        content = content.replace(/const\s+LOVABLE_API_KEY\s*=\s*Deno\.env\.get\(['"`]LOVABLE_API_KEY['"`]\);?\n?/g, '');
        content = content.replace(/let\s+LOVABLE_API_KEY\s*=\s*Deno\.env\.get\(['"`]LOVABLE_API_KEY['"`]\);?\n?/g, '');
        
        // Remove from conditions
        content = content.replace(/&&\s*!LOVABLE_API_KEY/g, '');
        content = content.replace(/\|\|\s*!LOVABLE_API_KEY/g, '');
        content = content.replace(/if\s*\(!LOVABLE_API_KEY\)\s*return null;?\n?/g, '');
        content = content.replace(/if\s*\(!LOVABLE_API_KEY\)\s*throw new Error\([^)]+\);?\n?/g, '');
        
        // Replace text in strings
        content = content.replace(/LOVABLE_API_KEY/g, 'GEMINI_API_KEY');
        content = content.replace(/Lovable-API-Key/g, 'Authorization'); // For headers
        content = content.replace(/Lovable AI Gateway/gi, 'Gemini API');
        
        if (content !== originalContent) {
          fs.writeFileSync(fullPath, content, 'utf8');
          console.log('Cleaned: ' + fullPath);
          changed = true;
        }
      }
    }
  }
}
processDir('./supabase/functions');
