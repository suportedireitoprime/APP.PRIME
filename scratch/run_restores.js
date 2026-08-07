import fs from 'fs';

const files = fs.readdirSync('scratch').filter(f => f.startsWith('restore_old_chunk_') && f.endsWith('.sql'));
console.log('Restaurando arquivos SQL:', files);

// Une todos os SQLs dos chunks
let fullSql = '';
for (const f of files) {
  fullSql += fs.readFileSync(`scratch/${f}`, 'utf-8') + '\n';
}

fs.writeFileSync('scratch/all_restore_60.sql', fullSql);
console.log('Arquivo unificado gerado em scratch/all_restore_60.sql');
