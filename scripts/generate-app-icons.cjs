const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const srcPath = 'C:/Users/ext_wpereira/.gemini/antigravity/brain/dd21ad5e-0e2e-4bc6-b4ba-29d49b970504/.user_uploaded/media_1795112194301_bb096a52.jpg';

if (!fs.existsSync(srcPath)) {
  console.error('Source image does not exist:', srcPath);
  process.exit(1);
}

// Function to generate circular mask
function getCircleMask(size) {
  return Buffer.from(
    `<svg width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="#000"/></svg>`
  );
}

// Function to create ICO buffer from PNG buffer
function createIco(pngBuffer) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // icon type (1 = ICO)
  header.writeUInt16LE(1, 4); // number of images (1)

  const dirEntry = Buffer.alloc(16);
  dirEntry.writeUInt8(32, 0); // width
  dirEntry.writeUInt8(32, 1); // height
  dirEntry.writeUInt8(0, 2);  // color palette (0 = no palette)
  dirEntry.writeUInt8(0, 3);  // reserved
  dirEntry.writeUInt16LE(1, 4); // color planes
  dirEntry.writeUInt16LE(32, 6); // bits per pixel
  dirEntry.writeUInt32LE(pngBuffer.length, 8); // size of image data in bytes
  dirEntry.writeUInt32LE(6 + 16, 12); // offset of image data

  return Buffer.concat([header, dirEntry, pngBuffer]);
}

