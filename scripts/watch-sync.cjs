const fs = require('fs');
const path = require('path');

const LOG_FILE = 'C:\\Users\\ext_wpereira\\.gemini\\antigravity-ide\\brain\\4a51176c-8daf-4994-baef-af690062e377\\.system_generated\\tasks\\task-611.log';
const PROGRESS_FILE = path.join(__dirname, 'sync_r2_progress.json');
const AUDIOS_FILE = path.join(__dirname, 'all_drive_audios.json');

console.clear();
console.log('====================================================');
console.log('   MONITOR DE SINCRONIZAÇÃO: GOOGLE DRIVE -> R2     ');
console.log('====================================================\n');

function showStatus() {
  if (fs.existsSync(LOG_FILE)) {
    const content = fs.readFileSync(LOG_FILE, 'utf8');
    const lines = content.trim().split('\n').filter(Boolean);
    const lastLines = lines.slice(-15);
    console.clear();
    console.log('====================================================');
    console.log('   MONITOR EM TEMPO REAL: GOOGLE DRIVE -> R2       ');
    console.log('   (Pressione Ctrl + C para fechar este monitor)    ');
    console.log('====================================================\n');
    console.log(lastLines.join('\n'));
  } else if (fs.existsSync(PROGRESS_FILE)) {
    const prog = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));
    const total = fs.existsSync(AUDIOS_FILE) ? JSON.parse(fs.readFileSync(AUDIOS_FILE, 'utf8')).length : 6603;
    const count = Object.keys(prog).length;
    const pct = ((count / total) * 100).toFixed(1);
    console.clear();
    console.log(`Progresso: ${count}/${total} (${pct}%)`);
  }
}

showStatus();
setInterval(showStatus, 2000);
