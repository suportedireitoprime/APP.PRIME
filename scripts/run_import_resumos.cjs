const fs = require('fs');
const path = require('path');
const { processTheme } = require('./process_resumos_drive.cjs');

// Assegura diretório de destino
const BUNDLE_DIR = path.join(__dirname, '..', 'public', 'offline-bundle');
if (!fs.existsSync(BUNDLE_DIR)) {
  fs.mkdirSync(BUNDLE_DIR, { recursive: true });
}
const CATALOG_FILE = path.join(BUNDLE_DIR, 'resumos-catalog.json');

// Carrega catálogo existente ou inicializa
let catalog = [];
if (fs.existsSync(CATALOG_FILE)) {
  try {
    catalog = JSON.parse(fs.readFileSync(CATALOG_FILE, 'utf8'));
  } catch {
    catalog = [];
  }
}

async function run() {
  const areaName = 'Direito Penal';

  // Lista dos temas prioritários com seus arquivos .docx e pastas de áudio
  const targets = [
    {
      docx: {
        id: '1gZzggPZ-T8C2aw0ZG_B8mhH85JJDHeiK',
        name: '35 - Resumo - Crimes Praticados por Funcionario Publico contra a Administracao.docx'
      },
      audioFolder: {
        id: '1DesE3nzo_99I54aXIt-eXQNwSfNLBcjY',
        name: 'crimes-funcionario-publico'
      }
    },
    {
      docx: {
        id: '1blNiCCDz021IJom8XjfNhzNNP1vT1YVe',
        name: '01 - Resumo - Crimes contra a Familia.docx'
      },
      audioFolder: {
        id: '1qjbaoMyP81fTM-HYPjuZD1UQZCO3BsCP',
        name: 'crimes-contra-a-familia'
      }
    }
  ];

  for (const target of targets) {
    try {
      const temaResult = await processTheme(areaName, target.docx, target.audioFolder);

      // Atualiza catálogo em memória
      let areaObj = catalog.find(a => a.area.toLowerCase() === areaName.toLowerCase());
      if (!areaObj) {
        areaObj = {
          area: areaName,
          total: 0,
          coverUrl: '/covers/cp_artigos_v2.webp',
          temas: []
        };
        catalog.push(areaObj);
      }

      // Remove tema antigo se já existir e adiciona o novo completo
      areaObj.temas = areaObj.temas.filter(t => t.tema.toLowerCase() !== temaResult.tema.toLowerCase());
      areaObj.temas.push(temaResult);
      areaObj.total = areaObj.temas.reduce((sum, t) => sum + (t.total || 0), 0);

      // Persiste no arquivo JSON
      fs.writeFileSync(CATALOG_FILE, JSON.stringify(catalog, null, 2), 'utf8');
      console.log(`\n🎉 Tema [${temaResult.tema}] salvo no catálogo com ${temaResult.total} capítulos!`);
    } catch (err) {
      console.error(`Erro ao processar ${target.docx.name}:`, err);
    }
  }

  console.log(`\n Catálogo atualizado em: ${CATALOG_FILE}`);
  console.log(`Áreas no catálogo: ${catalog.length}`);
  catalog.forEach(a => console.log(` - ${a.area}: ${a.temas.length} temas, ${a.total} subtemas`));
}

run().catch(console.error);
