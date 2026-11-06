const path = require('path');
const fs = require('fs');
const projectDir = path.resolve(__dirname, '..');
const xlsx = require(path.join(projectDir, 'node_modules/xlsx'));
const { createClient } = require(path.join(projectDir, 'node_modules/@supabase/supabase-js'));

const envPath = path.join(projectDir, '.env');
const env = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
const url = env.match(/VITE_SUPABASE_URL\s*=\s*["']?([^"'\s]+)/)?.[1];
const key = env.match(/VITE_SUPABASE_PUBLISHABLE_KEY\s*=\s*["']?([^"'\s]+)/)?.[1];

if (!url || !key) {
  console.error('Erro: VITE_SUPABASE_URL ou VITE_SUPABASE_PUBLISHABLE_KEY não encontrados no .env');
  process.exit(1);
}

const supabase = createClient(url, key);

const PROGRESS_FILE = path.join(projectDir, 'import_progress.json');
const INDEX_FILE = path.join(projectDir, 'all_sheets_index.json');
const LOG_FILE = path.join(projectDir, 'importar_flashcards.log');

function log(msg) {
  const line = `[${new Date().toLocaleTimeString('pt-BR')}] ${msg}`;
  console.log(line);
  try {
    fs.appendFileSync(LOG_FILE, line + '\n', 'utf8');
  } catch {}
}

if (!fs.existsSync(INDEX_FILE)) {
  log(`Arquivo de índice não encontrado: ${INDEX_FILE}`);
  process.exit(1);
}

const allSheets = JSON.parse(fs.readFileSync(INDEX_FILE, 'utf8'));

let progress = {
  processedIds: {},
  totalInsertedCards: 0,
  areaCounts: {},
};

if (fs.existsSync(PROGRESS_FILE)) {
  try {
    progress = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));
    log(`[RESUMO] Retomando progresso: ${Object.keys(progress.processedIds).length}/${allSheets.length} planilhas (${progress.totalInsertedCards} cards já salvos).`);
  } catch (e) {
    log('Aviso: progresso corrompido, iniciando do zero.');
  }
}

function normalizeTabName(name) {
  const n = name.trim().toLowerCase();
  if (n.includes('pergunta')) return 'Pergunta e Resposta';
  if (n.includes('múltipla') || n.includes('multipla')) return 'Múltipla Escolha';
  if (n.includes('verdadeiro') || n.includes('v/f')) return 'Verdadeiro ou Falso';
  if (n.includes('lacuna')) return 'Completar Lacunas';
  if (n.includes('erro')) return 'Ache o Erro';
  if (n.includes('ditado') || n.includes('fala')) return 'Ditado';
  if (n.includes('pegadinha')) return 'Pegadinha';
  return name;
}

function parseCardsFromWorkbook(wb, sheetMeta) {
  const cards = [];
  const area = sheetMeta.area;
  const tema = sheetMeta.livro;
  const subtema = sheetMeta.name.replace(/^Flashcards\s*[—–-]\s*/i, '').trim();

  for (const sheetName of wb.SheetNames) {
    const norm = normalizeTabName(sheetName);
    const ws = wb.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(ws);

    for (const r of rows) {
      const nivel = r['Nível'] || r['Nivel'] || null;
      let card = null;

      if (norm === 'Pergunta e Resposta') {
        const pergunta = r['Pergunta'];
        const resposta = r['Resposta Correta'];
        if (pergunta && resposta) {
          card = {
            area,
            tema,
            subtema,
            pergunta: String(pergunta).trim(),
            resposta: String(resposta).trim(),
            dica: r['Definição'] ? String(r['Definição']).trim() : null,
            exemplo: r['Exemplo Prático'] ? String(r['Exemplo Prático']).trim() : null,
            base_legal: r['Aprofundar — O que diz o livro/lei'] || r['Aprofundar'] ? String(r['Aprofundar — O que diz o livro/lei'] || r['Aprofundar']).trim() : null,
            reforco_conteudo: r['Pegadinha de Prova'] ? String(r['Pegadinha de Prova']).trim() : null,
            resumo_ia: 'Pergunta e Resposta',
            artigo_numero: nivel ? String(nivel).trim() : null,
          };
        }
      } else if (norm === 'Múltipla Escolha') {
        const pergunta = r['Pergunta'];
        const gabarito = r['Gabarito'] || '';
        const respCorreta = r['Resposta Correta'] || '';
        if (pergunta) {
          const alts = {
            A: r['Alternativa A'] || '',
            B: r['Alternativa B'] || '',
            C: r['Alternativa C'] || '',
            D: r['Alternativa D'] || '',
          };
          card = {
            area,
            tema,
            subtema,
            pergunta: String(pergunta).trim(),
            resposta: `[Gabarito: ${gabarito}] ${respCorreta}`.trim(),
            dica: r['Definição'] ? String(r['Definição']).trim() : null,
            exemplo: r['Exemplo Prático'] ? String(r['Exemplo Prático']).trim() : null,
            base_legal: r['Aprofundar — O que diz o livro/lei'] || r['Aprofundar'] ? String(r['Aprofundar — O que diz o livro/lei'] || r['Aprofundar']).trim() : null,
            reforco_conteudo: JSON.stringify({ alternativas: alts, gabarito: String(gabarito).trim() }),
            resumo_ia: 'Múltipla Escolha',
            artigo_numero: nivel ? String(nivel).trim() : null,
          };
        }
      } else if (norm === 'Verdadeiro ou Falso') {
        const pergunta = r['Afirmação'] || r['Pergunta'];
        const vfRaw = r['Resposta (V/F)'] || r['Resposta'] || '';
        const vf = String(vfRaw).toUpperCase().startsWith('V') ? 'Verdadeiro' : 'Falso';
        if (pergunta) {
          card = {
            area,
            tema,
            subtema,
            pergunta: String(pergunta).trim(),
            resposta: vf,
            dica: r['Definição'] ? String(r['Definição']).trim() : null,
            exemplo: r['Exemplo Prático'] ? String(r['Exemplo Prático']).trim() : null,
            base_legal: r['Aprofundar — O que diz o livro/lei'] || r['Aprofundar'] ? String(r['Aprofundar — O que diz o livro/lei'] || r['Aprofundar']).trim() : null,
            reforco_conteudo: r['Pegadinha de Prova'] ? String(r['Pegadinha de Prova']).trim() : null,
            resumo_ia: 'Verdadeiro ou Falso',
            artigo_numero: nivel ? String(nivel).trim() : null,
          };
        }
      } else if (norm === 'Completar Lacunas') {
        const pergunta = r['Frase com Lacunas'] || r['Pergunta'];
        const fraseCompleta = r['Frase Completa'] || '';
        const palavras = [r['Palavra 1'], r['Palavra 2'], r['Palavra 3']].filter(Boolean).map(String);
        if (pergunta) {
          card = {
            area,
            tema,
            subtema,
            pergunta: String(pergunta).trim(),
            resposta: fraseCompleta ? String(fraseCompleta).trim() : palavras.join(', '),
            dica: r['Definição'] ? String(r['Definição']).trim() : null,
            exemplo: r['Exemplo Prático'] ? String(r['Exemplo Prático']).trim() : null,
            base_legal: r['Aprofundar — O que diz o livro/lei'] || r['Aprofundar'] ? String(r['Aprofundar — O que diz o livro/lei'] || r['Aprofundar']).trim() : null,
            reforco_conteudo: JSON.stringify({ palavras, fraseCompleta }),
            resumo_ia: 'Completar Lacunas',
            artigo_numero: nivel ? String(nivel).trim() : null,
          };
        }
      } else if (norm === 'Ache o Erro') {
        const pergunta = r['Frase com Erro'] || r['Pergunta'];
        const errada = r['Palavra Errada'] || '';
        const correta = r['Palavra Correta'] || '';
        const fraseCorreta = r['Frase Correta'] || '';
        if (pergunta) {
          card = {
            area,
            tema,
            subtema,
            pergunta: String(pergunta).trim(),
            resposta: `Palavra Errada: "${errada}" ➔ Correta: "${correta}"\n\nFrase Correta: ${fraseCorreta}`.trim(),
            dica: r['Definição'] ? String(r['Definição']).trim() : null,
            exemplo: null,
            base_legal: r['Aprofundar — O que diz o livro/lei'] || r['Aprofundar'] ? String(r['Aprofundar — O que diz o livro/lei'] || r['Aprofundar']).trim() : null,
            reforco_conteudo: JSON.stringify({ palavraErrada: errada, palavraCorreta: correta, fraseCorreta }),
            resumo_ia: 'Ache o Erro',
            artigo_numero: nivel ? String(nivel).trim() : null,
          };
        }
      } else if (norm === 'Ditado') {
        const pergunta = r['Pergunta — o que falar'] || r['Pergunta'];
        const resposta = r['Resposta Correta'] || r['Resposta'];
        const palavrasChave = r['Palavras-chave (separadas por ;)'] || '';
        if (pergunta && resposta) {
          card = {
            area,
            tema,
            subtema,
            pergunta: String(pergunta).trim(),
            resposta: String(resposta).trim(),
            dica: r['Definição'] ? String(r['Definição']).trim() : null,
            exemplo: null,
            base_legal: r['Aprofundar — O que diz o livro/lei'] || r['Aprofundar'] ? String(r['Aprofundar — O que diz o livro/lei'] || r['Aprofundar']).trim() : null,
            reforco_conteudo: palavrasChave ? `Palavras-chave: ${palavrasChave}` : null,
            resumo_ia: 'Ditado',
            artigo_numero: nivel ? String(nivel).trim() : null,
          };
        }
      } else if (norm === 'Pegadinha') {
        const pergunta = r['Afirmação'] || r['Pergunta'];
        const temPegadinha = r['Tem Pegadinha? (Sim/Não)'] || '';
        const armadilha = r['Onde Está a Armadilha'] || '';
        const versaoCorreta = r['Versão Correta'] || '';
        if (pergunta) {
          card = {
            area,
            tema,
            subtema,
            pergunta: String(pergunta).trim(),
            resposta: `Tem Pegadinha? ${temPegadinha}\n\nOnde está a armadilha: ${armadilha}\n\nVersão Correta: ${versaoCorreta}`.trim(),
            dica: r['Definição'] ? String(r['Definição']).trim() : null,
            exemplo: armadilha ? `Armadilha: ${armadilha}` : null,
            base_legal: r['Aprofundar — O que diz o livro/lei'] || r['Aprofundar'] ? String(r['Aprofundar — O que diz o livro/lei'] || r['Aprofundar']).trim() : null,
            reforco_conteudo: JSON.stringify({ temPegadinha, armadilha, versaoCorreta }),
            resumo_ia: 'Pegadinha',
            artigo_numero: nivel ? String(nivel).trim() : null,
          };
        }
      }

      if (card) {
        cards.push(card);
      }
    }
  }

  return cards;
}

async function downloadSheetWithRetry(id, maxRetries = 5) {
  const url = `https://docs.google.com/spreadsheets/d/${id}/export?format=xlsx`;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = await res.arrayBuffer();
      return Buffer.from(buf);
    } catch (e) {
      if (attempt === maxRetries) throw e;
      await new Promise(r => setTimeout(r, 1200 * attempt));
    }
  }
}

