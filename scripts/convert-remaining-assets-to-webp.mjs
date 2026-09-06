import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const targets = [
  {
    dir: path.join(rootDir, 'public', 'pilulas'),
    maxWidth: 900,
    quality: 82,
    recursive: false,
  },
  {
    dir: path.join(rootDir, 'public', 'pilulas', 'ministros'),
    maxWidth: 600,
    quality: 82,
    recursive: false,
  },
  {
    dir: path.join(rootDir, 'src', 'assets', 'thumbnails'),
    maxWidth: 800,
    quality: 80,
    recursive: false,
  },
  {
    dir: path.join(rootDir, 'src', 'assets', 'paywall'),
    maxWidth: 900,
    quality: 82,
    recursive: false,
  },
  {
    dir: path.join(rootDir, 'src', 'assets', 'onboarding'),
    maxWidth: 800,
    quality: 82,
    recursive: false,
  },
];

async function convertDirectory({ dir, maxWidth, quality }) {
  if (!fs.existsSync(dir)) {
    console.log(`Directory not found: ${dir}`);
    return;
  }

  const files = fs.readdirSync(dir);
  let convertedCount = 0;
  let savedBytes = 0;

  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    if (ext !== '.png' && ext !== '.jpg' && ext !== '.jpeg') {
      continue;
    }

    const filePath = path.join(dir, file);
    const baseName = path.basename(file, ext);
    const webpPath = path.join(dir, `${baseName}.webp`);

    const originalBuffer = fs.readFileSync(filePath);
    const originalSize = originalBuffer.length;

    try {
      let transformer = sharp(originalBuffer);
      const metadata = await transformer.metadata();

      if (maxWidth && metadata.width && metadata.width > maxWidth) {
        transformer = transformer.resize({ width: maxWidth, withoutEnlargement: true });
      }

      const webpBuffer = await transformer
        .webp({ quality, effort: 4 })
        .toBuffer();

      fs.writeFileSync(webpPath, webpBuffer);
      const newSize = webpBuffer.length;

      // Remove the old legacy file
      fs.unlinkSync(filePath);

      savedBytes += (originalSize - newSize);
      convertedCount++;
      console.log(`Converted: ${file} (${Math.round(originalSize / 1024)}KB) -> ${baseName}.webp (${Math.round(newSize / 1024)}KB)`);
    } catch (err) {
      console.error(`Error converting ${file}:`, err);
    }
  }

  console.log(`[${path.relative(rootDir, dir)}] Converted ${convertedCount} files. Saved: ${Math.round(savedBytes / 1024)}KB`);
}

async function run() {
  console.log('--- Starting conversion of remaining assets to WebP ---');
  for (const target of targets) {
    await convertDirectory(target);
  }
  console.log('--- Conversion finished successfully ---');
}

run();
