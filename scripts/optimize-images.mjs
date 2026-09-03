import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Dinamically import sharp to avoid errors if it's not installed
let sharp;
try {
  sharp = (await import('sharp')).default;
} catch (e) {
  console.error("Sharp não está instalado no projeto. Rode 'npm install sharp' ou use npx.");
  process.exit(1);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SRC_DIR = path.resolve(__dirname, '../src');

async function processDirectory(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await processDirectory(fullPath);
    } else {
      const ext = path.extname(fullPath).toLowerCase();
      
      if (['.png', '.jpg', '.jpeg'].includes(ext)) {
        const outPath = fullPath.substring(0, fullPath.lastIndexOf('.')) + '.webp';
        console.log(`Convertendo: ${fullPath} -> ${outPath}`);
        try {
          await sharp(fullPath)
            .webp({ quality: 80, effort: 6 })
            .toFile(outPath);
          console.log(`Sucesso! Apagando original: ${fullPath}`);
          await fs.unlink(fullPath);
        } catch (err) {
          console.error(`Erro ao converter ${fullPath}:`, err);
        }
      } 
      // Comprimir webp gigante
      else if (ext === '.webp') {
        const stat = await fs.stat(fullPath);
        if (stat.size > 500 * 1024) { // maior que 500kb
          console.log(`Recomprimindo WEBP gigante: ${fullPath} (${(stat.size/1024).toFixed(1)} KB)`);
          const tempPath = fullPath + '.temp';
          try {
            await sharp(fullPath)
              .resize({ width: 1200, withoutEnlargement: true })
              .webp({ quality: 80, effort: 6 })
              .toFile(tempPath);
            await fs.unlink(fullPath);
            await fs.rename(tempPath, fullPath);
            console.log(`Sucesso na compressão.`);
          } catch (err) {
            console.error(`Erro ao recomprimir ${fullPath}:`, err);
          }
        }
      }
    }
  }
}

async function main() {
  console.log('Iniciando otimização de imagens em', SRC_DIR);
  await processDirectory(SRC_DIR);
  console.log('Conversão concluída!');
}

main();
