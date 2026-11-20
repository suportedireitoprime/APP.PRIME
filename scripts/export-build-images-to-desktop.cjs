const fs = require('fs');
const path = require('path');

const imgExts = new Set(['.png', '.jpg', '.jpeg', '.webp', '.svg', '.gif', '.ico', '.avif']);

// Detect desktop directory
const desktopPaths = [
  'C:/Users/ext_wpereira/OneDrive - Vitamina Work Life S.A/Escritorio',
  'C:/Users/ext_wpereira/Desktop'
].filter(p => fs.existsSync(p));

const targetBaseName = 'Imagens_Build_App_Prime';
const mainTarget = path.join(desktopPaths[0], targetBaseName);

console.log('Main target directory:', mainTarget);
if (!fs.existsSync(mainTarget)) {
  fs.mkdirSync(mainTarget, { recursive: true });
}

const allCopied = [];

function copyRecursive(srcDir, destSubdir, label) {
  if (!fs.existsSync(srcDir)) return;

  function traverse(currentSrc, currentDest) {
    const entries = fs.readdirSync(currentSrc, { withFileTypes: true });
    for (const entry of entries) {
      const srcFile = path.join(currentSrc, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules' || entry.name === '.git') continue;
        traverse(srcFile, path.join(currentDest, entry.name));
      } else {
        const ext = path.extname(entry.name).toLowerCase();
        if (imgExts.has(ext)) {
          if (!fs.existsSync(currentDest)) {
            fs.mkdirSync(currentDest, { recursive: true });
          }
          const destFile = path.join(currentDest, entry.name);
          fs.copyFileSync(srcFile, destFile);
          const stat = fs.statSync(srcFile);
          allCopied.push({
            projectPath: srcFile.replace(/\\/g, '/'),
            destPath: destFile.replace(/\\/g, '/'),
            sizeBytes: stat.size,
            sizeKb: (stat.size / 1024).toFixed(1),
            sizeMb: (stat.size / (1024 * 1024)).toFixed(2),
            category: label,
            name: entry.name,
            ext: ext
          });
        }
      }
    }
  }

  traverse(srcDir, path.join(mainTarget, destSubdir));
}

console.log('1. Copying public/ images...');
copyRecursive('public', 'public_web', 'public');

console.log('2. Copying src/assets/ images...');
copyRecursive('src/assets', 'src_assets', 'src/assets');

console.log('3. Copying resources/ native image templates...');
copyRecursive('resources', 'resources_nativas', 'resources');

console.log('Total images copied:', allCopied.length);

// Sort by size descending
allCopied.sort((a, b) => b.sizeBytes - a.sizeBytes);

const totalBytes = allCopied.reduce((acc, cur) => acc + cur.sizeBytes, 0);
const totalMb = (totalBytes / (1024 * 1024)).toFixed(2);

console.log(`Total size: ${totalMb} MB`);

// Generate report
let report = `# RELATÓRIO DE IMAGENS DO APP DIREITO PRIME\n\n`;
report += `Total de imagens encontradas: ${allCopied.length}\n`;
report += `Espaço total ocupado: ${totalMb} MB\n\n`;
report += `Localização das imagens na Área de Trabalho:\n`;
report += `📁 ${mainTarget}\n\n`;
report += `## TOP 30 IMAGENS MAIS PESADAS (CANDIDATAS A EXCLUSÃO OU OTIMIZAÇÃO)\n\n`;
report += `| Tamanho | Formato | Arquivo original no projeto |\n`;
report += `|---|---|---|\n`;

allCopied.slice(0, 30).forEach(item => {
  report += `| ${item.sizeKb} KB (${item.sizeMb} MB) | ${item.ext} | \`${item.projectPath}\` |\n`;
});

report += `\n## DISTRIBUIÇÃO POR SUBPASTA NA ÁREA DE TRABALHO\n\n`;
const byCat = {};
allCopied.forEach(item => {
  byCat[item.category] = (byCat[item.category] || 0) + 1;
});
Object.keys(byCat).forEach(cat => {
  report += `- **${cat}**: ${byCat[cat]} imagens\n`;
});

fs.writeFileSync(path.join(mainTarget, 'RELATORIO_IMAGENS.md'), report, 'utf8');
fs.writeFileSync(path.join(mainTarget, 'lista_todas_imagens.txt'), allCopied.map(i => `${i.sizeKb.padStart(8)} KB | ${i.projectPath}`).join('\n'), 'utf8');

console.log('Report generated at:', path.join(mainTarget, 'RELATORIO_IMAGENS.md'));

// If Desktop second path exists and is different, create a shortcut or copy report
if (desktopPaths[1] && desktopPaths[1] !== desktopPaths[0]) {
  const altTarget = path.join(desktopPaths[1], targetBaseName);
  try {
    if (!fs.existsSync(altTarget)) {
      // Create junction or copy
      const { execSync } = require('child_process');
      execSync(`cmd /c mklink /J "${altTarget}" "${mainTarget}"`);
      console.log('Created junction on secondary desktop:', altTarget);
    }
  } catch (e) {
    console.log('Note: secondary junction skipped or not needed');
  }
}
