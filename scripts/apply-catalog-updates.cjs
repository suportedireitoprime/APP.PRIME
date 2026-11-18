const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://dnjrgpldcwcpoywamorr.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJncGxkY3djcG95d2Ftb3JyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY4NjEzMywiZXhwIjoyMDk4MjYyMTMzfQ.M4cllbXRDvqgCt5T7_yFjnT4seIYU-Va7Bs6PhRDu-w';
const sb = createClient(SUPABASE_URL, SERVICE_KEY);

const R2_DOMAIN = 'https://pub-9cd49875afe549788617b01e97309a55.r2.dev';

function normalize(s) {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

async function main() {
  const driveBooks = JSON.parse(
    fs.readFileSync(path.join(__dirname, '..', 'books_drive_map.json'), 'utf8')
  ).filter(b => b.folderName !== 'Clássicos possíveis para editar' && b.clara && b.escura);

  const offlineBundlePath = path.join(__dirname, '..', 'public', 'offline-bundle', 'biblioteca-classicos.json');
  let appBooks = JSON.parse(fs.readFileSync(offlineBundlePath, 'utf8'));

  // Obter registros atuais do Supabase
  console.log('Consultando tabela biblioteca_classicos no Supabase...');
  const { data: supaBooks, error: supaErr } = await sb.from('biblioteca_classicos').select('id, livro');
  if (supaErr) {
    throw new Error('Erro ao buscar biblioteca_classicos: ' + supaErr.message);
  }

  let maxId = supaBooks.reduce((max, b) => Math.max(max, b.id || 0), 155);
  console.log(`Supabase possui ${supaBooks.length} registros. Maior ID atual: ${maxId}`);

  let updatedCount = 0;
  let insertedCount = 0;

  for (const db of driveBooks) {
    const claraUrl = `${R2_DOMAIN}/classicos/${db.slug}/${db.slug}-versao-clara.pdf`;
    const escuraUrl = `${R2_DOMAIN}/classicos/${db.slug}/${db.slug}-versao-escura.pdf`;
    const dbNorm = normalize(db.titulo);

    const curiosidadesPayload = {
      versoes_pdf: { clara: claraUrl, escura: escuraUrl },
      download_clara: claraUrl,
      download_escura: escuraUrl
    };

    // 1. Verificar no Supabase
    const matchedSupa = supaBooks.find(sbRow => {
      const sNorm = normalize(sbRow.livro);
      return sNorm === dbNorm || dbNorm.includes(sNorm) || sNorm.includes(dbNorm);
    });

    let bookId;
    if (matchedSupa) {
      bookId = matchedSupa.id;
      const { error: upErr } = await sb
        .from('biblioteca_classicos')
        .update({
          download: claraUrl,
          curiosidades: curiosidadesPayload
        })
        .eq('id', bookId);
      if (upErr) console.warn(`Falha ao atualizar ${matchedSupa.livro} no Supabase:`, upErr.message);
      else updatedCount++;
    } else {
      maxId++;
      bookId = maxId;
      const { error: inErr } = await sb
        .from('biblioteca_classicos')
        .insert({
          id: bookId,
          livro: db.titulo,
          autor: db.autor,
          imagem: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=600',
          sobre: `${db.titulo}, de ${db.autor}. Obra clássica agora disponível na íntegra com edição especial e leitura otimizada nos modos Claro e Escuro.`,
          download: claraUrl,
          area: 'Clássicos',
          curiosidades: curiosidadesPayload,
          editora: 'Edição Especial',
          paginas: 220,
          minutos_leitura: 260
        });
      if (inErr) console.warn(`Falha ao inserir ${db.titulo} no Supabase:`, inErr.message);
      else {
        insertedCount++;
        supaBooks.push({ id: bookId, livro: db.titulo });
      }
    }

    // 2. Atualizar no bundle offline
    const matchedApp = appBooks.find(ab => {
      const abNorm = normalize(ab.livro);
      return abNorm === dbNorm || dbNorm.includes(abNorm) || abNorm.includes(dbNorm);
    });

    if (matchedApp) {
      matchedApp.download = claraUrl;
      matchedApp.download_escura = escuraUrl;
      matchedApp.downloadEscura = escuraUrl;
      matchedApp.curiosidades = curiosidadesPayload;
    } else {
      appBooks.push({
        id: bookId,
        livro: db.titulo,
        autor: db.autor,
        imagem: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=600',
        sobre: `${db.titulo}, de ${db.autor}. Obra clássica agora disponível na íntegra com edição especial e leitura otimizada nos modos Claro e Escuro.`,
        link: null,
        download: claraUrl,
        download_escura: escuraUrl,
        downloadEscura: escuraUrl,
        capa_horizontal: null,
        ano_lancamento: null,
        editora: 'Edição Especial',
        curiosidades: curiosidadesPayload,
        analise_detalhada: `${db.titulo} é uma obra fundamental para o pensamento crítico, formação humanística e prática profissional.`,
        audio_resumo_url: null,
        paginas: 220,
        minutos_leitura: 260
      });
    }
  }

  fs.writeFileSync(offlineBundlePath, JSON.stringify(appBooks, null, 2), 'utf8');
  console.log(`\n========================================`);
  console.log(`SINCRONIZAÇÃO DE CATÁLOGO CONCLUÍDA!`);
  console.log(`Supabase atualizados: ${updatedCount}`);
  console.log(`Supabase novos inseridos: ${insertedCount}`);
  console.log(`Bundle offline total de livros: ${appBooks.length}`);
  console.log(`========================================\n`);
}

main().catch(err => {
  console.error('Erro:', err);
  process.exit(1);
});
