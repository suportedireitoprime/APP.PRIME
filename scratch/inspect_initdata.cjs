const fs = require('fs');

const htmlPath = 'C:/Users/ext_wpereira/.gemini/antigravity-ide/brain/22b5cd56-d5fa-4a7b-8b79-ecf3acdd05c3/.system_generated/steps/206/content.md';
const content = fs.readFileSync(htmlPath, 'utf8');

// Extrai a linha 475 ou o bloco __initData
const initDataMatch = content.match(/__initData\s*=\s*([^;]+);/);
if (initDataMatch) {
  console.log('Encontrado __initData, tamanho da string:', initDataMatch[1].length);
  try {
    const data = JSON.parse(initDataMatch[1]);
    console.log('JSON parse com sucesso!');
    fs.writeFileSync('scratch/initdata.json', JSON.stringify(data, null, 2));
    console.log('Salvo em scratch/initdata.json');
  } catch (e) {
    console.log('Erro ao fazer JSON parse direto:', e.message);
    fs.writeFileSync('scratch/initdata_raw.txt', initDataMatch[1]);
  }
} else {
  console.log('Não encontrou __initData');
}
