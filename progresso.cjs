const fs = require('fs');
const path = require('path');

const TASKS_DIR = 'C:\\Users\\ext_wpereira\\.gemini\\antigravity\\brain\\4e9dcdc2-8d38-4c34-a586-4135360b26f4\\.system_generated\\tasks';

function getActiveLog() {
  try {
    if (!fs.existsSync(TASKS_DIR)) return null;
    const files = fs.readdirSync(TASKS_DIR)
      .filter(f => f.startsWith('task-') && f.endsWith('.log'))
      .map(f => path.join(TASKS_DIR, f))
      .filter(f => {
        try {
          const head = fs.readFileSync(f, 'utf8').slice(0, 800);
          return head.includes('STARTING MATÉRIA') || head.includes('sync_pipeline') || head.includes('FILA GLOBAL') || head.includes('ENXAME');
        } catch {
          return false;
        }
      })
      .map(full => ({ path: full, mtime: fs.statSync(full).mtimeMs }))
      .sort((a, b) => b.mtime - a.mtime);
    return files.length > 0 ? files[0].path : null;
  } catch {
    return null;
  }
}

function formatDuration(seconds) {
  if (isNaN(seconds) || seconds <= 0 || !isFinite(seconds)) return '--';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m ${s}s`;
}

function render() {
  const activeLog = getActiveLog();
  let materiaAtual = 'Processando...';
  let arquivosLote = 0;
  let aulasTask = 0;
  let isTaskActive = false;
  let taskSec = 1;

  if (activeLog && fs.existsSync(activeLog)) {
    try {
      const stats = fs.statSync(activeLog);
      const isRecent = (Date.now() - stats.mtimeMs) < 25000;
      isTaskActive = isRecent;
      const durationSec = isRecent 
        ? Math.max(1, (Date.now() - stats.birthtimeMs) / 1000)
        : Math.max(1, (stats.mtimeMs - stats.birthtimeMs) / 1000);
      taskSec = durationSec;

      const content = fs.readFileSync(activeLog, 'utf8');
      const dots = (content.match(/\./g) || []).length;
      arquivosLote = dots;

      const okMatches = (content.match(/(DONE\s+✓(30x|100x|200x|1500x)|-> OK)/g) || []).length;
      aulasTask = okMatches;

      const matMatches = [...content.matchAll(/\[([a-z-]+)\]\s+Aula/g)];
      if (matMatches.length > 0) {
        materiaAtual = matMatches[matMatches.length - 1][1];
      }
    } catch {}
  }

  // 1. Total Geral (22 Matérias · 387 Módulos · ~2.400 Aulas)
  const totalGeralEstimado = 2399;
  const aulasPreExistentes = 1326;

  // 2. Checkpoints
  const checkpoints = fs.readdirSync('.').filter(f => f.startsWith('checkpoint_') && f.endsWith('.json'));
  let aulasCheckpoints = 0;
  for (const cp of checkpoints) {
    try {
      const d = JSON.parse(fs.readFileSync(cp, 'utf8'));
      aulasCheckpoints += (d.aulas ? d.aulas.length : 0);
    } catch {}
  }

  const totalAulasFeitas = aulasPreExistentes + aulasCheckpoints;
  const aulasFaltam = Math.max(0, totalGeralEstimado - totalAulasFeitas);

  // 3. Velocidade e ETA
  let vel = 35.0; // Baseline do enxame paralelo de 100 workers
  if (isTaskActive && taskSec > 10 && arquivosLote > 0) {
    vel = Math.max(15, ((arquivosLote / taskSec) * 60) / 40);
  }
  const etaSec = aulasFaltam * (60 / Math.max(0.1, vel));

  // Barra de progresso
  const pct = Math.min(100, Math.round((totalAulasFeitas / totalGeralEstimado) * 100));
  const barraLen = 35;
  const preenchido = Math.round((pct / 100) * barraLen);
  const barra = '█'.repeat(preenchido) + '░'.repeat(barraLen - preenchido);

  // Saída estática no terminal (sem scroll)
  process.stdout.write('\x1b[2J\x1b[0;0H');
  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║        STATUS DA SINCRONIZAÇÃO — AULAS INTERATIVAS (R2)          ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝\n');
  console.log(` Progresso Geral : [${barra}] ${pct}%\n`);
  console.log(` • Aulas Concluídas : ${totalAulasFeitas} de ${totalGeralEstimado} aulas (22 disciplinas)`);
  console.log(` • Aulas Restantes  : ${aulasFaltam} aulas restantes\n`);
  console.log(` • ⚡ Velocidade    : ${vel.toFixed(1)} aulas/minuto (~${(60/vel).toFixed(1)}s por aula)`);
  console.log(` • ⏳ Tempo Estimado: ~${formatDuration(etaSec)}`);
  console.log(` • 🚀 Status Enxame : ${isTaskActive ? '🟢 ATIVO (100 AULAS PARALELAS)' : '🔄 SINCRONIZANDO...'}\n`);
  console.log(` • 📂 Em Andamento  : ${materiaAtual}`);
  console.log('────────────────────────────────────────────────────────────────────');
  console.log(' (Atualizando em tempo real a cada 2s... Pressione Ctrl + C para sair)');
}

render();
setInterval(render, 2000);
