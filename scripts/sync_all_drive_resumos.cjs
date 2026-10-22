const fs = require('fs');
const path = require('path');
const { processTheme } = require('./process_resumos_drive.cjs');

const BUNDLE_DIR = path.join(__dirname, '..', 'public', 'offline-bundle');
if (!fs.existsSync(BUNDLE_DIR)) {
  fs.mkdirSync(BUNDLE_DIR, { recursive: true });
}
const CATALOG_FILE = path.join(BUNDLE_DIR, 'resumos-catalog.json');
const PROGRESS_FILE = path.join(__dirname, 'resumos_sync_progress.json');

// Carrega progresso
function getProgress() {
  if (fs.existsSync(PROGRESS_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));
    } catch {
      return { completed: {}, failed: {} };
    }
  }
  return { completed: {}, failed: {} };
}

function saveProgress(prog) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(prog, null, 2), 'utf8');
}

// Carrega catálogo
function getCatalog() {
  if (fs.existsSync(CATALOG_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(CATALOG_FILE, 'utf8'));
    } catch {
      return [];
    }
  }
  return [];
}

function saveCatalog(cat) {
  fs.writeFileSync(CATALOG_FILE, JSON.stringify(cat, null, 2), 'utf8');
}

function normalize(s) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function run() {
  const areaName = 'Direito Penal';
  const resumos = JSON.parse(fs.readFileSync('scratch/penal_resumos.json', 'utf8'));
  const narracoes = JSON.parse(fs.readFileSync('scratch/penal_narracoes.json', 'utf8'));

  const progress = getProgress();
  const catalog = getCatalog();

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

  // Lista dos temas a processar
  console.log(`Iniciando processamento de ${resumos.length} temas de Direito Penal...`);

  for (let i = 0; i < resumos.length; i++) {
    const r = resumos[i];
    if (progress.completed[r.name]) {
      console.log(`⏩ [${i+1}/${resumos.length}] Já concluído anteriormente: ${r.name}`);
      continue;
    }

    const rClean = normalize(r.name.replace(/^[\d\s\-]+resumo\s*[-–]\s*/i, '').replace(/\.docx$/i, ''));
    
    // Procura pasta de narração
    const matchFolder = narracoes.find(n => {
      const nClean = normalize(n.name);
      return rClean.includes(nClean) || nClean.includes(rClean) ||
        (rClean.split(' ').filter(w => w.length > 3).every(w => nClean.includes(w)));
    });

    try {
      console.log(`\n⏳ [${i+1}/${resumos.length}] Processando: ${r.name}`);
      const temaResult = await processTheme(areaName, r, matchFolder);

      // Atualiza catálogo
      areaObj.temas = areaObj.temas.filter(t => t.tema.toLowerCase() !== temaResult.tema.toLowerCase());
      areaObj.temas.push(temaResult);
      areaObj.total = areaObj.temas.reduce((sum, t) => sum + (t.total || 0), 0);

      saveCatalog(catalog);

      progress.completed[r.name] = {
        tema: temaResult.tema,
        capitulos: temaResult.total,
        timestamp: new Date().toISOString()
      };
      saveProgress(progress);
      console.log(`✅ [${i+1}/${resumos.length}] Sucesso: ${r.name} (${temaResult.total} capítulos)`);
    } catch (e) {
      console.error(`❌ [${i+1}/${resumos.length}] Falha em ${r.name}:`, e.message);
      progress.failed[r.name] = e.message;
      saveProgress(progress);
    }
  }

  console.log(`\n==================================================`);
  console.log(`PROCESSAMENTO CONCLUÍDO!`);
  console.log(`Total de temas no catálogo: ${areaObj.temas.length}`);
  console.log(`Total de subtemas/capítulos: ${areaObj.total}`);
  console.log(`==================================================`);
}

run().catch(console.error);
