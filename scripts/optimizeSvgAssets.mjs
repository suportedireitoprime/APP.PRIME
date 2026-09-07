import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const TARGET_DIRS = [
  path.join(rootDir, 'public'),
  path.join(rootDir, 'src', 'assets'),
];

function minifySvg(svgString) {
  return svgString
    // Remove XML declaration and doctype
    .replace(/<\?xml[\s\S]*?\?>/gi, '')
    .replace(/<!DOCTYPE[\s\S]*?>/gi, '')
    // Remove comments
    .replace(/<!--[\s\S]*?-->/g, '')
    // Remove redundant metadata namespaces/tags
    .replace(/<metadata[\s\S]*?<\/metadata>/gi, '')
    // Collapse multi-whitespace
    .replace(/\s{2,}/g, ' ')
    // Remove whitespace between tags
    .replace(/>\s+</g, '><')
    .trim();
}

function processDir(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      processDir(fullPath);
    } else if (entry.isFile() && entry.name.endsWith('.svg')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const minified = minifySvg(content);
      if (minified.length < content.length) {
        fs.writeFileSync(fullPath, minified, 'utf8');
        const diff = content.length - minified.length;
        console.log(`[optimizeSvg] Minificado ${path.relative(rootDir, fullPath)} (-${diff} bytes)`);
      }
    }
  }
}

console.log('[optimizeSvg] Iniciando minificação de vetores SVG...');
TARGET_DIRS.forEach(processDir);
console.log('[optimizeSvg] Concluído com sucesso.');
