import fs from 'fs';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';

function parseCornellRaw(rawText) {
  // 1. Extrair RESUMO: GUARDA ASSIM
  let bodyPart = rawText;
  let resumoGuardaAssim = '';
  let perguntaRapida = '';
  let respostaRapida = '';

  const resumoIdx = rawText.indexOf('RESUMO: GUARDA ASSIM');
  if (resumoIdx !== -1) {
    bodyPart = rawText.slice(0, resumoIdx);
    let afterResumo = rawText.slice(resumoIdx + 'RESUMO: GUARDA ASSIM'.length).trim();
    
    const perguntaIdx = afterResumo.indexOf('Pergunta rápida:');
    if (perguntaIdx !== -1) {
      resumoGuardaAssim = afterResumo.slice(0, perguntaIdx).trim();
      const afterPergunta = afterResumo.slice(perguntaIdx + 'Pergunta rápida:'.length).trim();
      const pontoInterrogacao = afterPergunta.indexOf('?');
      if (pontoInterrogacao !== -1) {
        perguntaRapida = afterPergunta.slice(0, pontoInterrogacao + 1).trim();
        respostaRapida = afterPergunta.slice(pontoInterrogacao + 1).trim();
      } else {
        perguntaRapida = afterPergunta;
      }
    } else {
      resumoGuardaAssim = afterResumo;
    }
  }

  // 2. Limpar cabeçalho padrão
  // Pílula 01: Vingança privada e talião  Pílulas de Direito • Direito Penal • Matéria 1: História do Direito Penal • Ficha Cornell: ouvir o áudio e revisar por esta página
  const headerMatch = bodyPart.match(/Pílula\s+\d+:[^•]+•[^•]+•[^•]+•[^\n]+?(?:revisar por esta página|Ficha Cornell)/i);
  if (headerMatch) {
    bodyPart = bodyPart.slice(headerMatch[0].length).trim();
  } else {
    const revIdx = bodyPart.indexOf('revisar por esta página');
    if (revIdx !== -1) {
      bodyPart = bodyPart.slice(revIdx + 'revisar por esta página'.length).trim();
    }
  }

  // 3. Identificar pares pergunta / resposta
  // Padrões comuns: "O que é?", "Conceito", "Marcos da prova", "Sequência", "Exemplo:", "Não confunda", "Diferenças", "Requisitos", "Dica prática", etc.
  // Vamos dividir por padrões que terminam em '?' ou tópicos conhecidos
  const knownKeywords = [
    'O que é\\?', 'O que é o talião\\?', 'Marcos da prova', 'Sequência', 'Exemplo[^:]*:', 'Não confunda',
    'Conceito', 'Natureza jurídica', 'Fundamento', 'Previsão legal', 'Requisitos', 'Hipóteses',
    'Causas de exclusão', 'Aplicação prática', 'Dica de ouro', 'Atenção', 'Elemento subjetivo',
    'Objetividade jurídica', 'Sujeito ativo', 'Sujeito passivo', 'Consumação', 'Tentativa',
    'Classificação', 'Diferença', 'Princípio', 'Exceção', 'Importante'
  ];

  const regex = new RegExp(`(?=(${knownKeywords.join('|')}))`, 'i');
  const blocks = bodyPart.split(regex).map(s => s?.trim()).filter(Boolean);

  const itens = [];
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    // Se b é uma keyword
    const isKeyword = knownKeywords.some(kw => new RegExp(`^${kw}$`, 'i').test(b));
    if (isKeyword && i + 1 < blocks.length) {
      const q = b;
      let a = blocks[i + 1].trim();
      // Remove a própria keyword do início da resposta se duplicada
      if (a.toLowerCase().startsWith(q.toLowerCase())) {
        a = a.slice(q.length).trim();
      }
      itens.push({ pergunta: q, resposta: a });
      i++; // pula resposta
    } else if (b.includes('?') && !isKeyword) {
      const qIdx = b.indexOf('?');
      const q = b.slice(0, qIdx + 1).trim();
      const a = b.slice(qIdx + 1).trim();
      if (q && a) {
        itens.push({ pergunta: q, resposta: a });
      } else if (b) {
        itens.push({ pergunta: 'Ponto Central', resposta: b });
      }
    } else if (b.includes(':') && b.length < 50) {
      const colIdx = b.indexOf(':');
      const q = b.slice(0, colIdx + 1).trim();
      const a = b.slice(colIdx + 1).trim();
      itens.push({ pergunta: q, resposta: a });
    } else if (b) {
      itens.push({ pergunta: 'Ponto Central', resposta: b });
    }
  }

  return {
    rawText: rawText.trim(),
    itens: itens.length > 0 ? itens : [{ pergunta: 'Conteúdo da Ficha', resposta: bodyPart }],
    resumoGuardaAssim,
    perguntaRapida,
    respostaRapida,
  };
}

async function main() {
  const catalog = JSON.parse(fs.readFileSync('src/data/pilulasDireitoPenalCatalog.json', 'utf8'));
  const resultMap = {};

  const allTopics = [];
  for (const m of catalog) {
    for (const t of m.topicos) {
      if (t.pdfUrl) allTopics.push({ topic: t, modulo: m });
    }
  }

  console.log(`Extracting Cornell notes from ${allTopics.length} PDFs...`);
  const concurrency = 15;
  for (let i = 0; i < allTopics.length; i += concurrency) {
    const batch = allTopics.slice(i, i + concurrency);
    await Promise.all(batch.map(async ({ topic, modulo }) => {
      try {
        const res = await fetch(topic.pdfUrl);
        if (!res.ok) return;
        const ab = await res.arrayBuffer();
        const doc = await pdfjs.getDocument({ data: new Uint8Array(ab) }).promise;
        const page = await doc.getPage(1);
        const tc = await page.getTextContent();
        const rawText = tc.items.map(it => it.str).join(' ');

        const parsed = parseCornellRaw(rawText);
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
  console.log('✓ Successfully wrote src/data/pilulasCornellNotes.json!');
}

main().catch(console.error);
