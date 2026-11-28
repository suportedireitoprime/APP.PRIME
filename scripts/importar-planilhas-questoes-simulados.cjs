const XLSX = require('xlsx');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const SHEET1_PATH = path.join(process.cwd(), 'tmp_sheet1.xlsx');
const SHEET2_PATH = path.join(process.cwd(), 'tmp_sheet2.xlsx');

function sqlStr(val) {
  if (val === null || val === undefined) return 'NULL';
  const s = String(val).trim();
  if (!s) return 'NULL';
  return "'" + s.replace(/'/g, "''") + "'";
}

function sqlInt(val) {
  if (val === null || val === undefined || val === '') return 'NULL';
  const n = parseInt(String(val), 10);
  return Number.isFinite(n) ? String(n) : 'NULL';
}

function sqlJsonb(obj) {
  return "'" + JSON.stringify(obj).replace(/'/g, "''") + "'::jsonb";
}

function md5(str) {
  return crypto.createHash('md5').update(String(str)).digest('hex');
}

function runSqlFile(filePath) {
  execFileSync('supabase', ['db', 'query', '--linked', '-f', filePath], {
    stdio: 'pipe',
    maxBuffer: 50 * 1024 * 1024,
  });
}

function normalizeGabarito(g) {
  const s = String(g || '').trim().toUpperCase();
  return ['A', 'B', 'C', 'D', 'E'].includes(s) ? s : null;
}

function main() {
  if (!fs.existsSync(SHEET1_PATH) || !fs.existsSync(SHEET2_PATH)) {
    throw new Error('Arquivos tmp_sheet1.xlsx e tmp_sheet2.xlsx não encontrados na raiz.');
  }

  const wb1 = XLSX.readFile(SHEET1_PATH);
  const wb2 = XLSX.readFile(SHEET2_PATH);

  const OAB_CARGO_ID = '63fbd266-3c2d-4b91-85b7-25402ff2ac1f';
  const OAB_EXAM_ID = crypto.randomUUID();
  const CONC_EXAM_ID = crypto.randomUUID();

  const questoesRows = [];
  const simuladosRows = [];
  const simQuestionsRows = [];
  const seenHashes = new Set();

  // 1. Processa OAB 1..47
  const oabSheets = wb1.SheetNames.filter((n) => /^OAB\s+\d+$/i.test(n));
  console.log(`Planilha OAB: ${oabSheets.length} abas de exames encontradas.`);

  for (const sheetName of oabSheets) {
    const rows = XLSX.utils.sheet_to_json(wb1.Sheets[sheetName], { defval: '' });
    if (rows.length === 0) continue;

    const firstYear = parseInt(String(rows[0]['Ano'] || ''), 10) || 2024;
    const simId = crypto.randomUUID();
    simuladosRows.push({
      id: simId,
      exam_id: OAB_EXAM_ID,
      year: firstYear,
      prova_url: null,
      gabarito_url: null,
    });

    for (const r of rows) {
      const enunciado = String(r['Enunciado'] || '').trim();
      if (!enunciado) continue;
      const gabarito = normalizeGabarito(r['Alternativa correta']);
      const status = String(r['Status'] || '').trim();
      const isAnulada = /anulad/i.test(status);
      const idExterno = String(r['ID único'] || '').trim() || `${sheetName}-${r['Questão'] || ''}`;
      const hash = md5(`oab|${idExterno}|${enunciado.slice(0, 120)}`);
      if (seenHashes.has(hash)) continue;
      seenHashes.add(hash);

      const altA = String(r['Alternativa A'] || '').trim() || null;
      const altB = String(r['Alternativa B'] || '').trim() || null;
      const altC = String(r['Alternativa C'] || '').trim() || null;
      const altD = String(r['Alternativa D'] || '').trim() || null;
      const altE = String(r['Alternativa E'] || '').trim() || null;

      questoesRows.push({
        hash_dedup: hash,
        id_externo: idExterno,
        cargo_id: OAB_CARGO_ID,
        cargo: String(r['Cargo / Órgão'] || 'Advogado (Exame de Ordem) – OAB').trim(),
        origem: 'oab',
        nivel: 'oab',
        disciplina: String(r['Matéria'] || 'Outros').trim(),
        assunto: String(r['Tema'] || '').trim() || null,
        tema_amplo: String(r['Tema (amplo)'] || '').trim() || null,
        topico: String(r['Tópico'] || '').trim() || null,
        tema_central: String(r['Tema (amplo)'] || r['Tema'] || '').trim() || null,
        ano: parseInt(String(r['Ano'] || ''), 10) || null,
        banca: String(r['Banca'] || 'FGV').trim(),
        orgao: 'OAB',
        prova: String(r['Prova'] || sheetName).trim(),
        numero_questao: String(r['Questão'] || '').trim() || null,
        enunciado,
        alt_a: altA,
        alt_b: altB,
        alt_c: altC,
        alt_d: altD,
        alt_e: altE,
        gabarito_oficial: gabarito,
        gabarito_comentado: String(r['Comentário'] || '').trim() || null,
        base_legal: String(r['Base legal'] || '').trim() || null,
        fonte: String(r['Fonte'] || '').trim() || null,
        observacao: String(r['Observação'] || '').trim() || null,
        status_questao: status || null,
        ativo: !isAnulada && Boolean(gabarito),
      });

      if (!isAnulada && gabarito) {
        const opts = [
          altA ? { letra: 'A', texto: altA } : null,
          altB ? { letra: 'B', texto: altB } : null,
          altC ? { letra: 'C', texto: altC } : null,
          altD ? { letra: 'D', texto: altD } : null,
          altE ? { letra: 'E', texto: altE } : null,
        ].filter(Boolean);

        simQuestionsRows.push({
          simulado_id: simId,
          text: enunciado,
          options: opts,
          correct_comment: String(r['Comentário'] || '').trim() || null,
          disciplina: String(r['Matéria'] || 'Outros').trim(),
          assunto: String(r['Tema'] || '').trim() || null,
          topico: String(r['Tópico'] || '').trim() || null,
          tema_amplo: String(r['Tema (amplo)'] || '').trim() || null,
          gabarito,
          id_externo: idExterno,
          numero_questao: parseInt(String(r['Questão'] || ''), 10) || null,
          base_legal: String(r['Base legal'] || '').trim() || null,
          codigo_externo: String(r['Código Qconcursos'] || '').trim() || null,
          dificuldade: String(r['Dificuldade (Qconcursos)'] || '').trim() || null,
          status: status || 'Válida',
          fonte: String(r['Fonte'] || '').trim() || null,
          observacao: String(r['Observação'] || '').trim() || null,
        });
      }
    }
  }

  // 2. Processa Planilha 2 (Conceituais)
  const concSheet = wb2.SheetNames[0];
  const concRows = XLSX.utils.sheet_to_json(wb2.Sheets[concSheet], { defval: '' });
  console.log(`Planilha Conceituais (${concSheet}): ${concRows.length} linhas.`);

  // Agrupa por Livro para gerar simulados temáticos de Conceituais
  const livroSimMap = new Map();
  let concIndex = 0;

  for (const r of concRows) {
    concIndex += 1;
    const enunciado = String(r['Enunciado'] || '').trim();
    const gabarito = normalizeGabarito(r['Gabarito']);
    if (!enunciado || !gabarito) continue;

    const materia = String(r['Matéria'] || 'Direito Penal').trim();
    const livro = String(r['Livro'] || 'Geral').trim();
    const tema = String(r['Tema'] || '').trim() || null;
    const nivelRaw = String(r['Nível'] || 'conceitual').trim().toLowerCase();
    const idExterno = `CONC-${concIndex}`;
    const hash = md5(`conc|${materia}|${livro}|${enunciado.slice(0, 140)}|${gabarito}`);
    if (seenHashes.has(hash)) continue;
    seenHashes.add(hash);

    const altA = String(r['A'] || '').trim() || null;
    const altB = String(r['B'] || '').trim() || null;
    const altC = String(r['C'] || '').trim() || null;
    const altD = String(r['D'] || '').trim() || null;

    questoesRows.push({
      hash_dedup: hash,
      id_externo: idExterno,
      cargo_id: null,
      cargo: 'Conceitual',
      origem: 'conceituais',
      nivel: 'conceitual',
      disciplina: materia,
      assunto: livro,
      tema_amplo: livro,
      topico: tema,
      tema_central: tema || livro,
      ano: 2026,
      banca: 'Conceitual',
      orgao: 'Conceitual',
      prova: livro,
      numero_questao: String(concIndex),
      enunciado,
      alt_a: altA,
      alt_b: altB,
      alt_c: altC,
      alt_d: altD,
      alt_e: null,
      gabarito_oficial: gabarito,
      gabarito_comentado: String(r['Comentário'] || '').trim() || null,
      base_legal: null,
      fonte: 'Planilha Conceituais',
      observacao: nivelRaw,
      status_questao: 'Válida',
      ativo: true,
    });

    if (!livroSimMap.has(livro)) {
      const sId = crypto.randomUUID();
      livroSimMap.set(livro, { id: sId, count: 0 });
      simuladosRows.push({
        id: sId,
        exam_id: CONC_EXAM_ID,
        year: 2026,
        prova_url: null,
        gabarito_url: null,
      });
    }
    const livroSim = livroSimMap.get(livro);
    livroSim.count += 1;
    const opts = [
      altA ? { letra: 'A', texto: altA } : null,
      altB ? { letra: 'B', texto: altB } : null,
      altC ? { letra: 'C', texto: altC } : null,
      altD ? { letra: 'D', texto: altD } : null,
    ].filter(Boolean);

    simQuestionsRows.push({
      simulado_id: livroSim.id,
      text: enunciado,
      options: opts,
      correct_comment: String(r['Comentário'] || '').trim() || null,
      disciplina: materia,
      assunto: livro,
      topico: tema,
      tema_amplo: livro,
      gabarito,
      id_externo: idExterno,
      numero_questao: livroSim.count,
      base_legal: null,
      codigo_externo: null,
      dificuldade: nivelRaw,
      status: 'Válida',
      fonte: 'Planilha Conceituais',
      observacao: livro,
    });
  }

  console.log(`Preparadas: ${questoesRows.length} questões | ${simuladosRows.length} simulados | ${simQuestionsRows.length} questões de simulado.`);

  const tmpSql = path.join(process.cwd(), 'tmp_import_batch.sql');

  // 3. Insere simulado_exams e simulados
  const examsSql = `
    INSERT INTO public.simulado_exams (id, name) VALUES
      (${sqlStr(OAB_EXAM_ID)}, 'OAB (Exame de Ordem)'),
      (${sqlStr(CONC_EXAM_ID)}, 'Conceituais (Direito Penal)');
    INSERT INTO public.simulados (id, exam_id, year) VALUES
      ${simuladosRows.map((s) => `(${sqlStr(s.id)}, ${sqlStr(s.exam_id)}, ${s.year})`).join(',\n      ')};
  `;
  fs.writeFileSync(tmpSql, examsSql, 'utf8');
  runSqlFile(tmpSql);
  console.log('Exams e simulados inseridos!');

  // 4. Insere questoes em lotes de 1000
  const BATCH = 1000;
  for (let i = 0; i < questoesRows.length; i += BATCH) {
    const slice = questoesRows.slice(i, i + BATCH);
    const values = slice
      .map(
        (q) =>
          `(${sqlStr(q.hash_dedup)}, ${sqlStr(q.id_externo)}, ${sqlStr(q.cargo_id)}, ${sqlStr(q.cargo)}, ${sqlStr(q.origem)}, ${sqlStr(q.nivel)}, ${sqlStr(q.disciplina)}, ${sqlStr(q.assunto)}, ${sqlStr(q.tema_amplo)}, ${sqlStr(q.topico)}, ${sqlStr(q.tema_central)}, ${sqlInt(q.ano)}, ${sqlStr(q.banca)}, ${sqlStr(q.orgao)}, ${sqlStr(q.prova)}, ${sqlStr(q.numero_questao)}, ${sqlStr(q.enunciado)}, ${sqlStr(q.alt_a)}, ${sqlStr(q.alt_b)}, ${sqlStr(q.alt_c)}, ${sqlStr(q.alt_d)}, ${sqlStr(q.alt_e)}, ${sqlStr(q.gabarito_oficial)}, ${sqlStr(q.gabarito_comentado)}, ${sqlStr(q.base_legal)}, ${sqlStr(q.fonte)}, ${sqlStr(q.observacao)}, ${sqlStr(q.status_questao)}, ${q.ativo ? 'true' : 'false'})`
      )
      .join(',\n');
    const sql = `INSERT INTO public.questoes (hash_dedup, id_externo, cargo_id, cargo, origem, nivel, disciplina, assunto, tema_amplo, topico, tema_central, ano, banca, orgao, prova, numero_questao, enunciado, alt_a, alt_b, alt_c, alt_d, alt_e, gabarito_oficial, gabarito_comentado, base_legal, fonte, observacao, status_questao, ativo) VALUES\n${values}\nON CONFLICT (hash_dedup) DO NOTHING;`;
    fs.writeFileSync(tmpSql, sql, 'utf8');
    runSqlFile(tmpSql);
    console.log(`questoes lote ${i + slice.length}/${questoesRows.length}`);
  }

  // 5. Insere simulado_questions em lotes de 1000
  for (let i = 0; i < simQuestionsRows.length; i += BATCH) {
    const slice = simQuestionsRows.slice(i, i + BATCH);
    const values = slice
      .map(
        (q) =>
          `(${sqlStr(q.simulado_id)}, ${sqlStr(q.text)}, ${sqlJsonb(q.options)}, ${sqlStr(q.correct_comment)}, ${sqlStr(q.disciplina)}, ${sqlStr(q.assunto)}, ${sqlStr(q.topico)}, ${sqlStr(q.tema_amplo)}, ${sqlStr(q.gabarito)}, ${sqlStr(q.id_externo)}, ${sqlInt(q.numero_questao)}, ${sqlStr(q.base_legal)}, ${sqlStr(q.codigo_externo)}, ${sqlStr(q.dificuldade)}, ${sqlStr(q.status)}, ${sqlStr(q.fonte)}, ${sqlStr(q.observacao)})`
      )
      .join(',\n');
    const sql = `INSERT INTO public.simulado_questions (simulado_id, text, options, correct_comment, disciplina, assunto, topico, tema_amplo, gabarito, id_externo, numero_questao, base_legal, codigo_externo, dificuldade, status, fonte, observacao) VALUES\n${values};`;
    fs.writeFileSync(tmpSql, sql, 'utf8');
    runSqlFile(tmpSql);
    console.log(`simulado_questions lote ${i + slice.length}/${simQuestionsRows.length}`);
  }

  if (fs.existsSync(tmpSql)) fs.unlinkSync(tmpSql);
  console.log('Importação concluída com sucesso!');
}

main();
