const fs = require('fs');
const path = require('path');

const TASKS_DIR = 'C:\\Users\\ext_wpereira\\.gemini\\antigravity\\brain\\4e9dcdc2-8d38-4c34-a586-4135360b26f4\\.system_generated\\tasks';

function getLatestLogFile() {
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

function renderDashboard() {
  const isWatch = process.argv.includes('--watch') || process.argv.includes('-w');

  // 1. Total Geral do Acervo (22 Matérias · 387 Módulos · ~2.400 Aulas)
  const totalModulosGeral = 387;
  const totalAulasGeral = 2399; // 387 módulos * ~6.2 aulas por módulo
  const modulosPreExistentes = 153;
  const aulasPreExistentes = 1326; // Administrativo, Constitucional, Trabalho, Penal

  // 2. Checkpoints concluídos nesta expansão
  const checkpoints = fs.readdirSync('.').filter(f => f.startsWith('checkpoint_') && f.endsWith('.json'));
  let modulosCheckpoints = 0;
  let aulasCheckpoints = 0;
  const materiasDetalhe = [];

  for (const cp of checkpoints) {
    try {
      const d = JSON.parse(fs.readFileSync(cp, 'utf8'));
      const mQtd = d.materias ? d.materias.length : 0;
      const aQtd = d.aulas ? d.aulas.length : 0;
      modulosCheckpoints += mQtd;
      aulasCheckpoints += aQtd;
      materiasDetalhe.push({
        slug: cp.replace('checkpoint_', '').replace('.json', ''),
        modulos: mQtd,
        aulas: aQtd
      });
    } catch {}
  }

  // 3. Analisar log do task atual
  let materiaAtual = 'Processando enxame...';
  let arquivosNoTask = 0;
  let aulas100PctNoTask = 0;
  let isTaskActive = false;
  let taskRunningSec = 1;

  const latestLog = getLatestLogFile();
  if (latestLog && fs.existsSync(latestLog)) {
    try {
      const stats = fs.statSync(latestLog);
      const logContent = fs.readFileSync(latestLog, 'utf8');
      const timeSinceLastWrite = (Date.now() - stats.mtimeMs) / 1000;
      isTaskActive = timeSinceLastWrite < 25;

      const taskStartTime = stats.birthtimeMs || stats.ctimeMs;
      taskRunningSec = isTaskActive 
        ? Math.max(1, (Date.now() - taskStartTime) / 1000)
        : Math.max(1, (stats.mtimeMs - taskStartTime) / 1000);

      const dotMatches = logContent.match(/\./g) || [];
      arquivosNoTask = dotMatches.length;

      const okMatches = logContent.match(/(-> OK|\[DONE\s+✓(30x|100x|200x|1500x)\])/g) || [];
      aulas100PctNoTask = okMatches.length;

      const matMatches = [...logContent.matchAll(/\[([a-z-]+)\]\s+Aula/g)];
      if (matMatches.length > 0) {
        materiaAtual = matMatches[matMatches.length - 1][1];
      }
    } catch {}
  }

  // Total acumulado em tempo real
  const totalAulasProntas = aulasPreExistentes + aulasCheckpoints;
  const aulasFaltantes = Math.max(0, totalAulasGeral - totalAulasProntas);

  // Velocidade e ETA
  let velAulasPorMinuto = 35; // Baseline do enxame paralelo (100 workers)
  if (isTaskActive && taskRunningSec > 10 && arquivosNoTask > 0) {
    const arqPerSec = arquivosNoTask / taskRunningSec;
    velAulasPorMinuto = Math.max(15, (arqPerSec * 60) / 40);
  }
  const tempoRestanteSegundos = aulasFaltantes * (60 / velAulasPorMinuto);

  // Barra de progresso geral
  const pct = Math.min(100, Math.round((totalAulasProntas / totalAulasGeral) * 100));
  const barraLen = 35;
  const cheios = Math.round((pct / 100) * barraLen);
  const vazios = barraLen - cheios;
  const barra = '█'.repeat(cheios) + '░'.repeat(vazios);

  if (isWatch) console.clear();

  console.log('╔══════════════════════════════════════════════════════════════════════╗');
  console.log('║        PAINEL DE SINCRONIZAÇÃO EM TEMPO REAL — R2 CLOUDFLARE        ║');
  console.log('╚══════════════════════════════════════════════════════════════════════╝\n');
  console.log(` Progresso Geral: [${barra}] ${pct}% (${totalAulasProntas} / ${totalAulasGeral} aulas)`);
  console.log(` ----------------------------------------------------------------------`);
  console.log(` • Aulas Já Concluídas (R2 + App)     : ${totalAulasProntas} aulas`);
  console.log(` • Aulas Restantes                    : ${aulasFaltantes} aulas`);
  console.log(` • Total Geral Acervo Completo        : ${totalAulasGeral} aulas em ${totalModulosGeral} módulos (22 disciplinas)`);
  console.log(` ----------------------------------------------------------------------`);
  console.log(` ⚡ VELOCIDADE ATUAL                  : ${velAulasPorMinuto.toFixed(1)} aulas/minuto (~${(60 / velAulasPorMinuto).toFixed(1)}s por aula)`);
  console.log(` ⏳ TEMPO ESTIMADO RESTANTE (ETA)     : ~${formatDuration(tempoRestanteSegundos)}`);
  console.log(` 🚀 STATUS DO ENXAME                  : ${isTaskActive ? '🟢 ATIVO (100 AULAS PARALELAS · POOL 4096)' : '🔄 RETOMANDO SINCRONIZAÇÃO...'}`);
  console.log(` 📂 MATÉRIA EM PROCESSAMENTO          : ${materiaAtual}`);
  console.log(` ----------------------------------------------------------------------`);
  console.log(` Matérias Concluídas:`);
  console.log(`   ✓ BASE INICIAL (4 MATÉRIAS)       : 153 módulos | 1.326 aulas`);
  for (const m of materiasDetalhe) {
    console.log(`   ✓ ${m.slug.toUpperCase().padEnd(32)} : ${m.modulos} módulos | ${m.aulas} aulas`);
  }
  console.log(` ----------------------------------------------------------------------`);
  if (isWatch) {
    console.log(` [Atualizando em tempo real a cada 2s... Pressione Ctrl+C para sair]`);
  }
}

renderDashboard();

if (process.argv.includes('--watch') || process.argv.includes('-w')) {
  setInterval(renderDashboard, 2000);
}
