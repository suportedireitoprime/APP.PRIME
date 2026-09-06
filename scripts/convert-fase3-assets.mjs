import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const specificFiles = [
  'src/assets/lei-cover-ec.jpg',
  'src/assets/lei-cover-eca.jpg',
  'src/assets/lei-cover-ed.jpg',
  'src/assets/lei-cover-eir.jpg',
  'src/assets/lei-cover-eoab.jpg',
  'src/assets/lei-cover-epd.jpg',
  'src/assets/norma-cover-lc.jpg',
  'src/assets/norma-cover-lei.jpg',
  'src/assets/norma-cover-mp.jpg',
  'src/assets/capa-direito-medico.jpg',
  'src/assets/capa-filosofia.jpg',
  'src/assets/capa-lei-penal-especial.jpg',
  'src/assets/capa-processo-penal.jpg',
  'src/assets/filosofos/socrates.jpg',
  'src/assets/assistente-feature-1.jpg',
  'src/assets/assistente-feature-2.jpg',
  'src/assets/assistente-feature-3.jpg',
];

const directories = [
  'src/assets/boletim-tipos',
];

async function convertFile(relPath, maxWidth = 800, quality = 82) {
  const fullPath = path.join(rootDir, relPath);
  if (!fs.existsSync(fullPath)) return;

  const ext = path.extname(fullPath);
  const dir = path.dirname(fullPath);
  const baseName = path.basename(fullPath, ext);
  const webpPath = path.join(dir, `${baseName}.webp`);

  const buffer = fs.readFileSync(fullPath);
  const origSize = buffer.length;

  try {
    let transformer = sharp(buffer);
    const meta = await transformer.metadata();
    if (meta.width && meta.width > maxWidth) {
      transformer = transformer.resize({ width: maxWidth, withoutEnlargement: true });
    }
    const webpBuffer = await transformer.webp({ quality, effort: 4 }).toBuffer();
    fs.writeFileSync(webpPath, webpBuffer);
    fs.unlinkSync(fullPath);
    console.log(`Converted: ${relPath} (${Math.round(origSize / 1024)}KB) -> ${baseName}.webp (${Math.round(webpBuffer.length / 1024)}KB)`);
  } catch (err) {
    console.error(`Error converting ${relPath}:`, err);
  }
}

async function run() {
  console.log('--- Converting remaining JPGs in src/assets ---');
  for (const f of specificFiles) {
    await convertFile(f);
  }

  for (const d of directories) {
    const fullDir = path.join(rootDir, d);
    if (!fs.existsSync(fullDir)) continue;
    const files = fs.readdirSync(fullDir);
    for (const file of files) {
      if (file.toLowerCase().endsWith('.jpg') || file.toLowerCase().endsWith('.png')) {
        await convertFile(path.join(d, file));
      }
    }
  }

  console.log('--- Done converting assets ---');
}

run();
