const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const sourceImage = 'C:/Users/ext_wpereira/.gemini/antigravity/brain/dd21ad5e-0e2e-4bc6-b4ba-29d49b970504/.user_uploaded/media_1795439743327_55f11f31.jpg';

async function generate() {
  console.log('Generating icons from:', sourceImage);

  // 1. Web & PWA (public/)
  const publicTargets = [
    { file: 'public/icon-512.png', size: 512, format: 'png' },
    { file: 'public/icon-192.png', size: 192, format: 'png' },
    { file: 'public/apple-touch-icon.png', size: 180, format: 'png' },
    { file: 'public/favicon.png', size: 512, format: 'png' },
    { file: 'public/favicon-32x32.png', size: 32, format: 'png' },
    { file: 'public/favicon-16x16.png', size: 16, format: 'png' },
    { file: 'public/app-icon.webp', size: 512, format: 'webp' },
    { file: 'public/app-icon.jpg', size: 512, format: 'jpeg' },
  ];

  for (const t of publicTargets) {
    const dest = path.resolve(t.file);
    if (t.format === 'png') {
      await sharp(sourceImage)
        .resize(t.size, t.size, { fit: 'cover' })
        .png({ quality: 100, compressionLevel: 9 })
        .toFile(dest);
    } else if (t.format === 'webp') {
      await sharp(sourceImage)
        .resize(t.size, t.size, { fit: 'cover' })
        .webp({ quality: 95 })
        .toFile(dest);
    } else if (t.format === 'jpeg') {
      await sharp(sourceImage)
        .resize(t.size, t.size, { fit: 'cover' })
        .jpeg({ quality: 95 })
        .toFile(dest);
    }
    console.log('Generated:', t.file);
  }

  // 2. iOS AppIcon
  const iosFile = path.resolve('ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png');
  if (fs.existsSync(path.dirname(iosFile))) {
    await sharp(sourceImage)
      .resize(1024, 1024, { fit: 'cover' })
      .png({ quality: 100, compressionLevel: 9 })
      .toFile(iosFile);
    console.log('Generated iOS: AppIcon-512@2x.png (1024x1024)');
  }

  // 3. Android Mipmaps
  const androidDensities = [
    { dir: 'mipmap-mdpi', launcher: 48, foreground: 108 },
    { dir: 'mipmap-hdpi', launcher: 72, foreground: 162 },
    { dir: 'mipmap-xhdpi', launcher: 96, foreground: 216 },
    { dir: 'mipmap-xxhdpi', launcher: 144, foreground: 324 },
    { dir: 'mipmap-xxxhdpi', launcher: 192, foreground: 432 },
  ];

  for (const d of androidDensities) {
    const dirPath = path.resolve('android/app/src/main/res', d.dir);
    if (!fs.existsSync(dirPath)) continue;

    // ic_launcher.png
    await sharp(sourceImage)
      .resize(d.launcher, d.launcher, { fit: 'cover' })
      .png({ quality: 100, compressionLevel: 9 })
      .toFile(path.join(dirPath, 'ic_launcher.png'));

    // ic_launcher_round.png
    await sharp(sourceImage)
      .resize(d.launcher, d.launcher, { fit: 'cover' })
      .png({ quality: 100, compressionLevel: 9 })
      .toFile(path.join(dirPath, 'ic_launcher_round.png'));

    // ic_launcher_foreground.png
    await sharp(sourceImage)
      .resize(d.foreground, d.foreground, { fit: 'cover' })
      .png({ quality: 100, compressionLevel: 9 })
      .toFile(path.join(dirPath, 'ic_launcher_foreground.png'));

    console.log(`Generated Android ${d.dir}: launcher(${d.launcher}), round(${d.launcher}), foreground(${d.foreground})`);
  }

  // Also update android webview public asset if it exists
  const androidWebAsset = path.resolve('android/app/src/main/assets/public/icon-512.png');
  if (fs.existsSync(path.dirname(androidWebAsset))) {
    await sharp(sourceImage)
      .resize(512, 512, { fit: 'cover' })
      .png({ quality: 100, compressionLevel: 9 })
      .toFile(androidWebAsset);
    console.log('Updated android assets/public/icon-512.png');
  }

  console.log('ALL ICONS GENERATED SUCCESSFULLY!');
}

generate().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
