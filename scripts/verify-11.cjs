const fs = require('fs');
const books = JSON.parse(fs.readFileSync('public/offline-bundle/biblioteca-classicos.json'));

const missing11 = [
  'O Monge e o Executivo',
  'O que é Direito',
  'O Último Dia de um Condenado',
  'O Processo',
  'O Mundo Assombrado pelos Demônios',
  'Sobre a Liberdade',
  'O Príncipe',
  'Virando a Própria Mesa',
  'Teoria Pura do Direito',
  'Vigiar e Punir',
  'O Mundo de Sofia'
];

function norm(s) {
  return (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
}

async function verify() {
  console.log('=== VERIFICAÇÃO DOS 11 LIVROS NO CLOUDFLARE R2 ===\n');
  for (const title of missing11) {
    const n = norm(title);
    const b = books.find(x => norm(x.livro).includes(n) || n.includes(norm(x.livro)));
    if (!b) {
      console.error('NÃO ENCONTRADO NO JSON:', title);
      continue;
    }
    const r1 = await fetch(b.download, { method: 'HEAD' });
    const r2 = await fetch(b.downloadEscura, { method: 'HEAD' });
    const size1 = (r1.headers.get('content-length') / 1024 / 1024).toFixed(2);
    const size2 = (r2.headers.get('content-length') / 1024 / 1024).toFixed(2);
    console.log(`✓ ${b.livro}:`);
    console.log(`    Clara:  HTTP ${r1.status} (${size1} MB) -> ${b.download}`);
    console.log(`    Escura: HTTP ${r2.status} (${size2} MB) -> ${b.downloadEscura}`);
  }
}

verify().catch(console.error);
