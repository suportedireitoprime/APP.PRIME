const fs = require('fs');
const path = require('path');

const TASKS_DIR = 'C:\\Users\\ext_wpereira\\.gemini\\antigravity\\brain\\4e9dcdc2-8d38-4c34-a586-4135360b26f4\\.system_generated\\tasks';

function getActiveSyncLog() {
  try {
    const files = fs.readdirSync(TASKS_DIR)
      .filter(f => f.startsWith('task-') && f.endsWith('.log'))
      .map(f => path.join(TASKS_DIR, f))
      .filter(f => {
        try {
          const head = fs.readFileSync(f, 'utf8').slice(0, 1000);
          return head.includes('STARTING MATÉRIA') || head.includes('sync_pipeline') || head.includes('30x');
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

const targetLog = getActiveSyncLog();
if (!targetLog) {
  console.log('Nenhum log de sincronização ativo encontrado no momento.');
  process.exit(0);
}

console.clear();
console.log('================================================================');
console.log(` ACOMPANHAMENTO DE LOGS AO VIVO (30 AULAS SIMULTÂNEAS)          `);
console.log(` Arquivo: ${path.basename(targetLog)}`);
console.log(' (Pressione Ctrl + C para sair a qualquer momento)');
console.log('================================================================\n');

// Read initial last 40 lines
let lastSize = 0;
try {
  const content = fs.readFileSync(targetLog, 'utf8');
  lastSize = Buffer.byteLength(content, 'utf8');
  const lines = content.split('\n');
  const tail = lines.slice(-35).join('\n');
  process.stdout.write(tail);
} catch (e) {}

// Stream new bytes every 500ms
setInterval(() => {
  try {
    const stats = fs.statSync(targetLog);
    if (stats.size > lastSize) {
      const stream = fs.createReadStream(targetLog, {
        start: lastSize,
        end: stats.size
      });
      lastSize = stats.size;
      stream.pipe(process.stdout);
    }
  } catch (e) {}
}, 500);

