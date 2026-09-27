const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const inputDir = path.join(__dirname, 'docs', 'PROFISSÕES');
const outputDir = path.join(__dirname, 'public', 'profissoes');

async function convert() {
  const files = fs.readdirSync(inputDir).filter(f => f.endsWith('.png'));
  for (const file of files) {
    const inputPath = path.join(inputDir, file);
    const filename = file.replace('.png', '.webp');
    const outputPath = path.join(outputDir, filename);
    await sharp(inputPath)
      .webp({ quality: 80 })
      .toFile(outputPath);
    console.log(`Converted: ${filename}`);
  }
}

convert().catch(console.error);
