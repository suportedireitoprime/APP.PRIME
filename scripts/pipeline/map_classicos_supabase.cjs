const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const SUPABASE_URL = 'https://dnjrgpldcwcpoywamorr.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJncGxkY3djcG95d2Ftb3JyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY4NjEzMywiZXhwIjoyMDk4MjYyMTMzfQ.M4cllbXRDvqgCt5T7_yFjnT4seIYU-Va7Bs6PhRDu-w';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

function normalizeStr(s) {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

async function run() {
  const { data: dbBooks, error } = await supabase
    .from('biblioteca_classicos')
    .select('id, livro, autor, audio_resumo_url, curiosidades')
    .order('id');

  if (error) {
    console.error('Supabase error:', error);
    return;
  }

  const files = JSON.parse(fs.readFileSync('scripts/pipeline/classicos_files_list.json', 'utf8'));
  const driveBooks = {};

  files.forEach(f => {
    if (f.name.startsWith('Controle')) return;
    const m = f.name.match(/^(\d{2}-[a-z0-9-]+?)(?:-ficha-cornell\.pdf|-roteiro\.txt|\.mp3|\.srt)$/i);
    const key = m ? m[1] : f.name.replace(/\.[^.]+$/, '');
    if (!driveBooks[key]) {
      driveBooks[key] = { key, titleGuess: key.replace(/^\d{2}-/, '').replace(/-/g, ' ') };
    }
  });

  console.log(`Matching ${Object.keys(driveBooks).length} drive books against ${dbBooks.length} Supabase classicos...`);

  const matched = [];
  const unmatched = [];

  for (const key of Object.keys(driveBooks).sort()) {
    const driveNorm = normalizeStr(driveBooks[key].titleGuess);
    let match = dbBooks.find(b => {
      const bookNorm = normalizeStr(b.livro);
      return bookNorm === driveNorm || bookNorm.includes(driveNorm) || driveNorm.includes(bookNorm);
    });

    // Special custom aliases if needed
    if (!match) {
      if (key.includes('justica')) match = dbBooks.find(b => b.livro.includes('Justiça'));
      if (key.includes('o-que-e-direito')) match = dbBooks.find(b => b.livro.includes('O que é Direito'));
      if (key.includes('acesso-a-justica')) match = dbBooks.find(b => b.livro.includes('Acesso à Justiça'));
      if (key.includes('o-espirito-das-leis')) match = dbBooks.find(b => b.livro.includes('O Espírito das Leis'));
      if (key.includes('a-teoria-das-formas-de-governo')) match = dbBooks.find(b => b.livro.includes('Formas de Governo'));
      if (key.includes('o-advogado-do-diabo')) match = dbBooks.find(b => b.livro.includes('Advogado do Diabo'));
    }

    if (match) {
      matched.push({ key, dbId: match.id, dbLivro: match.livro, dbAutor: match.autor });
    } else {
      unmatched.push(key);
    }
  }

  console.log(`Matched: ${matched.length} / ${Object.keys(driveBooks).length}`);
  if (unmatched.length > 0) {
    console.log('Unmatched:', unmatched);
  }

  matched.forEach(m => {
    console.log(`[OK] ${m.key} -> ID ${m.dbId}: "${m.dbLivro}" (${m.dbAutor})`);
  });

  fs.writeFileSync('scripts/pipeline/classicos_matched.json', JSON.stringify(matched, null, 2));
}

run().catch(console.error);
