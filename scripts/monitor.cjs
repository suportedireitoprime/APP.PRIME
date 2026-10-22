const fs = require('fs');
const path = require('path');

const adaptLog = path.resolve('scripts/adapt-articles.log');
const importLog = path.resolve('scripts/import.log');
const taskLog = 'C:\\Users\\ext_wpereira\\.gemini\\antigravity-ide\\brain\\40b2fe2b-fe10-4513-a17e-0b047c5609ef\\.system_generated\\tasks\\task-1571.log';

// Determina qual arquivo de log exibir
let targetLog = adaptLog;
if (process.argv.includes('--import') || (!fs.existsSync(adaptLog) && fs.existsSync(importLog))) {
  targetLog = importLog;
} else if (!fs.existsSync(adaptLog) && fs.existsSync(taskLog)) {
  targetLog = taskLog;
}

console.clear();
console.log('================================================================');
console.log('       ACOMPANHAMENTO EM TEMPO REAL DOS LOGS DO BLOG            ');
console.log('================================================================');
console.log(`Monitorando: ${targetLog}\n`);

let lastSize = 0;

function printNewContent() {
  try {
    if (!fs.existsSync(targetLog)) return;
    const stat = fs.statSync(targetLog);
    if (stat.size > lastSize) {
      const stream = fs.createReadStream(targetLog, {
        start: Math.max(0, lastSize === 0 ? stat.size - 4000 : lastSize),
        end: stat.size
      });
      stream.on('data', chunk => {
        process.stdout.write(chunk.toString());
      });
      lastSize = stat.size;
    }
  } catch {}
}

printNewContent();
setInterval(printNewContent, 1000);
