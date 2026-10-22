const fs = require('fs');

const subfolders = [
  { id: '1ATOIIPVzkm7Uu0y9M46kCLPSlJxzmLqn', name: '01. Dos Crimes de "Lavagem" ou Ocultação de Bens, Direitos e Valores (art. 1)' },
  { id: '1yVowPuJuYlSz5T4SJFIiwqMWQtb3mUxO', name: '02. Disposições Processuais Especiais (arts. 2-6)' },
  { id: '1w4BPMLYZdswJIbk1ANNjAtBEpBihgP93', name: '03. Dos Efeitos da Condenação (art. 7)' },
  { id: '19sKc-IjaDZq4Mf9hH358iGAyvx-dvp4g', name: '04. Dos Bens, Direitos ou Valores Oriundos de Crimes Praticados no Estrangeiro (art. 8)' },
  { id: '1a7XNkHcF3OYl858R5N5JMa1zl_VdPMOG', name: '05. Das Pessoas Sujeitas ao Mecanismo de Controle (art. 9)' },
  { id: '11iKouKUz7C5G5hx7TKOoGJg9FmBWjc3D', name: '06. Da Identificação dos Clientes e Manutenção de Registros (arts. 10 a 10-A)' },
  { id: '1EogEbZhY9pWarczo7iWIdOX-jWN9frJX', name: '07. Da Comunicação de Operações Financeiras (arts. 11 a 11-A)' },
  { id: '1_bToBuQpxCNomWsxOXhkX-xmHcL9j0V_', name: '08. Da Responsabilidade Administrativa (arts. 12 a 12-A)' },
  { id: '19MqvBZQZKYKxyvorKwM5PRO8OMMKhj6J', name: '09. Do Conselho de Controle de Atividades Financeiras (arts. 14-15)' },
  { id: '1ERXU_zA2iwrjtFJw0p0nYMyn_EgSNSj8', name: '10. Disposições Gerais (arts. 17-A a 18)' }
];

async function scanFolder(folder) {
  const res = await fetch(`https://drive.google.com/drive/folders/${folder.id}`, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
  });
  const html = await res.text();
  const match = html.match(/window\['_DRIVE_ivd'\]\s*=\s*'([^']+)'/);
  if (!match) return [];

  let decoded = match[1].replace(/\\x([0-9A-Fa-f]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
  decoded = decoded.replace(/\\\\+"/g, '\\"');

  const items = [];
  try {
    const data = JSON.parse(decoded);
    function extract(arr) {
      if (!Array.isArray(arr)) return;
      if (arr.length >= 4 && typeof arr[0] === 'string' && arr[0].length >= 20 && typeof arr[2] === 'string') {
        items.push({ id: arr[0], name: arr[2], mime: arr[3] });
      }
      for (const el of arr) if (Array.isArray(el)) extract(el);
    }
    extract(data);
  } catch (e) {
    console.error('Parse error for folder', folder.name, e.message);
  }
  return items;
}

async function run() {
  console.log('Escaneando subpastas de Lei de Lavagem de Dinheiro...');
  const audios = [];

  for (const sf of subfolders) {
    const items = await scanFolder(sf);
    console.log(`- ${sf.name}: ${items.length} itens`);
    for (const item of items) {
      if (item.name.toLowerCase().endsWith('.mp3')) {
        let artNum = '';
        const m = item.name.match(/(?:Art\.?|Artigo)?\s*0*([0-9]+(?:\-[A-Za-z0-9]+)?)/i);
        artNum = m ? m[1] : item.name.replace(/\.[^.]+$/, '').trim();

        audios.push({
          driveId: item.id,
          fileName: item.name,
          artigoNumero: artNum,
          category: 'leis especiais',
          lawName: 'Lei de Lavagem de Dinheiro (9.613/1998)',
          tabelaNome: 'LLAV_LAVAGEM_DINHEIRO',
          sigla: 'LLAV',
          subfolder: sf.name
        });
      }
    }
  }

  console.log(`Total de áudios encontrados na Lei de Lavagem: ${audios.length}`);
  const current = JSON.parse(fs.readFileSync('scripts/all_drive_audios.json', 'utf8'));
  const merged = [...current, ...audios];
  fs.writeFileSync('scripts/all_drive_audios.json', JSON.stringify(merged, null, 2), 'utf8');
  console.log(`Novo total geral de áudios em scripts/all_drive_audios.json: ${merged.length}`);
}

run().catch(console.error);