async function main() {
  console.log('Generating App Icons from new Lady Justice / Themis artwork across ALL platforms...');

  // 0. RESOURCES & ASSETS (Source of truth for GitHub Actions Android & iOS builds)
  console.log('0. Updating resources/ and assets/ folders...');
  if (!fs.existsSync('resources')) fs.mkdirSync('resources', { recursive: true });
  if (!fs.existsSync('assets')) fs.mkdirSync('assets', { recursive: true });
  if (!fs.existsSync('build-assets')) fs.mkdirSync('build-assets', { recursive: true });

  fs.copyFileSync(srcPath, 'resources/themis-master-icon.jpg');

  // Master icon (1024x1024)
  await sharp(srcPath).resize(1024, 1024).png().toFile('resources/icon.png');
  fs.copyFileSync('resources/icon.png', 'assets/icon.png');
  fs.copyFileSync('resources/icon.png', 'build-assets/ios-app-icon.png');

  // Background for adaptive icon: solid matching dark tone #1f0101
  await sharp({
    create: {
      width: 1024,
      height: 1024,
      channels: 4,
      background: { r: 31, g: 1, b: 1, alpha: 1 }
    }
  }).png().toFile('resources/icon-background.png');
  fs.copyFileSync('resources/icon-background.png', 'assets/icon-background.png');

  // Foreground for adaptive icon: Themis artwork centered at 72% so circular masks never crop details
  const fgInnerSize = Math.round(1024 * 0.72);
  const fgInnerBuffer = await sharp(srcPath).resize(fgInnerSize, fgInnerSize).toBuffer();
  await sharp({
    create: {
      width: 1024,
      height: 1024,
      channels: 4,
      background: { r: 31, g: 1, b: 1, alpha: 1 }
    }
  })
    .composite([{ input: fgInnerBuffer, gravity: 'center' }])
    .png()
    .toFile('resources/icon-foreground.png');
  fs.copyFileSync('resources/icon-foreground.png', 'assets/icon-foreground.png');

  // Splash screens (2732x2732 with centered artwork)
  const splashInner = await sharp(srcPath).resize(800, 800).toBuffer();
  await sharp({
    create: {
      width: 2732,
      height: 2732,
      channels: 4,
      background: { r: 31, g: 1, b: 1, alpha: 1 }
    }
  })
    .composite([{ input: splashInner, gravity: 'center' }])
    .png()
    .toFile('resources/splash.png');
  fs.copyFileSync('resources/splash.png', 'resources/splash-dark.png');
  fs.copyFileSync('resources/splash.png', 'assets/splash.png');
  fs.copyFileSync('resources/splash.png', 'assets/splash-dark.png');
  fs.copyFileSync('resources/splash.png', 'build-assets/ios-splash.png');

  // 1. PUBLIC (Web & PWA)
  console.log('1. Generating Public PWA icons...');
  await sharp(srcPath).resize(512, 512).png().toFile('public/icon-512.png');
  await sharp(srcPath).resize(192, 192).png().toFile('public/icon-192.png');
  await sharp(srcPath).resize(180, 180).png().toFile('public/apple-touch-icon.png');
  await sharp(srcPath).resize(32, 32).png().toFile('public/favicon-32x32.png');
  await sharp(srcPath).resize(16, 16).png().toFile('public/favicon-16x16.png');
  await sharp(srcPath).resize(512, 512).png().toFile('public/favicon.png');
  await sharp(srcPath).resize(1024, 1024).jpeg({ quality: 95 }).toFile('public/app-icon.jpg');
  await sharp(srcPath).resize(1024, 1024).webp({ quality: 92 }).toFile('public/app-icon.webp');
  await sharp(srcPath).resize(512, 512).webp({ quality: 92 }).toFile('public/logo-prime.webp');
  await sharp(srcPath).resize(512, 512).png().toFile('public/logo-coruja.png');

  // Favicon.ico
  const fav32Png = await sharp(srcPath).resize(32, 32).png().toBuffer();
  fs.writeFileSync('public/favicon.ico', createIco(fav32Png));

  // Ensure public/manifest.json matches public/site.webmanifest
  const webmanifestContent = fs.readFileSync('public/site.webmanifest', 'utf8');
  fs.writeFileSync('public/manifest.json', webmanifestContent);

  // 2. iOS AppIcon
  const iosIconPath = 'ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png';
  if (fs.existsSync(path.dirname(iosIconPath))) {
    console.log('2. Generating iOS AppIcon (1024x1024)...');
    await sharp(srcPath).resize(1024, 1024).png().toFile(iosIconPath);
  }

  // 3. Android Mipmap Icons
  console.log('3. Generating Android launcher icons...');
  const androidMipmaps = [
    { dir: 'mipmap-mdpi', size: 48, fgSize: 108 },
    { dir: 'mipmap-hdpi', size: 72, fgSize: 162 },
    { dir: 'mipmap-xhdpi', size: 96, fgSize: 216 },
    { dir: 'mipmap-xxhdpi', size: 144, fgSize: 324 },
    { dir: 'mipmap-xxxhdpi', size: 192, fgSize: 432 },
  ];

  const resBase = 'android/app/src/main/res';
  if (fs.existsSync(resBase)) {
    for (const m of androidMipmaps) {
      const targetDir = path.join(resBase, m.dir);
      if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

      // Standard icon
      await sharp(srcPath).resize(m.size, m.size).png().toFile(path.join(targetDir, 'ic_launcher.png'));

      // Round icon with circle mask
      const circleMask = getCircleMask(m.size);
      await sharp(srcPath)
        .resize(m.size, m.size)
        .composite([{ input: circleMask, blend: 'dest-in' }])
        .png()
        .toFile(path.join(targetDir, 'ic_launcher_round.png'));

      // Adaptive foreground: artwork centered at 72% on canvas with #1f0101 background
      const innerSize = Math.round(m.fgSize * 0.72);
      const innerBuffer = await sharp(srcPath).resize(innerSize, innerSize).toBuffer();

      await sharp({
        create: {
          width: m.fgSize,
          height: m.fgSize,
          channels: 4,
          background: { r: 31, g: 1, b: 1, alpha: 1 },
        },
      })
        .composite([{ input: innerBuffer, gravity: 'center' }])
        .png()
        .toFile(path.join(targetDir, 'ic_launcher_foreground.png'));
    }

    // Update background color in Android resources
    const bgXmlPath = path.join(resBase, 'values', 'ic_launcher_background.xml');
    if (fs.existsSync(bgXmlPath)) {
      fs.writeFileSync(
        bgXmlPath,
        `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#1f0101</color>\n</resources>\n`
      );
    }

    const drawableBgPath = path.join(resBase, 'drawable', 'ic_launcher_background.xml');
    if (fs.existsSync(drawableBgPath)) {
      fs.writeFileSync(
        drawableBgPath,
        `<?xml version="1.0" encoding="utf-8"?>\n<vector xmlns:android="http://schemas.android.com/apk/res/android"\n    android:width="108dp"\n    android:height="108dp"\n    android:viewportHeight="108"\n    android:viewportWidth="108">\n    <path\n        android:fillColor="#1f0101"\n        android:pathData="M0,0h108v108h-108z" />\n</vector>\n`
      );
    }
  }

  // 4. Also update .output/public icons if .output/public exists so Vite dev/preview reflects it immediately
  const outputPublic = '.output/public';
  if (fs.existsSync(outputPublic)) {
    console.log('4. Syncing to .output/public for instant preview...');
    const filesToSync = [
      'icon-512.png',
      'icon-192.png',
      'apple-touch-icon.png',
      'favicon-32x32.png',
      'favicon-16x16.png',
      'favicon.png',
      'favicon.ico',
      'app-icon.jpg',
      'app-icon.webp',
      'logo-prime.webp',
      'logo-coruja.png',
      'site.webmanifest',
      'manifest.json',
    ];
    for (const f of filesToSync) {
      const srcF = path.join('public', f);
      const destF = path.join(outputPublic, f);
      if (fs.existsSync(srcF)) {
        fs.copyFileSync(srcF, destF);
      }
    }
  }

  console.log('✅ ALL APP ICONS GENERATED AND SYNCED TO ALL TARGETS (resources, assets, build-assets, android, ios, public)!');
}

main().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
