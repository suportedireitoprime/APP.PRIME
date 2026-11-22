const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Fonte de verdade em alta definição: Têmis Vazada Oficial PNG (243KB sem perdas)
const themisVazadaPath = path.resolve('src/assets/logo-coruja.png');

if (!fs.existsSync(themisVazadaPath)) {
  console.error('Imagem da Têmis Vazada não encontrada em:', themisVazadaPath);
  process.exit(1);
}

// Cores Oficiais selecionadas no Studio:
// Cor 1: #F20723 | Cor 2: #C91823 | Ângulo: 0° (Linear do topo ao rodapé)
const COR1 = '#F20723';
const COR2 = '#C91823';

// Escala / Expansão Oficial calibrada para preencher com imponência a safe-zone (82%)
const EXPANSION_RATIO = 0.82;

// Gera SVG de fundo com gradiente linear oficial
function createGradientSvg(width, height) {
  return Buffer.from(`
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="carmesimOficial" x1="0%" y1="100%" x2="0%" y2="0%">
      <stop offset="0%" stop-color="${COR1}" />
      <stop offset="100%" stop-color="${COR2}" />
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#carmesimOficial)" />
</svg>
`);
}

// Gera SVG de sombra de profundidade 3D
function createShadowSvg(width, height) {
  const cx = width / 2;
  const cy = height * 0.58;
  const r = width * 0.38;
  return Buffer.from(`
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="shadow" cx="50%" cy="58%" r="38%">
      <stop offset="0%" stop-color="rgba(0,0,0,0.55)" />
      <stop offset="70%" stop-color="rgba(0,0,0,0.22)" />
      <stop offset="100%" stop-color="rgba(0,0,0,0)" />
    </radialGradient>
  </defs>
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#shadow)" />
</svg>
`);
}

// Máscara circular para ícones redondos
function getCircleMask(size) {
  return Buffer.from(
    `<svg width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="#000"/></svg>`
  );
}

// Cria buffer ICO a partir de PNG 32x32
function createIco(pngBuffer) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reservado
  header.writeUInt16LE(1, 2); // tipo (1 = ICO)
  header.writeUInt16LE(1, 4); // 1 imagem

  const dirEntry = Buffer.alloc(16);
  dirEntry.writeUInt8(32, 0); // largura
  dirEntry.writeUInt8(32, 1); // altura
  dirEntry.writeUInt8(0, 2);  // paleta de cores
  dirEntry.writeUInt8(0, 3);  // reservado
  dirEntry.writeUInt16LE(1, 4); // planos de cor
  dirEntry.writeUInt16LE(32, 6); // bits por pixel
  dirEntry.writeUInt32LE(pngBuffer.length, 8); // tamanho dos dados
  dirEntry.writeUInt32LE(6 + 16, 12); // offset

  return Buffer.concat([header, dirEntry, pngBuffer]);
}

