const fs = require('fs');
const path = require('path');
const sharp = require('C:/temp_sharp/node_modules/sharp');

const excludeList = [
  'icon-512.png',
  'icon-192.png',
  'apple-touch-icon.png',
  'favicon.png',
  'favicon-32x32.png',
  'favicon-16x16.png'
];

async function convertDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      await convertDir(fullPath);
    } else {
      const ext = path.extname(fullPath).toLowerCase();
      if ((ext === '.png' || ext === '.jpg' || ext === '.jpeg') && !excludeList.includes(file)) {
        const webpPath = fullPath.replace(new RegExp(`${ext}$`, 'i'), '.webp');
        try {
          await sharp(fullPath)
            .webp({ quality: 80, effort: 6 })
            .toFile(webpPath);
          console.log(`Converted: ${fullPath} -> ${webpPath}`);
          fs.unlinkSync(fullPath); // Delete old file
        } catch (err) {
          console.error(`Failed to convert ${fullPath}:`, err);
        }
      }
    }
  }
}

async function run() {
  await convertDir(path.join(__dirname, 'public'));
  await convertDir(path.join(__dirname, 'src'));
  console.log('Conversion complete!');
}

run();

