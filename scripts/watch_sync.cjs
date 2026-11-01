/**
 * DASHBOARD EM TEMPO REAL NO TERMINAL
 * Execute no seu PowerShell ou CMD:
 * node scripts/watch_sync.cjs
 */
const fs = require('fs');
const path = require('path');

const PROGRESS_FILE = path.join(__dirname, 'aulas_media_sync_progress.json');
const CATALOGO_FILE = path.join(__dirname, '4_disciplinas_completo.json');

const TOTALS = {
  'direito-penal': { nome: 'Direito Penal', total: 456 },
  'direito-administrativo': { nome: 'Direito Administrativo', total: 187 },
  'direito-constitucional': { nome: 'Direito Constitucional', total: 271 },
  'direito-do-trabalho': { nome: 'Direito do Trabalho', total: 325 }
};

function renderProgressBar(pct, width = 30) {
  const filled = Math.round((pct / 100) * width);
  const empty = width - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}

function updateScreen() {
  let progress = {};
  if (fs.existsSync(PROGRESS_FILE)) {
    try {
      progress = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));
    } catch {}
  }

  const counts = {
    'direito-penal': 0,
    'direito-administrativo': 0,
    'direito-constitucional': 0,
    'direito-do-trabalho': 0
  };

  let totalAudios = 0;
  let totalImgs = 0;
  const recentEntries = [];

  for (const [key, val] of Object.entries(progress)) {
    if (val.status === 'concluido') {
      const disc = key.split('/')[0];
      if (counts[disc] !== undefined) {
        counts[disc]++;
      }
      totalAudios += (val.audios || 0);
      totalImgs += (val.imagens || 0);
      if (val.completedAt) {
        recentEntries.push({ key, ...val });
      }
    }
  }

  recentEntries.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));

  const total3Restantes = 187 + 271 + 325; // 783
  const concluidas3Restantes = counts['direito-administrativo'] + counts['direito-constitucional'] + counts['direito-do-trabalho'];
  const pct3Restantes = ((concluidas3Restantes / total3Restantes) * 100).toFixed(1);

  const totalGeral4 = 456 + total3Restantes; // 1239
  const concluidasGeral = counts['direito-penal'] + concluidas3Restantes;
  const pctGeral = ((concluidasGeral / totalGeral4) * 100).toFixed(1);

  // Limpa tela do terminal
  process.stdout.write('\x1Bc');

  console.log('==============================================================================');
  console.log('⚡ PAINEL HYPER WARP - SINCRONIZAÇÃO CLOUDFLARE R2 EM TEMPO REAL');
  console.log('==============================================================================');
  console.log(`HORA: ${new Date().toLocaleTimeString('pt-BR')}  |  Áudios no R2: ${totalAudios.toLocaleString()}  |  Imagens no R2: ${totalImgs.toLocaleString()}`);
  console.log('------------------------------------------------------------------------------');
  console.log(`🎯 PROGRESSO DAS 3 MATÉRIAS SOLICITADAS: [${concluidas3Restantes}/${total3Restantes}] - ${pct3Restantes}%`);
  console.log(`   [${renderProgressBar(parseFloat(pct3Restantes), 40)}] ${pct3Restantes}%`);
  console.log(`   Faltam exatamente: ${total3Restantes - concluidas3Restantes} aulas`);
  console.log('------------------------------------------------------------------------------');

  for (const [discKey, info] of Object.entries(TOTALS)) {
    const done = counts[discKey] || 0;
    const pct = ((done / info.total) * 100).toFixed(1);
    const bar = renderProgressBar(parseFloat(pct), 20);
    const statusIcon = done >= info.total ? '✅ CONCLUÍDO' : '⚡ SINCRONIZANDO';
    const padding = ' '.repeat(Math.max(0, 24 - info.nome.length));
    console.log(`• ${info.nome}${padding} [${bar}] ${done.toString().padStart(3, ' ')}/${info.total} (${pct.padStart(5, ' ')}%)  ${statusIcon}`);
  }

  console.log('------------------------------------------------------------------------------');
  console.log(`🌐 TOTAL GERAL DO APLICATIVO (4 DISCIPLINAS): [${concluidasGeral}/${totalGeral4}] - ${pctGeral}%`);
  console.log(`   [${renderProgressBar(parseFloat(pctGeral), 40)}] ${pctGeral}%`);
  console.log('------------------------------------------------------------------------------');
  console.log('ÚLTIMAS AULAS SINCRONIZADAS:');
  const topRecent = recentEntries.slice(0, 5);
  if (topRecent.length === 0) {
    console.log('   Iniciando downloads e uploads simultâneos...');
  } else {
    for (const r of topRecent) {
      const parts = r.key.split('/');
      const hora = r.completedAt ? new Date(r.completedAt).toLocaleTimeString('pt-BR') : '';
      console.log(`   [${hora}] ${parts[0]} > ${parts[2]} (${r.audios || 0} áudios, ${r.imagens || 0} imgs)`);
    }
  }
  console.log('==============================================================================');
  console.log('Pressione Ctrl+C para sair deste monitor (o processo de sync continuará rodando).');
}

// Atualiza a cada 1.5s
setInterval(updateScreen, 1500);
updateScreen();