// Função utilitária para renderizar o busto com brilho, saturação e nitidez cristalina
async function getEnhancedThemis(width, height) {
  return await sharp(themisVazadaPath)
    .resize(width, height, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .modulate({ brightness: 1.16, saturation: 1.25 })
    .sharpen({ sigma: 1.2, m1: 1.2, m2: 2.2 })
    .toBuffer();
}

async function main() {
  console.log('🚀 Gerando Ícones do Aplicativo: Têmis Vazada HD (Expansão 82%) + Vermelho Carmesim Oficial (#F20723 -> #C91823)...');

  // Garante diretórios
  const dirs = ['resources', 'assets', 'build-assets', 'public'];
  dirs.forEach(d => {
    if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  });

  // ── 1. GERAÇÃO DO ÍCONE MESTRE (1024x1024) ──
  console.log('1. Criando Master Icon 1024x1024 com expansão a 82% em resources/ e assets/...');
  const masterBgSvg = createGradientSvg(1024, 1024);
  const masterBgBuffer = await sharp(masterBgSvg).png().toBuffer();
  const masterShadowBuffer = await sharp(createShadowSvg(1024, 1024)).png().toBuffer();

  // Fundo do adaptive icon (1024x1024 gradiente carmesim oficial)
  await sharp(masterBgSvg).png().toFile('resources/icon-background.png');
  fs.copyFileSync('resources/icon-background.png', 'assets/icon-background.png');

  // Busto da Têmis para o Master Icon: 840x840 (~82% da área, imponente e nítido)
  const masterThemisSize = Math.round(1024 * EXPANSION_RATIO); // ~840px
  const masterThemisBuffer = await getEnhancedThemis(masterThemisSize, masterThemisSize);

  // Master Icon completo (1024x1024 com fundo gradiente + sombra 3D + busto centralizado)
  const masterIconBuffer = await sharp(masterBgBuffer)
    .composite([
      { input: masterShadowBuffer, gravity: 'center' },
      { input: masterThemisBuffer, gravity: 'center' }
    ])
    .png()
    .toBuffer();

  await sharp(masterIconBuffer).toFile('resources/icon.png');
  fs.copyFileSync('resources/icon.png', 'assets/icon.png');
  fs.copyFileSync('resources/icon.png', 'build-assets/ios-app-icon.png');

  // Foreground do adaptive icon (1024x1024 transparente, busto a 82% preenchendo a safe-zone perfeitamente)
  const fgThemisBuffer = await getEnhancedThemis(masterThemisSize, masterThemisSize);

  await sharp({
    create: {
      width: 1024,
      height: 1024,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
    .composite([{ input: fgThemisBuffer, gravity: 'center' }])
    .png()
    .toFile('resources/icon-foreground.png');

  fs.copyFileSync('resources/icon-foreground.png', 'assets/icon-foreground.png');
  fs.copyFileSync('resources/icon-foreground.png', 'assets/icon-only.png');

  // Atualiza também src/assets/icon-foreground.png e themis-master-icon.jpg para sincronia total
  fs.copyFileSync('resources/icon-foreground.png', 'src/assets/icon-foreground.png');
  await sharp(masterIconBuffer).jpeg({ quality: 95 }).toFile('src/assets/themis-master-icon.jpg');
  await sharp(masterIconBuffer).jpeg({ quality: 95 }).toFile('resources/themis-master-icon.jpg');

  // ── 2. SPLASH SCREENS (2732x2732) ──
  console.log('2. Gerando Splash Screens 2732x2732...');
  const splashBgSvg = createGradientSvg(2732, 2732);
  const splashThemisBuffer = await getEnhancedThemis(950, 950);

  const splashBuffer = await sharp(splashBgSvg)
    .composite([{ input: splashThemisBuffer, gravity: 'center' }])
    .png()
    .toBuffer();

  await sharp(splashBuffer).toFile('resources/splash.png');
  fs.copyFileSync('resources/splash.png', 'resources/splash-dark.png');
  fs.copyFileSync('resources/splash.png', 'assets/splash.png');
  fs.copyFileSync('resources/splash.png', 'assets/splash-dark.png');
  fs.copyFileSync('resources/splash.png', 'build-assets/ios-splash.png');

  // ── 3. ÍCONES PUBLIC (PWA & WEB) ──
  console.log('3. Gerando Ícones Web & PWA (public/)...');
  await sharp(masterIconBuffer).resize(512, 512).png().toFile('public/icon-512.png');
  await sharp(masterIconBuffer).resize(192, 192).png().toFile('public/icon-192.png');
  await sharp(masterIconBuffer).resize(180, 180).png().toFile('public/apple-touch-icon.png');
  await sharp(masterIconBuffer).resize(32, 32).png().toFile('public/favicon-32x32.png');
  await sharp(masterIconBuffer).resize(16, 16).png().toFile('public/favicon-16x16.png');
  await sharp(masterIconBuffer).resize(512, 512).png().toFile('public/favicon.png');
  await sharp(masterIconBuffer).resize(1024, 1024).jpeg({ quality: 95 }).toFile('public/app-icon.jpg');
  await sharp(masterIconBuffer).resize(1024, 1024).webp({ quality: 92 }).toFile('public/app-icon.webp');
  await sharp(masterIconBuffer).resize(512, 512).webp({ quality: 92 }).toFile('public/logo-prime.webp');
  await sharp(masterIconBuffer).resize(512, 512).png().toFile('public/logo-coruja.png');

  const fav32Png = await sharp(masterIconBuffer).resize(32, 32).png().toBuffer();
  fs.writeFileSync('public/favicon.ico', createIco(fav32Png));

  // ── 4. iOS APP ICON (1024x1024) ──
  const iosIconPath = 'ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png';
  if (fs.existsSync(path.dirname(iosIconPath))) {
    console.log('4. Atualizando iOS AppIcon...');
    await sharp(masterIconBuffer).resize(1024, 1024).png().toFile(iosIconPath);
  }

  // ── 5. ANDROID MIPMAPS (ic_launcher, round, foreground, background) ──
  console.log('5. Gerando Mipmaps Nativos do Android com expansão a 82%...');
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

      // Ícone clássico (quadrado com cantos pelo launcher legado)
      await sharp(masterIconBuffer)
        .resize(m.size, m.size)
        .png()
        .toFile(path.join(targetDir, 'ic_launcher.png'));

      // Ícone redondo clássico (com máscara circular para launchers redondos legados)
      const roundThemisSize = Math.round(m.size * EXPANSION_RATIO);
      const roundThemis = await getEnhancedThemis(roundThemisSize, roundThemisSize);
      const roundBg = await sharp(createGradientSvg(m.size, m.size)).png().toBuffer();
      const circleMask = getCircleMask(m.size);

      await sharp(roundBg)
        .composite([{ input: roundThemis, gravity: 'center' }])
        .composite([{ input: circleMask, blend: 'dest-in' }])
        .png()
        .toFile(path.join(targetDir, 'ic_launcher_round.png'));

      // Adaptive Background: gradiente carmesim oficial em resolução exata fgSize
      const bgMipmapSvg = createGradientSvg(m.fgSize, m.fgSize);
      await sharp(bgMipmapSvg)
        .png()
        .toFile(path.join(targetDir, 'ic_launcher_background.png'));

      // Adaptive Foreground: fundo 100% TRANSPARENTE com busto centralizado a 82%
      const fgInnerSize = Math.round(m.fgSize * EXPANSION_RATIO);
      const fgInnerBuffer = await getEnhancedThemis(fgInnerSize, fgInnerSize);

      await sharp({
        create: {
          width: m.fgSize,
          height: m.fgSize,
          channels: 4,
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        }
      })
        .composite([{ input: fgInnerBuffer, gravity: 'center' }])
        .png()
        .toFile(path.join(targetDir, 'ic_launcher_foreground.png'));
    }

    // Atualiza cor de fundo oficial em XML do Android para o Carmesim Oficial
    const bgXmlPath = path.join(resBase, 'values', 'ic_launcher_background.xml');
    if (fs.existsSync(bgXmlPath)) {
      fs.writeFileSync(
        bgXmlPath,
        `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">${COR1}</color>\n</resources>\n`
      );
    }

    const drawableBgPath = path.join(resBase, 'drawable', 'ic_launcher_background.xml');
    if (fs.existsSync(drawableBgPath)) {
      fs.writeFileSync(
        drawableBgPath,
        `<?xml version="1.0" encoding="utf-8"?>\n<vector xmlns:android="http://schemas.android.com/apk/res/android"\n    android:width="108dp"\n    android:height="108dp"\n    android:viewportHeight="108"\n    android:viewportWidth="108">\n    <path\n        android:fillColor="${COR1}"\n        android:pathData="M0,0h108v108h-108z" />\n</vector>\n`
      );
    }

    // Garante que mipmap-anydpi-v26/ic_launcher.xml use background e foreground corretos
    const anyDpiDir = path.join(resBase, 'mipmap-anydpi-v26');
    if (fs.existsSync(anyDpiDir)) {
      const adaptiveLauncherXml = `<?xml version="1.0" encoding="utf-8"?>\n<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">\n    <background android:drawable="@mipmap/ic_launcher_background" />\n    <foreground android:drawable="@mipmap/ic_launcher_foreground" />\n</adaptive-icon>\n`;
      fs.writeFileSync(path.join(anyDpiDir, 'ic_launcher.xml'), adaptiveLauncherXml);
      fs.writeFileSync(path.join(anyDpiDir, 'ic_launcher_round.xml'), adaptiveLauncherXml);
    }
  }

  // ── 6. SINCRONIZA COM .output/public (se existir) ──
  const outputPublic = '.output/public';
  if (fs.existsSync(outputPublic)) {
    console.log('6. Sincronizando com .output/public...');
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
      'logo-coruja.png'
    ];
    for (const f of filesToSync) {
      const srcF = path.join('public', f);
      const destF = path.join(outputPublic, f);
      if (fs.existsSync(srcF)) {
        fs.copyFileSync(srcF, destF);
      }
    }
  }

  console.log('✅ SUCESSO: Todos os ícones gerados e sincronizados com a Têmis HD (82%) e Fundo Carmesim Oficial!');
}

main().catch(err => {
  console.error('Erro ao gerar ícones:', err);
  process.exit(1);
});
