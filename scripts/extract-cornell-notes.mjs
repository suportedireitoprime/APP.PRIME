import fs from 'fs';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';

function parsePdfByCoords(textContent) {
  const items = textContent.items.map(it => ({
    x: Math.round(it.transform[4]),
    y: Math.round(it.transform[5]),
    str: it.str
  })).filter(it => it.str.trim() !== '');

  // Sort items top-to-bottom (descending Y), then left-to-right (ascending X)
  items.sort((a, b) => {
    if (Math.abs(b.y - a.y) > 4) {
      return b.y - a.y; // top first
    }
    return a.x - b.x; // left first
  });

  const rows = [];
  let currentRow = null;
  let summaryItems = [];
  let inSummary = false;

  for (const it of items) {
    if (it.y > 745) continue; // skip header lines

    if (it.str.includes('RESUMO: GUARDA ASSIM') || inSummary) {
      inSummary = true;
      summaryItems.push(it.str);
      continue;
    }

    // Se X <= 168, é uma nova Pergunta/Pista da coluna esquerda!
    if (it.x <= 168) {
      if (currentRow) {
        rows.push({
          pergunta: currentRow.pergunta.join(' ').replace(/\s+/g, ' ').trim(),
          resposta: currentRow.resposta.join(' ').replace(/\s+/g, ' ').trim()
        });
      }
      currentRow = { pergunta: [it.str], resposta: [] };
    } else if (currentRow) {
      currentRow.resposta.push(it.str);
    }
  }

  if (currentRow) {
    rows.push({
      pergunta: currentRow.pergunta.join(' ').replace(/\s+/g, ' ').trim(),
      resposta: currentRow.resposta.join(' ').replace(/\s+/g, ' ').trim()
    });
  }

  // Parse resumo text
  const fullSummary = summaryItems.join(' ').replace(/\s+/g, ' ').trim();
  let resumoGuardaAssim = '';
  let perguntaRapida = '';
  let respostaRapida = '';

  const cleanSum = fullSummary.replace(/^RESUMO:\s*GUARDA\s*ASSIM\s*/i, '');
  const pIdx = cleanSum.indexOf('Pergunta rápida:');
  if (pIdx !== -1) {
    resumoGuardaAssim = cleanSum.slice(0, pIdx).trim();
    const afterP = cleanSum.slice(pIdx + 'Pergunta rápida:'.length).trim();
    const qIdx = afterP.indexOf('?');
    if (qIdx !== -1) {
      perguntaRapida = afterP.slice(0, qIdx + 1).trim();
      respostaRapida = afterP.slice(qIdx + 1).trim();
    } else {
      perguntaRapida = afterP;
    }
  } else {
    resumoGuardaAssim = cleanSum;
  }

  return {
    rows: rows.filter(r => r.pergunta.length > 0 && r.resposta.length > 0),
    resumoGuardaAssim,
    perguntaRapida,
    respostaRapida,
    rawText: items.map(it => it.str).join(' ')
  };
}

async function main() {
  const catalog = JSON.parse(fs.readFileSync('src/data/pilulasDireitoPenalCatalog.json', 'utf8'));
  const resultMap = fs.existsSync('src/data/pilulasCornellNotes.json') 
    ? JSON.parse(fs.readFileSync('src/data/pilulasCornellNotes.json', 'utf8'))
    : {};

  const allTopics = [];
  for (const m of catalog) {
    for (const t of m.topicos) {
      if (t.pdfUrl && !resultMap[t.id]) allTopics.push({ topic: t, modulo: m });
    }
  }

  console.log(`Re-extracting Cornell tables from ${allTopics.length} PDFs...`);
  const concurrency = 20;
  for (let i = 0; i < allTopics.length; i += concurrency) {
    const batch = allTopics.slice(i, i + concurrency);
    await Promise.all(batch.map(async ({ topic, modulo }) => {
      try {
        let res = await fetch(topic.pdfUrl);
        if (!res.ok && topic.drivePdfId) {
          res = await fetch(`https://drive.google.com/uc?export=download&id=${topic.drivePdfId}`);
        }
        if (!res.ok) {
          console.warn(`Falha ao baixar PDF ${topic.id}: ${res.status}`);
          return;
        }
        const ab = await res.arrayBuffer();
        const doc = await pdfjs.getDocument({ data: new Uint8Array(ab) }).promise;
        const page = await doc.getPage(1);
        const tc = await page.getTextContent();

        const parsed = parsePdfByCoords(tc);
        resultMap[topic.id] = {
          id: topic.id,
          titulo: topic.titulo,
          moduloId: modulo.id,
          moduloTitulo: modulo.titulo,
          moduloIndex: modulo.folderIndex,
          ...parsed
        };
      } catch (err) {
        console.warn(`Erro no tópico ${topic.id}:`, err.message);
      }
    }));
    console.log(`Progress: ${Math.min(i + concurrency, allTopics.length)} / ${allTopics.length}`);
  }

  fs.writeFileSync('src/data/pilulasCornellNotes.json', JSON.stringify(resultMap, null, 2), 'utf8');
  console.log('✓ Successfully updated src/data/pilulasCornellNotes.json with authentic table rows!');
}

main().catch(console.error);
