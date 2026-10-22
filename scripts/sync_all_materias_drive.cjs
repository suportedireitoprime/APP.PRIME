const fs = require('fs');
const path = require('path');
const { processTheme, uploadToR2 } = require('./process_resumos_drive.cjs');

const BUNDLE_DIR = path.join(__dirname, '..', 'public', 'offline-bundle');
if (!fs.existsSync(BUNDLE_DIR)) {
  fs.mkdirSync(BUNDLE_DIR, { recursive: true });
}
const CATALOG_FILE = path.join(BUNDLE_DIR, 'resumos-catalog.json');
const PROGRESS_FILE = path.join(__dirname, 'resumos_sync_progress.json');

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

const stopWords = new Set([
  'contra', 'para', 'com', 'sem', 'sob', 'sobre', 'dos', 'das',
  'uma', 'uns', 'umas', 'resumo', 'de', 'do', 'da', 'e', 'o', 'a',
  'em', 'no', 'na', 'nos', 'nas', 'ao', 'aos'
]);

function findBestMatch(rName, narracoes) {
  const rClean = normalize(rName.replace(/^[\d\s\-]+resumo\s*[-–]\s*/i, '').replace(/\.docx$/i, ''));
  const rWords = rClean.split(' ').filter(w => w.length > 1 && !stopWords.has(w));
  let best = null;
  let bestScore = 0;

  for (const n of narracoes) {
    const nClean = normalize(n.name);
    const nWords = nClean.split(' ').filter(w => w.length > 1 && !stopWords.has(w));
    
    const common = rWords.filter(w => nWords.includes(w)).length;
    const score = common / Math.max(rWords.length, nWords.length);
    
    if (rClean === nClean) return n;
    if (score > bestScore && common >= 1) {
      bestScore = score;
      best = n;
    }
  }
  return bestScore >= 0.3 ? best : null;
}

// Escaneia itens de uma pasta do Drive
async function scanFolderItems(folderId) {
  const url = `https://drive.google.com/drive/folders/${folderId}`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  });

  const html = await res.text();
  const match = html.match(/window\['_DRIVE_ivd'\]\s*=\s*'([^']+)'/);
  if (!match) return [];

  const hexDecoded = match[1].replace(/\\x([0-9A-Fa-f]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
  let data;
  try {
    data = JSON.parse(hexDecoded);
  } catch (e) {
    return [];
  }

  const items = [];
  function findItems(arr) {
    if (!Array.isArray(arr)) return;
    if (arr.length >= 4 && typeof arr[0] === 'string' && arr[0].length >= 20 && typeof arr[2] === 'string') {
      items.push({
        id: arr[0],
        parentId: arr[1],
        name: arr[2],
        mimeType: arr[3],
        isFolder: arr[3] === 'application/vnd.google-apps.folder'
      });
    }
    for (const el of arr) {
      if (Array.isArray(el)) findItems(el);
    }
  }

  findItems(data);
  return items;
}

// Mapeamento padrão de capas para cada área
const AREA_COVERS = {
  'direito penal': '/covers/cp_artigos_v2.webp',
  'direito civil': '/covers/cc_artigos_v2.webp',
  'direito processual civil': '/covers/cpc_artigos_v2.webp',
  'direito constitucional': '/covers/cf_artigos_v2.webp',
  'direito administrativo': '/covers/adm_artigos_v2.webp',
  'direito do trabalho': '/covers/clt_artigos_v2.webp',
  'direito processual penal': '/covers/cpp_artigos_v2.webp',
  'direito tributario': '/covers/ctn_artigos_v2.webp',
  'direito empresarial': '/covers/cc_artigos_v2.webp'
};

async function syncMateria(materiaFolder) {
  const cleanMateriaName = materiaFolder.name.replace(/^[\d\s_]+/, '').replace(/_/g, ' ').trim();
  console.log(`\n======================================================================`);
  console.log(`INICIANDO SINCRONIZAÇÃO DA MATÉRIA: [${cleanMateriaName}]`);
  console.log(`Folder ID: ${materiaFolder.id}`);
  console.log(`======================================================================`);

  const subItems = await scanFolderItems(materiaFolder.id);
  const resumosFolder = subItems.find(i => i.isFolder && /resumos?/i.test(i.name));
  const narracoesFolder = subItems.find(i => i.isFolder && /narrac(oes|ao|ões)/i.test(i.name));

  if (!resumosFolder) {
    console.log(`⚠️ Pasta de resumos não encontrada em ${cleanMateriaName}. Pulando.`);
    return;
  }

  console.log(`Varrendo pasta de resumos (.docx)...`);
  const resumosFiles = await scanFolderItems(resumosFolder.id);
  const docxFiles = resumosFiles.filter(f => f.name.endsWith('.docx'));
  console.log(`Encontrados ${docxFiles.length} arquivos .docx de resumo`);

  let narracoesSubfolders = [];
  if (narracoesFolder) {
    console.log(`Varrendo pasta de narrações...`);
    narracoesSubfolders = await scanFolderItems(narracoesFolder.id);
    console.log(`Encontradas ${narracoesSubfolders.length} pastas/arquivos de narração`);
  }

  const progress = getProgress();
  const catalog = getCatalog();

  let areaObj = catalog.find(a => normalize(a.area) === normalize(cleanMateriaName));
  const coverUrl = AREA_COVERS[normalize(cleanMateriaName)] || '/covers/cp_artigos_v2.webp';

  if (!areaObj) {
    areaObj = {
      area: cleanMateriaName,
      total: 0,
      coverUrl,
      temas: []
    };
    catalog.push(areaObj);
  }

  for (let i = 0; i < docxFiles.length; i++) {
    const r = docxFiles[i];
    const key = `${cleanMateriaName}::${r.name}`;
    if (progress.completed[key]) {
      console.log(`⏩ [${i+1}/${docxFiles.length}] Já concluído: ${r.name}`);
      continue;
    }

    const matchFolder = findBestMatch(r.name, narracoesSubfolders);

    try {
      console.log(`\n⏳ [${i+1}/${docxFiles.length}] Processando: ${r.name}`);
      const temaResult = await processTheme(cleanMateriaName, r, matchFolder);

      areaObj.temas = areaObj.temas.filter(t => t.tema.toLowerCase() !== temaResult.tema.toLowerCase());
      areaObj.temas.push(temaResult);
      areaObj.total = areaObj.temas.reduce((sum, t) => sum + (t.total || 0), 0);

      saveCatalog(catalog);

      progress.completed[key] = {
        area: cleanMateriaName,
        tema: temaResult.tema,
        capitulos: temaResult.total,
        timestamp: new Date().toISOString()
      };
      saveProgress(progress);
      console.log(`✅ [${i+1}/${docxFiles.length}] Sucesso: ${r.name} (${temaResult.total} capítulos)`);
    } catch (e) {
      console.error(`❌ [${i+1}/${docxFiles.length}] Falha em ${r.name}:`, e.message);
      progress.failed[key] = e.message;
      saveProgress(progress);
    }
  }

  console.log(`\nFinalizada matéria ${cleanMateriaName}: ${areaObj.temas.length} temas, ${areaObj.total} subtemas.`);
}

module.exports = {
  syncMateria,
  scanFolderItems
};
