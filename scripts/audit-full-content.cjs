const fs = require('fs');
const path = require('path');
const https = require('https');

async function main() {
  console.log('=== INICIANDO AUDITORIA COMPLETA DE CONTEÚDO DO APP ===\n');

  const report = {
    pilulas: {},
    livros_biblioteca: {},
    videoaulas: {},
    resumos_audiobooks: {},
    vademecum: {},
    questoes: {}
  };

  // -------------------------------------------------------------
  // 1. AUDITORIA: PÍLULAS DAS 23 MATÉRIAS (src/data/pilulas)
  // -------------------------------------------------------------
  const pilulasDir = path.join(__dirname, '../src/data/pilulas');
  if (fs.existsSync(pilulasDir)) {
    const files = fs.readdirSync(pilulasDir).filter(f => f.endsWith('.json') && f !== 'index.json');
    let totalMaterias = files.length;
    let totalModulos = 0;
    let totalTopicos = 0;
    let topicosComMp3 = 0;
    let topicosComSrt = 0;
    let topicosComPdf = 0;
    let topicosComTxt = 0;
    let missingFiles = [];

    files.forEach(f => {
      try {
        const content = JSON.parse(fs.readFileSync(path.join(pilulasDir, f), 'utf8'));
        const modulos = content.modulos || [];
        totalModulos += modulos.length;
        let matTopicos = 0;
        let matMissing = 0;

        modulos.forEach(m => {
          (m.topicos || []).forEach(t => {
            totalTopicos++;
            matTopicos++;
            if (t.audioUrl) topicosComMp3++; else matMissing++;
            if (t.srtUrl) topicosComSrt++;
            if (t.pdfUrl) topicosComPdf++;
            if (t.roteiroUrl) topicosComTxt++;
            
            // Checar se falta algo crítico
            if (!t.audioUrl || !t.pdfUrl) {
              missingFiles.push({ materia: f, modulo: m.titulo, topico: t.titulo, audio: !!t.audioUrl, pdf: !!t.pdfUrl });
            }
          });
        });

        report.pilulas[f] = {
          modulos: modulos.length,
          topicos: matTopicos,
          completo: matMissing === 0
        };
      } catch (e) {
        report.pilulas[f] = { erro: e.message };
      }
    });

    console.log(`[PÍLULAS] Total de Matérias: ${totalMaterias}`);
    console.log(`[PÍLULAS] Total de Módulos: ${totalModulos}`);
    console.log(`[PÍLULAS] Total de Tópicos/Aulas: ${totalTopicos}`);
    console.log(`[PÍLULAS] Com Áudio MP3: ${topicosComMp3}/${totalTopicos} (${Math.round((topicosComMp3/totalTopicos)*100)}%)`);
    console.log(`[PÍLULAS] Com Legenda SRT: ${topicosComSrt}/${totalTopicos} (${Math.round((topicosComSrt/totalTopicos)*100)}%)`);
    console.log(`[PÍLULAS] Com Ficha Cornell PDF: ${topicosComPdf}/${totalTopicos} (${Math.round((topicosComPdf/totalTopicos)*100)}%)`);
    console.log(`[PÍLULAS] Com Roteiro TXT: ${topicosComTxt}/${totalTopicos} (${Math.round((topicosComTxt/totalTopicos)*100)}%)`);
    console.log(`[PÍLULAS] Tópicos com pendência de áudio/PDF: ${missingFiles.length}`);
  }

  // -------------------------------------------------------------
  // 2. AUDITORIA: INVENTÁRIO DO DRIVE (scripts/pilulas_inventory.json)
  // -------------------------------------------------------------
  const invPath = path.join(__dirname, 'pilulas_inventory.json');
  if (fs.existsSync(invPath)) {
    try {
      const inv = JSON.parse(fs.readFileSync(invPath, 'utf8'));
      const keys = Object.keys(inv);
      let totalDriveFiles = 0;
      let driveCategories = keys.length;
      keys.forEach(k => {
        totalDriveFiles += (inv[k].files || []).length;
      });
      console.log(`\n[DRIVE INVENTORY] Categorias no Drive: ${driveCategories}`);
      console.log(`[DRIVE INVENTORY] Total de Arquivos brutos catalogados: ${totalDriveFiles}`);
    } catch (e) {}
  }

  // -------------------------------------------------------------
  // 3. AUDITORIA: BIBLIOTECA DE LIVROS / OBRAS / CLÁSSICOS
  // -------------------------------------------------------------
  const booksScript = path.join(__dirname, 'scan-all-drive-books.cjs');
  const booksSyncScript = path.join(__dirname, 'sync-all-drive-books-r2.cjs');
  console.log(`\n[BIBLIOTECA] Scripts existentes: scan-all-drive-books: ${fs.existsSync(booksScript)}, sync-all-drive-books-r2: ${fs.existsSync(booksSyncScript)}`);

  // Checar arquivos locais de biblioteca ou catálogos
  const catPath = path.join(__dirname, '../src/data/livros_catalogo.json');
  const catAlt = path.join(__dirname, '../src/data/biblioteca.json');
  console.log(`[BIBLIOTECA] src/data/livros_catalogo.json existe? ${fs.existsSync(catPath)}`);
  console.log(`[BIBLIOTECA] src/data/biblioteca.json existe? ${fs.existsSync(catAlt)}`);

  // Checar src/data/
  const dataDir = path.join(__dirname, '../src/data');
  if (fs.existsSync(dataDir)) {
    const dataFiles = fs.readdirSync(dataDir).filter(f => f.endsWith('.json'));
    console.log(`[SRC/DATA] Arquivos JSON em src/data: ${dataFiles.join(', ')}`);
  }

  // -------------------------------------------------------------
  // 4. AUDITORIA: VIDEOAULAS (scripts/videoaulas_*.json)
  // -------------------------------------------------------------
  const vaAreasPath = path.join(__dirname, 'videoaulas_areas.json');
  const vaOabPath = path.join(__dirname, 'videoaulas_oab1.json');
  const vaInicPath = path.join(__dirname, 'videoaulas_iniciante.json');
  let vaAreasCount = 0;
  let vaOabCount = 0;
  let vaInicCount = 0;
  if (fs.existsSync(vaAreasPath)) {
    const data = JSON.parse(fs.readFileSync(vaAreasPath, 'utf8'));
    vaAreasCount = Array.isArray(data) ? data.length : Object.keys(data).length;
  }
  if (fs.existsSync(vaOabPath)) {
    const data = JSON.parse(fs.readFileSync(vaOabPath, 'utf8'));
    vaOabCount = Array.isArray(data) ? data.length : Object.keys(data).length;
  }
  if (fs.existsSync(vaInicPath)) {
    const data = JSON.parse(fs.readFileSync(vaInicPath, 'utf8'));
    vaInicCount = Array.isArray(data) ? data.length : Object.keys(data).length;
  }
  console.log(`\n[VIDEOAULAS] Áreas: ${vaAreasCount} itens`);
  console.log(`[VIDEOAULAS] OAB 1ª Fase: ${vaOabCount} itens`);
  console.log(`[VIDEOAULAS] Iniciante: ${vaInicCount} itens`);

  console.log('\n=== FIM DA AUDITORIA LOCAL PRELIMINAR ===');
}

main().catch(console.error);
