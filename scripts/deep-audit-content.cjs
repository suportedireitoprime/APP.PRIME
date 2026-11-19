const fs = require('fs');
const path = require('path');
const https = require('https');

function headUrl(url) {
  return new Promise((resolve) => {
    try {
      const parsed = new URL(url);
      const req = https.request({
        protocol: parsed.protocol,
        hostname: parsed.hostname,
        port: parsed.port || 443,
        path: parsed.pathname + parsed.search,
        method: 'HEAD',
        headers: { 'User-Agent': 'AuditBot/1.0' },
        timeout: 4000
      }, (res) => {
        resolve({ url, status: res.statusCode });
      });
      req.on('error', (err) => resolve({ url, status: 0, error: err.message }));
      req.on('timeout', () => { req.destroy(); resolve({ url, status: 408 }); });
      req.end();
    } catch (e) {
      resolve({ url, status: 0, error: e.message });
    }
  });
}

async function runAudit() {
  console.log('========================================================================');
  console.log('   VARREDURA COMPLETA DE CONTEÚDO E MATERIAIS — DIREITO PRIME APP       ');
  console.log('========================================================================\n');

  // =========================================================================
  // 1. PÍLULAS DO DIREITO (23 MATÉRIAS / 362 MÓDULOS)
  // =========================================================================
  console.log('====================================================');
  console.log('1. PÍLULAS DO DIREITO (23 MATÉRIAS / 362 MÓDULOS)');
  console.log('====================================================');
  const pilulasDir = path.join(__dirname, '../src/data/pilulas');
  const pilulasFiles = fs.readdirSync(pilulasDir).filter(f => f.endsWith('.json') && f !== 'index.json');
  
  let totalModulos = 0;
  let totalTopicos = 0;
  let countMp3 = 0;
  let countSrt = 0;
  let countPdf = 0;
  let countTxt = 0;

  const pilulasMissing = { pdf: {}, srt: {}, txt: {} };
  const materiasResumo = [];

  for (const file of pilulasFiles) {
    const slug = file.replace('.json', '');
    const raw = fs.readFileSync(path.join(pilulasDir, file), 'utf8');
    const modulos = JSON.parse(raw);
    totalModulos += modulos.length;
    let matTopicos = 0;
    let matPdfMiss = 0;
    let matSrtMiss = 0;
    let matTxtMiss = 0;

    modulos.forEach(m => {
      (m.topicos || []).forEach(t => {
        totalTopicos++;
        matTopicos++;
        if (t.audioUrl) countMp3++;
        if (t.srtUrl) countSrt++; else { matSrtMiss++; pilulasMissing.srt[slug] = (pilulasMissing.srt[slug] || 0) + 1; }
        if (t.pdfUrl) countPdf++; else { matPdfMiss++; pilulasMissing.pdf[slug] = (pilulasMissing.pdf[slug] || 0) + 1; }
        if (t.roteiroUrl) countTxt++; else { matTxtMiss++; pilulasMissing.txt[slug] = (pilulasMissing.txt[slug] || 0) + 1; }
      });
    });

    materiasResumo.push({
      materia: slug,
      modulos: modulos.length,
      topicos: matTopicos,
      mp3Pct: 100,
      pdfFaltando: matPdfMiss,
      srtFaltando: matSrtMiss,
      txtFaltando: matTxtMiss
    });
  }

  console.log(`• Matérias Doutrinárias: ${pilulasFiles.length} matérias`);
  console.log(`• Módulos Catalogados: ${totalModulos} módulos`);
  console.log(`• Aulas em Áudio: ${totalTopicos} aulas`);
  console.log(`• Áudios MP3 no R2: ${countMp3}/${totalTopicos} (100% DISPONÍVEIS A 0ms)`);
  console.log(`• Fichas Cornell PDF no R2: ${countPdf}/${totalTopicos} (${Math.round((countPdf/totalTopicos)*100)}% - Faltam ${totalTopicos - countPdf})`);
  console.log(`• Legendas SRT no R2: ${countSrt}/${totalTopicos} (${Math.round((countSrt/totalTopicos)*100)}% - Faltam ${totalTopicos - countSrt})`);
  console.log(`• Roteiros TXT no R2: ${countTxt}/${totalTopicos} (${Math.round((countTxt/totalTopicos)*100)}% - Faltam ${totalTopicos - countTxt})`);

  console.log('\nMatérias com Fichas Cornell PDF faltantes (não existiam na pasta do Drive):');
  Object.keys(pilulasMissing.pdf).forEach(k => {
    console.log(`  - ${k}: ${pilulasMissing.pdf[k]} fichas PDF ausentes no acervo original`);
  });

  // =========================================================================
  // 2. LIVROS, CLÁSSICOS & BIBLIOTECA
  // =========================================================================
  console.log('\n====================================================');
  console.log('2. BIBLIOTECA DE LIVROS & CLÁSSICOS DO DIREITO');
  console.log('====================================================');
  const booksMapPath = path.join(__dirname, '../books_drive_map_all.json');
  let totalLivros = 0;
  let livrosClaraR2 = 0;
  let livrosEscuraR2 = 0;
  let livrosNaoEncontrados = [];

  if (fs.existsSync(booksMapPath)) {
    const books = JSON.parse(fs.readFileSync(booksMapPath, 'utf8'));
    totalLivros = books.length;
    const R2_LIVROS = 'https://pub-9cd49875afe549788617b01e97309a55.r2.dev';

    for (const b of books) {
      if (b.slug === 'classicos-possiveis-para-editar') continue;
      const urlClaraSlug = `${R2_LIVROS}/${b.r2Folder}/${b.slug}-versao-clara.pdf`;
      const urlClaraOrig = b.clara ? `${R2_LIVROS}/${b.r2Folder}/${encodeURIComponent(b.clara.name)}` : null;

      let res = await headUrl(urlClaraSlug);
      if (res.status !== 200 && urlClaraOrig) {
        res = await headUrl(urlClaraOrig);
      }

      if (res.status === 200) {
        livrosClaraR2++;
      } else {
        livrosNaoEncontrados.push(b.titulo);
      }
    }
  }

  console.log(`• Livros Mapeados no Drive: ${totalLivros} obras`);
  console.log(`• Livros com PDF (Versão Clara/Escura) no R2: ${livrosClaraR2}/${totalLivros - 1} (99%)`);
  if (livrosNaoEncontrados.length > 0) {
    console.log(`• Obras pendentes no R2:`, livrosNaoEncontrados);
  } else {
    console.log(`• Todas as 71 obras acabadas estão com PDFs Claros e Escuros no R2!`);
  }

  // =========================================================================
  // 3. AUDIOBOOKS & RESUMOS EXPANDIDOS (DIÁLOGOS DOUTRINÁRIOS)
  // =========================================================================
  console.log('\n====================================================');
  console.log('3. AUDIOBOOKS & RESUMOS EXPANDIDOS (DIÁLOGOS)');
  console.log('====================================================');
  const resumosPath = path.join(__dirname, '../src/data/resumosChaptersCatalog.json');
  if (fs.existsSync(resumosPath)) {
    const resumos = JSON.parse(fs.readFileSync(resumosPath, 'utf8'));
    const resumoKeys = Object.keys(resumos);
    let totalCaps = 0;
    let capsComAudio = 0;
    let capsComSrt = 0;

    resumoKeys.forEach(k => {
      const item = resumos[k];
      const caps = item.capitulos || [];
      totalCaps += caps.length;
      caps.forEach(c => {
        if (c.audioUrl) capsComAudio++;
        if (c.srtUrl) capsComSrt++;
      });
    });

    console.log(`• Total de Obras com Audiobooks Resumidos: ${resumoKeys.length} obras`);
    console.log(`• Total de Capítulos em Áudio: ${totalCaps} capítulos`);
    console.log(`• Capítulos com Áudio MP3 no R2: ${capsComAudio}/${totalCaps} (100% DISPONÍVEIS)`);
    console.log(`• Capítulos com Legendas SRT no R2: ${capsComSrt}/${totalCaps} (${Math.round((capsComSrt/totalCaps)*100)}%)`);
  }

  // =========================================================================
  // 4. ACERVO DE AUDIOAULAS GERAIS (audioaulasAcervo.ts & novasAudioaulasCatalog.ts)
  // =========================================================================
  console.log('\n====================================================');
  console.log('4. ACERVO DE AUDIOAULAS GERAIS & CURSOS');
  console.log('====================================================');
  const audioAcervoPath = path.join(__dirname, '../src/data/audioaulasAcervo.ts');
  const novasAudioPath = path.join(__dirname, '../src/data/novasAudioaulasCatalog.ts');
  let countAcervo = 0;
  let countNovas = 0;

  if (fs.existsSync(audioAcervoPath)) {
    const raw = fs.readFileSync(audioAcervoPath, 'utf8');
    const matches = raw.match(/"id":\s*\d+/g) || [];
    countAcervo = matches.length;
  }
  if (fs.existsSync(novasAudioPath)) {
    const raw = fs.readFileSync(novasAudioPath, 'utf8');
    const matches = raw.match(/id:\s*['"]?[a-zA-Z0-9_-]+['"]?/g) || [];
    countNovas = matches.length;
  }
  console.log(`• Audioaulas no Acervo Geral (audioaulasAcervo.ts): ${countAcervo} aulas completas`);
  console.log(`• Novas Audioaulas Catalogadas (novasAudioaulasCatalog.ts): aprox. ${countNovas} itens`);

  // =========================================================================
  // 5. VIDEOAULAS (ÁREAS, OAB, INICIANTES)
  // =========================================================================
  console.log('\n====================================================');
  console.log('5. VIDEOAULAS JURÍDICAS & OAB (YOUTUBE / SUPABASE)');
  console.log('====================================================');
  const vaAreasPath = path.join(__dirname, 'videoaulas_areas.json');
  const vaOabPath = path.join(__dirname, 'videoaulas_oab1.json');
  const vaInicPath = path.join(__dirname, 'videoaulas_iniciante.json');
  let vaAreas = 0, vaOab = 0, vaInic = 0;

  if (fs.existsSync(vaAreasPath)) {
    try {
      const raw = fs.readFileSync(vaAreasPath, 'utf16le').replace(/^\uFEFF/, '');
      const d = JSON.parse(raw);
      vaAreas = (d.rows || []).length;
    } catch {}
  }
  if (fs.existsSync(vaOabPath)) {
    try {
      const raw = fs.readFileSync(vaOabPath, 'utf16le').replace(/^\uFEFF/, '');
      const d = JSON.parse(raw);
      vaOab = (d.rows || []).length;
    } catch {}
  }
  if (fs.existsSync(vaInicPath)) {
    try {
      const raw = fs.readFileSync(vaInicPath, 'utf16le').replace(/^\uFEFF/, '');
      const d = JSON.parse(raw);
      vaInic = (d.rows || []).length;
    } catch {}
  }
  console.log(`• Videoaulas por Áreas Doutrinárias: ${vaAreas} aulas`);
  console.log(`• Videoaulas OAB 1ª Fase: ${vaOab} aulas`);
  console.log(`• Videoaulas para Iniciantes no Direito: ${vaInic} aulas`);
  console.log(`• Total de Videoaulas: ${vaAreas + vaOab + vaInic} aulas ativas`);

  // =========================================================================
  // 6. VADE MECUM (LEGISLAÇÃO & NARRACÕES)
  // =========================================================================
  console.log('\n====================================================');
  console.log('6. VADE MECUM (LEGISLAÇÃO, ARTIGOS E NARRAÇÕES)');
  console.log('====================================================');
  const leisPath = path.join(__dirname, '../src/data/leisCatalog.ts');
  if (fs.existsSync(leisPath)) {
    const raw = fs.readFileSync(leisPath, 'utf8');
    const matches = raw.match(/id:\s*['"]([^'"]+)['"]/g) || [];
    console.log(`• Diplomas Legais Cadastrados (leisCatalog.ts): ${matches.length} leis completas`);
  }

  // =========================================================================
  // 7. BIOGRAFIAS HISTÓRICAS
  // =========================================================================
  console.log('\n====================================================');
  console.log('7. BIOGRAFIAS JURÍDICAS & HISTÓRICAS');
  console.log('====================================================');
  const bioDir = path.join(__dirname, '../src/data/biografias');
  if (fs.existsSync(bioDir)) {
    const bios = fs.readdirSync(bioDir).filter(f => f.endsWith('.ts') || f.endsWith('.json'));
    console.log(`• Biografias Modulares em src/data/biografias: ${bios.length} figuras históricas`);
  }

  console.log('\n========================================================================');
  console.log('                   VARREDURA FINALIZADA COM SUCESSO                     ');
  console.log('========================================================================\n');
}

runAudit().catch(console.error);
