const fs = require('fs');
let content = fs.readFileSync('src/components/vademecum/overlays/SearchOverlay.tsx', 'utf8');

const regexToReplace = /const identificarLeiPorTexto = \(text: string\) => {[\s\S]*?return null;\r?\n};/;

const precompiledLogic = `const precompiledSiglas = new Map<string, RegExp>();
const getSiglaRegex = (sigla: string) => {
  if (!precompiledSiglas.has(sigla)) {
    const escaped = sigla.replace(/[.*+?^\\$\\{\\}()|\\[\\]\\\\\\\\]/g, '\\\\$&');
    precompiledSiglas.set(sigla, new RegExp(\`\\\\b\${escaped}\\\\b\`, 'i'));
  }
  return precompiledSiglas.get(sigla)!;
};

const identificarLeiPorTexto = (text: string) => {
  const artMatch = text.match(/art(?:igo)?\\.?\\s*(\\d+[-a-zA-Z]*)/i);
  const artigoNumero = artMatch ? artMatch[1] : undefined;

  const catalog = [...LEIS_CATALOG].sort((a, b) => b.sigla.length - a.sigla.length);
  for (const lei of catalog) {
    if (!lei.sigla) continue;
    const regex = getSiglaRegex(lei.sigla);
    if (regex.test(text)) {
      return { lei, artigoNumero };
    }
  }
  return null;
};`;

content = content.replace(regexToReplace, precompiledLogic);
content = content.replace('const debouncedQuery = useDebounce(query, 100);', 'const debouncedQuery = useDebounce(query, 300);');

fs.writeFileSync('src/components/vademecum/overlays/SearchOverlay.tsx', content);
