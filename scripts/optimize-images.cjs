const fs = require('fs');
const path = require('path');
const sharp = require(path.resolve(process.cwd(), 'node_modules/sharp'));

const DIRS = [
  path.resolve(process.cwd(), 'src/assets'),
  path.resolve(process.cwd(), 'public/assets'),
  path.resolve(process.cwd(), 'public/images'),
];

async function scanAndOptimize(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await scanAndOptimize(fullPath);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (['.png', '.jpg', '.jpeg'].includes(ext)) {
        // Ignora ícones nativos especiais se houver
        if (entry.name.includes('ic_launcher')) continue;
        const stat = fs.statSync(fullPath);
        // Otimiza arquivos acima de 50KB
        if (stat.size > 50 * 1024) {
          const webpPath = fullPath.replace(/\.(png|jpg|jpeg)$/i, '.webp');
          if (!fs.existsSync(webpPath)) {
            try {
              await sharp(fullPath).webp({ quality: 80 }).toFile(webpPath);
              const newStat = fs.statSync(webpPath);
              const saved = ((stat.size - newStat.size) / 1024).toFixed(1);
              console.log(`[OK] Convertido: ${path.relative(process.cwd(), fullPath)} -> .webp (-${saved} KB)`);
            } catch (err) {
              console.warn(`[SKIP] Não foi possível converter ${entry.name}:`, err.message);
            }
          }
        }
      }
    }
  }
}

async function main() {
  console.log('--- Iniciando Otimização Automática de Imagens para WebP ---');
  for (const dir of DIRS) {
    await scanAndOptimize(dir);
  }
  console.log('--- Otimização concluída ---');
}

main().catch(console.error);

