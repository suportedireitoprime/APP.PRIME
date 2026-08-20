const fs = require('fs');
const path = require('path');

const replacements = [
    { from: /br\.com\.vacatio\.app/g, to: 'br.com.direito.app' },
    { from: /direitoprime:\/\//g, to: 'direitoprime://' },
    { from: /vacatio\.com\.br/g, to: 'direitoprime.com.br' },
    { from: /suporte\.vacatio@gmail\.com/g, to: 'suporte@direitoprime.com.br' },
    { from: /direito_prime_local/g, to: 'direito_prime_local' },
    { from: /direitoprime:/g, to: 'direitoprime:' },
    { from: /direitoprime-alertas-v2/g, to: 'direitoprime-alertas-v2' },
    { from: /DireitoPrimeBot/g, to: 'DireitoPrimeBot' },
    { from: /logo-direitoprime-v2/g, to: 'logo-direitoprime-v2' },
    { from: /direitoprime-logo/g, to: 'direitoprime-logo' },
    { from: /direitoprime-legis/g, to: 'direitoprime-legis' },
    { from: /primeLogoAsset/g, to: 'primeLogoAsset' },
    { from: /primeLogoBundled/g, to: 'primeLogoBundled' },
    { from: /primeLogo/g, to: 'primeLogo' },
    { from: /direitoprime-release/g, to: 'direitoprime-release' },
    { from: /app-direitoprime/g, to: 'app-direitoprime' },
    { from: /suporteprime/g, to: 'suporteprime' },
    { from: /direitoprime-ios/g, to: 'direitoprime-ios' },
    { from: /Mozilla\/5\.0 Vacatio/g, to: 'Mozilla/5.0 DireitoPrime' },
    { from: /do Direito Prime/g, to: 'do Direito Prime' },
    { from: /no Direito Prime/g, to: 'no Direito Prime' },
    { from: /o Direito Prime/g, to: 'o Direito Prime' },
    { from: /_Direito Prime ·/g, to: '_Direito Prime ·' },
    { from: /Direito Prime —/g, to: 'Direito Prime —' },
    { from: /'DIREITO PRIME'/g, to: "'DIREITO PRIME'" },
    { from: /vacatio/g, to: 'direitoprime' } // fallback genérico (cuidado)
];

const extensionsToProcess = ['.ts', '.tsx', '.json', '.md', '.html', '.plist', '.xml', '.gradle', '.pbxproj', '.mjs', '.cjs'];
const ignoreDirs = ['node_modules', 'dist', '.git', 'livros_json', '.angular', '.nx', 'android', 'ios']; // Will skip android/ios in bulk replace to do it carefully or let Capacitor sync handle it. 

// Actually, wait! Capacitor's iOS and Android folders SHOULD be modified because the package name might be in there.
// But changing package name in android/ios natively is very complex (requires moving folders).
// It's better to change in capacitor.config.ts and let `cap sync` or android studio do the rest, or just replace strings and hope it works?
// Capacitor manages `appId` in `capacitor.config.ts`. If we change it, running `npx cap sync` updates it?
// Not entirely for package name/folder structure. `npx @capacitor/assets generate` generates icons.
// I will include android and ios for text replacement, but skip binary files.

const ignoreDirsFinal = ['node_modules', 'dist', '.git', 'livros_json', '.idea', '.gradle', 'build'];

function processDirectory(directory) {
    const files = fs.readdirSync(directory);
    
    for (const file of files) {
        const fullPath = path.join(directory, file);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            if (!ignoreDirsFinal.includes(file)) {
                processDirectory(fullPath);
            }
        } else {
            const ext = path.extname(fullPath);
            if (extensionsToProcess.includes(ext) || file === 'capacitor.config.ts') {
                try {
                    let content = fs.readFileSync(fullPath, 'utf8');
                    let changed = false;
                    
                    // Specific replacements first
                    for (let i = 0; i < replacements.length - 1; i++) {
                        const rule = replacements[i];
                        if (rule.from.test(content)) {
                            content = content.replace(rule.from, rule.to);
                            changed = true;
                        }
                    }
                    
                    // Fallback generic replacement
                    const genericRule = replacements[replacements.length - 1];
                    // We only apply generic replace to specific files to avoid breaking things unexpectedly
                    if (!fullPath.includes('package-lock.json') && genericRule.from.test(content)) {
                         // content = content.replace(genericRule.from, genericRule.to);
                         // changed = true;
                    }

                    if (changed) {
                        fs.writeFileSync(fullPath, content, 'utf8');
                        console.log(`Updated: ${fullPath}`);
                    }
                } catch (e) {
                    console.error(`Error processing ${fullPath}: ${e.message}`);
                }
            }
        }
    }
}

processDirectory('.');
console.log('Replacement complete.');
