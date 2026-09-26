const fs = require('fs');
const path = require('path');

const filePath = path.join('C:', 'Users', 'ext_wpereira', 'OneDrive - Vitamina Work Life S.A', 'Documentos', 'APP.PRIME', 'src', 'pages', 'Atualizacoes.tsx');
let c = fs.readFileSync(filePath, 'utf8');

// Add Capacitor import for Platform check
if (!c.includes('Capacitor')) {
  c = c.replace(/import \{ Browser \} from '@capacitor\/browser';/, "import { Browser } from '@capacitor/browser';\nimport { Capacitor } from '@capacitor/core';");
}

// Add openExternalLink helper inside Atualizacoes component
if (!c.includes('const openExternalLink =')) {
  c = c.replace(/const Atualizacoes = \(\) => \{/, `const Atualizacoes = () => {
  const openExternalLink = async (url: string) => {
    try {
      if (Capacitor.isNativePlatform()) {
        await Browser.open({ url });
      } else {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    } catch (e) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };`);
}

// Replace all Browser.open with openExternalLink
c = c.replace(/Browser\.open\(\{ url: (.*?) \}\)/g, 'openExternalLink($1)');

// Add getAvatarUrl helper
if (!c.includes('const getAvatarUrl =')) {
  c = c.replace(/const openExternalLink =/, `const getAvatarUrl = (title: string) => {
    const cleanTitle = title.split('-')[0].trim().substring(0, 20);
    return \`https://ui-avatars.com/api/?name=\${encodeURIComponent(cleanTitle)}&background=10B981&color=fff&size=128&bold=true&font-size=0.4\`;
  };
  const openExternalLink =`);
}

// Replace GraduationCap fallback with Avatar
c = c.replace(/<GraduationCap className="w-12 h-12 text-\[\#10B981\]\/20" \/>/g, `<img src={getAvatarUrl(conc.titulo)} alt="" className="w-16 h-16 rounded-full object-contain drop-shadow-md border border-white/10" />`);

// Replace Notícias Jurídicas image fallback
c = c.replace(/<Newspaper className="w-8 h-8 text-white\/20" \/>/g, `<img src={\`https://ui-avatars.com/api/?name=\${encodeURIComponent(noticia.fonte || 'Noticia')}&background=FACC15&color=000&size=128&bold=true\`} alt="" className="w-16 h-16 rounded-full object-contain drop-shadow-md border border-white/10 opacity-80" />`);

fs.writeFileSync(filePath, c, 'utf8');
console.log('Done');
