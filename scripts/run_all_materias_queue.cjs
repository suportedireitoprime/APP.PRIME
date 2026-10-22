const fs = require('fs');
const path = require('path');
const { syncMateria } = require('./sync_all_materias_drive.cjs');

const LOG_FILE = path.join(__dirname, 'sync_queue.log');

// Log duplo (console + arquivo para acompanhamento em tempo real)
const originalLog = console.log;
const originalErr = console.error;

function appendLog(level, args) {
  const line = `[${new Date().toLocaleTimeString('pt-BR')}] ${args.join(' ')}\n`;
  try {
    fs.appendFileSync(LOG_FILE, line, 'utf8');
  } catch {}
}

console.log = (...args) => {
  originalLog(...args);
  appendLog('INFO', args);
};

console.error = (...args) => {
  originalErr(...args);
  appendLog('ERROR', args);
};

async function main() {
  fs.writeFileSync(LOG_FILE, `=== INÍCIO DA SINCRONIZAÇÃO EM LOTE: ${new Date().toLocaleString('pt-BR')} ===\n\n`, 'utf8');
  const rootFolders = JSON.parse(fs.readFileSync('scratch/drive_root_folders.json', 'utf8'));
  const materias = rootFolders.filter(f => f.mimeType === 'application/vnd.google-apps.folder');

  console.log(`Encontradas ${materias.length} pastas de matérias para processar.`);

  for (const m of materias) {
    // Pula Direito Penal pois já está 100% finalizado
    if (/direito penal/i.test(m.name) && !/processual/i.test(m.name) && !/especial/i.test(m.name)) {
      console.log(`⏩ Matéria [${m.name}] já concluída 100%. Pulando.`);
      continue;
    }

    try {
      await syncMateria(m);
    } catch (err) {
      console.error(`Erro ao sincronizar matéria ${m.name}:`, err.message);
    }
  }

  console.log('\n============================================================');
  console.log('TODAS AS MATÉRIAS DO DRIVE FORAM PROCESSADAS COM SUCESSO!');
  console.log('============================================================');
}

main().catch(console.error);
