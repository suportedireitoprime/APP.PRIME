const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const sourceImage = 'C:/Users/ext_wpereira/.gemini/antigravity/brain/dd21ad5e-0e2e-4bc6-b4ba-29d49b970504/.user_uploaded/media_1795453132058_be171c54.jpg';
const BG_COLOR = '#210303'; // Deep wine/burgundy matching the new Lady Justice medallion

async function createCircularMask(size) {
  const svg = `<svg width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="#fff"/></svg>`;
  return Buffer.from(svg);
}

function buildIcoBuffer(images) {
  // images: array of { width, height, buffer } (PNG format)
  const count = images.length;
  const headerSize = 6;
  const entrySize = 16;
  let offset = headerSize + entrySize * count;

  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // ICO type
  header.writeUInt16LE(count, 4); // number of images

  const entries = [];
  for (const img of images) {
    const entry = Buffer.alloc(entrySize);
    entry.writeUInt8(img.width >= 256 ? 0 : img.width, 0);
    entry.writeUInt8(img.height >= 256 ? 0 : img.height, 1);
    entry.writeUInt8(0, 2); // color palette
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(img.buffer.length, 8); // size
    entry.writeUInt32LE(offset, 12); // offset
    entries.push(entry);
    offset += img.buffer.length;
  }

  return Buffer.concat([header, ...entries, ...images.map(img => img.buffer)]);
}

