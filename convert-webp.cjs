const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const ASSETS = path.resolve(__dirname, 'src/assets');

// All PNG/JPG files to convert to WebP
const filesToConvert = [
  // Blog PNGs (Item 1) — 12 files
  'blog/esperanca-garcia.png',
  'blog/piramide-de-kelsen.png',
  'blog/inquilinato.png',
  'blog/lgpd.png',
  'blog/aristoteles.png',
  'blog/terras-indigenas.png',
  'blog/inquisicao.png',
  'blog/prisao-2a-instancia.png',
  'blog/cliente-dificil.png',
  'blog/reforma-tributaria.png',
  'blog/processo-legislativo.png',
  'blog/hart-dworkin.png',
  // Blog Jurisprudência JPGs (Item 2) — 10 files
  'blog/jurisprudencia/juris-01.jpg',
  'blog/jurisprudencia/juris-02.jpg',
  'blog/jurisprudencia/juris-03.jpg',
  'blog/jurisprudencia/juris-04.jpg',
  'blog/jurisprudencia/juris-05.jpg',
  'blog/jurisprudencia/juris-06.jpg',
  'blog/jurisprudencia/juris-07.jpg',
  'blog/jurisprudencia/juris-08.jpg',
  'blog/jurisprudencia/juris-09.jpg',
  'blog/jurisprudencia/juris-10.jpg',
  // Auth (Item 3)
  'auth-judge-scene.jpeg',
  // Horus (Item 4)
  'horus/horus-star.png',
  // Logo PNG (Item 5) — skip, already has webp version
  // Landing JPGs (Item 6)
  'landing-tribunal/sec-justica.jpg',
  'landing-tribunal/sec-biblioteca.jpg',
  'landing-tribunal/sec-balanca.jpg',
  'landing-tribunal/sec-plenario.jpg',
  'landing-tribunal/hero-tribunal.jpg',
  // Hero PNGs (Item 7)
  'hero-1.png',
  'hero-2.png',
  'hero-3.png',
  'hero-4.png',
  'hero-5.png',
  'hero-6.png',
  // Direito Adm PNGs (Item 8)
  'direito-adm-1.png',
  'direito-adm-2.png',
  'direito-adm-3.png',
  'direito-adm-4.png',
  'direito-adm-5.png',
  'direito-adm-6.png',
  'direito-adm-7.png',
  // Auth horizontal
  'auth-themis-impact-horizontal.jpg',
];

async function convert(relPath) {
  const src = path.join(ASSETS, relPath);
  if (!fs.existsSync(src)) {
    console.log(`SKIP (not found): ${relPath}`);
    return;
  }
  const ext = path.extname(relPath);
  const dest = path.join(ASSETS, relPath.replace(ext, '.webp'));
  if (fs.existsSync(dest)) {
    console.log(`SKIP (exists): ${dest}`);
    return;
  }
  const origSize = fs.statSync(src).size;
  await sharp(src).webp({ quality: 80 }).toFile(dest);
  const newSize = fs.statSync(dest).size;
  const saved = ((1 - newSize / origSize) * 100).toFixed(1);
  console.log(`OK: ${relPath} -> .webp | ${(origSize/1024).toFixed(0)}KB -> ${(newSize/1024).toFixed(0)}KB (${saved}% saved)`);
}

(async () => {
  for (const f of filesToConvert) {
    await convert(f);
  }
  console.log('\nDone!');
})();