async function sendBatchToSupabase(cards, maxRetries = 10) {
  if (cards.length === 0) return;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await supabase.functions.invoke('importar-flashcards', {
        body: { action: 'insert_batch', cards }
      });
      if (res.error) {
        let detail = res.error.message || 'Erro Edge';
        try {
          if (res.error.context) {
            const bodyTxt = await res.error.context.text();
            detail += ` - ${bodyTxt.slice(0, 150)}`;
          }
        } catch {}
        throw new Error(detail);
      }
      return;
    } catch (e) {
      const waitTime = Math.min(attempt * 3000, 20000);
      log(`  [Tentativa ${attempt}/${maxRetries}] Pausa preventiva (${(waitTime / 1000).toFixed(0)}s)... Motivo: ${e.message.slice(0, 80)}`);
      if (attempt === maxRetries) throw e;
      await new Promise(r => setTimeout(r, waitTime));
    }
  }
}

function slugify(text) {
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
}

async function main() {
  const remainingSheets = allSheets.filter(s => !progress.processedIds[s.id]);
  log(`\n======================================================`);
  log(`  IMPORTADOR DE FLASHCARDS — GOOGLE DRIVE ➔ SUPABASE`);
  log(`======================================================`);
  log(`Total geral de planilhas: ${allSheets.length}`);
  log(`Planilhas restantes: ${remainingSheets.length}`);
  log(`Cards já salvos no Supabase: ${progress.totalInsertedCards}\n`);

  // Concorrência moderada (3 trabalhadores simultâneos para evitar rate limit de Cloudflare)
  const CONCURRENCY = 3;
  const startTime = Date.now();
  let completedCount = Object.keys(progress.processedIds).length;
  let saveCounter = 0;
  let queueIndex = 0;

  async function worker() {
    while (queueIndex < remainingSheets.length) {
      const sheet = remainingSheets[queueIndex++];
      if (!sheet) break;

      try {
        const buf = await downloadSheetWithRetry(sheet.id);
        const wb = xlsx.read(buf, { type: 'buffer' });
        const cards = parseCardsFromWorkbook(wb, sheet);

        if (cards.length > 0) {
          await sendBatchToSupabase(cards);
          // Pequena pausa entre lotes para manter latência estável
          await new Promise(r => setTimeout(r, 200));
        }

        progress.processedIds[sheet.id] = true;
        progress.totalInsertedCards += cards.length;
        progress.areaCounts[sheet.area] = (progress.areaCounts[sheet.area] || 0) + cards.length;
        completedCount++;
        saveCounter++;

        const pct = ((completedCount / allSheets.length) * 100).toFixed(1);
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);

        log(`[${completedCount}/${allSheets.length} • ${pct}%] Salvos: ${progress.totalInsertedCards} cards | ${sheet.area} -> ${sheet.name.replace(/^Flashcards\s*[—–-]\s*/i, '')}`);

        if (saveCounter >= 5) {
          saveCounter = 0;
          fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
        }
      } catch (err) {
        log(`Erro ao processar [${sheet.name}]: ${err.message}`);
      }
    }
  }

  const workers = Array.from({ length: CONCURRENCY }, () => worker());
  await Promise.all(workers);

  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
  log(`\n======================================================`);
  log(`  SUCESSO TOTAL! ${progress.totalInsertedCards} FLASHCARDS INGERIDOS!`);
  log(`======================================================\n`);

  log('Recalculando métricas e áreas no Supabase...');
  const sortedAreas = Object.entries(progress.areaCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([area, count], idx) => ({
      area,
      slug: slugify(area),
      total_cards: count,
      ordem: idx + 1
    }));

  const resAreas = await supabase.functions.invoke('importar-flashcards', {
    body: { action: 'recalculate_areas', areas: sortedAreas }
  });
  log(`Métricas das áreas atualizadas: ${JSON.stringify(resAreas.data || resAreas.error)}`);

  const resStats = await supabase.functions.invoke('importar-flashcards', {
    body: { action: 'stats' }
  });
  log(`Estatísticas finais no banco: ${JSON.stringify(resStats.data || resStats.error)}`);
}

main().catch(err => {
  log(`Erro fatal: ${err.message}`);
  process.exit(1);
});