async function generate() {
  console.log('Generating high-quality app icons from master image:');
  console.log(sourceImage);

  if (!fs.existsSync(sourceImage)) {
    throw new Error(`Master source image not found at ${sourceImage}`);
  }

  // 1. Master Backup & Raw Copies
  fs.copyFileSync(sourceImage, path.resolve('resources/themis-master-icon.jpg'));
  fs.copyFileSync(sourceImage, path.resolve('resources/app-icon-master.jpg'));
  console.log('Copied raw master images to resources/');

  // 2. Resources Master Icons (for @capacitor/assets)
  await sharp(sourceImage)
    .resize(1024, 1024, { fit: 'cover' })
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.resolve('resources/icon.png'));
  console.log('Generated: resources/icon.png (1024x1024)');

  // resources/icon-background.png (solid #210303)
  await sharp({
    create: {
      width: 1024,
      height: 1024,
      channels: 4,
      background: { r: 33, g: 3, b: 3, alpha: 1 },
    },
  })
    .png()
    .toFile(path.resolve('resources/icon-background.png'));
  console.log('Generated: resources/icon-background.png (1024x1024 solid)');

  // resources/icon-foreground.png (medallion centered with 72% safe zone for Android adaptive icons)
  const foregroundEmblem1024 = await sharp(sourceImage)
    .resize(768, 768, { fit: 'cover' })
    .png({ quality: 100 })
    .toBuffer();

  await sharp({
    create: {
      width: 1024,
      height: 1024,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: foregroundEmblem1024, gravity: 'center' }])
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.resolve('resources/icon-foreground.png'));
  console.log('Generated: resources/icon-foreground.png (1024x1024 with 75% safe area)');

  // 3. Web & PWA (public/)
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
        .webp({ quality: 100, lossless: true })
        .toFile(dest);
    } else if (t.format === 'jpeg') {
      await sharp(sourceImage)
        .resize(t.size, t.size, { fit: 'cover' })
        .jpeg({ quality: 98, chromaSubsampling: '4:4:4' })
        .toFile(dest);
    }
    console.log('Generated:', t.file);
  }

  // Generate multi-size favicon.ico
  const ico32Buffer = await sharp(sourceImage).resize(32, 32).png().toBuffer();
  const ico16Buffer = await sharp(sourceImage).resize(16, 16).png().toBuffer();
  const ico48Buffer = await sharp(sourceImage).resize(48, 48).png().toBuffer();
  const icoData = buildIcoBuffer([
    { width: 48, height: 48, buffer: ico48Buffer },
    { width: 32, height: 32, buffer: ico32Buffer },
    { width: 16, height: 16, buffer: ico16Buffer },
  ]);
  fs.writeFileSync(path.resolve('public/favicon.ico'), icoData);
  console.log('Generated: public/favicon.ico (16, 32, 48 multi-res)');

  // 4. iOS Universal AppIcon (Xcode 14+ 1024x1024)
  const iosFile = path.resolve('ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png');
  if (fs.existsSync(path.dirname(iosFile))) {
    await sharp(sourceImage)
      .resize(1024, 1024, { fit: 'cover' })
      .png({ quality: 100, compressionLevel: 9 })
      .toFile(iosFile);
    console.log('Generated iOS: AppIcon-512@2x.png (1024x1024)');
  }

  const buildAssetsIos = path.resolve('build-assets/ios-app-icon.png');
  if (fs.existsSync(path.dirname(buildAssetsIos))) {
    await sharp(sourceImage)
      .resize(1024, 1024, { fit: 'cover' })
      .png({ quality: 100, compressionLevel: 9 })
      .toFile(buildAssetsIos);
    console.log('Generated build-assets/ios-app-icon.png');
  }

  // 5. Android Mipmaps
  const androidDensities = [
    { dir: 'mipmap-mdpi', launcher: 48, foreground: 108 },
    { dir: 'mipmap-hdpi', launcher: 72, foreground: 162 },
    { dir: 'mipmap-xhdpi', launcher: 96, foreground: 216 },
    { dir: 'mipmap-xxhdpi', launcher: 144, foreground: 324 },
    { dir: 'mipmap-xxxhdpi', launcher: 192, foreground: 432 },
    { dir: 'mipmap-ldpi', launcher: 36, foreground: 81 },
  ];

  for (const d of androidDensities) {
    const dirPath = path.resolve('android/app/src/main/res', d.dir);
    if (!fs.existsSync(dirPath)) continue;

    // ic_launcher.png (Full medallion)
    await sharp(sourceImage)
      .resize(d.launcher, d.launcher, { fit: 'cover' })
      .png({ quality: 100, compressionLevel: 9 })
      .toFile(path.join(dirPath, 'ic_launcher.png'));

    // ic_launcher_round.png (Circular anti-aliased clipped medallion)
    const mask = await createCircularMask(d.launcher);
    await sharp(sourceImage)
      .resize(d.launcher, d.launcher, { fit: 'cover' })
      .composite([{ input: mask, blend: 'dest-in' }])
      .png({ quality: 100, compressionLevel: 9 })
      .toFile(path.join(dirPath, 'ic_launcher_round.png'));

    // ic_launcher_background.png (Solid #210303)
    await sharp({
      create: {
        width: d.foreground,
        height: d.foreground,
        channels: 4,
        background: { r: 33, g: 3, b: 3, alpha: 1 },
      },
    })
      .png()
      .toFile(path.join(dirPath, 'ic_launcher_background.png'));

    // ic_launcher_foreground.png (Safe-zone centered medallion)
    const emblemSize = Math.round(d.foreground * 0.72);
    const emblemBuffer = await sharp(sourceImage)
      .resize(emblemSize, emblemSize, { fit: 'cover' })
      .png({ quality: 100 })
      .toBuffer();

    await sharp({
      create: {
        width: d.foreground,
        height: d.foreground,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    })
      .composite([{ input: emblemBuffer, gravity: 'center' }])
      .png({ quality: 100, compressionLevel: 9 })
      .toFile(path.join(dirPath, 'ic_launcher_foreground.png'));

    console.log(`Generated Android ${d.dir}: launcher(${d.launcher}), round(${d.launcher}), background(${d.foreground}), foreground(${d.foreground})`);
  }

  // 6. Update Android WebView public asset if exists
  const androidWebAsset = path.resolve('android/app/src/main/assets/public/icon-512.png');
  if (fs.existsSync(path.dirname(androidWebAsset))) {
    await sharp(sourceImage)
      .resize(512, 512, { fit: 'cover' })
      .png({ quality: 100, compressionLevel: 9 })
      .toFile(androidWebAsset);
    console.log('Updated android assets/public/icon-512.png');
  }

  console.log('\n✅ ALL APP INSTALLATION ICONS GENERATED WITH 100% QUALITY!');
}

generate().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
