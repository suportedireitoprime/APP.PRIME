const fs = require('fs');
const { syncMateria } = require('./sync_all_materias_drive.cjs');

async function main() {
  const rootFolders = JSON.parse(fs.readFileSync('scratch/drive_root_folders.json', 'utf8'));
  const materias = rootFolders.filter(f => f.mimeType === 'application/vnd.google-apps.folder');

  console.log(`Encontradas ${materias.length} pastas de matérias para processar.`);

  for (const m of materias) {
    // Pula Direito Penal pois já está sendo processado por sync_all_drive_resumos.cjs
    if (/direito penal/i.test(m.name) && !/processual/i.test(m.name) && !/especial/i.test(m.name)) {
      console.log(`⏩ Matéria [${m.name}] tratada separadamente.`);
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
