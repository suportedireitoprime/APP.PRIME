import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const srcDir = path.join(__dirname, '../src');

function walkSync(dir, filelist = []) {
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    if (fs.statSync(dirFile).isDirectory()) {
      filelist = walkSync(dirFile, filelist);
    } else if (dirFile.endsWith('.ts') || dirFile.endsWith('.tsx')) {
      filelist.push(dirFile);
    }
  });
  return filelist;
}

const files = walkSync(srcDir);
let changedCount = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes("from 'date-fns'") || content.includes('from "date-fns"') || content.includes('date-fns/locale')) {
    
    // Replace imports
    content = content.replace(/import\s+\{([^}]+)\}\s+from\s+['"]date-fns['"];?/g, 'import { $1 } from "@/lib/dateUtils";');
    
    // Remove locale imports
    content = content.replace(/import\s+\{([^}]+)\}\s+from\s+['"]date-fns\/locale['"];?\n?/g, '');
    
    // Replace format with locale: ptBR object -> format(date, pattern)
    // Example: format(new Date(erro.created_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })
    content = content.replace(/,\s*\{\s*locale:\s*ptBR\s*\}\s*\)/g, ')');
    
    // Replace formatDistanceToNow
    // formatDistanceToNow(date, { addSuffix: true, locale: ptBR })
    content = content.replace(/formatDistanceToNow\(([^,]+),\s*\{\s*addSuffix:\s*(true|false),\s*locale:\s*ptBR\s*\}\)/g, 'formatDistanceToNow($1, { addSuffix: $2 })');
    content = content.replace(/formatDistanceToNow\(([^,]+),\s*\{\s*locale:\s*ptBR\s*\}\)/g, 'formatDistanceToNow($1)');
    
    // Write back
    fs.writeFileSync(file, content, 'utf8');
    console.log('Updated', file);
    changedCount++;
  }
}
console.log('Done! Updated ' + changedCount + ' files.');
